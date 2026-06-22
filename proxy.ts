import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('ieo_admin_auth')
  const { pathname } = request.nextUrl

  // 쿠키 값이 서버 시크릿(AUTH_SECRET)과 정확히 일치할 때만 인증으로 인정.
  // (존재 여부만 보면 ieo_admin_auth=아무값 쿠키를 위조해 우회 가능)
  const isAuthed = !!authCookie && authCookie.value === process.env.AUTH_SECRET

  // Exclude static files and api routes from proxy
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // If trying to access login page while authenticated, redirect to dashboard
  if (pathname === '/login') {
    if (isAuthed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // If trying to access any other page while NOT authenticated, redirect to login
  if (!isAuthed) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
