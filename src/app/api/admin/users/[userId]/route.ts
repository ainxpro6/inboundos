import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { user } from "@/server/schema";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// PATCH /api/admin/users/[userId] — Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageUsers(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { role } = body;

  const validRoles = ["admin", "supervisor", "checker"];
  if (!role || !validRoles.includes(role)) {
    return Response.json({ error: "Role tidak valid" }, { status: 400 });
  }

  // Prevent changing own role
  if (userId === session.user.id) {
    return Response.json(
      { error: "Tidak bisa mengubah role sendiri" },
      { status: 400 }
    );
  }

  await db.update(user).set({ role }).where(eq(user.id, userId));

  return Response.json({ success: true });
}

// DELETE /api/admin/users/[userId] — Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageUsers(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  // Prevent deleting self
  if (userId === session.user.id) {
    return Response.json(
      { error: "Tidak bisa menghapus akun sendiri" },
      { status: 400 }
    );
  }

  await db.delete(user).where(eq(user.id, userId));

  return Response.json({ success: true });
}
