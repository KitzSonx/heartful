// app/api/auth/teacher-login/route.ts - Secure Teacher Login
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const ALLOWED_USER = process.env.TEACHER_USERNAME || 'counselor'
    const ALLOWED_PASS = process.env.TEACHER_PASSWORD || 'Counselor@2026'

    const cleanUser = String(username || '').trim().toLowerCase()
    const cleanPass = String(password || '').trim()

    // 1. ตรวจสอบ Username และ Password ครู
    if (cleanUser !== ALLOWED_USER.toLowerCase() || cleanPass !== ALLOWED_PASS) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านครูไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // 2. สร้าง Response และฝัง Secure HTTP-Only Cookie ให้ครูทันที
    const response = NextResponse.json({
      success: true,
      role: 'teacher',
      fullName: 'ครูแนะแนว (ผู้ดูแลระบบ)',
      redirect: '/teacher',
    })

    response.cookies.set('teacher_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: '/',
    })

    return response
  } catch (err: unknown) {
    console.error('Teacher login API error:', err)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
