// lib/supabase.ts - Supabase Client สำหรับ Browser (พร้อม SSR Cookie Sync)
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Re-export all database types
export type {
  Role,
  Profile,
  DiaryEntry,
  DiaryInput,
  RoomSummary,
  AtRiskStudent,
  BehaviorStats,
  DailyStats,
  WeekDayEntry,
} from '../types/database'