"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  ScanBarcode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react";

const CABANG_OPTIONS = ["", "Bogor", "Jakarta", "Palembang"];

interface InboundLogEntry {
  id: string;
  expiry_date: string;
  qty_good: number;
  qty_reject: number;
  checker_name: string;
  scanned_at: string;
  po_number: string;
  po_cabang: string;
  sku_name: string;
  sku_code: string;
}

interface Stats {
  totalScans: number;
  totalGood: number;
  totalReject: number;
  rejectionRate: string;
}

interface LogsResponse {
  data: InboundLogEntry[];
  stats: Stats;
  checkers: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function InboundLogsPage() {
  const [response, setResponse] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState("7d");
  const [checker, setChecker] = useState("");
  const [cabang, setCabang] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        dateRange,
      });
      if (checker) params.set("checker", checker);
      if (cabang) params.set("cabang", cabang);
      if (search.trim()) params.set("search", search);

      const res = await fetch(`/api/admin/inbound-logs?${params}`);
      if (res.ok) {
        setResponse(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, dateRange, checker, cabang, search]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "99999",
        dateRange,
      });
      if (checker) params.set("checker", checker);
      if (cabang) params.set("cabang", cabang);
      if (search.trim()) params.set("search", search);

      const res = await fetch(`/api/admin/inbound-logs?${params}`);
      if (!res.ok) return;
      const data: LogsResponse = await res.json();

      const csvHeader = "Timestamp,PO Number,SKU Code,SKU Name,Cabang,Expiry Date,Qty Good,Qty Reject,Checker\n";
      const csvRows = data.data
        .map((log) => {
          const ts = new Date(log.scanned_at).toLocaleString("id-ID");
          const expiry = new Date(log.expiry_date).toLocaleDateString("id-ID");
          const skuName = `"${(log.sku_name || "").replace(/"/g, '""')}"`;
          return `${ts},${log.po_number},${log.sku_code},${skuName},${log.po_cabang},${expiry},${log.qty_good},${log.qty_reject},${log.checker_name}`;
        })
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inbound-logs-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  }, [dateRange, checker, cabang, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [dateRange, checker, cabang, search]);

  const stats = response?.stats || {
    totalScans: 0,
    totalGood: 0,
    totalReject: 0,
    rejectionRate: "0.0",
  };

  const getStatusBadge = (qtyGood: number, qtyReject: number) => {
    const total = qtyGood + qtyReject;
    const rejectPct = total > 0 ? (qtyReject / total) * 100 : 0;

    if (qtyReject === 0) {
      return {
        label: "Quality Pass",
        bg: "bg-status-bg-green",
        text: "text-success-vibrant",
        border: "border-success-vibrant/20",
      };
    }
    if (rejectPct < 10) {
      return {
        label: "Flagged for Review",
        bg: "bg-status-bg-amber",
        text: "text-warning-amber",
        border: "border-warning-amber/20",
      };
    }
    return {
      label: "High Rejection",
      bg: "bg-status-bg-red",
      text: "text-danger-signal",
      border: "border-danger-signal/20",
    };
  };

  const pagination = response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const showFrom = (pagination.page - 1) * pagination.limit + 1;
  const showTo = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-industrial-blue leading-tight">
            Inbound Logs & Reports
          </h1>
          <p className="text-on-surface-variant mt-1">
            Detailed audit trail and receiving metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-outline-variant bg-surface-container-lowest rounded-xl px-4 py-2 text-sm text-on-surface focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus min-h-[48px]"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 border-2 border-industrial-blue bg-transparent text-industrial-blue px-6 py-2 rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors min-h-[48px] disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-industrial-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Scans"
          value={stats.totalScans.toLocaleString()}
          icon={<ScanBarcode className="h-5 w-5 text-industrial-blue" />}
        />
        <SummaryCard
          label="Total Good Units"
          value={stats.totalGood.toLocaleString()}
          icon={<CheckCircle className="h-5 w-5 text-success-vibrant" />}
        />
        <SummaryCard
          label="Total Reject Units"
          value={stats.totalReject.toLocaleString()}
          icon={<XCircle className="h-5 w-5 text-danger-signal" />}
        />
        <SummaryCard
          label="Rejection Rate"
          value={`${stats.rejectionRate}%`}
          icon={<AlertTriangle className="h-5 w-5 text-warning-amber" />}
        />
      </div>

      {/* Filters & Data Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        {/* Filters Row */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO, SKU, Name, Checker..."
              className="w-full min-h-[40px] pl-9 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-5 w-5 text-on-surface-variant" />
            <span className="text-sm font-semibold text-on-surface-variant mr-1">Filters:</span>
            <select
              value={checker}
              onChange={(e) => setChecker(e.target.value)}
              className="border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-1.5 text-sm text-on-surface focus:border-scanner-focus min-h-[40px]"
            >
              <option value="">All Checkers</option>
              {(response?.checkers || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={cabang}
              onChange={(e) => setCabang(e.target.value)}
              className="border border-outline-variant bg-surface-container-lowest rounded-lg px-3 py-1.5 text-sm text-on-surface focus:border-scanner-focus min-h-[40px]"
            >
              <option value="">All Cabang</option>
              {CABANG_OPTIONS.filter(Boolean).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-scanner-focus border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !response?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <ScanBarcode className="h-12 w-12 text-outline-variant mb-4" />
              <p className="text-sm">Belum ada data inbound log</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-sm font-semibold text-on-surface-variant">
                  <th className="p-4 whitespace-nowrap">Timestamp</th>
                  <th className="p-4 whitespace-nowrap">PO Number</th>
                  <th className="p-4 whitespace-nowrap">SKU Code</th>
                  <th className="p-4">SKU Name</th>
                  <th className="p-4 whitespace-nowrap">Cabang</th>
                  <th className="p-4 whitespace-nowrap">Expiry Date</th>
                  <th className="p-4 text-right whitespace-nowrap">Qty Good</th>
                  <th className="p-4 text-right whitespace-nowrap">Qty Reject</th>
                  <th className="p-4 whitespace-nowrap">Checker</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {response.data.map((log, idx) => {
                  const badge = getStatusBadge(log.qty_good, log.qty_reject);
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-outline-variant hover:bg-surface-container-high transition-colors ${
                        idx % 2 === 1 ? "bg-surface-container-low/30" : ""
                      }`}
                    >
                      <td className="p-4 text-on-surface-variant whitespace-nowrap text-sm">
                        {new Date(log.scanned_at).toLocaleDateString("id-ID", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(log.scanned_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 font-bold text-industrial-blue whitespace-nowrap text-sm">
                        {log.po_number}
                      </td>
                      <td className="p-4 text-sm font-semibold text-industrial-blue font-mono whitespace-nowrap">
                        {log.sku_code}
                      </td>
                      <td className="p-4 max-w-[250px] truncate text-sm" title={log.sku_name}>
                        {log.sku_name}
                      </td>
                      <td className="p-4 text-on-surface-variant whitespace-nowrap text-sm">
                        {log.po_cabang}
                      </td>
                      <td className="p-4 text-on-surface-variant whitespace-nowrap text-sm">
                        {new Date(log.expiry_date).toLocaleDateString("id-ID", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right font-bold text-success-vibrant text-sm">
                        {log.qty_good.toLocaleString()}
                      </td>
                      <td className={`p-4 text-right text-sm ${log.qty_reject > 0 ? "font-bold text-danger-signal" : ""}`}>
                        {log.qty_reject}
                      </td>
                      <td className="p-4 text-on-surface-variant whitespace-nowrap text-sm">
                        {log.checker_name}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div className="text-sm text-on-surface-variant">
              Showing {showFrom}-{showTo} of {pagination.total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="w-10 h-10 flex items-center justify-center border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="w-10 h-10 flex items-center justify-center border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-on-surface-variant text-sm font-semibold">{label}</span>
        {icon}
      </div>
      <div className="text-[32px] md:text-[40px] font-extrabold leading-[48px] text-industrial-blue animate-count-up">
        {value}
      </div>
    </div>
  );
}
