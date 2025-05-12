    import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Authentication middleware for NextAuth
 * This middleware checks if the user is authenticated and if the session matches expected attributes
 * 
 * @param req The incoming request
 */
export async function middleware(req: NextRequest) {
  // Skip auth check for public routes
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }  // Get the NextAuth token
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if we're in production to log extra debug info
    const isProduction = process.env.NODE_ENV === "production";
    const isNetlify = !!process.env.NETLIFY;
    
    if (isProduction) {
      // Log request details in production to help debug Netlify issues
      console.log(`Auth check for path: ${req.nextUrl.pathname}`);
      console.log(`Environment: ${isNetlify ? "Netlify" : "Other production"}`);
      console.log(`Has token: ${!!token}`);
      console.log(`Has NEXTAUTH_SECRET: ${!!process.env.NEXTAUTH_SECRET}`);
      console.log(`Has COOKIE_DOMAIN: ${!!process.env.COOKIE_DOMAIN}`);
    }

    // If no token and not on login page, redirect to home page which handles auth
    if (!token) {
      console.log("No authentication token found, redirecting to home");
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }

    // Check if the token has basic required properties
    if (!token.email) {
      console.warn("Invalid token format - missing email");
      const url = new URL("/?error=invalid_token", req.url);
      return NextResponse.redirect(url);
    }
    
    // Log the user email in production (for audit/debugging)
    if (isProduction) {
      console.log(`Authenticated user: ${token.email}`);
    }
  } catch (error) {
    console.error("Error verifying authentication token:", error);
    // If there's an error checking the token, redirect to home with error
    const url = new URL("/?error=auth_error", req.url);
    return NextResponse.redirect(url);
  }

  // Add additional security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  if (process.env.NODE_ENV === "production") {
    // Enforce HTTPS in production
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    
    // In production, also add Content-Security-Policy
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );
  }

  return response;
}

// Configure the paths this middleware applies to
export const config = {
  matcher: [
    // Apply to all paths except API routes, static files, and images
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
