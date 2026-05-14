import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/verification", "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  // Token lives in localStorage (client-side) — we can't read it in edge middleware.
  // We rely on the client-side redirect in api.ts (401 → /login) for JWT enforcement.
  // Middleware here guards against direct navigation by checking a lightweight
  // `cl_auth` cookie that we set on the client after login.
  const authCookie = request.cookies.get("cl_auth");
  if (!authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
