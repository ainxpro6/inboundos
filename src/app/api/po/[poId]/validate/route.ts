import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { masterSku, purchaseOrderItem } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  // Validate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poId } = await params;
  const body = await request.json();
  const { barcode } = body;

  if (!barcode) {
    return Response.json(
      { success: false, message: "Barcode wajib diisi" },
      { status: 400 }
    );
  }

  // Find SKU by barcode
  const sku = await db.query.masterSku.findFirst({
    where: eq(masterSku.barcode, barcode),
  });

  if (!sku) {
    return Response.json({
      success: false,
      message: "Barcode tidak terdaftar di Master SKU",
    });
  }

  // Check if this SKU is part of the PO
  const poItem = await db.query.purchaseOrderItem.findFirst({
    where: and(
      eq(purchaseOrderItem.poId, poId),
      eq(purchaseOrderItem.skuId, sku.id)
    ),
    with: {
      sku: true,
    },
  });

  if (!poItem) {
    return Response.json({
      success: false,
      message: "SKU tidak terdaftar dalam PO ini",
    });
  }

  return Response.json({
    success: true,
    message: "SKU valid dan terdaftar dalam PO",
    sku: {
      id: sku.id,
      sku_code: sku.skuCode,
      name: sku.name,
      barcode: sku.barcode,
    },
    po_item: {
      id: poItem.id,
      po_id: poItem.poId,
      sku_id: poItem.skuId,
      qty_order: poItem.qtyOrder,
      qty_received: poItem.qtyReceived,
    },
  });
}
