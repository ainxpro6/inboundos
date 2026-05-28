"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

interface POData {
  id: string;
  po_number: string;
  supplier_name: string;
  cabang: string;
  status: string;
  created_at: string;
  items: { qty_order: number; qty_received: number }[];
}

interface InboundLogEntry {
  id: string;
  qty_good: number;
  qty_reject: number;
  checker_name: string;
  scanned_at: string;
  sku_name?: string;
  sku_code?: string;
  po_number?: string;
}

export default function AdminOverviewPage() {
  const { data: session } = useSession();
  const [pos, setPOs] = useState<POData[]>([]);
  const [recentLogs, setRecentLogs] = useState<InboundLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [posRes, logsRes] = await Promise.all([
          fetch("/api/po").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/admin/inbound-logs?limit=5").then((r) =>
            r.ok ? r.json() : { data: [] }
          ),
        ]);
        setPOs(Array.isArray(posRes) ? posRes : []);
        setRecentLogs(logsRes.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activePOs = pos.filter((p) => p.status !== "COMPLETED");
  const totalOrdered = pos.reduce(
    (s, po) => s + po.items.reduce((a, i) => a + i.qty_order, 0),
    0
  );
  const totalReceived = pos.reduce(
    (s, po) => s + po.items.reduce((a, i) => a + i.qty_received, 0),
    0
  );
  const completionPct =
    totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleExportPOs = useCallback(async () => {
    setExporting(true);
    try {
      const csvHeader = "PO Number,Supplier,Cabang,Status,Created,Qty Ordered,Qty Received,Progress %\n";
      const csvRows = pos
        .map((po) => {
          const ordered = po.items.reduce((s, i) => s + i.qty_order, 0);
          const received = po.items.reduce((s, i) => s + i.qty_received, 0);
          const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
          const created = new Date(po.created_at).toLocaleDateString("id-ID");
          const supplier = `"${(po.supplier_name || "").replace(/"/g, '""')}"`;
          return `${po.po_number},${supplier},${po.cabang},${po.status},${created},${ordered},${received},${pct}%`;
        })
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [pos]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-industrial-blue leading-tight">
            Shift Overview
          </h1>
          <p className="text-on-surface-variant mt-1">
            {dateStr} • Cabang Jakarta, Bogor, Palembang
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPOs}
            disabled={exporting || pos.length === 0}
            className="min-h-[48px] px-4 bg-industrial-blue text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {exporting ? "Exporting..." : "Export POs"}
          </button>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Active POs */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between h-32 md:h-40 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              Active POs
            </span>
            <span className="bg-primary-fixed text-scanner-focus p-1.5 rounded-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <div className="z-10 flex items-baseline gap-3">
            <span className="text-[40px] font-extrabold leading-[48px] text-industrial-blue">
              {loading ? "..." : activePOs.length}
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-surface-container opacity-50 rounded-full border border-outline-variant z-0 pointer-events-none" />
        </div>

        {/* Units Received */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between h-32 md:h-40">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              Units Received
            </span>
            <span className="bg-surface-container-high text-industrial-blue p-1.5 rounded-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[40px] font-extrabold leading-[48px] text-industrial-blue">
                {loading ? "..." : totalReceived.toLocaleString()}
              </span>
              <span className="text-on-surface-variant">/ {totalOrdered.toLocaleString()}</span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-industrial-blue transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scanning Pace */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center h-32 md:h-40">
          <div className="flex-1">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
              Scanning Pace
            </span>
            <span className="text-xl font-semibold text-on-surface">
              {completionPct >= 80 ? "On Track" : completionPct >= 40 ? "In Progress" : "Starting"}
            </span>
            <p className="text-on-surface-variant mt-1 text-sm">
              Selamat datang, {session?.user?.name}
            </p>
          </div>
          <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-container-highest"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="text-success-vibrant"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${completionPct}, 100`}
                strokeWidth="4"
              />
            </svg>
            <span className="absolute text-sm font-bold text-industrial-blue">
              {completionPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
        {/* Active Purchase Orders Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low rounded-t-xl">
            <h2 className="text-lg font-semibold text-industrial-blue">
              Active Purchase Orders
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-scanner-focus border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                <p className="text-sm">Belum ada Purchase Order</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant z-10">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-on-surface-variant">PO Number</th>
                    <th className="p-4 text-sm font-semibold text-on-surface-variant hidden sm:table-cell">Supplier</th>
                    <th className="p-4 text-sm font-semibold text-on-surface-variant w-1/3">Progress</th>
                    <th className="p-4 text-sm font-semibold text-on-surface-variant text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.slice(0, 10).map((po) => {
                    const ordered = po.items.reduce((s, i) => s + i.qty_order, 0);
                    const received = po.items.reduce((s, i) => s + i.qty_received, 0);
                    const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                    const barColor =
                      pct >= 100 ? "bg-success-vibrant" : pct > 0 ? "bg-scanner-focus" : "bg-industrial-blue";
                    const statusBadge =
                      po.status === "COMPLETED"
                        ? { bg: "bg-status-bg-green", text: "text-success-vibrant", label: "Complete" }
                        : po.status === "PARTIAL"
                        ? { bg: "bg-secondary-container", text: "text-on-secondary-container", label: "Active" }
                        : { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Pending" };

                    return (
                      <tr key={po.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer group">
                        <td className="p-4">
                          <span className="text-sm font-semibold text-industrial-blue group-hover:text-scanner-focus transition-colors block">
                            {po.po_number}
                          </span>
                          <span className="text-xs text-on-surface-variant sm:hidden">{po.supplier_name}</span>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-sm text-on-surface">{po.supplier_name}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-industrial-blue">
                              {received.toLocaleString()} / {ordered.toLocaleString()}
                            </span>
                            <span className={`text-xs font-semibold ${pct >= 100 ? "text-success-vibrant" : pct > 50 ? "text-scanner-focus" : "text-on-surface-variant"}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-surface-container-highest rounded-sm overflow-hidden">
                            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-3 border-t border-outline-variant text-center bg-surface-container-low rounded-b-xl">
            <Link
              href="/admin/po"
              className="text-sm font-semibold text-industrial-blue hover:text-scanner-focus transition-colors min-h-[48px] w-full inline-flex items-center justify-center"
            >
              View All POs
            </Link>
          </div>
        </div>

        {/* Live Scan Feed */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-outline-variant flex items-center gap-2 bg-surface-container-low rounded-t-xl">
            <span className="w-2 h-2 rounded-full bg-success-vibrant animate-pulse" />
            <h2 className="text-lg font-semibold text-industrial-blue">Live Scan Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <p className="text-sm">Belum ada scan terbaru</p>
              </div>
            ) : (
              recentLogs.map((log) => {
                const isReject = log.qty_reject > 0;
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                      isReject
                        ? "border-error-container bg-status-bg-red/30"
                        : "border-outline-variant bg-surface-container-lowest hover:border-scanner-focus"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isReject
                          ? "bg-status-bg-red text-danger-signal"
                          : "bg-primary-fixed text-scanner-focus"
                      }`}
                    >
                      {isReject ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-semibold truncate block ${isReject ? "text-danger-signal" : "text-on-surface"}`}>
                          {log.sku_code || "SKU"} {log.sku_name ? `(${log.sku_name.substring(0, 20)})` : ""}
                        </span>
                        <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">
                          {new Date(log.scanned_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                        <span className="border-r border-outline-variant pr-2">
                          Qty: <strong className="text-industrial-blue">{log.qty_good}</strong>
                          {log.qty_reject > 0 && (
                            <span className="text-danger-signal ml-1">(Reject: {log.qty_reject})</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {log.checker_name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
