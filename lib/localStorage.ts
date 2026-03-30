// helpers สำหรับ cache ข้อมูล user ใน localStorage
export interface CachedProfile {
  fullName: string
  nickname: string
  room: string
  studentNumber: number
}

const KEY = 'heartful_profile'
const TODAY_KEY = 'heartful_today'

export function getCachedProfile(): CachedProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setCachedProfile(p: CachedProfile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function getTodayEntry(): { pts: number; submittedAt: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TODAY_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    if (data.date !== today) return null
    return data
  } catch { return null }
}

export function setTodayEntry(pts: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TODAY_KEY, JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    pts,
    submittedAt: new Date().toISOString(),
  }))
}