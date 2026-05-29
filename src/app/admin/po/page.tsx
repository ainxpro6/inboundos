"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Trash2,
  Search,
  AlertTriangle,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const CABANG_OPTIONS = ["Bogor", "Jakarta", "Palembang"];

interface SkuOption {
  id: string;
  sku_code: string;
  name: string;
  barcode: string;
}

interface POItem {
  id: string;
  sku_id: string;
  qty_order: number;
  qty_received: number;
  sku?: SkuOption;
}

interface PO {
  id: string;
  po_number: string;
  supplier_name: string;
  cabang: string;
  status: string;
  created_at: string;
  items: POItem[];
}

export default function AdminPOPage() {
  const searchParams = useSearchParams();
  const [pos, setPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PO | null>(null);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [exporting, setExporting] = useState(false);

  // Open create dialog if ?create=true in URL
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true);
    }
  }, [searchParams]);

  const loadPOs = useCallback(async () => {
    try {
      const url = search.trim()
        ? `/api/po?search=${encodeURIComponent(search)}`
        : "/api/po";
      const res = await fetch(url);
      if (res.ok) setPOs(await res.json());
    } catch {
      toast.error("Gagal memuat data PO");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      loadPOs();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadPOs]);

  const getProgress = (items: POItem[]) => {
    const ordered = items.reduce((s, i) => s + i.qty_order, 0);
    const received = items.reduce((s, i) => s + i.qty_received, 0);
    return { ordered, received, pct: ordered > 0 ? Math.round((received / ordered) * 100) : 0 };
  };

  const filteredPOs = statusFilter
    ? pos.filter((po) => po.status === statusFilter)
    : pos;

  const handleExportPOs = useCallback(() => {
    setExporting(true);
    try {
      const csvHeader = "PO Number,Supplier,Cabang,Status,Created,Qty Ordered,Qty Received,Progress %\n";
      const csvRows = filteredPOs
        .map((po) => {
          const { ordered, received, pct } = getProgress(po.items);
          const created = new Date(po.created_at).toLocaleDateString("id-ID");
          const supplier = `"${(po.supplier_name || "").replace(/"/g, '""')}"`;
          return `${po.po_number},${supplier},${po.cabang},${po.status},${created},${ordered},${received},${pct}%`;
        })
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-orders-${statusFilter || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [filteredPOs, statusFilter]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background">
      {/* Header & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-industrial-blue leading-tight">
            Purchase Orders
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleExportPOs}
              disabled={exporting || filteredPOs.length === 0}
              className="min-h-[48px] px-4 border-2 border-industrial-blue text-industrial-blue bg-transparent rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-industrial-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export"}</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="min-h-[48px] px-6 bg-industrial-blue text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat PO</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-on-surface-variant">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search POs, Suppliers..."
                className="w-full min-h-[48px] pl-10 pr-4 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-on-surface-variant">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[48px] bg-surface-container-low border border-outline-variant rounded-xl px-4 text-sm text-on-surface focus:border-scanner-focus focus:ring-1 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-scanner-focus border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-outline-variant mb-4" />
              <p className="text-sm text-on-surface-variant">Tidak ada PO ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-container-low sticky top-0 z-10 border-b border-outline-variant">
                <tr>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue whitespace-nowrap">PO Number</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue">Supplier</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue whitespace-nowrap">Cabang</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue whitespace-nowrap">Created</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue">Status</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue w-64">Receiving Progress</th>
                  <th className="py-4 px-6 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po) => {
                  const { ordered, received, pct } = getProgress(po.items);
                  const barColor =
                    pct >= 100 ? "bg-success-vibrant" : pct > 0 ? "bg-scanner-focus" : "bg-industrial-blue";

                  const statusBadge =
                    po.status === "COMPLETED"
                      ? { bg: "bg-status-bg-green", text: "text-success-vibrant", icon: "✓", label: "Completed" }
                      : po.status === "PARTIAL"
                      ? { bg: "bg-status-bg-amber", text: "text-warning-amber", icon: "⏳", label: "In Progress" }
                      : { bg: "bg-surface-container-high", text: "text-on-surface-variant", icon: "◷", label: "Pending" };

                  return (
                    <tr
                      key={po.id}
                      className={`border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors ${
                        selectedPO?.id === po.id ? "bg-secondary-container/30" : ""
                      }`}
                      onClick={() => setSelectedPO(po)}
                    >
                      <td className="py-4 px-6 font-bold text-industrial-blue text-sm">{po.po_number}</td>
                      <td className="py-4 px-6 text-sm">{po.supplier_name}</td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">{po.cabang}</td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">
                        {new Date(po.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                            <span>{received.toLocaleString()} / {ordered.toLocaleString()} Units</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                            <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(po); }}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-danger-signal hover:bg-status-bg-red transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-outline-variant p-4 flex justify-between items-center bg-surface-container-lowest">
          <span className="text-sm text-on-surface-variant">
            Showing {filteredPOs.length} entries
          </span>
        </div>
      </div>

      {/* Create PO Dialog */}
      <CreatePODialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={loadPOs}
      />

      {/* Delete Dialog */}
      <DeletePODialog
        po={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadPOs}
      />
    </div>
  );
}

// ============================================================================
// Create PO Dialog
// ============================================================================

interface NewPOItem {
  sku_id: string;
  sku_code: string;
  sku_name: string;
  qty_order: number;
}

function CreatePODialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [poNumber, setPoNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [cabang, setCabang] = useState("Jakarta");
  const [items, setItems] = useState<NewPOItem[]>([]);
  const [skuSearch, setSkuSearch] = useState("");
  const [skuResults, setSkuResults] = useState<SkuOption[]>([]);
  const [searchingSkus, setSearchingSkus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendorList, setVendorList] = useState<{ id: string; name: string }[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Fetch vendors on mount
  useEffect(() => {
    if (!open) return;
    setLoadingVendors(true);
    fetch("/api/admin/vendor?limit=200")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setVendorList(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingVendors(false));
  }, [open]);

  interface SkuOption {
    id: string;
    sku_code: string;
    name: string;
    barcode: string;
  }

  // Search SKUs
  useEffect(() => {
    if (!skuSearch.trim()) {
      setSkuResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingSkus(true);
      try {
        const res = await fetch(
          `/api/admin/sku?search=${encodeURIComponent(skuSearch)}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setSkuResults(data.data || []);
        }
      } catch {
        // ignore
      } finally {
        setSearchingSkus(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [skuSearch]);

  const addItem = (sku: SkuOption) => {
    if (items.some((i) => i.sku_id === sku.id)) {
      toast.error("SKU sudah ditambahkan");
      return;
    }
    setItems([{ sku_id: sku.id, sku_code: sku.sku_code, sku_name: sku.name, qty_order: 1 }, ...items]);
    setSkuSearch("");
    setSkuResults([]);
  };

  const removeItem = (skuId: string) => {
    setItems(items.filter((i) => i.sku_id !== skuId));
  };

  const updateQty = (skuId: string, qty: number) => {
    setItems(items.map((i) => (i.sku_id === skuId ? { ...i, qty_order: qty } : i)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Tambahkan minimal 1 item");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          po_number: poNumber,
          supplier_name: supplierName,
          cabang,
          items: items.map((i) => ({ sku_id: i.sku_id, qty_order: i.qty_order })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat PO");
        return;
      }

      toast.success("PO berhasil dibuat");
      onSuccess();
      onClose();
      setPoNumber("");
      setSupplierName("");
      setCabang("Jakarta");
      setItems([]);
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Purchase Order Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nomor PO</Label>
              <Input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-2025-0044"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Supplier</Label>
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
                required
              >
                <option value="">— Pilih Vendor —</option>
                {loadingVendors ? (
                  <option disabled>Memuat...</option>
                ) : (
                  vendorList.map((v) => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Cabang Selection */}
          <div className="space-y-2">
            <Label>Cabang</Label>
            <select
              value={cabang}
              onChange={(e) => setCabang(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
            >
              {CABANG_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* SKU Search */}
          <div className="space-y-2">
            <Label>Tambah Item SKU</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Cari kode SKU, nama, atau barcode..."
                className="pl-10 h-11 rounded-xl"
              />
              {searchingSkus && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results */}
            {skuResults.length > 0 && (
              <div className="border border-outline-variant rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {skuResults.map((sku) => (
                  <button
                    key={sku.id}
                    type="button"
                    onClick={() => addItem(sku)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-container-high transition-colors text-sm border-b border-outline-variant last:border-0"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold">{sku.sku_code}</p>
                      <p className="text-xs text-on-surface-variant truncate">{sku.name}</p>
                    </div>
                    <Plus className="h-4 w-4 text-scanner-focus shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Added items */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-on-surface-variant">
                {items.length} item ditambahkan
              </Label>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.sku_id}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold truncate">{item.sku_code}</p>
                      <p className="text-[10px] text-on-surface-variant truncate">{item.sku_name}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.qty_order}
                      onChange={(e) => updateQty(item.sku_id, parseInt(e.target.value) || 1)}
                      className="w-20 h-9 rounded-lg text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.sku_id)}
                      className="p-1.5 text-on-surface-variant hover:text-danger-signal transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-bg-red border border-danger-signal/20">
              <AlertTriangle className="h-4 w-4 text-danger-signal shrink-0" />
              <p className="text-xs text-danger-signal">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl gap-2 bg-industrial-blue hover:bg-industrial-blue/90">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Membuat PO..." : "Buat PO"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePODialog({
  po,
  onClose,
  onSuccess,
}: {
  po: PO | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!po) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/po/${po.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`PO ${po.po_number} dihapus`);
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus PO");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!po} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-danger-signal">Hapus PO</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-on-surface-variant">
          Yakin ingin menghapus <strong>{po?.po_number}</strong>? Semua item dan log inbound terkait akan ikut terhapus.
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1 h-11 rounded-xl gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
