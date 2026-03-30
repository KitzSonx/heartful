'use client'
import { useState, useEffect } from 'react'
import Mascot from '../../components/ui/Mascot'
import HeartMeter from '../../components/ui/HeartMeter'
import CheckItem from '../../components/diary/CheckItem'
import SleepSlider from '../../components/diary/SleepSlider'
import StepsPicker from '../../components/diary/StepsPicker'
import SectionHeader from '../../components/diary/SectionHeader'
import SugarSlider from '../../components/diary/SugarSlider'
import VeggiePicker from '../../components/diary/VeggiePicker'
import WaterSlider from '../../components/diary/WaterSlider'
import { getCachedProfile, setCachedProfile, getTodayEntry, setTodayEntry, type CachedProfile } from '../../lib/localStorage'
import { getStudentProfile, getTodayDiary, saveDiaryEntry, getWeeklyData } from '../../lib/supabase-diary'

const MAX_PTS = 30

function ProfileForm({ onDone }: { onDone: (p: CachedProfile) => void }) {
  const [fullName, setFullName] = useState('')
  const [room, setRoom] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [error, setError] = useState('')
  const nickname = fullName.trim().split(' ')[0] || ''

  const handleSubmit = () => {
    if (!fullName.trim() || !room.trim() || !studentNumber) { setError('กรุณากรอกข้อมูลให้ครบ'); return }
    const p: CachedProfile = { fullName: fullName.trim(), nickname: nickname || fullName.trim(), room: room.trim(), studentNumber: Number(studentNumber) }
    setCachedProfile(p)
    onDone(p)
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '48px 24px', fontFamily: 'var(--font-body)', animation: 'fadeUp 0.5s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Mascot mood="good" size={100} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, marginTop: 16 }}>
          สวัสดี! <span className="grad-text">แนะนำตัวก่อนนะ</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>ระบบจะจำข้อมูลคุณไว้ ไม่ต้องกรอกทุกวัน</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>ชื่อ-นามสกุล</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="เช่น สมชาย ใจดี" style={iStyle} />
          {nickname && fullName.includes(' ') && <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 4 }}>จะเรียกคุณว่า "<span style={{ color: 'var(--purple-soft)' }}>{nickname}</span>"</p>}
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>ห้องเรียน</label>
          <input value={room} onChange={e => setRoom(e.target.value)} placeholder="เช่น ม.4/2" style={iStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>เลขที่</label>
          <input value={studentNumber} onChange={e => setStudentNumber(e.target.value.replace(/\D/g, ''))} placeholder="เช่น 12" type="number" style={iStyle} />
        </div>
        {error && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</p>}
        <button onClick={handleSubmit} style={{ padding: '14px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: 'white', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-body)', cursor: 'pointer', width: '100%' }}>
          เริ่มบันทึกวันนี้ 💜
        </button>
      </div>
    </div>
  )
}

const iStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }

function AlreadyDone({ profile, pts, onReset }: { profile: CachedProfile; pts: number; onReset: () => void }) {
  const pct = Math.round((pts / MAX_PTS) * 100)
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', animation: 'fadeUp 0.5s ease both' }}>
      <Mascot mood={pct >= 100 ? 'great' : 'good'} size={120} />
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, marginTop: 16 }}>
        สวัสดี, <span className="grad-text">{profile.nickname}</span>!
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>วันนี้คุณบันทึกไปแล้ว 🎉</p>
      <div className="glass" style={{ padding: '28px', margin: '24px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>หัวใจของคุณวันนี้</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeartMeter pct={pct} pts={pts} maxPts={MAX_PTS} size={140} />
        </div>
        {pct >= 100 && <p style={{ marginTop: 14, fontSize: 15, color: '#f9a8d4', fontWeight: 500 }}>❤️ หัวใจเต็มดวง! Mission Complete!</p>}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 16 }}>กลับมากรอกใหม่พรุ่งนี้นะ 💜</p>
      <button onClick={onReset} style={{ fontSize: 12, color: 'var(--text-hint)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>ไม่ใช่ฉัน? เปลี่ยนชื่อ</button>
    </div>
  )
}

