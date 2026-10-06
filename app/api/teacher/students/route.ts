// app/api/teacher/students/route.ts - ดึงข้อมูลนักเรียนทั้งหมดสำหรับครู (ผ่าน service role)
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getBangkokDateString, getBangkokDaysAgo } from '../../../../lib/date'

// ใช้ service role เพื่อข้าม RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  // ตรวจสอบว่าเป็นครูก่อน
  const cookieStore = await cookies()
  const teacherSession = cookieStore.get('teacher_session')?.value
  if (!teacherSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = getBangkokDateString()
  const threeDaysAgo = getBangkokDaysAgo(3)

  // ดึงนักเรียนทั้งหมด (ยกเว้น teacher)
  const { data: students, error: sErr } = await supabaseAdmin
    .from('profiles')
    .select('id, student_id, full_name, room, student_number, streak, last_diary_date, created_at, role')
    .neq('role', 'teacher')
    .order('room', { ascending: true })
    .order('student_number', { ascending: true, nullsFirst: false })

  if (sErr || !students) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }

  // ดึงบันทึกวันนี้แบบเต็มทุกฟิลด์
  const { data: entries } = await supabaseAdmin
    .from('diary_entries')
    .select('*')
    .eq('date', today)

  // สถิติรวม
  const { count: entriesCount } = await supabaseAdmin
    .from('diary_entries')
    .select('id', { count: 'exact', head: true })
    .eq('date', today)

  const atRiskStudents = students.filter(s => {
    if (!s.last_diary_date) return true
    const lastDate = new Date(s.last_diary_date).getTime()
    const cutoff = new Date(threeDaysAgo).getTime()
    return lastDate < cutoff
  })

  // สร้าง room summary
  const roomMap: Record<string, { total: number; done: number }> = {}
  for (const s of students) {
    if (!s.room) continue
    if (!roomMap[s.room]) roomMap[s.room] = { total: 0, done: 0 }
    roomMap[s.room].total++
    const entry = entries?.find(e => e.user_id === s.id)
    if (entry || s.last_diary_date === today) roomMap[s.room].done++
  }
  const rooms = Object.entries(roomMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))

  const todayMs = new Date(today).getTime()

  // Map นักเรียนพร้อมสถานะและระดับความเสี่ยง/คะแนน
  const studentsWithStatus = students.map(s => {
    const todayEntry = entries?.find(e => e.user_id === s.id) || null
    const lastDateMs = s.last_diary_date ? new Date(s.last_diary_date).getTime() : null
    const daysSince = lastDateMs ? Math.max(0, Math.floor((todayMs - lastDateMs) / (1000 * 60 * 60 * 24))) : 99

    let riskLevel: 'critical' | 'warning' | 'good' = 'good'
    let riskReason = 'สุขภาวะปกติ'

    const needHelp = todayEntry?.need_counselor
    const totalPts = todayEntry?.total_pts ?? 0

    if (needHelp) {
      riskLevel = 'critical'
      riskReason = '🚨 ขอคุยกับครูแนะแนว'
    } else if (daysSince >= 3) {
      riskLevel = 'critical'
      riskReason = s.last_diary_date ? `⚠️ ขาดบันทึก ${daysSince} วัน` : '⚠️ ยังไม่เคยบันทึก'
    } else if (todayEntry && totalPts < 12) {
      riskLevel = 'critical'
      riskReason = `⚠️ คะแนนรวมต่ำ (${totalPts} คะแนน)`
    } else if (!todayEntry && daysSince >= 1) {
      riskLevel = 'warning'
      riskReason = `ยังไม่บันทึกวันนี้ (ล่าสุด ${daysSince} วันก่อน)`
    } else if (todayEntry && totalPts < 18) {
      if ((todayEntry.body_pts ?? 0) <= 6) {
        riskLevel = 'warning'
        riskReason = 'ควรดูแลด้านกาย (การนอน/น้ำ/อาหาร)'
      } else if ((todayEntry.mind_pts ?? 0) <= 3) {
        riskLevel = 'warning'
        riskReason = 'ควรเสริมความผ่อนคลาย/อารมณ์'
      } else if ((todayEntry.social_pts ?? 0) <= 2) {
        riskLevel = 'warning'
        riskReason = 'ควรเสริมด้านสัมพันธภาพ'
      } else {
        riskLevel = 'warning'
        riskReason = 'คะแนนระดับปานกลาง'
      }
    } else if (todayEntry) {
      riskLevel = 'good'
      riskReason = 'สุขภาวะดี บันทึกสม่ำเสมอ'
    }

    return {
      id: s.id,
      student_id: s.student_id,
      full_name: s.full_name,
      room: s.room,
      student_number: s.student_number,
      streak: s.streak ?? 0,
      last_diary_date: s.last_diary_date,
      today_submitted: !!todayEntry || s.last_diary_date === today,
      today_mood: todayEntry?.mood || null,
      need_counselor: todayEntry?.need_counselor || false,
      today_entry: todayEntry,
      risk_level: riskLevel,
      risk_reason: riskReason,
      days_since_last_entry: daysSince,
      created_at: s.created_at,
    }
  })


  return NextResponse.json({
    students: studentsWithStatus,
    rooms,
    stats: {
      totalStudents: students.length,
      entriesCount: entriesCount ?? 0,
      completeCount: entriesCount ?? 0,
      atRiskCount: atRiskStudents.length,
    },
  })
}
