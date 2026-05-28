"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { canAccessAdmin, ROLE_LABELS, type UserRole } from "@/lib/permissions";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = (session?.user?.role || "checker") as UserRole;
  const showAdmin = canAccessAdmin(userRole);

  const getTitle = () => {
    if (pathname.startsWith("/scan")) return "Scan Barcode";
    if (pathname.startsWith("/po/")) return "Detail PO";
    return "InboundOS";
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-fixed relative overflow-hidden">
            <img src="/favicon.ico" alt="InboundOS Logo" className="h-5 w-5 object-contain" />
          </div>
          <span className="font-semibold text-base tracking-tight text-industrial-blue">
            {getTitle()}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {session?.user && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-on-surface-variant truncate max-w-[120px]">
                {session.user.name}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
          )}

          {showAdmin && (
            <Link
              href="/admin"
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors touch-target ${
                pathname.startsWith("/admin")
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
              title="Admin Panel"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}

          <Link
            href="/dashboard"
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors touch-target ${
              pathname === "/dashboard"
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:text-danger-signal hover:bg-status-bg-red transition-colors touch-target"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
