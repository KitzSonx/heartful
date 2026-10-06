// app/api/teacher/student-detail/route.ts - ดึงประวัติและรายละเอียดคะแนนรายข้อของนักเรียนรายบุคคลสำหรับครู
import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const teacherSession = cookieStore.get('teacher_session')?.value
  if (!teacherSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }

  // 1. ดึงโปรไฟล์ของนักเรียน
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (pErr || !profile) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // 2. ดึงประวัติ diary entries ทั้งหมดของนักเรียนคนนี้ เรียงตามวันที่ล่าสุด
  const { data: entries, error: eErr } = await supabaseAdmin
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)

  // 3. ดึงข้อความในโหลความรู้สึก (jar_notes)
  const { data: jarNotes } = await supabaseAdmin
    .from('jar_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    profile,
    entries: entries ?? [],
    jarNotes: jarNotes ?? [],
  })
}
