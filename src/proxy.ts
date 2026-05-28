import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const { pathname } = request.nextUrl;

  // Public routes — allow without auth
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isPublicRoute || isAuthApi) {
    // If user is logged in and tries to access login/register, redirect to dashboard
    if (isPublicRoute && sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect to login if no session
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
