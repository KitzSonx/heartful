import { supabase } from './supabase'

export async function getRoomSummaryToday() {
  const today = new Date().toISOString().slice(0, 10)

  const { data: students } = await supabase
    .from('profiles')
    .select('id, room')
    .eq('role', 'student')
  if (!students) return []

  const { data: entries } = await supabase
    .from('diary_entries')
    .select('user_id, total_pts, is_complete')
    .eq('date', today)

  const rooms: Record<string, { total: number; done: number; complete: number }> = {}
  for (const s of students) {
    if (!rooms[s.room]) rooms[s.room] = { total: 0, done: 0, complete: 0 }
    rooms[s.room].total++
    const entry = entries?.find(e => e.user_id === s.id)
    if (entry) {
      rooms[s.room].done++
      if (entry.is_complete) rooms[s.room].complete++
    }
  }
  return Object.entries(rooms)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
}

export async function getAtRiskStudents() {
  const { data, error } = await supabase
    .from('at_risk_students')
    .select('*')
    .order('days_since_last_entry', { ascending: false })
    .limit(20)

  if (error) {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
    const { data: fallback } = await supabase
      .from('profiles')
      .select('id, full_name, room, student_number, last_diary_date, streak')
      .eq('role', 'student')
      .or(`last_diary_date.lt.${threeDaysAgo},last_diary_date.is.null`)
      .order('last_diary_date', { ascending: true, nullsFirst: true })
      .limit(20)
    return fallback ?? []
  }
  return data ?? []
}

export async function getBehaviorStats() {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('diary_entries')
    .select('ate_vegetables, sugar_pts, drank_water, observed_emotions, limited_social_media, meditated, time_with_loved, helped_others, steps_level')
    .gte('date', weekAgo)

  if (!data || data.length === 0) return []
  const total = data.length
  const pct = (n: number) => Math.round((n / total) * 100)

  return [
    { label: 'ดื่มน้ำเพียงพอ',        pct: pct(data.filter(d => d.drank_water).length),             color: '#99f6e4' },
    { label: 'กินผักผลไม้',           pct: pct(data.filter(d => d.ate_vegetables).length),           color: '#86efac' },
    { label: 'ขอบคุณ 3 อย่าง',       pct: pct(data.filter(d => d.observed_emotions).length),         color: '#c4b5fd' },
    { label: 'ลดน้ำตาล/น้ำหวาน',      pct: pct(data.filter(d => (d.sugar_pts ?? 0) >= 3).length),   color: '#f9a8d4' },
    { label: 'ออกกำลัง 6,000+ ก้าว', pct: pct(data.filter(d => (d.steps_level ?? 0) >= 3).length), color: '#fb923c' },
  ]
}

export async function getDailyStats() {
  const today = new Date().toISOString().slice(0, 10)

  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')

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
    .eq('role', 'student')
    .lt('last_diary_date', new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10))

  return {
    totalStudents: totalStudents ?? 0,
    entriesCount: entriesCount ?? 0,
    completeCount: completeCount ?? 0,
    atRiskCount: atRisk?.length ?? 0,
  }
}