function MissionComplete({ pts, profile, streak, weekDays }: { pts: number; profile: CachedProfile; streak: number; weekDays: { date: string; entry: any }[] }) {
  const pct = Math.round((pts / MAX_PTS) * 100)
  const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 20px 48px', textAlign: 'center', animation: 'fadeUp 0.6s ease both', fontFamily: 'var(--font-body)' }}>
      <Mascot mood={pct >= 100 ? 'great' : pct >= 60 ? 'good' : 'neutral'} size={130} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, marginTop: 14 }}>
        {pct >= 100 ? <span className="grad-text">รักตัวเองสำเร็จ! ❤️</span> : <span className="grad-text">บันทึกแล้ววันนี้ 🌟</span>}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13 }}>{profile.nickname} · {profile.room} · เลขที่ {profile.studentNumber}</p>
      <div className="glass" style={{ padding: '24px', margin: '20px 0 14px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>หัวใจของคุณวันนี้</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeartMeter pct={pct} pts={pts} maxPts={MAX_PTS} size={150} />
        </div>
        <p style={{ marginTop: 14, fontSize: 13, color: pct >= 100 ? '#f9a8d4' : 'var(--text-secondary)' }}>
          {pct >= 100 ? '❤️ หัวใจเต็มดวง! Mission Complete!' : `ยังขาดอีก ${MAX_PTS - pts} คะแนนจะหัวใจเต็มดวง 💜`}
        </p>
      </div>
      <div className="glass" style={{ padding: '16px 18px', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--text-secondary)' }}>🔥 ทำต่อเนื่อง {streak} วันแล้ว!</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {weekDays.map((d, i) => {
            const dow = new Date(d.date + 'T00:00:00').getDay()
            const isToday = d.date === today
            const done = !!d.entry
            return (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, background: isToday ? 'rgba(153,246,228,0.18)' : done ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.05)', color: isToday ? 'var(--teal-soft)' : done ? 'var(--purple-soft)' : 'var(--text-hint)', border: isToday ? '1.5px solid rgba(153,246,228,0.4)' : done ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent' }}>
                {dayLabels[dow]}
              </div>
            )
          })}
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>กลับมากรอกพรุ่งนี้เพื่อรักษา streak ไว้นะ 💜</p>
    </div>
  )
}

