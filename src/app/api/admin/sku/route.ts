import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { masterSku } from "@/server/schema";
import { auth } from "@/lib/auth";
import { canManageSKU } from "@/lib/permissions";
import { headers } from "next/headers";
import { ilike, or, sql, count } from "drizzle-orm";

// GET /api/admin/sku — List SKUs with pagination + search
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(
        ilike(masterSku.skuCode, `%${search}%`),
        ilike(masterSku.name, `%${search}%`),
        ilike(masterSku.barcode, `%${search}%`)
      )
    : undefined;

  const [skus, totalResult] = await Promise.all([
    db
      .select()
      .from(masterSku)
      .where(whereClause)
      .orderBy(masterSku.skuCode)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(masterSku)
      .where(whereClause),
  ]);

  return Response.json({
    data: skus.map((s) => ({
      id: s.id,
      sku_code: s.skuCode,
      name: s.name,
      barcode: s.barcode,
    })),
    total: totalResult[0].total,
    page,
    limit,
    totalPages: Math.ceil(totalResult[0].total / limit),
  });
}

// POST /api/admin/sku — Create new SKU (admin/supervisor)
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageSKU(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { sku_code, name, barcode } = body;

  if (!sku_code || !name || !barcode) {
    return Response.json(
      { error: "SKU code, nama, dan barcode wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const id = crypto.randomUUID();
    await db.insert(masterSku).values({
      id,
      skuCode: sku_code,
      name,
      barcode,
    });

    return Response.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat SKU";
    if (message.includes("unique") || message.includes("duplicate")) {
      return Response.json(
        { error: "SKU code atau barcode sudah ada" },
        { status: 409 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
