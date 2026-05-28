import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Better Auth Tables
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Admin plugin fields
  role: text("role").notNull().default("checker"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Application Tables
// ============================================================================

export const poStatusEnum = pgEnum("po_status", [
  "PENDING",
  "PARTIAL",
  "COMPLETED",
]);

export const masterSku = pgTable("master_sku", {
  id: text("id").primaryKey(),
  skuCode: text("sku_code").notNull().unique(),
  name: text("name").notNull(),
  barcode: text("barcode").notNull().unique(),
});

export const purchaseOrder = pgTable("purchase_order", {
  id: text("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierName: text("supplier_name").notNull(),
  cabang: text("cabang").notNull().default("Jakarta"),
  status: poStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseOrderItem = pgTable("purchase_order_item", {
  id: text("id").primaryKey(),
  poId: text("po_id")
    .notNull()
    .references(() => purchaseOrder.id, { onDelete: "cascade" }),
  skuId: text("sku_id")
    .notNull()
    .references(() => masterSku.id),
  qtyOrder: integer("qty_order").notNull(),
  qtyReceived: integer("qty_received").notNull().default(0),
});

export const inboundLog = pgTable("inbound_log", {
  id: text("id").primaryKey(),
  poItemId: text("po_item_id")
    .notNull()
    .references(() => purchaseOrderItem.id, { onDelete: "cascade" }),
  expiryDate: date("expiry_date").notNull(),
  qtyGood: integer("qty_good").notNull(),
  qtyReject: integer("qty_reject").notNull().default(0),
  checkerName: text("checker_name").notNull(),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
});

// ============================================================================
// Relations (for Drizzle query API)
// ============================================================================

export const purchaseOrderRelations = relations(purchaseOrder, ({ many }) => ({
  items: many(purchaseOrderItem),
}));

export const purchaseOrderItemRelations = relations(
  purchaseOrderItem,
  ({ one, many }) => ({
    purchaseOrder: one(purchaseOrder, {
      fields: [purchaseOrderItem.poId],
      references: [purchaseOrder.id],
    }),
    sku: one(masterSku, {
      fields: [purchaseOrderItem.skuId],
      references: [masterSku.id],
    }),
    inboundLogs: many(inboundLog),
  })
);

export const masterSkuRelations = relations(masterSku, ({ many }) => ({
  purchaseOrderItems: many(purchaseOrderItem),
}));

export const inboundLogRelations = relations(inboundLog, ({ one }) => ({
  poItem: one(purchaseOrderItem, {
    fields: [inboundLog.poItemId],
    references: [purchaseOrderItem.id],
  }),
}));
