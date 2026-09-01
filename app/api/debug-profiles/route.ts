// app/api/debug-profiles/route.ts - ใช้สำหรับ debug เท่านั้น (ลบทิ้งหลังแก้ปัญหา)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: all, error: e1 } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, room, student_number')

  const { data: notTeacher, error: e2 } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, room, student_number')
    .neq('role', 'teacher')

  const { data: orNull, error: e3 } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, room, student_number')
    .or('role.neq.teacher,role.is.null')

  return NextResponse.json({
    all: { count: all?.length ?? 0, data: all, error: e1 },
    neq_teacher: { count: notTeacher?.length ?? 0, data: notTeacher, error: e2 },
    or_null: { count: orNull?.length ?? 0, data: orNull, error: e3 },
  })
}