export default function DiaryPage() {
  const [profile, setProfile] = useState<CachedProfile | null>(null)
  const [dbProfile, setDbProfile] = useState<any>(null)
  const [todayDbEntry, setTodayDbEntry] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [weekDays, setWeekDays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [sleepPts, setSleepPts] = useState(0)
  const [sleepLevel, setSleepLevel] = useState(1)
  const [stepsPts, setStepsPts] = useState(0)
  const [stepsLevel, setStepsLevel] = useState(1)
  const [veggiePts, setVeggiePts] = useState(0)
  const [veggieMeals, setVeggieMeals] = useState(0)
  const [sugarPts, setSugarPts] = useState(0)
  const [sugarLevel, setSugarLevel] = useState(50)
  const [waterPts, setWaterPts] = useState(0)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [checks, setChecks] = useState({ observed_emotions: false, limited_social_media: false, meditated: false, time_with_loved: false, helped_others: false, tidied_space: false, expressed_opinion: false })
  const [gratitude, setGratitude] = useState('')
  const [gratPts, setGratPts] = useState(0)

  const checkPts = Object.entries(checks).reduce((sum, [k, v]) => {
    const map: Record<string, number> = { observed_emotions: 2, limited_social_media: 1, meditated: 1, time_with_loved: 2, helped_others: 2, tidied_space: 1, expressed_opinion: 1 }
    return sum + (v ? (map[k] ?? 0) : 0)
  }, 0)

  const totalPts = sleepPts + stepsPts + veggiePts + sugarPts + waterPts + checkPts + gratPts
  const pct = Math.round((totalPts / MAX_PTS) * 100)
  const mascotMood = pct === 0 ? 'sad' : pct < 40 ? 'neutral' : pct < 80 ? 'good' : 'great'
  const isComplete = pct >= 100

  useEffect(() => {
    const cached = getCachedProfile()
    if (cached) { setProfile(cached); loadSupabase(cached) }
    else setLoading(false)
  }, [])

  async function loadSupabase(p: CachedProfile) {
    setLoading(true)
    try {
      const dbP = await getStudentProfile(p.room, p.studentNumber)
      setDbProfile(dbP)
      if (dbP) {
        setTodayDbEntry(await getTodayDiary(dbP.id))
        setWeekDays(await getWeeklyData(dbP.id))
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (dbProfile) {
      await saveDiaryEntry(dbProfile.id, {
        sleep_level: sleepLevel, sleep_pts: sleepPts, steps_level: stepsLevel, steps_pts: stepsPts,
        ate_vegetables: veggieMeals > 0, veggie_meals: veggieMeals, sugar_level: sugarLevel, sugar_pts: sugarPts,
        drank_water: waterGlasses >= 4, water_glasses: waterGlasses, water_pts: waterPts,
        body_pts: sleepPts + stepsPts + veggiePts + sugarPts + waterPts, ...checks,
        gratitude_text: gratitude,
        mind_pts: (checks.observed_emotions ? 2 : 0) + (checks.limited_social_media ? 1 : 0) + (checks.meditated ? 1 : 0) + gratPts,
        social_pts: (checks.time_with_loved ? 2 : 0) + (checks.helped_others ? 2 : 0) + (checks.tidied_space ? 1 : 0) + (checks.expressed_opinion ? 1 : 0),
        total_pts: totalPts, is_complete: isComplete,
      })
      setWeekDays(await getWeeklyData(dbProfile.id))
    }
    setTodayEntry(totalPts)
    setSubmitted(true)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-hint)', fontFamily: 'var(--font-body)' }}>กำลังโหลด...</div>
  if (!profile) return <ProfileForm onDone={p => { setProfile(p); loadSupabase(p) }} />

  const localToday = getTodayEntry()
  if (!submitted && (todayDbEntry || localToday)) {
    const pts = todayDbEntry?.total_pts ?? localToday?.pts ?? 0
    return <AlreadyDone profile={profile} pts={pts} onReset={() => { if (typeof window !== 'undefined') localStorage.removeItem('heartful_profile'); setProfile(null); setTodayDbEntry(null) }} />
  }
  if (submitted) return <MissionComplete pts={totalPts} profile={profile} streak={dbProfile?.streak ?? 0} weekDays={weekDays} />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 48px', fontFamily: 'var(--font-body)', animation: 'fadeUp 0.5s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 2 }}>{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400 }}>สวัสดี, <span className="grad-text">{profile.nickname}</span> 👋</h1>
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 1 }}>{profile.room} · เลขที่ {profile.studentNumber}</p>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'var(--purple-soft)', display: 'flex', alignItems: 'center', gap: 5 }}>
          🔥 <strong>{dbProfile?.streak ?? 0}</strong> วัน
        </div>
      </div>

      <div className="glass" style={{ padding: '22px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(167,139,250,0.08) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Mascot mood={mascotMood} size={96} pct={pct} />
          <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 5 }}>{pct === 0 ? 'เริ่มเลย!' : pct < 40 ? 'ไปต่อนะ 💪' : pct < 80 ? 'ดีมาก! 💜' : 'เกือบถึงแล้ว!'}</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <HeartMeter pct={pct} pts={totalPts} maxPts={MAX_PTS} size={118} />
        </div>
      </div>

      <div className="glass" style={{ padding: '16px', marginBottom: 10 }}>
        <SectionHeader category="body" title="ร่างกาย (Physical)" pts={sleepPts + stepsPts + veggiePts + sugarPts + waterPts} maxPts={16} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Box title="🌙 นอนหลับกี่ชั่วโมง?"><SleepSlider onChange={(p, _, lv) => { setSleepPts(p); if (lv) setSleepLevel(lv) }} /></Box>
          <Box title="🚶 จำนวนก้าวเดินวันนี้"><StepsPicker onChange={(p, lv) => { setStepsPts(p); if (lv) setStepsLevel(lv) }} /></Box>
          <Row><VeggiePicker onChange={(p, m) => { setVeggiePts(p); setVeggieMeals(m) }} /></Row>
          <Row><SugarSlider onChange={(p, lv) => { setSugarPts(p); setSugarLevel(lv) }} /></Row>
          <Row><WaterSlider onChange={(p, g) => { setWaterPts(p); setWaterGlasses(g) }} /></Row>
        </div>
      </div>

      <div className="glass" style={{ padding: '16px', marginBottom: 10 }}>
        <SectionHeader category="mind" title="จิตใจ (Mental)" pts={(checks.observed_emotions ? 2 : 0) + (checks.limited_social_media ? 1 : 0) + (checks.meditated ? 1 : 0) + gratPts} maxPts={7} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CheckItem label="สังเกตและยอมรับอารมณ์ตัวเอง" pts={2} category="mind" onChange={c => setChecks(p => ({ ...p, observed_emotions: c }))} />
          <CheckItem label="จำกัดเวลาเสพโซเชียลมีเดีย" pts={1} category="mind" onChange={c => setChecks(p => ({ ...p, limited_social_media: c }))} />
          <CheckItem label="ทำสมาธิหรือหายใจลึกๆ" pts={1} category="mind" onChange={c => setChecks(p => ({ ...p, meditated: c }))} />
          <Box title="🙏 ขอบคุณ 3 อย่างวันนี้" badge={`+${gratPts}/3 pt`} badgeActive={gratPts > 0}>
            <textarea value={gratitude} onChange={e => { setGratitude(e.target.value); setGratPts(e.target.value.trim().length > 15 ? 3 : 0) }} placeholder="วันนี้ขอบคุณ...&#10;1. &#10;2. &#10;3. " rows={4} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', lineHeight: 1.7, resize: 'none', outline: 'none' }} />
          </Box>
        </div>
      </div>

      <div className="glass" style={{ padding: '16px', marginBottom: 18 }}>
        <SectionHeader category="social" title="สังคม (Social)" pts={(checks.time_with_loved ? 2 : 0) + (checks.helped_others ? 2 : 0) + (checks.tidied_space ? 1 : 0) + (checks.expressed_opinion ? 1 : 0)} maxPts={6} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CheckItem label="ใช้เวลากับคนที่รักวันนี้" pts={2} category="social" onChange={c => setChecks(p => ({ ...p, time_with_loved: c }))} />
          <CheckItem label="ทำดีหรือช่วยเหลือคนอื่น" pts={2} category="social" onChange={c => setChecks(p => ({ ...p, helped_others: c }))} />
          <CheckItem label="จัดระเบียบห้อง/โต๊ะเรียน" pts={1} category="social" onChange={c => setChecks(p => ({ ...p, tidied_space: c }))} />
          <CheckItem label="กล้าพูดหรือแสดงความคิดเห็น" pts={1} category="social" onChange={c => setChecks(p => ({ ...p, expressed_opinion: c }))} />
        </div>
      </div>

      <button onClick={handleSubmit} style={{ width: '100%', padding: '15px', borderRadius: 'var(--radius-lg)', border: 'none', background: isComplete ? 'linear-gradient(135deg, #f472b6, #a78bfa)' : totalPts > 0 ? 'linear-gradient(135deg, rgba(167,139,250,0.8), rgba(236,72,153,0.6))' : 'rgba(255,255,255,0.07)', color: 'white', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-body)', cursor: 'pointer', boxShadow: isComplete ? '0 8px 32px rgba(244,114,182,0.35)' : 'none', transition: 'all 0.3s' }}>
        {isComplete ? '❤️ บันทึก — หัวใจเต็มดวง!' : totalPts > 0 ? `บันทึกวันนี้ (${totalPts}/${MAX_PTS} pt)` : 'กรอกข้อมูลก่อนบันทึก'}
      </button>
    </div>
  )
}

function Box({ title, children, badge, badgeActive }: { title: string; children: React.ReactNode; badge?: string; badgeActive?: boolean }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</p>
        {badge && <span style={{ fontSize: 11, color: badgeActive ? 'var(--purple-soft)' : 'var(--text-hint)', background: badgeActive ? 'rgba(196,181,253,0.15)' : 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>{children}</div>
}