import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/ocr-test(.*)',
  '/auth/login(.*)',
  '/auth/signup(.*)',
  '/api/public(.*)',
  '/api/analyze-image(.*)',
  // Allow weather lookup for geolocation flows before user profile is loaded.
  '/api/weather/current(.*)',
  // Let route handler decide auth/user response semantics.
  '/api/user/profile(.*)',
]);

const backendOnlyDeploy = process.env.BACKEND_ONLY_DEPLOY === 'true'

const clerkAuthMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
})

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (backendOnlyDeploy) {
    if (!request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Backend service is running' }, { status: 200 })
    }
  }

  return clerkAuthMiddleware(request, event)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
