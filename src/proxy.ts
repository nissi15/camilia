import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const warehouseRoutes = ["/dashboard", "/inventory", "/processing", "/requests", "/reports", "/categories"];
const restaurantRoutes = ["/my-dashboard", "/my-requests", "/new-request"];
const sharedRoutes = ["/messages", "/notifications", "/settings"];
const publicRoutes = ["/login", "/register"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes and static assets
  if (publicRoutes.some((route) => pathname.startsWith(route))) return;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api/auth")) return;

  // Allow Telegram Mini App routes
  if (pathname.startsWith("/tg")) return;

  // Allow all API routes — each route handles its own auth (NextAuth or Telegram initData)
  if (pathname.startsWith("/api/")) return;

  // Allow static uploads
  if (pathname.startsWith("/uploads")) return;

  // Root: unauthenticated → landing page, authenticated → redirect by role
  if (pathname === "/") {
    if (!req.auth?.user) return;
    const role = (req.auth.user as Record<string, unknown>).role as string;
    if (role === "WAREHOUSE_ADMIN") {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    return Response.redirect(new URL("/my-dashboard", req.url));
  }

  // Shared routes require auth but not a specific role
  if (sharedRoutes.some((route) => pathname.startsWith(route))) {
    if (!req.auth?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
    return;
  }

  const user = req.auth?.user;

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  const role = (user as Record<string, unknown>).role as string;

  // Warehouse routes: only WAREHOUSE_ADMIN
  if (warehouseRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== "WAREHOUSE_ADMIN") {
      return Response.redirect(new URL("/my-dashboard", req.url));
    }
  }

  // Restaurant routes: only RESTAURANT_STAFF
  if (restaurantRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== "RESTAURANT_STAFF") {
      return Response.redirect(new URL("/dashboard", req.url));
    }
  }

});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
