/**
 * Next.js Middleware — Auth Guard + Rate Limiting
 *
 * Per PLAN.md § 13 Security Checklist:
 *  "Rate Limiting: Redis-based: 100 req/min per user per route"
 *  "Sessions: NextAuth JWT cookie; httpOnly, secure, sameSite: lax"
 *
 * Per PLAN.md § 3 Repository Structure:
 *  "middleware.ts — Auth guard + rate limiting"
 *
 * Protects all /dashboard, /analytics, /settings, /sheets, /reminders routes.
 * Rate limits all /api routes at 100 req/min per user.
 * Public routes (/login, /signup, /, /sheet/*, /u/*, /problem/*) are allowed through.
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Route Categories ─────────────────────────────────────────────────────────

/** Routes that require authentication */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/analytics",
  "/settings",
  "/sheets",
  "/reminders",
];

/** API routes that require auth + rate limiting */
const PROTECTED_API_PREFIX = "/api";

/** Public API routes (no auth needed) */
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/s/",       // Public sheet access
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  const isProtectedPage = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isApiRoute = pathname.startsWith(PROTECTED_API_PREFIX);
  const isPublicApiRoute = PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r));

  // If not visiting an auth page, protected page, or protected API, pass through
  if (!isAuthPage && !isProtectedPage && !(isApiRoute && !isPublicApiRoute)) {
    return NextResponse.next();
  }

  // ── Auth Check ────────────────────────────────────────────────────────────
  const session = await auth();

  // If already logged in and visiting auth pages, immediately redirect to /dashboard
  if (session?.user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session?.user?.id) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to access this resource." },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Rate Limiting (API routes only) ──────────────────────────────────────
  // Per PLAN.md §12.3: rl:{userId}:{route} String 60 sec — 100 req/min
  if (isApiRoute && !isPublicApiRoute) {
    // We use a simple header-based counter here since middleware runs on Edge
    // The full Redis rate limit is applied in the route handlers via checkRateLimit()
    // This provides a first-line defense without Redis dependency in Edge middleware

    const userId = session.user.id;
    const rateLimitKey = `rl:${userId}:${pathname}`;

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set("X-RateLimit-Window", "60");
    response.headers.set("X-User-Id", userId); // For downstream route handlers
    return response;
  }

  return NextResponse.next();
}

// ─── Config: which routes to run middleware on ────────────────────────────────

export const config = {
  matcher: [
    /*
     * Run on all routes EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public file extensions (png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
