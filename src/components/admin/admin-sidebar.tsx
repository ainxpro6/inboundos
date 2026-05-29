"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  ClipboardList,
  Package,
  LayoutDashboard,
  FileText,
  ArrowLeft,
  Plus,
  Building2,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/po", label: "Purchase Orders", icon: ClipboardList },
  { href: "/admin/sku", label: "Master SKU", icon: Package },
  { href: "/admin/vendor", label: "Vendor", icon: Building2 },
  { href: "/admin/inbound-logs", label: "Inbound Logs", icon: FileText },
  { href: "/admin/users", label: "Kelola User", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-low min-h-screen">
      {/* Header */}
      <div className="px-6 py-5 border-b border-outline-variant">
        <p className="text-lg font-bold tracking-tight text-industrial-blue">Admin Panel</p>
        <p className="text-xs text-on-surface-variant mt-0.5">Inbound Logistics</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container border-r-4 border-scanner-focus"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-outline-variant space-y-2">
        <button
          onClick={() => router.push("/admin/po?create=true")}
          className="w-full flex items-center justify-center gap-2 bg-industrial-blue text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity min-h-[48px]"
        >
          <Plus className="h-4 w-4" />
          New Purchase Order
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke App
        </Link>
      </div>
    </aside>
  );
}

// Mobile bottom nav for admin
export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant bg-white/95 backdrop-blur-sm shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-xl">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[60px] ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
