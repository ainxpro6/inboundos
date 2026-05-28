# InboundOS — Warehouse Inbound Scanner

InboundOS is a modern, high-performance, mobile-first **Progressive Web App (PWA)** designed specifically for warehouse operations (Checkers and Supervisors). It streamlines the intake of Fast-Moving Consumer Goods (FMCG), ensuring high accuracy in recording product masses, expiration dates, and quantities directly from loading docks.

Developed using **Next.js 16**, **React 19**, **TailwindCSS v4**, **Drizzle ORM**, and **Better Auth**, InboundOS guarantees transactional integrity, micro-second latency, and beautiful interactive feedback on both mobile scanners and desktop panels.

---

## 🚀 Key Features

### 📡 1. Barcode Scanning & Verification
* **Integrated HTML5 Camera Scanner**: Scans EAN-13, UPC, and Code 128 barcodes using standard browser cameras via `html5-qrcode`.
* **Hardware Scanner Compatibility (Keyboard Wedge)**: Instant scanning on rugged industrial devices (Zebra, Honeywell, PDA handhelds) with zero key focus required.
* **Instant SKU Lookup**: Cross-references scanned barcodes against the central Master SKU database and verifies PO item inclusions in real-time.

### 📱 2. Progressive Web App (PWA) Integration
* **Standalone Installation**: Run InboundOS in chromeless standalone mode directly on Android/iOS and industrial handheld terminals.
* **Lock-Scale Viewports**: Specially configured to override native browser auto-zoom when tapping text inputs on mobile screens. Keeps the layout static and stable.
* **Offline Caching**: Workbox-powered service workers (`sw.js`) cache core app segments for seamless navigation in warehouse dead zones.

### 📊 3. Interactive PO Progress & Audits
* **Fulfillment Dashboard**: Real-time progress bars and status indicators mapping Qty Ordered against Qty Received.
* **Smart Expiry Warnings**: Visual warnings if a checker enters an expiry date less than 6 months from today, preventing short-shelf-life intakes.
* **Excel-Friendly CSV Export**: Export PO tables, Master SKUs, and Inbound Logs with Excel-compliant UTF-8 Byte Order Mark (`\uFEFF`) and quote sanitization.
* **SQL-Level Inbound Search**: Instantly query logs by PO number, SKU code, product name, or checker with debounced client-side inputs.

### 🔐 4. Auth & Role-Based Permissions
* **Secure Sessions**: Powered by **Better Auth** with secure, encrypted HTTP-only session cookies.
* **Access Control Lists (ACL)**:
  * **Checker**: Scanner workflows, detail entries, and personal intake views.
  * **Supervisor & Admin**: Create/edit POs, manage Master SKUs, register users, audit all logs, and trigger Excel CSV exports.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS v4, Lucide Icons, Sonner |
| **Authentication** | Better Auth (Session-based, secure credentials) |
| **ORM & Database** | Drizzle ORM (Type-safe query builder), PostgreSQL |
| **PWA Tooling** | `@ducanh2912/next-pwa` (Workbox Service Worker wrapper) |
| **Build System** | Webpack Compiler (For PWA custom bundler support) |

---

## 📁 Database Schema

InboundOS maintains ACID-compliant relational tables inside PostgreSQL:

1. **`user`**: Central authentication user directory with role-based attributes (`role`, `banned`).
2. **`session`**: Active login session hashes with dynamic `expires_at` trackers.
3. **`master_sku`**: Global SKU catalog containing `sku_code`, `name`, and indexable `barcode`.
4. **`purchase_order`**: Head of purchase documents (`po_number`, `supplier_name`, `status`, `cabang`).
5. **`purchase_order_item`**: Ordered items linking POs to Master SKUs with target `qty_order` and cumulative `qty_received`.
6. **`inbound_log`**: Audit logs of inbound scan logs (`qty_good`, `qty_reject`, `expiry_date`, `checker_name`).

*Note: Inbound saves trigger SQL **transactions** to insert logs, update item fulfillment progress, and auto-transition PO statuses atomically.*

---

## 🏁 Getting Started

### 1. Prerequisites
* **Node.js**: v20 or newer
* **PostgreSQL**: Local or hosted instance (Supabase, Neon, AWS RDS, etc.)

### 2. Environment Variables Setup
Create a `.env.local` file in the root folder of the project:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/inboundos"
BETTER_AUTH_SECRET="your-32-char-random-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Dependency Installation
Install production and developer packages:
```bash
npm install
```

### 4. Database Setup
Generate and execute SQL migrations to provision the schema in PostgreSQL, then seed test data:
```bash
# Generate schema files
npm run db:generate

# Push schema directly to database
npm run db:push

# Run seed script (Creates default Admin and Checker profiles + sample POs)
npm run db:seed
```

### 5. Running the Application
Start the development server with the Webpack compiler:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Builds
Compile and optimize for production:
```bash
npm run build
```
This command compiles static assets, type-checks code, and builds PWA service workers cleanly under the Webpack engine.

---

## 📄 License
This project is proprietary and confidential. Owned and maintained by Inbound Logistics team.
