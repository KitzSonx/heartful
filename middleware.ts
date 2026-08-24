// middleware.ts - Route Guard ตรวจสอบสิทธิ์การเข้าถึงด้วย Supabase Auth
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: ตรวจสอบ Session ของ Supabase และ Cookie ของครู
  const isTeacherCookie = request.cookies.get('teacher_session')?.value === 'authenticated'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const role = isTeacherCookie ? 'teacher' : (user?.user_metadata?.role || 'student')
  const isAuthenticated = !!user || isTeacherCookie

  // 1. ถ้ายังไม่ได้ Login — Redirect ไป /login (รวมถึงหน้าแรก /)
  if (!isAuthenticated && (pathname === '/' || pathname.startsWith('/diary') || pathname.startsWith('/teacher'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 1b. ถ้า Login แล้วเข้าหน้าแรก / ให้ Redirect ไปหน้าที่เหมาะสมตาม Role
  if (isAuthenticated && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'teacher' ? '/teacher' : '/diary'
    return NextResponse.redirect(url)
  }

  // 2. ถ้านักเรียนพยายามเข้าหน้า Teacher Dashboard (/teacher)
  if (isAuthenticated && role === 'student' && pathname.startsWith('/teacher')) {
    const url = request.nextUrl.clone()
    url.pathname = '/diary'
    return NextResponse.redirect(url)
  }

  // 3. ถ้า Login แล้วแต่เข้าหน้า /login ให้ Redirect ไปยังหน้าที่เหมาะสม
  if (isAuthenticated && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'teacher' ? '/teacher' : '/diary'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/diary/:path*',
    '/teacher/:path*',
    '/login',
  ],
}
