import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { vendor } from "@/server/schema";
import { auth } from "@/lib/auth";
import { canManageVendor } from "@/lib/permissions";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// PATCH /api/admin/vendor/[vendorId] — Update vendor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageVendor(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { vendorId } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.code !== undefined) updateData.code = body.code;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.phone !== undefined) updateData.phone = body.phone;

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
  }

  try {
    await db.update(vendor).set(updateData).where(eq(vendor.id, vendorId));
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update vendor";
    if (message.includes("unique") || message.includes("duplicate")) {
      return Response.json(
        { error: "Kode vendor atau nama sudah ada" },
        { status: 409 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/vendor/[vendorId] — Delete vendor
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageVendor(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { vendorId } = await params;

  await db.delete(vendor).where(eq(vendor.id, vendorId));

  return Response.json({ success: true });
}
