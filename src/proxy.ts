import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  // Protect both the admin UI pages and admin API routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isApi = pathname.startsWith("/api/");
    if (!token) {
      return isApi
        ? NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        : NextResponse.redirect(new URL("/connexion", req.url));
    }
    const role = token.role as string | undefined;
    if (!role || !["admin", "support"].includes(role)) {
      return isApi
        ? NextResponse.json({ error: "Accès refusé" }, { status: 403 })
        : NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/admin/:path*"],
};
