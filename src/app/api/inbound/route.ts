import { NextRequest } from "next/server";
import { db } from "@/server/db";
import {
  inboundLog,
  purchaseOrderItem,
  purchaseOrder,
} from "@/server/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  // Validate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { po_item_id, expiry_date, qty_good, qty_reject } = body;

  // Use session user's name as checker_name
  const checkerName = session.user.name;

  if (!po_item_id || !expiry_date || qty_good == null) {
    return Response.json(
      { success: false, message: "Data tidak lengkap" },
      { status: 400 }
    );
  }

  // Find the PO item
  const poItem = await db.query.purchaseOrderItem.findFirst({
    where: eq(purchaseOrderItem.id, po_item_id),
  });

  if (!poItem) {
    return Response.json({
      success: false,
      message: "PO Item tidak ditemukan. Transaksi dibatalkan.",
    });
  }

  const totalQtyInput = qty_good + (qty_reject || 0);
  const logId = crypto.randomUUID();

  // Transaction: insert log + update qty_received + update PO status
  await db.transaction(async (tx) => {
    // 1. Insert inbound log
    await tx.insert(inboundLog).values({
      id: logId,
      poItemId: po_item_id,
      expiryDate: expiry_date,
      qtyGood: qty_good,
      qtyReject: qty_reject || 0,
      checkerName: checkerName,
    });

    // 2. Update qty_received
    await tx
      .update(purchaseOrderItem)
      .set({
        qtyReceived: sql`${purchaseOrderItem.qtyReceived} + ${totalQtyInput}`,
      })
      .where(eq(purchaseOrderItem.id, po_item_id));

    // 3. Auto-update PO status
    const allItems = await tx.query.purchaseOrderItem.findMany({
      where: eq(purchaseOrderItem.poId, poItem.poId),
    });

    // Recalculate after update
    const updatedItems = allItems.map((item) =>
      item.id === po_item_id
        ? { ...item, qtyReceived: item.qtyReceived + totalQtyInput }
        : item
    );

    const allFulfilled = updatedItems.every(
      (item) => item.qtyReceived >= item.qtyOrder
    );
    const anyStarted = updatedItems.some((item) => item.qtyReceived > 0);

    let newStatus: "PENDING" | "PARTIAL" | "COMPLETED" = "PENDING";
    if (allFulfilled) {
      newStatus = "COMPLETED";
    } else if (anyStarted) {
      newStatus = "PARTIAL";
    }

    await tx
      .update(purchaseOrder)
      .set({ status: newStatus })
      .where(eq(purchaseOrder.id, poItem.poId));
  });

  return Response.json({
    success: true,
    message: "Data berhasil disimpan!",
  });
}
