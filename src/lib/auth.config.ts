import type { NextAuthConfig } from "next-auth";

// This file contains auth config that can be used in Edge middleware
// It must NOT import Prisma or any Node.js-only modules
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Providers are added in auth.ts (server-only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string;
        token.locationId = (user as Record<string, unknown>).locationId as string | null;
        token.locationName = (user as Record<string, unknown>).locationName as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.locationId = token.locationId as string | null;
        session.user.locationName = token.locationName as string | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes — no auth required
      if (pathname === "/") return true; // Landing page
      if (pathname === "/login" || pathname.startsWith("/login/")) return true;
      if (pathname.startsWith("/api/auth")) return true;

      // Telegram routes use their own auth (initData validation)
      if (pathname.startsWith("/tg")) return true;
      if (pathname.startsWith("/api/telegram")) return true;
      if (pathname.startsWith("/api/upload")) return true;
      if (pathname.startsWith("/api/cron")) return true;

      if (!isLoggedIn) return false;
      return true;
    },
  },
};
