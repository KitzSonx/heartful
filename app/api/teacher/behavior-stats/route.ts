// app/api/teacher/behavior-stats/route.ts - สถิติพฤติกรรมสุขภาพกาย-ใจ 7 วันย้อนหลังสำหรับครูแนะแนว
import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getBangkokDaysAgo } from '../../../../lib/date'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MOOD_META: Record<string, { label: string; emoji: string; type: 'positive' | 'low_energy' | 'distressed' }> = {
  happy:   { label: 'สุขใจ', emoji: '😊', type: 'positive' },
  calm:    { label: 'ผ่อนคลาย', emoji: '🍃', type: 'positive' },
  proud:   { label: 'ภูมิใจ', emoji: '✨', type: 'positive' },
  tired:   { label: 'เหนื่อยล้า', emoji: '🥱', type: 'low_energy' },
  sleepy:  { label: 'ง่วงนอน', emoji: '😴', type: 'low_energy' },
  worried: { label: 'กังวลใจ', emoji: '😰', type: 'distressed' },
  sad:     { label: 'เศร้าใจ', emoji: '😢', type: 'distressed' },
  hurt:    { label: 'เสียใจ', emoji: '💔', type: 'distressed' },
  angry:   { label: 'หงุดหงิด', emoji: '😤', type: 'distressed' },
  afraid:  { label: 'กลัว', emoji: '😨', type: 'distressed' },
  shocked: { label: 'ตกใจ', emoji: '😲', type: 'distressed' },
  shy:     { label: 'เขินอาย', emoji: '🙈', type: 'distressed' },
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const teacherSession = cookieStore.get('teacher_session')?.value
  if (!teacherSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const gradeFilter = searchParams.get('grade') || 'all'

  const weekAgo = getBangkokDaysAgo(7)

  // ดึงข้อมูลบันทึกในรอบ 7 วันย้อนหลัง พร้อมเชื่อมโยงห้องเรียน
  const { data: rawEntries, error } = await supabaseAdmin
    .from('diary_entries')
    .select('*, profiles!inner(room, full_name, student_id)')
    .gte('date', weekAgo)
    .order('date', { ascending: false })

  if (error || !rawEntries) {
    console.error('Error fetching behavior stats:', error)
    return NextResponse.json({ error: 'Failed to fetch behavior stats' }, { status: 500 })
  }

  // กรองตามระดับชั้น (ถ้าเลือก)
  const getGrade = (room: string) => {
    const m = room.match(/(\d+)[./]\d+/)
    return m ? m[1] : room.replace(/[^\d]/g, '').charAt(0) || '?'
  }

  const entries = gradeFilter !== 'all'
    ? rawEntries.filter((e) => getGrade(e.profiles?.room || '') === gradeFilter)
    : rawEntries

  const total = entries.length
  if (total === 0) {
    return NextResponse.json({
      totalEntries: 0,
      uniqueStudents: 0,
      behaviors: { body: [], mind: [], social: [] },
      moodStats: { groups: {}, list: [] },
      topConcerns: [],
      insights: { strengths: [], watchouts: [], recommendations: [] },
    })
  }

  const uniqueStudents = new Set(entries.map((e) => e.user_id)).size
  const calcPct = (count: number) => Math.round((count / total) * 100)

  // 1. หมวดกาย (Body)
  const sleepCount = entries.filter((e) => (e.sleep_pts ?? 0) >= 5).length
  const waterCount = entries.filter((e) => e.drank_water || (e.water_pts ?? 0) >= 3 || (e.water_glasses ?? 0) >= 8).length
  const veggieCount = entries.filter((e) => e.ate_vegetables || (e.veggie_meals ?? 0) >= 2).length
  const sugarCount = entries.filter((e) => e.reduced_sugar || (e.sugar_pts ?? 0) >= 3).length
  const stepsCount = entries.filter((e) => (e.steps_pts ?? 0) >= 3 || (e.steps_level ?? 0) >= 3).length

  const bodyBehaviors = [
    { key: 'sleep', label: 'นอนหลับเพียงพอ (7-8 ชม.)', count: sleepCount, pct: calcPct(sleepCount), color: '#3B82F6', isLow: calcPct(sleepCount) < 50 },
    { key: 'water', label: 'ดื่มน้ำสะอาดเพียงพอ (8 แก้ว)', count: waterCount, pct: calcPct(waterCount), color: '#06B6D4', isLow: calcPct(waterCount) < 50 },
    { key: 'sugar', label: 'ลดหวาน / คุมน้ำตาลในมื้อ', count: sugarCount, pct: calcPct(sugarCount), color: '#EC4899', isLow: calcPct(sugarCount) < 50 },
    { key: 'veggie', label: 'ทานผักผลไม้ในมื้ออาหาร', count: veggieCount, pct: calcPct(veggieCount), color: '#10B981', isLow: calcPct(veggieCount) < 50 },
    { key: 'steps', label: 'ขยับกาย / เดิน 6,000+ ก้าว', count: stepsCount, pct: calcPct(stepsCount), color: '#F97316', isLow: calcPct(stepsCount) < 50 },
  ]

  // 2. หมวดใจ (Mind)
  const emotionsCount = entries.filter((e) => e.observed_emotions).length
  const screenCount = entries.filter((e) => e.limited_social_media).length
  const meditateCount = entries.filter((e) => e.meditated).length
  const gratitudeCount = entries.filter((e) => e.gratitude_text && e.gratitude_text.trim().length > 0).length

  const mindBehaviors = [
    { key: 'emotions', label: 'สังเกตและรู้เท่าทันอารมณ์', count: emotionsCount, pct: calcPct(emotionsCount), color: '#8B5CF6', isLow: calcPct(emotionsCount) < 50 },
    { key: 'gratitude', label: 'เขียน 3 สิ่งดีๆ ที่รู้สึกขอบคุณ', count: gratitudeCount, pct: calcPct(gratitudeCount), color: '#F59E0B', isLow: calcPct(gratitudeCount) < 50 },
    { key: 'screen', label: 'พักจอ / ลดโซเชียลมีเดีย', count: screenCount, pct: calcPct(screenCount), color: '#6366F1', isLow: calcPct(screenCount) < 50 },
    { key: 'meditate', label: 'ฝึกสมาธิ / หายใจผ่อนคลาย', count: meditateCount, pct: calcPct(meditateCount), color: '#14B8A6', isLow: calcPct(meditateCount) < 30 },
  ]

  // 3. หมวดสังคม (Social)
  const lovedCount = entries.filter((e) => e.time_with_loved).length
  const helpCount = entries.filter((e) => e.helped_others).length
  const opinionCount = entries.filter((e) => e.expressed_opinion).length
  const tidyCount = entries.filter((e) => e.tidied_space).length

  const socialBehaviors = [
    { key: 'loved', label: 'ใช้เวลากับคนที่รัก / ครอบครัว', count: lovedCount, pct: calcPct(lovedCount), color: '#EF4444', isLow: calcPct(lovedCount) < 50 },
    { key: 'help', label: 'ช่วยเหลือหรือให้กำลังใจผู้อื่น', count: helpCount, pct: calcPct(helpCount), color: '#10B981', isLow: calcPct(helpCount) < 50 },
    { key: 'tidy', label: 'จัดห้อง / พื้นที่ตนเองเป็นระเบียบ', count: tidyCount, pct: calcPct(tidyCount), color: '#64748B', isLow: calcPct(tidyCount) < 50 },
    { key: 'opinion', label: 'กล้าพูด / แสดงความคิดเห็น', count: opinionCount, pct: calcPct(opinionCount), color: '#F97316', isLow: calcPct(opinionCount) < 50 },
  ]

  // 4. สถิติอารมณ์ 7 วัน (Mood Climate)
  const moodCounts: Record<string, number> = {}
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
    }
  })

  let posCount = 0
  let lowCount = 0
  let distCount = 0

  const moodList = Object.entries(moodCounts)
    .map(([key, count]) => {
      const meta = MOOD_META[key] || { label: key, emoji: '💭', type: 'distressed' }
      if (meta.type === 'positive') posCount += count
      else if (meta.type === 'low_energy') lowCount += count
      else distCount += count

      return {
        key,
        label: meta.label,
        emoji: meta.emoji,
        type: meta.type,
        count,
        pct: calcPct(count),
      }
    })
    .sort((a, b) => b.count - a.count)

  const moodGroups = {
    positive: { count: posCount, pct: calcPct(posCount), label: 'พลังบวก & ผ่อนคลาย' },
    low_energy: { count: lowCount, pct: calcPct(lowCount), label: 'พลังงานต่ำ & ง่วงเหนื่อย' },
    distressed: { count: distCount, pct: calcPct(distCount), label: 'เปราะบาง / ต้องดูแล' },
  }

  // 5. เรื่องกังวลใจสูงสุด (Top Concerns)
  const concernCounts: Record<string, number> = {}
  entries.forEach((e) => {
    if (Array.isArray(e.concerns)) {
      e.concerns.forEach((c: string) => {
        concernCounts[c] = (concernCounts[c] || 0) + 1
      })
    }
  })

  const topConcerns = Object.entries(concernCounts)
    .filter(([c]) => !c.includes('ไม่มี'))
    .map(([concern, count]) => ({
      concern,
      count,
      pct: calcPct(count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const noConcernCount = concernCounts['✨ ไม่มีเรื่องกังวล'] || 0
  const noConcernPct = calcPct(noConcernCount)

  // 6. ข้อเสนอแนะอัตโนมัติสำหรับครูแนะแนว (Guidance Insights)
  const strengths: string[] = []
  const watchouts: string[] = []
  const recommendations: string[] = []

  if (calcPct(sleepCount) >= 65) strengths.push(`นักเรียนส่วนใหญ่ (${calcPct(sleepCount)}%) จัดการเวลานอนได้เพียงพอ`)
  if (calcPct(emotionsCount) >= 70) strengths.push(`เด็กๆ มีทักษะการรู้เท่าทันอารมณ์ตนเองในระดับดีเยี่ยม (${calcPct(emotionsCount)}%)`)
  if (posCount >= total * 0.55) strengths.push(`บรรยากาศอารมณ์โดยรวมกว่า ${calcPct(posCount)}% อยู่ในกลุ่มพลังบวกและผ่อนคลาย`)

  if (calcPct(meditateCount) < 25) {
    watchouts.push(`อัตราการฝึกสมาธิ/ผ่อนคลายใจต่ำมากเพียง ${calcPct(meditateCount)}%`)
    recommendations.push('แนะนำจัดกิจกรรมสั้นๆ 2-3 นาที เช่น การฝึกหายใจ Box Breathing ในคาบโฮมรูมหรือก่อนเริ่มเรียน')
  }

  if (calcPct(screenCount) < 40) {
    watchouts.push(`นักเรียนกว่า ${100 - calcPct(screenCount)}% มีพฤติกรรมติดจอหรือยังไม่ได้พักสายตา`)
    recommendations.push('สอดแทรกความรู้เรื่อง Digital Detox และผลกระทบของ Blue light ต่อคุณภาพการนอนหลับ')
  }

  if (topConcerns.length > 0) {
    const top1 = topConcerns[0]
    watchouts.push(`เรื่องที่เด็กกังวลใจสูงสุดคือ "${top1.concern}" (${top1.pct}%)`)
    recommendations.push(`ควรนำประเด็น "${top1.concern}" มาเป็นหัวข้อคาบแนะแนวหรือจัด Workshop เทคนิคการจัดการความเครียด`)
  }

  return NextResponse.json({
    totalEntries: total,
    uniqueStudents,
    noConcernCount,
    noConcernPct,
    behaviors: {
      body: bodyBehaviors,
      mind: mindBehaviors,
      social: socialBehaviors,
    },
    moodStats: {
      groups: moodGroups,
      list: moodList,
    },
    topConcerns,
    insights: {
      strengths,
      watchouts,
      recommendations,
    },
  })
}
