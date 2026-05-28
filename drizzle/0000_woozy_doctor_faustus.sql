CREATE TYPE "public"."po_status" AS ENUM('PENDING', 'PARTIAL', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_log" (
	"id" text PRIMARY KEY NOT NULL,
	"po_item_id" text NOT NULL,
	"expiry_date" date NOT NULL,
	"qty_good" integer NOT NULL,
	"qty_reject" integer DEFAULT 0 NOT NULL,
	"checker_name" text NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_sku" (
	"id" text PRIMARY KEY NOT NULL,
	"sku_code" text NOT NULL,
	"name" text NOT NULL,
	"barcode" text NOT NULL,
	CONSTRAINT "master_sku_sku_code_unique" UNIQUE("sku_code"),
	CONSTRAINT "master_sku_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "purchase_order" (
	"id" text PRIMARY KEY NOT NULL,
	"po_number" text NOT NULL,
	"supplier_name" text NOT NULL,
	"status" "po_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_order_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"po_id" text NOT NULL,
	"sku_id" text NOT NULL,
	"qty_order" integer NOT NULL,
	"qty_received" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'checker' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" integer,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_log" ADD CONSTRAINT "inbound_log_po_item_id_purchase_order_item_id_fk" FOREIGN KEY ("po_item_id") REFERENCES "public"."purchase_order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_po_id_purchase_order_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_sku_id_master_sku_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."master_sku"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;