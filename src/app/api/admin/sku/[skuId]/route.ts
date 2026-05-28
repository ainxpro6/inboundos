import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { masterSku } from "@/server/schema";
import { auth } from "@/lib/auth";
import { canManageSKU } from "@/lib/permissions";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// PATCH /api/admin/sku/[skuId] — Edit SKU
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ skuId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageSKU(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { skuId } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.sku_code) updateData.skuCode = body.sku_code;
  if (body.name) updateData.name = body.name;
  if (body.barcode) updateData.barcode = body.barcode;

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
  }

  try {
    await db.update(masterSku).set(updateData).where(eq(masterSku.id, skuId));
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update SKU";
    if (message.includes("unique") || message.includes("duplicate")) {
      return Response.json(
        { error: "SKU code atau barcode sudah dipakai" },
        { status: 409 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/sku/[skuId] — Delete SKU
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ skuId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageSKU(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { skuId } = await params;

  try {
    await db.delete(masterSku).where(eq(masterSku.id, skuId));
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal hapus SKU";
    if (message.includes("foreign") || message.includes("constraint")) {
      return Response.json(
        { error: "SKU sedang dipakai di PO, tidak bisa dihapus" },
        { status: 409 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
