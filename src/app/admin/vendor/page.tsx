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
  Building2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export default function AdminVendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);

  const loadVendors = useCallback(async () => {
    try {
      const url = search.trim()
        ? `/api/admin/vendor?search=${encodeURIComponent(search)}`
        : "/api/admin/vendor";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.data || []);
      }
    } catch {
      toast.error("Gagal memuat data vendor");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      loadVendors();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadVendors]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background">
      {/* Header & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-industrial-blue leading-tight">
              Vendor
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Kelola daftar vendor/supplier untuk Purchase Order
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="min-h-[48px] px-6 bg-industrial-blue text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Vendor</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-sm font-semibold text-on-surface-variant">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama vendor..."
              className="w-full min-h-[48px] pl-10 pr-4 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
            />
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
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-outline-variant mb-4" />
              <p className="text-sm text-on-surface-variant">
                {search.trim() ? "Tidak ada vendor ditemukan" : "Belum ada vendor. Klik \"New Vendor\" untuk menambahkan."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-surface-container-low sticky top-0 z-10 border-b border-outline-variant">
                <tr>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue whitespace-nowrap">Kode</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue">Nama Vendor</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue hidden md:table-cell">Telepon</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue hidden lg:table-cell">Alamat</th>
                  <th className="py-4 px-6 text-sm font-bold text-industrial-blue hidden sm:table-cell whitespace-nowrap">Dibuat</th>
                  <th className="py-4 px-6 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-industrial-blue text-sm">{v.code}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-on-surface">{v.name}</td>
                    <td className="py-4 px-6 text-sm text-on-surface-variant hidden md:table-cell">{v.phone || "—"}</td>
                    <td className="py-4 px-6 text-sm text-on-surface-variant hidden lg:table-cell truncate max-w-[200px]">{v.address || "—"}</td>
                    <td className="py-4 px-6 text-sm text-on-surface-variant hidden sm:table-cell">
                      {new Date(v.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(v)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-scanner-focus hover:bg-primary-fixed transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-danger-signal hover:bg-status-bg-red transition-colors"
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

        {/* Footer */}
        <div className="border-t border-outline-variant p-4 flex justify-between items-center bg-surface-container-lowest">
          <span className="text-sm text-on-surface-variant">
            {vendors.length} vendor
          </span>
        </div>
      </div>

      {/* Create Vendor Dialog */}
      <CreateVendorDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={loadVendors}
      />

      {/* Edit Vendor Dialog */}
      <EditVendorDialog
        vendor={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={loadVendors}
      />

      {/* Delete Vendor Dialog */}
      <DeleteVendorDialog
        vendor={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadVendors}
      />
    </div>
  );
}

// ============================================================================
// Create Vendor Dialog
// ============================================================================

function CreateVendorDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, address, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat vendor");
        return;
      }

      toast.success("Vendor berhasil dibuat");
      onSuccess();
      onClose();
      setCode("");
      setName("");
      setAddress("");
      setPhone("");
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
          <DialogTitle>Tambah Vendor Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kode Vendor</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VND-001"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Vendor</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PT. Nama Vendor"
                className="h-11 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="021-12345678"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Industri No. 123, Jakarta"
              className="h-11 rounded-xl"
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
            {loading ? "Menyimpan..." : "Simpan Vendor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Edit Vendor Dialog
// ============================================================================

function EditVendorDialog({
  vendor,
  onClose,
  onSuccess,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (vendor) {
      setCode(vendor.code);
      setName(vendor.name);
      setAddress(vendor.address || "");
      setPhone(vendor.phone || "");
      setError("");
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/vendor/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, address, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal update vendor");
        return;
      }

      toast.success("Vendor berhasil diupdate");
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!vendor} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kode Vendor</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VND-001"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Vendor</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PT. Nama Vendor"
                className="h-11 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="021-12345678"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Industri No. 123, Jakarta"
              className="h-11 rounded-xl"
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
            {loading ? "Menyimpan..." : "Update Vendor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Delete Vendor Dialog
// ============================================================================

function DeleteVendorDialog({
  vendor,
  onClose,
  onSuccess,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!vendor) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/vendor/${vendor.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Vendor ${vendor.name} dihapus`);
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus vendor");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!vendor} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-danger-signal">Hapus Vendor</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-on-surface-variant">
          Yakin ingin menghapus vendor <strong>{vendor?.name}</strong> ({vendor?.code})?
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
