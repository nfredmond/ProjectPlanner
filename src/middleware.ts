import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// This middleware is used to:
// 1. Refresh the user's session on each request if it's expired
// 2. Protect routes that require authentication
// 3. Redirect authenticated users away from auth pages

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()
  
  // Check if the request is for an auth page
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                    req.nextUrl.pathname.startsWith('/register') ||
                    req.nextUrl.pathname.startsWith('/forgot-password')
  
  // Check if the request is for a protected page
  const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard') ||
                          req.nextUrl.pathname.startsWith('/projects') ||
                          req.nextUrl.pathname.startsWith('/map') ||
                          req.nextUrl.pathname.startsWith('/reports') ||
                          req.nextUrl.pathname.startsWith('/admin')

  // Check if the request is for an API route
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  
  // Public API routes that don't require authentication
  const isPublicApiRoute = isApiRoute && (
    req.nextUrl.pathname.startsWith('/api/community') ||
    req.nextUrl.pathname.startsWith('/api/public')
  )
  
  // Redirect unauthenticated users to login page if they're trying to access protected pages
  if (!session && (isProtectedPage || (isApiRoute && !isPublicApiRoute))) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect authenticated users to dashboard if they're trying to access auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  return res
}

// Configure the middleware to run only for specific paths
export const config = {
  matcher: [
    // Auth pages
    '/login', 
    '/register', 
    '/forgot-password',
    // Protected pages
    '/dashboard/:path*',
    '/projects/:path*',
    '/map/:path*',
    '/reports/:path*',
    '/admin/:path*',
    // API routes (except for public ones)
    '/api/:path*'
  ],
}
