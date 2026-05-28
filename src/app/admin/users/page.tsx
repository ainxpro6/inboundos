"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { canManageUsers, ROLE_LABELS, type UserRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Loader2,
  Trash2,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [roleDialog, setRoleDialog] = useState<UserData | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<UserData | null>(null);

  const isAdmin = canManageUsers(session?.user?.role);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-outline-variant mx-auto mb-4" />
          <p className="text-on-surface-variant">Hanya admin yang bisa mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-industrial-blue leading-tight">Kelola User</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {users.length} user terdaftar
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="min-h-[48px] px-6 bg-industrial-blue text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Buat Akun</span>
        </button>
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-scanner-focus border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 rounded-xl border border-outline-variant bg-surface-container-lowest"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-fixed text-scanner-focus font-bold text-sm shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-on-surface">{u.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <RoleBadge role={u.role as UserRole} />
                {u.id !== session?.user?.id && (
                  <>
                    <button
                      onClick={() => setRoleDialog(u)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-scanner-focus hover:bg-primary-fixed transition-colors"
                      title="Ubah role"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteDialog(u)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-danger-signal hover:bg-status-bg-red transition-colors"
                      title="Hapus user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={loadUsers}
      />

      {/* Role Dialog */}
      <ChangeRoleDialog
        user={roleDialog}
        onClose={() => setRoleDialog(null)}
        onSuccess={loadUsers}
      />

      {/* Delete Dialog */}
      <DeleteUserDialog
        user={deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onSuccess={loadUsers}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const variants: Record<string, string> = {
    admin: "bg-primary-fixed text-scanner-focus border-scanner-focus/20",
    supervisor: "bg-status-bg-amber text-warning-amber border-warning-amber/20",
    checker: "bg-surface-container-high text-on-surface-variant border-outline-variant",
  };

  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border ${variants[role] || variants.checker}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("checker");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat akun");
        return;
      }

      toast.success(`Akun ${name} berhasil dibuat`);
      onSuccess();
      onClose();
      setName("");
      setEmail("");
      setPassword("");
      setRole("checker");
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
          <DialogTitle>Buat Akun Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmad Fauzi"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-11 rounded-xl pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2">
              {(["checker", "supervisor", "admin"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    role === r
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-card text-muted-foreground border-border/50 hover:border-border"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Membuat..." : "Buat Akun"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({
  user,
  onClose,
  onSuccess,
}: {
  user: UserData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState<UserRole>("checker");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setRole(user.role as UserRole);
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        toast.success(`Role ${user.name} diubah ke ${ROLE_LABELS[role]}`);
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengubah role");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah Role</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ubah role untuk <strong>{user?.name}</strong>
        </p>
        <div className="flex gap-2">
          {(["checker", "supervisor", "admin"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                role === r
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border/50 hover:border-border"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-11 rounded-xl gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onSuccess,
}: {
  user: UserData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Akun ${user.name} berhasil dihapus`);
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-destructive">Hapus User</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Yakin ingin menghapus akun <strong>{user?.name}</strong> ({user?.email})? Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-11 rounded-xl gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
