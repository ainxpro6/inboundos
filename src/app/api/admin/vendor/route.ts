import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { vendor } from "@/server/schema";
import { auth } from "@/lib/auth";
import { canManageVendor } from "@/lib/permissions";
import { headers } from "next/headers";
import { ilike, or, count } from "drizzle-orm";

// GET /api/admin/vendor — List vendors with pagination + search
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
        ilike(vendor.code, `%${search}%`),
        ilike(vendor.name, `%${search}%`)
      )
    : undefined;

  const [vendors, totalResult] = await Promise.all([
    db
      .select()
      .from(vendor)
      .where(whereClause)
      .orderBy(vendor.name)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(vendor)
      .where(whereClause),
  ]);

  return Response.json({
    data: vendors.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      address: v.address,
      phone: v.phone,
      created_at: v.createdAt.toISOString(),
    })),
    total: totalResult[0].total,
    page,
    limit,
    totalPages: Math.ceil(totalResult[0].total / limit),
  });
}

// POST /api/admin/vendor — Create new vendor (admin/supervisor)
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageVendor(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, address, phone } = body;

  if (!code || !name) {
    return Response.json(
      { error: "Kode vendor dan nama wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const id = crypto.randomUUID();
    await db.insert(vendor).values({
      id,
      code,
      name,
      address: address || null,
      phone: phone || null,
    });

    return Response.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat vendor";
    if (message.includes("unique") || message.includes("duplicate")) {
      return Response.json(
        { error: "Kode vendor atau nama sudah ada" },
        { status: 409 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
