// src/lib/supabase.ts
// ติดตั้ง: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ========================
// src/types/database.ts
// ========================
export type Role = 'student' | 'teacher'

export interface Profile {
  id: string          // = auth.uid()
  full_name: string
  room: string        // เช่น "ม.4/2"
  student_number?: number
  role: Role
  total_points: number
  streak: number
  created_at: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  date: string        // YYYY-MM-DD
  // Body
  sleep_hours: number  // 1-5 (slider level)
  sleep_pts: number
  steps_level: number  // 1-4
  steps_pts: number
  ate_vegetables: boolean
  reduced_sugar: boolean
  drank_water: boolean
  body_pts: number
  // Mind
  observed_emotions: boolean
  limited_social_media: boolean
  meditated: boolean
  gratitude_text: string
  mind_pts: number
  // Social
  time_with_loved: boolean
  helped_others: boolean
  tidied_space: boolean
  expressed_opinion: boolean
  social_pts: number
  // Summary
  total_pts: number
  is_complete: boolean    // total_pts >= 26
  created_at: string
}