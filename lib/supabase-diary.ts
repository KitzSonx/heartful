// supabase-diary.ts - ฟังก์ชันสำหรับจัดการข้อมูลโปรไฟล์และบันทึกใน Supabase
import { supabase } from './supabase'

// ดึงหรือสร้าง profile อัตโนมัติถ้าไม่มี
export async function getOrCreateStudentProfile(
  fullName: string,
  room: string,
  studentNumber: number
) {
  // 1. หาก่อนว่ามีอยู่ไหม
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, full_name, room, student_number, streak, last_diary_date, total_points')
    .eq('room', room)
    .eq('student_number', studentNumber)
    .eq('role', 'student')
    .single()

  if (existing) return existing

  // 2. ไม่มี → สร้างใหม่
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      full_name: fullName,
      room,
      student_number: studentNumber,
      role: 'student',
      streak: 0,
      total_points: 0,
    })
    .select('id, full_name, room, student_number, streak, last_diary_date, total_points')
    .single()

  if (error) {
    console.error('สร้าง profile ไม่สำเร็จ:', error)
    return null
  }

  return created
}

// เช็คว่าวันนี้บันทึกแล้วหรือยัง
export async function getTodayDiary(userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('diary_entries')
    .select('id, total_pts, is_complete, created_at')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  return data
}

// บันทึก diary entry
export async function saveDiaryEntry(userId: string, entry: {
  sleep_level: number, sleep_pts: number,
  steps_level: number, steps_pts: number,
  ate_vegetables: boolean, veggie_meals: number,
  sugar_level: number, sugar_pts: number,
  drank_water: boolean, water_glasses: number, water_pts: number,
  body_pts: number,
  observed_emotions: boolean,
  limited_social_media: boolean,
  meditated: boolean,
  gratitude_text: string,
  mind_pts: number,
  time_with_loved: boolean,
  helped_others: boolean,
  tidied_space: boolean,
  expressed_opinion: boolean,
  social_pts: number,
  total_pts: number,
  is_complete: boolean,
}) {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('diary_entries')
    .upsert(
      { user_id: userId, date: today, ...entry },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) { console.error('บันทึก diary ไม่สำเร็จ:', error); return null }

  await updateStreak(userId, today)
  return data
}

async function updateStreak(userId: string, today: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak, last_diary_date, total_points')
    .eq('id', userId)
    .single()

  if (!profile) return

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let newStreak: number
  if (profile.last_diary_date === today) {
    // บันทึกซ้ำวันเดิม ไม่เปลี่ยน streak
    newStreak = profile.streak ?? 0
  } else if (profile.last_diary_date === yesterday) {
    // วันติดกัน streak +1
    newStreak = (profile.streak ?? 0) + 1
  } else {
    // ขาดไปหลายวัน เริ่มใหม่ที่ 1
    newStreak = 1
  }

  // คำนวณ total_points รวมทุก entry
  const { data: allEntries } = await supabase
    .from('diary_entries')
    .select('total_pts')
    .eq('user_id', userId)

  const totalPts = allEntries?.reduce((sum, e) => sum + (e.total_pts ?? 0), 0) ?? 0

  await supabase
    .from('profiles')
    .update({
      streak: newStreak,
      last_diary_date: today,
      total_points: totalPts,
    })
    .eq('id', userId)
}

// ดึง streak และข้อมูลสัปดาห์นี้
export async function getWeeklyData(userId: string) {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(d.toISOString().slice(0, 10))
  }

  const { data } = await supabase
    .from('diary_entries')
    .select('date, total_pts, is_complete')
    .eq('user_id', userId)
    .gte('date', days[0])
    .lte('date', days[6])

  return days.map(d => ({
    date: d,
    entry: data?.find(e => e.date === d) ?? null,
  }))
}

// เหลือไว้ให้ backward compatible
export async function getStudentProfile(room: string, studentNumber: number) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, room, student_number, streak, last_diary_date, total_points')
    .eq('room', room)
    .eq('student_number', studentNumber)
    .eq('role', 'student')
    .single()
  return data
}