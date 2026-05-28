"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { canAccessAdmin } from "@/lib/permissions";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!canAccessAdmin(session.user.role)) {
      router.replace("/dashboard");
      return;
    }

    setAuthorized(true);
  }, [session, isPending, router]);

  if (isPending || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-scanner-focus border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0 flex flex-col">
        {children}
      </main>
      <AdminMobileNav />
    </div>
  );
}
