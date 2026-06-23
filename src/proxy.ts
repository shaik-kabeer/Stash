import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-cards",
  "/rewards",
  "/explore",
  "/offers",
  "/advisor",
  "/cards",
  "/admin",
];

const ADMIN_PREFIXES = ["/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/my-cards",
    "/my-cards/:path*",
    "/rewards",
    "/rewards/:path*",
    "/explore",
    "/explore/:path*",
    "/offers",
    "/offers/:path*",
    "/advisor",
    "/advisor/:path*",
    "/cards",
    "/cards/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
