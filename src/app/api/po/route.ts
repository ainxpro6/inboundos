import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { purchaseOrder, purchaseOrderItem, masterSku } from "@/server/schema";
import { eq, ilike, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { canManagePO } from "@/lib/permissions";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  // Validate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim();

  // Fetch POs with items and SKU joins
  let pos;

  if (search) {
    pos = await db.query.purchaseOrder.findMany({
      where: or(
        ilike(purchaseOrder.poNumber, `%${search}%`),
        ilike(purchaseOrder.supplierName, `%${search}%`)
      ),
      with: {
        items: {
          with: {
            sku: true,
          },
        },
      },
      orderBy: (po, { desc }) => [desc(po.createdAt)],
    });
  } else {
    pos = await db.query.purchaseOrder.findMany({
      with: {
        items: {
          with: {
            sku: true,
          },
        },
      },
      orderBy: (po, { desc }) => [desc(po.createdAt)],
    });
  }

  // Map to frontend format
  const result = pos.map((po) => ({
    id: po.id,
    po_number: po.poNumber,
    supplier_name: po.supplierName,
    cabang: po.cabang,
    status: po.status,
    created_at: po.createdAt.toISOString(),
    items: po.items.map((item) => ({
      id: item.id,
      po_id: item.poId,
      sku_id: item.skuId,
      qty_order: item.qtyOrder,
      qty_received: item.qtyReceived,
      sku: item.sku
        ? {
            id: item.sku.id,
            sku_code: item.sku.skuCode,
            name: item.sku.name,
            barcode: item.sku.barcode,
          }
        : undefined,
    })),
  }));

  return Response.json(result);
}

// POST /api/po — Create new PO (admin/supervisor)
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManagePO(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { po_number, supplier_name, cabang, items } = body;

  if (!po_number || !supplier_name) {
    return Response.json(
      { error: "Nomor PO dan nama supplier wajib diisi" },
      { status: 400 }
    );
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json(
      { error: "Minimal 1 item dalam PO" },
      { status: 400 }
    );
  }

  // Check PO number uniqueness
  const existing = await db.query.purchaseOrder.findFirst({
    where: eq(purchaseOrder.poNumber, po_number),
  });

  if (existing) {
    return Response.json(
      { error: "Nomor PO sudah ada" },
      { status: 409 }
    );
  }

  const poId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      // Create PO
      await tx.insert(purchaseOrder).values({
        id: poId,
        poNumber: po_number,
        supplierName: supplier_name,
        cabang: cabang || "Jakarta",
        status: "PENDING",
      });

      // Create PO items
      for (const item of items) {
        if (!item.sku_id || !item.qty_order || item.qty_order <= 0) continue;

        await tx.insert(purchaseOrderItem).values({
          id: crypto.randomUUID(),
          poId: poId,
          skuId: item.sku_id,
          qtyOrder: item.qty_order,
          qtyReceived: 0,
        });
      }
    });

    return Response.json({ success: true, id: poId });
  } catch (err: unknown) {
    console.error("PO creation error:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return Response.json({ error: message }, { status: 500 });
  }
}
