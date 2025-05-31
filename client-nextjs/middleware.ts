import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add paths that should be accessible without authentication
const publicPaths = ["/login", "/recovery", "/auth/callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Get the token from the cookies
  const token = request.cookies.get("auth-token");

  // Redirect to login if accessing a protected route without authentication
  if (!isPublicPath && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to home if accessing auth pages while authenticated
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}; 