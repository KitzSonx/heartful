// types/database.ts - Type Definitions สำหรับ Supabase Database และ Data Models
export type Role = 'student' | 'teacher'

export interface Profile {
  id: string                // uuid = auth.uid()
  student_id?: string | null // รหัสนักเรียน เช่น "12345"
  full_name: string
  room: string              // ชั้นเรียน เช่น "ม.4/2"
  student_number?: number | null // เลขที่ในห้อง
  role: Role
  total_points: number
  streak: number
  last_diary_date?: string | null
  created_at?: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  date: string              // YYYY-MM-DD (Asia/Bangkok)

  // Body
  mood?: string | null      // happy, calm, proud, etc.
  sleep_level: number       // 1-5
  sleep_pts: number
  steps_level: number       // 1-4
  steps_pts: number
  ate_vegetables: boolean
  veggie_meals: number      // 0-3
  reduced_sugar: boolean
  sugar_level: number       // 0, 25, 50, 75, 100
  sugar_pts: number
  drank_water: boolean
  water_glasses: number     // 0-10
  water_pts: number
  body_pts: number

  // Mind
  concerns?: string[]       // รายการกังวลใจ
  observed_emotions: boolean
  limited_social_media: boolean
  meditated: boolean
  gratitude_text: string
  mind_pts: number

  // Social / Heart
  need_counselor?: boolean  // ต้องการคุยกับครูแนะแนว
  time_with_loved: boolean
  helped_others: boolean
  tidied_space: boolean
  expressed_opinion: boolean
  social_pts: number

  // Summary
  total_pts: number
  is_complete: boolean      // total_pts >= 26 (or 100%)
  created_at?: string
}

export interface DiaryInput {
  mood?: string | null
  sleep_level: number
  sleep_pts: number
  steps_level: number
  steps_pts: number
  ate_vegetables: boolean
  veggie_meals: number
  reduced_sugar: boolean
  sugar_level: number
  sugar_pts: number
  drank_water: boolean
  water_glasses: number
  water_pts: number
  body_pts: number
  concerns?: string[]
  observed_emotions: boolean
  limited_social_media: boolean
  meditated: boolean
  gratitude_text: string
  mind_pts: number
  need_counselor?: boolean
  time_with_loved: boolean
  helped_others: boolean
  tidied_space: boolean
  expressed_opinion: boolean
  social_pts: number
  total_pts: number
  is_complete: boolean
}

export interface JarNote {
  id: string
  user_id: string
  content: string
  mood?: string | null
  created_at: string
}

export interface RoomSummary {
  name: string
  total: number
  done: number
  complete: number
}

export interface AtRiskStudent {
  id: string
  student_id?: string | null
  full_name: string
  room: string
  student_number?: number | null
  entries_last_7_days?: number
  last_entry_date?: string | null
  last_diary_date?: string | null
  days_since_last_entry?: number
  streak?: number
}

export interface BehaviorStats {
  label: string
  pct: number
  color: string
}

export interface DailyStats {
  totalStudents: number
  entriesCount: number
  completeCount: number
  atRiskCount: number
}

export interface StudentWithStatus {
  id: string
  student_id?: string | null
  full_name: string
  room: string
  student_number?: number | null
  streak: number
  last_diary_date?: string | null
  today_submitted: boolean
  today_mood?: string | null
  need_counselor?: boolean
  created_at?: string
}

export interface WeekDayEntry {
  date: string
  entry: {
    total_pts?: number
    is_complete?: boolean
  } | null
}

