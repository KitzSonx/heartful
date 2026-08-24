// app/api/auth/teacher-logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('teacher_session')
  return response
}
