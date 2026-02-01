import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
    const isOnboardingPage = req.nextUrl.pathname.startsWith("/onboarding/buyer");

    // 1. If user is logged in but hasn't onboarded, force them to onboarding
    if (token && !token.onboardingCompleted && !isOnboardingPage && !isAuthPage) {
      return NextResponse.redirect(new URL("/onboarding/buyer", req.url));
    }

    // 2. If user IS onboarded, don't let them go back to onboarding
    if (token && token.onboardingCompleted && isOnboardingPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Only run middleware if user is logged in
    },
  }
);

// Protect these routes
export const config = {
  matcher: ["/", "/onboarding/buyer", "/checkout/:path*"],
};