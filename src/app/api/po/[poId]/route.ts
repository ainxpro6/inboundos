import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { purchaseOrder, purchaseOrderItem } from "@/server/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { canManagePO, canManageUsers } from "@/lib/permissions";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  // Validate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poId } = await params;

  const po = await db.query.purchaseOrder.findFirst({
    where: eq(purchaseOrder.id, poId),
    with: {
      items: {
        with: {
          sku: true,
        },
        orderBy: (item, { asc }) => [asc(item.createdAt)],
      },
    },
  });

  if (!po) {
    return Response.json({ error: "PO not found" }, { status: 404 });
  }

  const result = {
    id: po.id,
    po_number: po.poNumber,
    supplier_name: po.supplierName,
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
  };

  return Response.json(result);
}

// PATCH /api/po/[poId] — Update PO (admin/supervisor)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManagePO(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { poId } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.supplier_name) updateData.supplierName = body.supplier_name;
  if (body.status) updateData.status = body.status;

  if (Object.keys(updateData).length > 0) {
    await db.update(purchaseOrder).set(updateData).where(eq(purchaseOrder.id, poId));
  }

  return Response.json({ success: true });
}

// DELETE /api/po/[poId] — Delete PO (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageUsers(session.user.role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { poId } = await params;

  // Delete PO (cascade will handle items and logs)
  await db.delete(purchaseOrder).where(eq(purchaseOrder.id, poId));

  return Response.json({ success: true });
}
