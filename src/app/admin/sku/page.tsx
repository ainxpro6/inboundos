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
  Pencil,
  Search,
  AlertTriangle,
  Package,
  Download,
  Tag,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/table-pagination";

interface SkuData {
  id: string;
  sku_code: string;
  name: string;
  barcode: string;
}

interface SkuResponse {
  data: SkuData[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminSKUPage() {
  const [response, setResponse] = useState<SkuResponse>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<SkuData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkuData | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadSKUs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (search.trim()) params.set("search", search);

      const res = await fetch(`/api/admin/sku?${params}`);
      if (res.ok) setResponse(await res.json());
    } catch {
      toast.error("Gagal memuat data SKU");
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "99999" });
      if (search.trim()) params.set("search", search);

      const res = await fetch(`/api/admin/sku?${params}`);
      if (!res.ok) {
        toast.error("Gagal mengekspor data SKU");
        return;
      }
      const data: SkuResponse = await res.json();

      const csvHeader = "SKU Code,Product Name,Barcode\n";
      const csvRows = data.data
        .map((sku) => {
          const skuCode = `"${(sku.sku_code || "").replace(/"/g, '""')}"`;
          const skuName = `"${(sku.name || "").replace(/"/g, '""')}"`;
          const barcode = `"${(sku.barcode || "").replace(/"/g, '""')}"`;
          return `${skuCode},${skuName},${barcode}`;
        })
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sku-data-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data SKU berhasil diekspor");
    } catch {
      toast.error("Terjadi kesalahan saat mengekspor");
    } finally {
      setExporting(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      loadSKUs();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadSKUs]);

  // Reset page when search or limit changes
  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-industrial-blue leading-tight">
            Master SKU Management
          </h1>
          <p className="text-on-surface-variant mt-1">
            Centralized overview of master SKU data and specifications.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleExport}
            disabled={exporting || response.data.length === 0}
            className="flex-1 md:flex-none min-h-[48px] px-6 border-2 border-outline-variant bg-surface-container-lowest text-industrial-blue text-sm font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export Data"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 md:flex-none min-h-[48px] px-6 bg-industrial-blue text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New SKU
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total SKUs */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-on-surface-variant">Total SKUs</span>
            <Tag className="h-5 w-5 text-industrial-blue" />
          </div>
          <div className="text-[32px] md:text-[40px] font-extrabold leading-[48px] text-industrial-blue">
            {response.total.toLocaleString()}
          </div>
        </div>
        {/* Total Stock */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-on-surface-variant">Total Products</span>
            <Box className="h-5 w-5 text-industrial-blue" />
          </div>
          <div className="text-[32px] md:text-[40px] font-extrabold leading-[48px] text-industrial-blue">
            {response.data.length}
          </div>
        </div>
        {/* Current Page */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-on-surface-variant">Page</span>
            <Package className="h-5 w-5 text-industrial-blue" />
          </div>
          <div className="text-[32px] md:text-[40px] font-extrabold leading-[48px] text-industrial-blue">
            {response.page} / {response.totalPages || 1}
          </div>
        </div>
        {/* Filtered Results */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-on-surface-variant">
              {search ? "Search Results" : "Showing"}
            </span>
            <Search className="h-5 w-5 text-industrial-blue" />
          </div>
          <div className="text-[32px] md:text-[40px] font-extrabold leading-[48px] text-industrial-blue">
            {response.data.length}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-t-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by SKU or Name..."
            className="w-full min-h-[48px] pl-10 pr-4 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest border-x border-b border-outline-variant rounded-b-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-scanner-focus border-t-transparent rounded-full animate-spin" />
          </div>
        ) : response.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-outline-variant mb-4" />
            <p className="text-sm text-on-surface-variant">Tidak ada SKU ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-4 text-sm font-semibold text-on-surface-variant">SKU Code</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Product Name</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Barcode</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {response.data.map((sku) => (
                <tr key={sku.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                  <td className="p-4 text-sm font-semibold text-industrial-blue font-mono">{sku.sku_code}</td>
                  <td className="p-4 text-sm">{sku.name}</td>
                  <td className="p-4 text-sm text-on-surface-variant font-mono">{sku.barcode}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditTarget(sku)}
                        className="w-10 h-10 inline-flex items-center justify-center text-on-surface-variant hover:text-scanner-focus hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sku)}
                        className="w-10 h-10 inline-flex items-center justify-center text-on-surface-variant hover:text-danger-signal hover:bg-status-bg-red rounded-full transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-4">
        <TablePagination
          page={page}
          totalPages={response.totalPages}
          limit={limit}
          total={response.total}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Create/Edit Dialog */}
      <SKUFormDialog
        open={showCreate || !!editTarget}
        sku={editTarget}
        onClose={() => {
          setShowCreate(false);
          setEditTarget(null);
        }}
        onSuccess={loadSKUs}
      />

      {/* Delete Dialog */}
      <DeleteSKUDialog
        sku={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadSKUs}
      />
    </div>
  );
}

function SKUFormDialog({
  open,
  sku,
  onClose,
  onSuccess,
}: {
  open: boolean;
  sku: SkuData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!sku;
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sku) {
      setSkuCode(sku.sku_code);
      setName(sku.name);
      setBarcode(sku.barcode);
    } else {
      setSkuCode("");
      setName("");
      setBarcode("");
    }
    setError("");
  }, [sku, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/sku/${sku!.id}` : "/api/admin/sku";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku_code: skuCode, name, barcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan SKU");
        return;
      }

      toast.success(isEdit ? "SKU berhasil diupdate" : "SKU berhasil ditambahkan");
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit SKU" : "Tambah SKU Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Kode SKU</Label>
            <Input
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder="SKU-MILK-001"
              className="h-11 rounded-xl font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Nama Produk</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Susu Bayi Formula 400g"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Barcode</Label>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="8991234560011"
              className="h-11 rounded-xl font-mono"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-bg-red border border-danger-signal/20">
              <AlertTriangle className="h-4 w-4 text-danger-signal shrink-0" />
              <p className="text-xs text-danger-signal">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl gap-2 bg-industrial-blue hover:bg-industrial-blue/90">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Menyimpan..." : isEdit ? "Update SKU" : "Tambah SKU"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSKUDialog({
  sku,
  onClose,
  onSuccess,
}: {
  sku: SkuData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!sku) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sku/${sku.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("SKU berhasil dihapus");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus SKU");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!sku} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-danger-signal">Hapus SKU</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-on-surface-variant">
          Yakin ingin menghapus SKU <strong className="font-mono">{sku?.sku_code}</strong>?
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
