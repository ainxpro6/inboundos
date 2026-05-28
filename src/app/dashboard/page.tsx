"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useInbound } from "@/context/inbound-context";
import { Header } from "@/components/layout/header";
import { POSearch } from "@/components/po/po-search";
import { POCard } from "@/components/po/po-card";
import {
  Package,
  ScanBarcode,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

export default function DashboardPage() {
  const { purchaseOrders, isLoading, loadPurchaseOrders, searchPurchaseOrders } =
    useInbound();

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const handleSearch = useCallback(
    (query: string) => {
      searchPurchaseOrders(query);
    },
    [searchPurchaseOrders]
  );

  // Quick stats
  const stats = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const totalItems = purchaseOrders.reduce(
      (sum, po) => sum + po.items.length,
      0
    );
    const totalOrdered = purchaseOrders.reduce(
      (sum, po) => sum + po.items.reduce((s, i) => s + i.qty_order, 0),
      0
    );
    const totalReceived = purchaseOrders.reduce(
      (sum, po) => sum + po.items.reduce((s, i) => s + i.qty_received, 0),
      0
    );
    const completionRate =
      totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

    return { totalPOs, totalItems, totalReceived, completionRate };
  }, [purchaseOrders]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 px-4 pb-6">
        {/* Hero Section */}
        <div className="pt-6 pb-5">
          <h1 className="text-xl font-bold tracking-tight mb-1 text-industrial-blue">
            Dashboard Inbound
          </h1>
          <p className="text-sm text-on-surface-variant">
            Monitor dan kelola proses penerimaan barang.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<ClipboardList className="h-4 w-4" />}
            label="Total PO"
            value={stats.totalPOs}
            color="primary"
          />
          <StatCard
            icon={<Package className="h-4 w-4" />}
            label="Total Items"
            value={stats.totalItems}
            color="primary"
          />
          <StatCard
            icon={<ScanBarcode className="h-4 w-4" />}
            label="Qty Diterima"
            value={stats.totalReceived}
            color="success"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Completion"
            value={`${stats.completionRate}%`}
            color="warning"
          />
        </div>

        {/* Search */}
        <POSearch onSearch={handleSearch} className="mb-5" />

        {/* PO List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            Purchase Orders
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl animate-shimmer"
                />
              ))}
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-outline-variant" />
              </div>
              <p className="text-sm text-on-surface-variant font-medium">
                Tidak ada PO ditemukan
              </p>
              <p className="text-xs text-on-surface-variant/60 mt-1">
                Coba ubah kata kunci pencarian
              </p>
            </div>
          ) : (
            purchaseOrders.map((po) => <POCard key={po.id} po={po} />)
          )}
        </div>
      </main>
    </div>
  );
}

// ---------- Stat Card Sub-component ----------

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "primary" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "bg-primary-fixed text-scanner-focus",
    success: "bg-status-bg-green text-success-vibrant",
    warning: "bg-status-bg-amber text-warning-amber",
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-lg ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold tabular-nums text-industrial-blue">{value}</p>
    </div>
  );
}
