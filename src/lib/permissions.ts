// ============================================================================
// Role-Based Permission Helpers
// ============================================================================
//
// Roles hierarchy: admin > supervisor > checker
//
// admin     → Full access: manage users, manage PO, manage SKU, dashboard
// supervisor → Manage PO, edit SKU, view dashboard. CANNOT manage users.
// checker   → Scan barcode, inbound, search/view PO only.
// ============================================================================

export type UserRole = "admin" | "supervisor" | "checker";

export const ROLES: UserRole[] = ["admin", "supervisor", "checker"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  checker: "Checker",
};

// Permission checks
export function canManageUsers(role: string | null | undefined): boolean {
  return role === "admin";
}

export function canManagePO(role: string | null | undefined): boolean {
  return role === "admin" || role === "supervisor";
}

export function canManageSKU(role: string | null | undefined): boolean {
  return role === "admin" || role === "supervisor";
}

export function canAccessAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "supervisor";
}

export function canViewDashboard(role: string | null | undefined): boolean {
  return role === "admin" || role === "supervisor";
}

// Helper to get session role safely
export function getUserRole(session: { user?: { role?: string } } | null): UserRole {
  const role = session?.user?.role;
  if (role === "admin" || role === "supervisor" || role === "checker") {
    return role;
  }
  return "checker"; // default fallback
}
