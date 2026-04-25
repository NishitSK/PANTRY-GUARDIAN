import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/support(.*)',
  '/qna(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/ocr-test(.*)',
  '/auth/login(.*)',
  '/auth/signup(.*)',
  '/auth/sso-callback(.*)',
  '/api/public(.*)',
  '/api/analyze-image(.*)',
]);

const clerkAuthMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
})

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  // In split deployment, frontend /api calls are proxied to backend via rewrites.
  // Let them pass through without Clerk protection on frontend.
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  try {
    return await clerkAuthMiddleware(request, event)
  } catch (error) {
    console.error('[frontend middleware] Clerk middleware failed:', error)

    if (isPublicRoute(request)) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
