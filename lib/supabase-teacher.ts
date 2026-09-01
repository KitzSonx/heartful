// lib/supabase-teacher.ts - ฟังก์ชันดึงสถิติภาพรวมและนักเรียนกลุ่มเสี่ยง (Real Database 100% ปราศจาก Mock Data)
import { supabase } from './supabase'
import { getBangkokDateString, getBangkokDaysAgo } from './date'
import type { RoomSummary, AtRiskStudent, BehaviorStats, DailyStats, StudentWithStatus } from '../types/database'

// 1. ดึงสถิติภาพรวมวันนี้
export async function getDailyStats(): Promise<DailyStats> {
  const today = getBangkokDateString()
  const threeDaysAgo = getBangkokDaysAgo(3)

  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .neq('role', 'teacher')

  const { count: entriesCount } = await supabase
    .from('diary_entries')
    .select('id', { count: 'exact', head: true })
    .eq('date', today)

  const { count: completeCount } = await supabase
    .from('diary_entries')
    .select('id', { count: 'exact', head: true })
    .eq('date', today)
    .eq('is_complete', true)

  const { data: atRisk } = await supabase
    .from('profiles')
    .select('id')
    .neq('role', 'teacher')
    .or(`last_diary_date.lt.${threeDaysAgo},last_diary_date.is.null`)

  return {
    totalStudents: totalStudents ?? 0,
    entriesCount: entriesCount ?? 0,
    completeCount: completeCount ?? 0,
    atRiskCount: atRisk?.length ?? 0,
  }
}

// 2. ดึงสถิติการส่งไดอารี่แยกรายห้องประจำวัน
export async function getRoomSummaryToday(): Promise<RoomSummary[]> {
  const today = getBangkokDateString()

  const { data: students, error: studentErr } = await supabase
    .from('profiles')
    .select('id, room')
    .neq('role', 'teacher')

  if (studentErr || !students || students.length === 0) {
    return []
  }

  const { data: entries } = await supabase
    .from('diary_entries')
    .select('user_id, total_pts, is_complete')
    .eq('date', today)

  const rooms: Record<string, { total: number; done: number; complete: number }> = {}
  for (const s of students) {
    if (!s.room) continue
    if (!rooms[s.room]) {
      rooms[s.room] = { total: 0, done: 0, complete: 0 }
    }
    rooms[s.room].total++
    const entry = entries?.find(e => e.user_id === s.id)
    if (entry) {
      rooms[s.room].done++
      if (entry.is_complete) {
        rooms[s.room].complete++
      }
    }
  }

  return Object.entries(rooms)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
}

// 3. ดึงรายชื่อนักเรียนกลุ่มเสี่ยง (ขาดบันทึก >= 3 วัน)
export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
  const { data, error } = await supabase
    .from('at_risk_students')
    .select('*')
    .order('days_since_last_entry', { ascending: false })
    .limit(50)

  if (error || !data) {
    // Fallback Query ตรงไปยังตาราง profiles โดยไม่มี Mock Data
    const threeDaysAgo = getBangkokDaysAgo(3)
    const { data: fallback, error: fbErr } = await supabase
      .from('profiles')
      .select('id, student_id, full_name, room, student_number, last_diary_date, streak')
      .neq('role', 'teacher')
      .or(`last_diary_date.lt.${threeDaysAgo},last_diary_date.is.null`)
      .order('last_diary_date', { ascending: true, nullsFirst: true })
      .limit(50)

    if (fbErr || !fallback) return []

    const todayMs = new Date(getBangkokDateString()).getTime()
    return fallback.map(f => {
      const lastDateMs = f.last_diary_date ? new Date(f.last_diary_date).getTime() : null
      const daysSince = lastDateMs ? Math.floor((todayMs - lastDateMs) / (1000 * 60 * 60 * 24)) : 99
      return {
        id: f.id,
        student_id: f.student_id,
        full_name: f.full_name,
        room: f.room,
        student_number: f.student_number,
        last_diary_date: f.last_diary_date,
        streak: f.streak,
        days_since_last_entry: daysSince,
      }
    })
  }

  return data as AtRiskStudent[]
}

// 4. คำนวณสถิติพฤติกรรม 7 วันย้อนหลังจริง
export async function getBehaviorStats(): Promise<BehaviorStats[]> {
  const weekAgo = getBangkokDaysAgo(7)
  const { data, error } = await supabase
    .from('diary_entries')
    .select('ate_vegetables, sugar_pts, drank_water, observed_emotions, limited_social_media, meditated, time_with_loved, helped_others, steps_level')
    .gte('date', weekAgo)

  if (error || !data || data.length === 0) {
    return []
  }

  const total = data.length
  const pct = (n: number) => Math.round((n / total) * 100)

  return [
    { label: 'ดื่มน้ำเพียงพอ (4+ แก้ว)',  pct: pct(data.filter(d => d.drank_water).length),             color: '#99f6e4' },
    { label: 'กินผักผลไม้ในมื้ออาหาร',    pct: pct(data.filter(d => d.ate_vegetables).length),           color: '#86efac' },
    { label: 'รู้เท่าทันอารมณ์ตนเอง',    pct: pct(data.filter(d => d.observed_emotions).length),         color: '#c4b5fd' },
    { label: 'ลดหวาน/น้ำตาล',          pct: pct(data.filter(d => (d.sugar_pts ?? 0) >= 3).length),   color: '#f9a8d4' },
    { label: 'ออกกำลัง 6,000+ ก้าว',    pct: pct(data.filter(d => (d.steps_level ?? 0) >= 3).length), color: '#fb923c' },
  ]
}

// 5. ดึงรายชื่อนักเรียนทั้งหมดพร้อมสถานะการเข้าสู่ระบบ/ส่งบันทึกวันนี้
export async function getAllStudentsWithStatus(): Promise<StudentWithStatus[]> {
  const today = getBangkokDateString()

  // 1. ดึงนักเรียนทั้งหมดจากตาราง profiles (ยกเว้น teacher)
  const { data: students, error: sErr } = await supabase
    .from('profiles')
    .select('id, student_id, full_name, room, student_number, streak, last_diary_date, created_at, role')
    .neq('role', 'teacher')
    .order('room', { ascending: true })
    .order('student_number', { ascending: true, nullsFirst: false })

  if (sErr || !students) {
    console.error('ดึงรายชื่อนักเรียนไม่สำเร็จ:', sErr)
    return []
  }


  // 2. ดึงบันทึกไดอารี่ประจำวันของวันนี้
  const { data: entries } = await supabase
    .from('diary_entries')
    .select('user_id, mood, need_counselor')
    .eq('date', today)

  return students.map((s) => {
    const todayEntry = entries?.find((e) => e.user_id === s.id)
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
      created_at: s.created_at,
    }
  })
}