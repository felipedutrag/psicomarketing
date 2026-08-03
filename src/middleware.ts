import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Dashboard só acessível em desenvolvimento OU localhost
export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isDashboardApiRoute = request.nextUrl.pathname.startsWith('/api/dashboard')

  if (!isDev && !isLocalhost && (isDashboardRoute || isDashboardApiRoute)) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*'],
}