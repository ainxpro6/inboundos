import { db } from "@/server/db";
import { user } from "@/server/schema";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// GET /api/admin/users — List all users (admin only)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.select().from(user).orderBy(user.createdAt);

  return Response.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      banned: u.banned,
      createdAt: u.createdAt.toISOString(),
    }))
  );
}

// POST /api/admin/users — Create a new user (admin only)
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return Response.json(
      { error: "Nama, email, dan password wajib diisi" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Password minimal 8 karakter" },
      { status: 400 }
    );
  }

  const validRoles = ["admin", "supervisor", "checker"];
  if (role && !validRoles.includes(role)) {
    return Response.json(
      { error: "Role tidak valid" },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existing = await db.select().from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    return Response.json(
      { error: "Email sudah terdaftar" },
      { status: 409 }
    );
  }

  try {
    // Use better-auth admin API to create user
    const result = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: role || "checker",
      },
    });

    const createdUser = result.user;

    return Response.json({
      success: true,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat akun";
    return Response.json({ error: message }, { status: 500 });
  }
}
