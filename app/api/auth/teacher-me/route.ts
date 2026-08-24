// app/api/auth/teacher-me/route.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const isTeacher = request.cookies.get('teacher_session')?.value === 'authenticated'

  if (!isTeacher) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    role: 'teacher',
    fullName: 'ครูแนะแนว (ผู้ดูแลระบบ)',
  })
}
