import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@/utils/supabase/middleware'

// This middleware is used to:
// 1. Refresh the user's session on each request if it's expired
// 2. Protect routes that require authentication
// 3. Redirect authenticated users away from auth pages

// List of paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/projects',
  '/admin',
  '/prioritization',
  '/map',
  '/reports',
  '/community',
]

// List of paths that are always public
const publicPaths = [
  '/login',
  '/register',
  '/',
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
  '/logo.svg',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check if the path is protected
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    try {
      const clientResult = createClient(request)
      
      // Handle case where createClient returns NextResponse (error case)
      if (clientResult instanceof NextResponse) {
        return clientResult
      }
      
      const { response, supabase } = clientResult
      
      // Check if the user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Redirect to login page with return URL
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      return response
    } catch (error) {
      console.error('Authentication error in middleware:', error)
      
      // Redirect to login on error
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // For all other paths, just proceed
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
