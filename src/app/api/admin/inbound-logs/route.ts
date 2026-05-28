import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { inboundLog, purchaseOrderItem, purchaseOrder, masterSku } from "@/server/schema";
import { eq, desc, sql, and, gte, or, ilike } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  // Validate session & role
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessAdmin(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const dateRange = searchParams.get("dateRange") || "7d";
  const checkerFilter = searchParams.get("checker") || "";
  const cabangFilter = searchParams.get("cabang") || "";
  const search = searchParams.get("search")?.trim() || "";
  const offset = (page - 1) * limit;

  // Build date filter
  let dateFilter;
  const now = new Date();
  if (dateRange === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateFilter = gte(inboundLog.scannedAt, startOfDay);
  } else if (dateRange === "30d") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = gte(inboundLog.scannedAt, thirtyDaysAgo);
  } else {
    // default 7d
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = gte(inboundLog.scannedAt, sevenDaysAgo);
  }

  // Build conditions array
  const conditions = [dateFilter];
  if (checkerFilter) {
    conditions.push(eq(inboundLog.checkerName, checkerFilter));
  }
  if (cabangFilter) {
    conditions.push(eq(purchaseOrder.cabang, cabangFilter));
  }
  if (search) {
    conditions.push(
      or(
        ilike(purchaseOrder.poNumber, `%${search}%`),
        ilike(masterSku.skuCode, `%${search}%`),
        ilike(masterSku.name, `%${search}%`),
        ilike(inboundLog.checkerName, `%${search}%`)
      )!
    );
  }

  // Get logs with joins
  const logs = await db
    .select({
      id: inboundLog.id,
      expiry_date: inboundLog.expiryDate,
      qty_good: inboundLog.qtyGood,
      qty_reject: inboundLog.qtyReject,
      checker_name: inboundLog.checkerName,
      scanned_at: inboundLog.scannedAt,
      po_number: purchaseOrder.poNumber,
      po_cabang: purchaseOrder.cabang,
      sku_name: masterSku.name,
      sku_code: masterSku.skuCode,
    })
    .from(inboundLog)
    .innerJoin(purchaseOrderItem, eq(inboundLog.poItemId, purchaseOrderItem.id))
    .innerJoin(purchaseOrder, eq(purchaseOrderItem.poId, purchaseOrder.id))
    .innerJoin(masterSku, eq(purchaseOrderItem.skuId, masterSku.id))
    .where(and(...conditions))
    .orderBy(desc(inboundLog.scannedAt))
    .limit(limit)
    .offset(offset);

  // Get summary stats (matching all conditions)
  const statsResult = await db
    .select({
      total_scans: sql<number>`count(*)`,
      total_good: sql<number>`coalesce(sum(${inboundLog.qtyGood}), 0)`,
      total_reject: sql<number>`coalesce(sum(${inboundLog.qtyReject}), 0)`,
    })
    .from(inboundLog)
    .innerJoin(purchaseOrderItem, eq(inboundLog.poItemId, purchaseOrderItem.id))
    .innerJoin(purchaseOrder, eq(purchaseOrderItem.poId, purchaseOrder.id))
    .innerJoin(masterSku, eq(purchaseOrderItem.skuId, masterSku.id))
    .where(and(...conditions));

  const stats = statsResult[0] || { total_scans: 0, total_good: 0, total_reject: 0 };
  const totalScans = Number(stats.total_scans);
  const totalGood = Number(stats.total_good);
  const totalReject = Number(stats.total_reject);
  const rejectionRate = totalGood + totalReject > 0
    ? ((totalReject / (totalGood + totalReject)) * 100).toFixed(1)
    : "0.0";

  // Get unique checkers for filter dropdown (within date range)
  const checkers = await db
    .selectDistinct({ checker_name: inboundLog.checkerName })
    .from(inboundLog)
    .where(dateFilter);

  // Get total count for pagination (matching all conditions)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(inboundLog)
    .innerJoin(purchaseOrderItem, eq(inboundLog.poItemId, purchaseOrderItem.id))
    .innerJoin(purchaseOrder, eq(purchaseOrderItem.poId, purchaseOrder.id))
    .innerJoin(masterSku, eq(purchaseOrderItem.skuId, masterSku.id))
    .where(and(...conditions));
  const totalRecords = Number(countResult[0]?.count || 0);

  return Response.json({
    data: logs,
    stats: {
      totalScans,
      totalGood,
      totalReject,
      rejectionRate,
    },
    checkers: checkers.map((c) => c.checker_name),
    pagination: {
      page,
      limit,
      total: totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    },
  });
}
