// lib/supabase-diary.ts - ฟังก์ชันจัดการข้อมูลโปรไฟล์และไดอารี่ผ่าน Supabase (Real Database 100%)
import { supabase } from './supabase'
import { getBangkokDateString, getBangkokPastDays, getBangkokDaysAgo } from './date'
import type { DiaryInput, Profile, WeekDayEntry } from '../types/database'

// ดึงข้อมูลโปรไฟล์ของ User ปัจจุบัน
export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, student_id, full_name, room, student_number, streak, last_diary_date, total_points, role, created_at')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Profile
}

// ตรวจสอบว่าวันนี้ผู้ใช้บันทึกไดอารี่แล้วหรือไม่
export async function getTodayDiary(userId: string) {
  const today = getBangkokDateString()
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, total_pts, is_complete, created_at')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// บันทึก diary entry เชื่อมโยงกับ auth.uid() จริง
export async function saveDiaryEntry(userId: string, entry: DiaryInput) {
  const today = getBangkokDateString()

  const payload: Record<string, unknown> = {
    user_id: userId,
    date: today,
    ...entry,
  }

  let { data, error } = await supabase
    .from('diary_entries')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single()

  // หากเกิด error จาก column ใหม่ที่ยังไม่ได้รัน SQL (เช่น mood, concerns, need_counselor)
  if (error && (error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
    console.warn('ตาราง diary_entries ใน Supabase ยังไม่มีคอลัมน์ใหม่ กำลังบันทึกด้วยฟิลด์พื้นฐานแทน:', error.message)
    const basicEntry = { ...entry }
    delete basicEntry.mood
    delete basicEntry.concerns
    delete basicEntry.need_counselor

    const retry = await supabase
      .from('diary_entries')
      .upsert(
        {
          user_id: userId,
          date: today,
          ...basicEntry,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('บันทึกไดอารี่ไม่สำเร็จ:', error.message || error)
    return null
  }

  // อัปเดต Streak และ Total Points ลง Profile จริง
  await updateStreak(userId, today)
  return data
}

// คำนวณและอัปเดต Streak กับ Total Points
async function updateStreak(userId: string, today: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak, last_diary_date, total_points')
    .eq('id', userId)
    .single()

  if (!profile) return

  const yesterday = getBangkokDaysAgo(1)

  let newStreak: number
  if (profile.last_diary_date === today) {
    // บันทึกซ้ำวันเดิม Streak คงเดิม
    newStreak = profile.streak ?? 0
  } else if (profile.last_diary_date === yesterday) {
    // วันติดกัน Streak +1
    newStreak = (profile.streak ?? 0) + 1
  } else {
    // ขาดช่วง เริ่มใหม่ที่ 1
    newStreak = 1
  }

  // คำนวณคะแนนรวมทั้งหมดจาก diary_entries ของ user นี้
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

// ดึงข้อมูล 7 วันล่าสุดของผู้ใช้
export async function getWeeklyData(userId: string): Promise<WeekDayEntry[]> {
  const days = getBangkokPastDays(7)

  const { data, error } = await supabase
    .from('diary_entries')
    .select('date, total_pts, is_complete')
    .eq('user_id', userId)
    .gte('date', days[0])
    .lte('date', days[days.length - 1])

  if (error) {
    console.error('ดึงข้อมูลรายสัปดาห์ไม่สำเร็จ:', error)
  }

  return days.map(d => ({
    date: d,
    entry: data?.find(e => e.date === d) ?? null,
  }))
}

// ดึงรายการข้อความในโหลความรู้สึกทั้งหมดของ User
export async function getJarNotes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('jar_notes')
      .select('id, user_id, content, mood, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('ยังไม่พบบันทึกโหลความรู้สึก (อาจยังไม่ได้รัน SQL สร้างตาราง jar_notes):', error.message || error)
      return []
    }

    return data ?? []
  } catch (err) {
    console.warn('Error fetching jar notes:', err)
    return []
  }
}

// เพิ่มข้อความลงโหลความรู้สึกลง Supabase
export async function addJarNote(userId: string, content: string, mood?: string) {
  try {
    const { data, error } = await supabase
      .from('jar_notes')
      .insert({
        user_id: userId,
        content,
        mood: mood || null,
      })
      .select()
      .single()

    if (error) {
      console.warn('หยอดลงโหลความรู้สึกไม่สำเร็จ (โปรดตรวจสอบตาราง jar_notes ใน Supabase):', error.message || error)
      return null
    }

    return data
  } catch (err) {
    console.warn('Error adding jar note:', err)
    return null
  }
}