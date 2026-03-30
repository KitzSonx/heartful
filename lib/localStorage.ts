export interface CachedProfile {
  fullName: string
  nickname: string
  room: string
  studentNumber: number
}

const KEY = 'heartful_profile'

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