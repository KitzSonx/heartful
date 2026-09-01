// app/diary/page.tsx - Student Diary Page (Full Custom SVG Moods & Enhanced Warm Pastel Check-in)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { getCurrentProfile, getTodayDiary, saveDiaryEntry, getJarNotes, addJarNote, getDiaryHistory } from '../../lib/supabase-diary'
import { getBangkokDateString } from '../../lib/date'
import { sound } from '../../lib/sound'
import type { Profile, DiaryEntry } from '../../types/database'

// รายการอารมณ์ทั้งหมดที่ตรงกับไฟล์ใน components/moodpics/*.svg
const MOOD_LIST = [
  { key: 'happy',   label: 'สุขใจ',    emoji: '😊', glow: 'rgba(255, 217, 102, 0.5)' },
  { key: 'calm',    label: 'ผ่อนคลาย', emoji: '🍃', glow: 'rgba(163, 194, 151, 0.5)' },
  { key: 'proud',   label: 'ภูมิใจ',   emoji: '✨', glow: 'rgba(255, 209, 102, 0.5)' },
  { key: 'tired',   label: 'เหนื่อยล้า', emoji: '🥱', glow: 'rgba(206, 185, 244, 0.5)' },
  { key: 'sleepy',  label: 'ง่วงนอน',  emoji: '😴', glow: 'rgba(197, 225, 255, 0.5)' },
  { key: 'worried', label: 'กังวลใจ',  emoji: '😰', glow: 'rgba(144, 202, 249, 0.5)' },
  { key: 'sad',     label: 'เศร้าใจ',  emoji: '😢', glow: 'rgba(174, 214, 241, 0.5)' },
  { key: 'hurt',    label: 'เสียใจ',   emoji: '💔', glow: 'rgba(245, 183, 177, 0.5)' },
  { key: 'angry',   label: 'หงุดหงิด', emoji: '😤', glow: 'rgba(255, 154, 162, 0.5)' },
  { key: 'afraid',  label: 'กลัว',     emoji: '😨', glow: 'rgba(215, 189, 226, 0.5)' },
  { key: 'shocked', label: 'ตกใจ',     emoji: '😲', glow: 'rgba(254, 216, 177, 0.5)' },
  { key: 'shy',     label: 'เขินอาย',  emoji: '🙈', glow: 'rgba(250, 219, 216, 0.5)' },
]

export default function DiaryPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Flow State
  // 1: หน้าแรก (เลือกอารมณ์) | 2: เช็คอิน Wizard (Step 1: กาย, Step 2: ใจ+ขอบคุณ, Step 3: สังคม+ครู) | 3: โหลความรู้สึก | 4: Streak ฉลอง | 5: บันทึกของฉัน
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)

  // Check-in Form States
  const [selectedMood, setSelectedMood] = useState<string>('')

  // 1. หมวดกาย
  const [sleepOpt, setSleepOpt] = useState<string>('')
  const [foodOpt, setFoodOpt] = useState<string>('')
  const [waterOpt, setWaterOpt] = useState<string>('')
  const [stepsOpt, setStepsOpt] = useState<string>('')

  // 2. หมวดใจ & ขอบคุณ
  const [mindActions, setMindActions] = useState<string[]>([])
  const [gratitude1, setGratitude1] = useState('')
  const [gratitude2, setGratitude2] = useState('')
  const [gratitude3, setGratitude3] = useState('')
  const [concerns, setConcerns] = useState<string[]>([])

  // 3. หมวดสังคม & ครู
  const [socialActions, setSocialActions] = useState<string[]>([])
  const [teacherSignal, setTeacherSignal] = useState(false)

  // โหลความรู้สึก & ประวัติบันทึก
  const [jarGratitudeText, setJarGratitudeText] = useState('')
  const [jarNotes, setJarNotes] = useState<{ text: string; date: Date; mood: string }[]>([])
  const [diaryHistory, setDiaryHistory] = useState<DiaryEntry[]>([])
  const [historySubTab, setHistorySubTab] = useState<'diary' | 'jar'>('diary')
  const [expandedEntryIds, setExpandedEntryIds] = useState<string[]>([]) // ซ่อนไว้เป็นค่าเริ่มต้น (Collapsed by default)

  const toggleExpandEntry = (id: string) => {
    sound.playPop()
    setExpandedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleExpandAll = () => {
    sound.playPop()
    if (expandedEntryIds.length === diaryHistory.length) {
      setExpandedEntryIds([])
    } else {
      setExpandedEntryIds(diaryHistory.map((e) => e.id || e.date))
    }
  }

  const [stepError, setStepError] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  const loadStudentData = useCallback(async (uid: string) => {
    try {
      const p = await getCurrentProfile(uid)
      setProfile(p)
      if (p) {
        const today = await getTodayDiary(uid)
        if (today) {
          setAlreadyDone(true)
          setActiveTab(4)
        }
        const [notes, history] = await Promise.all([
          getJarNotes(uid),
          getDiaryHistory(uid),
        ])
        if (notes && notes.length > 0) {
          setJarNotes(notes.map((n) => ({
            text: n.content,
            date: new Date(n.created_at),
            mood: n.mood || '',
          })))
        }
        if (history && history.length > 0) {
          setDiaryHistory(history)
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return

      if (!user) {
        router.push('/login?redirect=/diary')
        return
      }

      await loadStudentData(user.id)
    }

    void init()
    return () => {
      isMounted = false
    }
  }, [router, loadStudentData])

  const handleLogout = async () => {
    sound.playClick()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // แตะเลือกอารมณ์
  const handleSelectMood = (key: string) => {
    sound.playPop()
    setSelectedMood(key)
    setStepError('')
  }

  // Toggle กิจกรรมดูแลใจ
  const toggleMindAction = (key: string) => {
    sound.playPop()
    setMindActions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Toggle กิจกรรมสังคม
  const toggleSocialAction = (key: string) => {
    sound.playPop()
    setSocialActions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // แตะเลือกความกังวล
  const toggleConcern = (item: string) => {
    sound.playPop()
    setStepError('')
    if (item === '✨ ไม่มีเรื่องกังวล') {
      setConcerns(['✨ ไม่มีเรื่องกังวล'])
    } else {
      const filtered = concerns.filter((c) => c !== '✨ ไม่มีเรื่องกังวล')
      if (filtered.includes(item)) {
        const next = filtered.filter((c) => c !== item)
        setConcerns(next)
      } else {
        setConcerns([...filtered, item])
      }
    }
  }

  // ไปยังขั้นตอนต่อไปพร้อมตรวจสอบความครบถ้วน
  const handleNextWizardStep = () => {
    sound.playClick()
    setStepError('')

    if (wizardStep === 1) {
      if (!sleepOpt || !foodOpt || !waterOpt || !stepsOpt) {
        sound.playPop()
        setStepError('กรุณาเลือกข้อมูลสุขภาพกายให้ครบทั้ง 4 ข้อก่อนไปต่อนะครับ 🌸')
        return
      }
      setWizardStep(2)
    } else if (wizardStep === 2) {
      if (concerns.length === 0) {
        sound.playPop()
        setStepError('กรุณาเลือกเรื่องกังวลใจอย่างน้อย 1 ข้อ (หรือเลือก "✨ ไม่มีเรื่องกังวล") นะครับ')
        return
      }
      setWizardStep(3)
    }
  }

  // ย้อนกลับ
  const handlePrevWizardStep = () => {
    sound.playClick()
    setStepError('')
    if (wizardStep === 1) {
      setActiveTab(1)
    } else if (wizardStep === 2) {
      setWizardStep(1)
    } else {
      setWizardStep(2)
    }
  }

  // ส่งคำตอบและบันทึกลง Supabase จริง
  const handleSubmitDiary = async () => {
    if (!profile) return
    sound.playClick()
    setSaving(true)
    try {
      const sleepPts = sleepOpt.includes('นอนพอ') ? 5 : sleepOpt.includes('นอนดึก') ? 3 : 1
      const foodPts = foodOpt.includes('ผักผลไม้') ? 3 : foodOpt.includes('ครบมื้อ') ? 2 : 1
      const waterPts = waterOpt.includes('เพียงพอ') ? 3 : waterOpt.includes('น้ำน้อย') ? 1 : 1
      const stepsPts = stepsOpt.includes('ออกกำลัง') ? 3 : stepsOpt.includes('พอสมควร') ? 2 : 1
      const bodyPts = sleepPts + foodPts + waterPts + stepsPts

      const combinedGratitude = [gratitude1.trim(), gratitude2.trim(), gratitude3.trim()]
        .filter(Boolean)
        .join('\n')

      const mindPts = (mindActions.length * 2) + (combinedGratitude.length > 5 ? 3 : 1) + (concerns.includes('✨ ไม่มีเรื่องกังวล') ? 2 : 1)
      const socialPts = (socialActions.length * 2) + (teacherSignal ? 2 : 1)
      const totalPts = bodyPts + mindPts + socialPts

      await saveDiaryEntry(profile.id, {
        mood: selectedMood || null,
        sleep_level: sleepPts,
        sleep_pts: sleepPts,
        steps_level: stepsPts,
        steps_pts: stepsPts,
        ate_vegetables: foodOpt.includes('ผักผลไม้'),
        veggie_meals: foodOpt.includes('ผักผลไม้') ? 2 : 1,
        reduced_sugar: !waterOpt.includes('น้ำหวาน'),
        sugar_level: waterOpt.includes('น้ำหวาน') ? 75 : 25,
        sugar_pts: waterOpt.includes('น้ำหวาน') ? 1 : 3,
        drank_water: waterOpt.includes('เพียงพอ'),
        water_glasses: waterOpt.includes('เพียงพอ') ? 8 : 4,
        water_pts: waterPts,
        body_pts: bodyPts,
        concerns,
        observed_emotions: mindActions.includes('observed_emotions') || !!selectedMood,
        limited_social_media: mindActions.includes('limited_social'),
        meditated: mindActions.includes('meditated'),
        gratitude_text: combinedGratitude,
        mind_pts: mindPts,
        need_counselor: teacherSignal,
        time_with_loved: socialActions.includes('time_with_loved'),
        helped_others: socialActions.includes('helped_others'),
        tidied_space: socialActions.includes('tidied_space'),
        expressed_opinion: socialActions.includes('expressed_opinion'),
        social_pts: socialPts,
        total_pts: totalPts,
        is_complete: true,
      })

      if (combinedGratitude) {
        await addJarNote(profile.id, combinedGratitude, selectedMood)
      }

      // โหลด Profile และประวัติใหม่
      const [updatedProfile, updatedHistory] = await Promise.all([
        getCurrentProfile(profile.id),
        getDiaryHistory(profile.id),
      ])
      if (updatedProfile) setProfile(updatedProfile)
      if (updatedHistory) setDiaryHistory(updatedHistory)
      setAlreadyDone(true)

      sound.playSuccess()
      setActiveTab(4)
    } catch (err) {
      console.error('Error saving diary:', err)
      sound.playSuccess()
      setActiveTab(4)
    }
    setSaving(false)
  }

  // หยอดความรู้สึก / เรื่องดีๆ ลงโหล
  const saveToJar = async () => {
    if (!jarGratitudeText.trim() || !profile) return
    sound.playJarDrop()
    const text = jarGratitudeText.trim()
    const currentMood = selectedMood
    setJarGratitudeText('')
    setJarNotes((prev) => [{ text, date: new Date(), mood: currentMood }, ...prev])
    await addJarNote(profile.id, text, currentMood)
  }

  const currentMoodObj = MOOD_LIST.find((m) => m.key === selectedMood)

  // Helper แปลงรูปแบบวันที่ไทย
  const formatThaiDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number)
      if (parts.length < 3) return { label: dateStr, dayName: '', isToday: false }
      const [y, m, d] = parts
      const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
      const dateObj = new Date(y, m - 1, d)
      const dayNames = ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์']
      const today = getBangkokDateString()
      const isToday = dateStr === today
      return {
        label: isToday ? 'วันนี้' : `${d} ${months[m - 1]} ${y + 543}`,
        fullDate: `${d} ${months[m - 1]} ${y + 543}`,
        dayName: dayNames[dateObj.getDay()] || '',
        isToday,
      }
    } catch {
      return { label: dateStr, dayName: '', isToday: false }
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)', color: 'var(--text-brown-light)', fontFamily: 'var(--font-body)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>กำลังเปิดสมุดไดอารี่ของคุณ... 🌿</p>
      </div>
    )
  }

  return (
    <div className="heartful-app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg-cream)' }}>
      {/* Top Navbar Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: 'rgba(255, 248, 239, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '2px solid var(--card-border)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: 36, height: 36, flexShrink: 0 }}>
            <rect width="40" height="40" rx="12" fill="#FFC7D1" />
            <path
              d="M20 31.5C20 31.5 8 23.5 8 15.5C8 11.5 11 8.5 15 8.5C17.5 8.5 19.2 9.8 20 11C20.8 9.8 22.5 8.5 25 8.5C29 8.5 32 11.5 32 15.5C32 23.5 20 31.5 20 31.5Z"
              fill="#5B4A3F"
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-brown)', letterSpacing: '-0.5px' }}>
            Heartful
          </span>
        </div>

        {/* Top Navigation Tabs (Desktop / Tablet) */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: 6, background: 'rgba(255, 255, 255, 0.7)', padding: 4, borderRadius: 99, border: '1px solid var(--card-border)' }}>
          {(alreadyDone
            ? [
                { id: 4, label: 'สรุปวันนี้', icon: '🔥' },
                { id: 3, label: 'โหลความรู้สึก', icon: '🫙' },
                { id: 5, label: 'บันทึกของฉัน', icon: '📖' },
              ]
            : [
                { id: 1, label: 'เลือกอารมณ์', icon: '✨' },
                { id: 2, label: 'เช็คอินสุขภาวะ', icon: '📝' },
                { id: 3, label: 'โหลความรู้สึก', icon: '🫙' },
                { id: 5, label: 'บันทึกของฉัน', icon: '📖' },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick()
                setActiveTab(tab.id as 1 | 2 | 3 | 4 | 5)
              }}
              style={{
                border: 'none',
                background: activeTab === tab.id ? 'var(--text-brown)' : 'transparent',
                color: activeTab === tab.id ? '#FFF8EF' : 'var(--text-brown-light)',
                padding: '8px 14px',
                borderRadius: 99,
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(91, 74, 63, 0.2)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Streak Pill & Logout Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              background: '#FFF0E5',
              border: '1.5px solid var(--accent-peach)',
              padding: '4px 10px',
              borderRadius: 99,
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#D96B27',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            🔥 {profile?.streak ?? 0}
          </div>

          <button
            onClick={handleLogout}
            title="ออกจากระบบ"
            style={{
              border: '1.5px solid var(--card-border)',
              background: '#FFFDF9',
              color: 'var(--text-brown-light)',
              padding: '5px 12px',
              borderRadius: 99,
              fontSize: 12.5,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            🚪 ออก
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          padding: '20px 16px calc(88px + env(safe-area-inset-bottom, 16px))',
        }}
      >
        {/* ========================================================
            STEP 1 / TAB 1: หน้าแรก (Mood Picker & How do you feel today?)
        ======================================================== */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Header Greeting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  สวัสดี {profile ? profile.full_name.split(' ')[0] : 'นักเรียน'} 🌿
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-brown-light)' }}>
                  ห้อง {profile?.room || '6.4'} {profile?.student_number ? `เลขที่ ${profile.student_number}` : ''} {profile?.student_id ? `(${profile.student_id})` : ''} {alreadyDone ? '· บันทึกแล้ววันนี้ 🎉' : ''}
                </p>
              </div>
              <div
                style={{
                  background: '#FFF0E5',
                  border: '1.5px solid var(--accent-peach)',
                  padding: '6px 14px',
                  borderRadius: 99,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#D96B27',
                  boxShadow: '0 2px 6px rgba(217, 107, 39, 0.12)',
                }}
              >
                🔥 {profile?.streak ?? 0} วันติด
              </div>
            </div>

            {/* Handwritten Title "How do you feel today?" */}
            <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 2 }}>
              <div
                style={{
                  fontFamily: "'Caveat', 'Patrick Hand', cursive",
                  fontSize: 34,
                  fontWeight: 700,
                  color: '#2D241E',
                  letterSpacing: '0.5px',
                  lineHeight: 1.2,
                }}
              >
                How do <span style={{ textDecoration: 'underline', textDecorationColor: '#E57373', textDecorationThickness: '3.5px', textUnderlineOffset: '5px' }}>you</span> feel today?
              </div>
            </div>

            {/* Mood SVG Stage Display */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: '8px 0' }}>
              <div
                style={{
                  width: 190,
                  height: 190,
                  borderRadius: '50%',
                  background: currentMoodObj ? currentMoodObj.glow : 'rgba(255, 218, 184, 0.3)',
                  filter: 'blur(25px)',
                  position: 'absolute',
                  zIndex: 1,
                  transition: 'background 0.5s ease',
                }}
              />
              <div
                style={{
                  width: 170,
                  height: 170,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '50%',
                  border: '2px dashed var(--card-border)',
                  boxShadow: '0 8px 24px rgba(91,74,63,0.06)',
                }}
              >
                {selectedMood ? (
                  <Image
                    src={`/moodpics/${selectedMood}.svg`}
                    alt={selectedMood}
                    width={140}
                    height={140}
                    priority
                    unoptimized
                    style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.08))' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-brown-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.55 }}>
                      <circle cx="24" cy="24" r="20" stroke="#5B4A3F" strokeWidth="2.5" strokeDasharray="5 3.5" />
                      <circle cx="17.5" cy="21" r="2.5" fill="#5B4A3F" />
                      <circle cx="30.5" cy="21" r="2.5" fill="#5B4A3F" />
                      <path d="M18.5 28.5 Q24 33.5 29.5 28.5" stroke="#5B4A3F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </svg>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--text-brown-light)', fontWeight: 500 }}>
                      แตะเลือกอารมณ์ด้านล่าง
                    </div>
                  </div>
                )}
              </div>

              {selectedMood && (
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-brown)',
                    background: '#FFFDF9',
                    border: '1.5px solid var(--card-border)',
                    padding: '6px 20px',
                    borderRadius: 99,
                    boxShadow: '0 2px 8px rgba(91,74,63,0.06)',
                    animation: 'fadeUp 0.25s ease both',
                  }}
                >
                  รู้สึก{currentMoodObj?.label}
                </div>
              )}
            </div>

            {/* 12 Mood Selection Grid */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 24,
                padding: '16px 12px',
                boxShadow: '0 4px 16px rgba(91, 74, 63, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px 6px',
                }}
              >
                {MOOD_LIST.map((mood) => {
                  const isSelected = selectedMood === mood.key
                  return (
                    <button
                      key={mood.key}
                      onClick={() => handleSelectMood(mood.key)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 4px 8px',
                        borderRadius: 18,
                        border: isSelected ? '2px solid var(--text-brown)' : '1.5px solid transparent',
                        background: isSelected ? 'var(--accent-peach)' : 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 12px rgba(91, 74, 63, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Image
                          src={`/moodpics/${mood.key}.svg`}
                          alt={mood.label}
                          width={44}
                          height={44}
                          unoptimized
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-display)',
                          fontWeight: isSelected ? 600 : 500,
                          color: 'var(--text-brown)',
                          marginTop: 4,
                        }}
                      >
                        {mood.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Next Button if mood is selected */}
            {selectedMood && (
              <div style={{ animation: 'fadeUp 0.3s ease both' }}>
                <button
                  onClick={() => {
                    sound.playClick()
                    setActiveTab(2)
                    setWizardStep(1)
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--accent-peach) 0%, var(--accent-pink) 100%)',
                    border: '2px solid var(--text-brown)',
                    borderRadius: 20,
                    padding: '16px',
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    fontWeight: 600,
                    color: 'var(--text-brown)',
                    boxShadow: '0 6px 0 var(--text-brown)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  เช็คอินสุขภาวะวันนี้ ➔
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: เช็คอิน Wizard 3 ขั้นตอน (กาย ➔ ใจ & ขอบคุณ ➔ สังคม & ครู)
        ======================================================== */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Header & Step Indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  {wizardStep === 1 && '🌿 ดูแลร่างกาย (Body)'}
                  {wizardStep === 2 && '🌸 จิตใจ & เรื่องดีๆ (Mind)'}
                  {wizardStep === 3 && '🤝 คนรอบข้าง & สัญญาณใจ (Social)'}
                </h2>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--text-brown-light)' }}>
                  ขั้นที่ {wizardStep} / 3
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#EFE4D6', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(wizardStep / 3) * 100}%`,
                    height: '100%',
                    background: 'var(--text-brown)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Warning Alert if user clicks Next without filling */}
            {stepError && (
              <div
                style={{
                  background: '#FFF0F0',
                  border: '1.5px solid #FFB5B5',
                  borderRadius: 16,
                  padding: '12px 16px',
                  color: '#c0392b',
                  fontSize: 13.5,
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  animation: 'fadeUp 0.2s ease both',
                }}
              >
                ⚠️ {stepError}
              </div>
            )}

            {/* ================= STEP 1: กาย (Body) ================= */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.25s ease forwards' }}>
                {/* 1. การนอนหลับ */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: !sleepOpt && stepError ? '2px solid #FFB5B5' : '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 12 }}>
                    🌙 การนอนหลับเมื่อคืน {!sleepOpt && <span style={{ color: '#E57373', fontSize: 13 }}>*</span>}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['😴 นอนพอ (7-8 ชม.)', '🥱 นอนดึก (4-6 ชม.)', '😵 นอนไม่หลับ (<4 ชม.)'].map((opt) => {
                      const isSel = sleepOpt === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            sound.playPop()
                            setSleepOpt(opt)
                            setStepError('')
                          }}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-peach)' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '10px 16px',
                            borderRadius: 99,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            boxShadow: isSel ? '0 2px 8px rgba(91, 74, 63, 0.12)' : 'none',
                          }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. การรับประทานอาหาร */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: !foodOpt && stepError ? '2px solid #FFB5B5' : '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 12 }}>
                    🍚 การรับประทานอาหาร {!foodOpt && <span style={{ color: '#E57373', fontSize: 13 }}>*</span>}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['🥗 ทานครบมื้อ & มีผักผลไม้', '🍚 ทานอาหารครบมื้อ', '🍪 ทานน้อย / ไม่ค่อยหิว'].map((opt) => {
                      const isSel = foodOpt === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            sound.playPop()
                            setFoodOpt(opt)
                            setStepError('')
                          }}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-peach)' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '10px 16px',
                            borderRadius: 99,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            boxShadow: isSel ? '0 2px 8px rgba(91, 74, 63, 0.12)' : 'none',
                          }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. การดื่มน้ำ */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: !waterOpt && stepError ? '2px solid #FFB5B5' : '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 12 }}>
                    💧 การดื่มน้ำวันนี้ {!waterOpt && <span style={{ color: '#E57373', fontSize: 13 }}>*</span>}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['💧 ดื่มน้ำเพียงพอ (6-8 แก้ว)', '🥤 ดื่มน้ำน้อย (<4 แก้ว)', '🧃 ดื่มน้ำหวาน / ชาไข่มุก'].map((opt) => {
                      const isSel = waterOpt === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            sound.playPop()
                            setWaterOpt(opt)
                            setStepError('')
                          }}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-sage)' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '10px 16px',
                            borderRadius: 99,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            boxShadow: isSel ? '0 2px 8px rgba(91, 74, 63, 0.12)' : 'none',
                          }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. การขยับร่างกาย / ก้าวเดิน */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: !stepsOpt && stepError ? '2px solid #FFB5B5' : '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 12 }}>
                    🚶 การขยับร่างกาย & เดินวันนี้ {!stepsOpt && <span style={{ color: '#E57373', fontSize: 13 }}>*</span>}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['🏃 เดินเยอะ / ออกกำลังกาย', '🚶 เดินพอสมควรในโรงเรียน', '🪑 นั่งนาน / ไม่ค่อยได้ขยับ'].map((opt) => {
                      const isSel = stepsOpt === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            sound.playPop()
                            setStepsOpt(opt)
                            setStepError('')
                          }}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? '#E2D4F8' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '10px 16px',
                            borderRadius: 99,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            boxShadow: isSel ? '0 2px 8px rgba(91, 74, 63, 0.12)' : 'none',
                          }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: ใจ & ขอบคุณ (Mind) ================= */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.25s ease forwards' }}>
                {/* 2a: กิจกรรมดูแลใจ (เลือกได้หลายข้อ) */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 6 }}>
                    🧘 การดูแลใจวันนี้
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginBottom: 12 }}>
                    วันนี้ได้ทำข้อไหนบ้าง (แตะเลือกได้มากกว่า 1 ข้อ)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { key: 'observed_emotions', label: '🍃 สังเกตและเข้าใจอารมณ์ตัวเอง' },
                      { key: 'limited_social', label: '📱 พักสายตา / ลดเวลาเสพโซเชียล' },
                      { key: 'meditated', label: '🌸 นั่งสมาธิหรือฝึกหายใจ 3-5 นาที' },
                    ].map((item) => {
                      const isSel = mindActions.includes(item.key)
                      return (
                        <button
                          key={item.key}
                          onClick={() => toggleMindAction(item.key)}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-sage)' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '10px 16px',
                            borderRadius: 16,
                            fontSize: 14,
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{ fontSize: 16 }}>{isSel ? '✓' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2b: 3 สิ่งดีๆ หรือเรื่องที่รู้สึกขอบคุณวันนี้ (3 Gratitudes) */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 6 }}>
                    🙏 3 สิ่งดีๆ หรือเรื่องที่ใจฟูในวันนี้
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginBottom: 12 }}>
                    เขียนสั้นๆ เรื่องเล็กๆ ที่ทำให้ยิ้มได้ หรือขอบคุณตัวเอง (ไม่บังคับ)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      value={gratitude1}
                      onChange={(e) => setGratitude1(e.target.value)}
                      placeholder="1. สิ่งดีๆ เรื่องแรก (เช่น เพื่อนแบ่งขนม, อากาศดี)"
                      style={{
                        width: '100%',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 13.5,
                        color: 'var(--text-brown)',
                        background: '#FFFDF9',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      value={gratitude2}
                      onChange={(e) => setGratitude2(e.target.value)}
                      placeholder="2. สิ่งดีๆ เรื่องที่สอง (เช่น ได้ฟังเพลงโปรด)"
                      style={{
                        width: '100%',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 13.5,
                        color: 'var(--text-brown)',
                        background: '#FFFDF9',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      value={gratitude3}
                      onChange={(e) => setGratitude3(e.target.value)}
                      placeholder="3. ขอบคุณตัวเอง (เช่น ขอบคุณตัวเองที่พยายาม)"
                      style={{
                        width: '100%',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 13.5,
                        color: 'var(--text-brown)',
                        background: '#FFFDF9',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* 2c: เรื่องกังวลใจ */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: concerns.length === 0 && stepError ? '2px solid #FFB5B5' : '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 6 }}>
                    💭 วันนี้มีเรื่องกังวลใจไหม? {concerns.length === 0 && <span style={{ color: '#E57373', fontSize: 13 }}>*</span>}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginBottom: 14 }}>
                    เลือกได้มากกว่า 1 ข้อ (ข้อมูลนี้เป็นความลับเฉพาะครูแนะแนว)
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      '📚 เรื่องเรียน/การสอบ',
                      '👥 ความสัมพันธ์กับเพื่อน',
                      '💖 เรื่องความรัก/คนคุย',
                      '🏡 เรื่องที่บ้าน/ครอบครัว',
                      '🩺 สุขภาพร่างกาย',
                      '⏳ กังวลเรื่องอนาคต',
                      '✨ ไม่มีเรื่องกังวล',
                    ].map((item) => {
                      const isSel = concerns.includes(item)
                      return (
                        <button
                          key={item}
                          onClick={() => toggleConcern(item)}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-sage)' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '10px 16px',
                            borderRadius: 99,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            boxShadow: isSel ? '0 2px 8px rgba(91, 74, 63, 0.12)' : 'none',
                          }}
                        >
                          {item}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: สังคม & ครู (Social) ================= */}
            {wizardStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.25s ease forwards' }}>
                {/* 3a: กิจกรรมสังคม / ความสัมพันธ์ */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 6 }}>
                    🤝 สิ่งดีๆ กับคนรอบข้างวันนี้
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginBottom: 12 }}>
                    วันนี้ได้ทำข้อไหนบ้าง (แตะเลือกได้ตามจริง)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { key: 'time_with_loved', label: '👥 ได้ใช้เวลากับคนที่รัก / เพื่อน / ครอบครัว' },
                      { key: 'helped_others', label: '🤝 ได้ทำสิ่งดีๆ หรือช่วยเหลือคนอื่น' },
                      { key: 'tidied_space', label: '🧹 ได้จัดระเบียบห้องหรือโต๊ะเรียน' },
                      { key: 'expressed_opinion', label: '🗣️ ได้กล้าพูดหรือแสดงความคิดเห็น' },
                    ].map((item) => {
                      const isSel = socialActions.includes(item.key)
                      return (
                        <button
                          key={item.key}
                          onClick={() => toggleSocialAction(item.key)}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-peach)' : '#FFFDF9',
                            color: 'var(--text-brown)',
                            padding: '11px 16px',
                            borderRadius: 16,
                            fontSize: 14,
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isSel ? 600 : 400,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{ fontSize: 16 }}>{isSel ? '✓' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3b: ต้องการพูดคุยกับครูแนะแนว */}
                <div
                  style={{
                    background: teacherSignal ? '#FFF0F3' : 'rgba(255, 255, 255, 0.92)',
                    border: teacherSignal ? '2px solid #FF9AA2' : '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ paddingRight: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                      👩‍🏫 ต้องการพูดคุยกับครูแนะแนว
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-brown-light)', marginTop: 2 }}>
                      ครูจะได้รับการแจ้งเตือนและติดต่อกลับอย่างเป็นความลับ
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={teacherSignal}
                    onChange={(e) => {
                      sound.playPop()
                      setTeacherSignal(e.target.checked)
                    }}
                    style={{ width: 24, height: 24, cursor: 'pointer', accentColor: '#E57373' }}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons: ย้อนกลับ / ถัดไป / ส่งคำตอบ */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={handlePrevWizardStep}
                style={{
                  flex: 1,
                  background: '#FFFDF9',
                  border: '2px solid var(--text-brown)',
                  borderRadius: 20,
                  padding: '14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  color: 'var(--text-brown)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                ย้อนกลับ
              </button>

              {wizardStep < 3 ? (
                <button
                  onClick={handleNextWizardStep}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, var(--accent-peach) 0%, var(--accent-pink) 100%)',
                    border: '2px solid var(--text-brown)',
                    borderRadius: 20,
                    padding: '14px',
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-brown)',
                    boxShadow: '0 4px 0 var(--text-brown)',
                    cursor: 'pointer',
                  }}
                >
                  ถัดไป ➔
                </button>
              ) : (
                <button
                  onClick={() => {
                    void handleSubmitDiary()
                  }}
                  disabled={saving}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, var(--accent-peach) 0%, #FF9AA2 100%)',
                    border: '2px solid var(--text-brown)',
                    borderRadius: 20,
                    padding: '14px',
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-brown)',
                    boxShadow: '0 4px 0 var(--text-brown)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกไดอารี่วันนี้ 🎉'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: โหลความรู้สึก & ระบายใจ (Gratitude & Feelings Jar)
        ======================================================== */}
        {activeTab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s ease forwards' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 24,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 56 }}>🫙</div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  โหลความรู้สึก & ระบายใจ
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginTop: 4 }}>
                  ระบายความรู้สึกในใจ เรื่องที่ภูมิใจ หรือสิ่งดีๆ ที่เกิดขึ้น วันที่เหนื่อยล้าสามารถเปิดอ่านได้เสมอ
                </p>
              </div>
              <textarea
                value={jarGratitudeText}
                onChange={(e) => setJarGratitudeText(e.target.value)}
                placeholder="ระบายความรู้สึก สิ่งดีๆ หรือเรื่องที่ภูมิใจในตัวเอง..."
                style={{
                  width: '100%',
                  height: 90,
                  border: '2px solid var(--card-border)',
                  borderRadius: 16,
                  padding: 12,
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-brown)',
                  background: '#FFFDF9',
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <button
                onClick={saveToJar}
                style={{
                  background: 'var(--accent-sage)',
                  border: '1.5px solid var(--text-brown)',
                  color: 'var(--text-brown)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 24px',
                  borderRadius: 99,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(91,74,63,0.1)',
                }}
              >
                🌸 หยอดลงโหลความรู้สึก
              </button>

              {/* ข้อความที่หยอดไว้ในโหล */}
              {jarNotes.length > 0 && (
                <div style={{ width: '100%', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                    เรื่องดีๆ และความรู้สึกที่หยอดไว้ในโหล:
                  </p>
                  {jarNotes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#FFFDF9',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: 'var(--text-brown)',
                        animation: 'fadeUp 0.3s ease both',
                      }}
                    >
                      📝 {note.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4 / RESULT: แสดงผลไฟ Streak ฉลองความสำเร็จ! (ไม่โชว์คะแนน)
        ======================================================== */}
        {activeTab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', animation: 'fadeUp 0.4s ease forwards' }}>
            {/* Fire Animation Stage */}
            <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0 10px' }}>
              <div
                style={{
                  position: 'absolute',
                  width: 170,
                  height: 170,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 154, 162, 0.5) 0%, rgba(255, 218, 184, 0.4) 60%, transparent 80%)',
                  filter: 'blur(20px)',
                  animation: 'pulseGlow 2s ease-in-out infinite alternate',
                }}
              />
              <div style={{ fontSize: 96, position: 'relative', zIndex: 2, animation: 'fireBounce 1.5s ease-in-out infinite alternate' }}>
                🔥
              </div>
            </div>

            {/* Streak Number Badge */}
            <div
              style={{
                background: 'linear-gradient(135deg, #FFF0E5 0%, #FFE4E6 100%)',
                border: '2px solid var(--text-brown)',
                borderRadius: 99,
                padding: '10px 28px',
                boxShadow: '0 6px 16px rgba(217, 107, 39, 0.2)',
              }}
            >
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#D96B27', fontFamily: 'var(--font-display)', margin: 0 }}>
                🔥 บันทึกต่อเนื่อง {profile?.streak ?? 1} วันติด!
              </h2>
            </div>

            {/* Congratulatory Card (ไม่มีการระบุคะแนน) */}
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 24, width: '100%', boxShadow: '0 8px 24px rgba(91,74,63,0.08)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                ยอดเยี่ยมมาก {profile ? profile.full_name.split(' ')[0] : ''}! 💖
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-brown-light)', lineHeight: 1.6 }}>
                คุณได้บันทึกความรู้สึกและดูแลสุขภาวะทั้ง <strong>กาย ใจ และสังคม</strong> ในวันนี้เรียบร้อยแล้ว พักผ่อนและรักษาความสุขนี้ไว้นะครับ ✨
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => {
                      sound.playClick()
                      setActiveTab(3)
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 99,
                      border: '1.5px solid var(--text-brown)',
                      background: 'var(--accent-sage)',
                      color: 'var(--text-brown)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🫙 โหลความรู้สึก
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick()
                      setActiveTab(5)
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 99,
                      border: '1.5px solid var(--text-brown)',
                      background: '#EEF0F8',
                      color: 'var(--text-brown)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📖 บันทึกของฉัน
                  </button>
                </div>
                {!alreadyDone && (
                  <button
                    onClick={() => {
                      sound.playClick()
                      setActiveTab(1)
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 99,
                      border: '1.5px solid var(--card-border)',
                      background: 'transparent',
                      color: 'var(--text-brown-light)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    🏠 กลับหน้าแรก
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: บันทึกของฉัน (Journal & Daily Wellness History)
        ======================================================== */}
        {activeTab === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Header */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                📖 บันทึกของฉัน
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>
                ย้อนดูข้อมูลสุขภาวะ ความรู้สึก และเรื่องดีๆ ที่เคยบันทึกไว้
              </p>
            </div>

            {/* Stats row */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 20,
                padding: '14px 20px',
                display: 'flex',
                gap: 0,
                boxShadow: '0 4px 12px rgba(91,74,63,0.04)',
              }}
            >
              {[
                { label: 'ไดอารี่สุขภาวะ', value: `${diaryHistory.length} วัน` },
                { label: 'บันทึกในโหล', value: `${jarNotes.length} ข้อความ` },
                { label: 'เช็คอินต่อเนื่อง', value: `${profile?.streak ?? 0} วัน` },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1.5px solid var(--card-border)' : 'none' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-brown-light)', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Sub-tab Switcher: ไดอารี่สุขภาวะ vs ข้อความในโหล */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 16,
                padding: 4,
                gap: 4,
              }}
            >
              <button
                onClick={() => {
                  sound.playPop()
                  setHistorySubTab('diary')
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: historySubTab === 'diary' ? 'var(--text-brown)' : 'transparent',
                  color: historySubTab === 'diary' ? '#FFF8EF' : 'var(--text-brown-light)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  fontWeight: historySubTab === 'diary' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                📝 ไดอารี่สุขภาวะ ({diaryHistory.length})
              </button>
              <button
                onClick={() => {
                  sound.playPop()
                  setHistorySubTab('jar')
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: historySubTab === 'jar' ? 'var(--text-brown)' : 'transparent',
                  color: historySubTab === 'jar' ? '#FFF8EF' : 'var(--text-brown-light)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  fontWeight: historySubTab === 'jar' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                🫙 ข้อความในโหล ({jarNotes.length})
              </button>
            </div>

            {/* ================= VIEW 1: ประวัติการเช็คอินไดอารี่สุขภาวะ ================= */}
            {historySubTab === 'diary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.25s ease forwards' }}>
                {diaryHistory.length === 0 ? (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.75)',
                      border: '1.5px dashed var(--card-border)',
                      borderRadius: 24,
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: 'var(--text-brown-light)',
                    }}
                  >
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📝</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-brown)' }}>ยังไม่มีประวัติการบันทึกสุขภาวะ</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>เริ่มเช็คอินวันนี้เพื่อสะสมประวัติการดูแลตัวเองกันเถอะ!</p>
                    {!alreadyDone && (
                      <button
                        onClick={() => { sound.playClick(); setActiveTab(1) }}
                        style={{
                          marginTop: 16,
                          padding: '10px 24px',
                          borderRadius: 99,
                          border: '1.5px solid var(--text-brown)',
                          background: 'var(--accent-peach)',
                          color: 'var(--text-brown)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✨ เช็คอินวันนี้
                      </button>
                    )}
                  </div>
                ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.25s ease forwards' }}>
                {/* Header Action Bar */}
                {diaryHistory.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                      แตะที่รายการเพื่อดูรายละเอียดแต่ละวัน ({diaryHistory.length} วัน)
                    </span>
                    <button
                      onClick={toggleExpandAll}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-brown)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {expandedEntryIds.length === diaryHistory.length ? 'ซ่อนทั้งหมด ▴' : 'เปิดทั้งหมด ▾'}
                    </button>
                  </div>
                )}

                {diaryHistory.length === 0 ? (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.75)',
                      border: '1.5px dashed var(--card-border)',
                      borderRadius: 24,
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: 'var(--text-brown-light)',
                    }}
                  >
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📝</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-brown)' }}>ยังไม่มีประวัติการบันทึกสุขภาวะ</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>เริ่มเช็คอินวันนี้เพื่อสะสมประวัติการดูแลตัวเองกันเถอะ!</p>
                    {!alreadyDone && (
                      <button
                        onClick={() => { sound.playClick(); setActiveTab(1) }}
                        style={{
                          marginTop: 16,
                          padding: '10px 24px',
                          borderRadius: 99,
                          border: '1.5px solid var(--text-brown)',
                          background: 'var(--accent-peach)',
                          color: 'var(--text-brown)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✨ เช็คอินวันนี้
                      </button>
                    )}
                  </div>
                ) : (
                  diaryHistory.map((entry) => {
                    const entryId = entry.id || entry.date
                    const isExpanded = expandedEntryIds.includes(entryId)
                    const dateInfo = formatThaiDate(entry.date)
                    const moodObj = MOOD_LIST.find((m) => m.key === entry.mood)

                    // Helper label maps
                    const sleepText =
                      entry.sleep_level >= 5 ? 'นอนพอ (7-8 ชม.)' :
                      entry.sleep_level >= 3 ? 'นอนดึก (4-6 ชม.)' : 'นอนไม่หลับ (<4 ชม.)'

                    const foodText = entry.ate_vegetables
                      ? 'ทานครบมื้อ & มีผักผลไม้'
                      : 'ทานอาหารครบมื้อ'

                    const waterText = entry.drank_water
                      ? 'ดื่มน้ำเพียงพอ (6-8 แก้ว)'
                      : (entry.reduced_sugar === false ? 'ดื่มน้ำหวาน/ชาไข่มุก' : 'ดื่มน้ำน้อย')

                    const stepsText =
                      entry.steps_level >= 3 ? 'เดินเยอะ / ออกกำลังกาย' :
                      entry.steps_level === 2 ? 'เดินพอสมควร' : 'นั่งนาน / ไม่ค่อยได้ขยับ'

                    return (
                      <div
                        key={entryId}
                        style={{
                          background: 'rgba(255, 255, 255, 0.94)',
                          border: '1.5px solid var(--card-border)',
                          borderRadius: 20,
                          padding: '12px 16px',
                          boxShadow: '0 2px 8px rgba(91,74,63,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Header: Clickable Toggle Bar (Completely static dimensions to prevent any layout jitter) */}
                        <div
                          onClick={() => toggleExpandEntry(entryId)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                            padding: '2px 0',
                          }}
                        >
                          {/* Date & Day Name */}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span
                              style={{
                                background: dateInfo.isToday ? 'var(--text-brown)' : '#EFE4D6',
                                color: dateInfo.isToday ? '#FFF8EF' : 'var(--text-brown)',
                                borderRadius: 10,
                                padding: '2px 10px',
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: 'var(--font-display)',
                              }}
                            >
                              {dateInfo.label}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                              {dateInfo.dayName}
                            </span>
                          </div>

                          {/* Right side: Mood Badge & Collapse Button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {moodObj && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFFDF9', border: '1px solid var(--card-border)', padding: '2px 8px', borderRadius: 99 }}>
                                <Image
                                  src={`/moodpics/${moodObj.key}.svg`}
                                  alt={moodObj.label}
                                  width={18}
                                  height={18}
                                  unoptimized
                                />
                                <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-brown)' }}>
                                  {moodObj.label}
                                </span>
                              </div>
                            )}

                            {/* Toggle Button */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                                color: 'var(--text-brown)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-display)',
                                background: isExpanded ? 'var(--accent-peach)' : '#FFFDF9',
                                border: '1px solid var(--card-border)',
                                padding: '3px 10px',
                                borderRadius: 99,
                                transition: 'background 0.2s ease',
                              }}
                            >
                              <span>{isExpanded ? 'ซ่อน' : 'ดูบันทึก'}</span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Smooth Accordion Body (CSS Grid 0fr -> 1fr animation) */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateRows: isExpanded ? '1fr' : '0fr',
                            transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <div
                            style={{
                              minHeight: 0,
                              overflow: 'hidden',
                              opacity: isExpanded ? 1 : 0,
                              transition: 'opacity 0.25s ease',
                            }}
                          >
                            <div style={{ borderTop: '1px solid var(--card-border)', marginTop: 10, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {/* 1. กาย (Body) */}
                              <div style={{ background: '#FFFDF9', border: '1px solid var(--card-border)', borderRadius: 14, padding: '10px 12px' }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                                  🌿 ร่างกาย:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ background: 'rgba(255, 218, 184, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                    🌙 {sleepText}
                                  </span>
                                  <span style={{ background: 'rgba(198, 217, 190, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                    🍚 {foodText}
                                  </span>
                                  <span style={{ background: 'rgba(197, 225, 255, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                    💧 {waterText}
                                  </span>
                                  <span style={{ background: 'rgba(226, 212, 248, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                    🚶 {stepsText}
                                  </span>
                                </div>
                              </div>

                              {/* 2. ใจ & ขอบคุณ (Mind) */}
                              <div style={{ background: '#FFFDF9', border: '1px solid var(--card-border)', borderRadius: 14, padding: '10px 12px' }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                                  🌸 จิตใจ & เรื่องดีๆ:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: entry.gratitude_text ? 8 : 0 }}>
                                  {entry.observed_emotions && (
                                    <span style={{ background: 'rgba(198, 217, 190, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      🍃 สังเกตอารมณ์
                                    </span>
                                  )}
                                  {entry.limited_social_media && (
                                    <span style={{ background: 'rgba(255, 218, 184, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      📱 พักจอ/ลดโซเชียล
                                    </span>
                                  )}
                                  {entry.meditated && (
                                    <span style={{ background: 'rgba(226, 212, 248, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      🌸 ฝึกสมาธิ/หายใจ
                                    </span>
                                  )}
                                  {entry.concerns && entry.concerns.length > 0 && (
                                    entry.concerns.map((c, ci) => (
                                      <span key={ci} style={{ background: c.includes('ไม่มี') ? 'rgba(198, 217, 190, 0.35)' : 'rgba(255, 181, 181, 0.35)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                        💭 {c}
                                      </span>
                                    ))
                                  )}
                                </div>

                                {/* ข้อความขอบคุณ (Gratitude Text) */}
                                {entry.gratitude_text && (
                                  <div style={{ background: '#FFF8EF', border: '1px dashed var(--card-border)', borderRadius: 10, padding: '8px 10px', marginTop: 6 }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-brown-light)', marginBottom: 2 }}>🙏 3 สิ่งดีๆ ที่บันทึกไว้:</div>
                                    <div style={{ fontSize: 12.5, color: 'var(--text-brown)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                      {entry.gratitude_text}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 3. สังคม & ครู (Social) */}
                              <div style={{ background: '#FFFDF9', border: '1px solid var(--card-border)', borderRadius: 14, padding: '10px 12px' }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                                  🤝 คนรอบข้าง & สัญญาณใจ:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {entry.time_with_loved && (
                                    <span style={{ background: 'rgba(255, 218, 184, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      👥 อยู่กับคนที่รัก/เพื่อน
                                    </span>
                                  )}
                                  {entry.helped_others && (
                                    <span style={{ background: 'rgba(198, 217, 190, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      🤝 ช่วยเหลือผู้อื่น
                                    </span>
                                  )}
                                  {entry.tidied_space && (
                                    <span style={{ background: 'rgba(226, 212, 248, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      🧹 จัดระเบียบห้อง/โต๊ะ
                                    </span>
                                  )}
                                  {entry.expressed_opinion && (
                                    <span style={{ background: 'rgba(197, 225, 255, 0.4)', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: 'var(--text-brown)' }}>
                                      🗣️ กล้าแสดงความคิดเห็น
                                    </span>
                                  )}
                                  {entry.need_counselor && (
                                    <span style={{ background: '#FFE4E6', border: '1px solid #FF9AA2', padding: '3px 9px', borderRadius: 99, fontSize: 12, color: '#C0392B', fontWeight: 600 }}>
                                      👩‍🏫 ส่งสัญญาณหาครูแนะแนว
                                    </span>
                                  )}
                                  {!entry.time_with_loved && !entry.helped_others && !entry.tidied_space && !entry.expressed_opinion && !entry.need_counselor && (
                                    <span style={{ fontSize: 12, color: 'var(--text-brown-light)' }}>-</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
                )}
              </div>
            )}

            {/* ================= VIEW 2: รายการข้อความในโหลความรู้สึก ================= */}
            {historySubTab === 'jar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.25s ease forwards' }}>
                {jarNotes.length === 0 ? (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      border: '1.5px dashed var(--card-border)',
                      borderRadius: 24,
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: 'var(--text-brown-light)',
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🫙</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>ยังไม่มีข้อความในโหล</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>ลองไปหยอดความรู้สึกลงโหลดูสิ!</p>
                    <button
                      onClick={() => { sound.playClick(); setActiveTab(3) }}
                      style={{
                        marginTop: 16,
                        padding: '10px 24px',
                        borderRadius: 99,
                        border: '1.5px solid var(--text-brown)',
                        background: 'var(--accent-sage)',
                        color: 'var(--text-brown)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🫙 ไปที่โหลความรู้สึก
                    </button>
                  </div>
                ) : (
                  jarNotes.map((note, idx) => {
                    const noteDate = note.date
                    const prev = idx > 0 ? jarNotes[idx - 1].date : null
                    const showDateHeader =
                      !prev ||
                      noteDate.getDate() !== prev.getDate() ||
                      noteDate.getMonth() !== prev.getMonth()
                    const dayNames = ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์']
                    const dateLabel = `${noteDate.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][noteDate.getMonth()]} ${noteDate.getFullYear() + 543}`
                    const timeLabel = `${noteDate.getHours().toString().padStart(2,'0')}:${noteDate.getMinutes().toString().padStart(2,'0')} น.`
                    const dayLabel = dayNames[noteDate.getDay()]
                    return (
                      <div key={idx}>
                        {showDateHeader && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, marginTop: idx > 0 ? 8 : 0 }}>
                            <span
                              style={{
                                background: 'var(--text-brown)',
                                color: '#FFF8EF',
                                borderRadius: 12,
                                padding: '2px 12px',
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: 'var(--font-display)',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {noteDate.toDateString() === new Date().toDateString() ? 'วันนี้' : dateLabel}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                              {dayLabel}
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.92)',
                            border: '1.5px solid var(--card-border)',
                            borderRadius: 20,
                            padding: '14px 18px',
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            animation: 'fadeUp 0.3s ease both',
                            boxShadow: '0 2px 8px rgba(91,74,63,0.04)',
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.9)',
                              border: '1.5px solid var(--card-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {note.mood ? (
                              <Image
                                src={`/moodpics/${note.mood}.svg`}
                                alt={note.mood}
                                width={34}
                                height={34}
                                unoptimized
                                style={{ objectFit: 'contain' }}
                              />
                            ) : (
                              <span style={{ fontSize: 22 }}>📝</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, color: 'var(--text-brown)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap' }}>
                              {note.text}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-brown-light)', marginTop: 4 }}>
                              {timeLabel}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Bottom Bar for Students */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(255, 248, 239, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1.5px solid var(--card-border)',
          padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 12px))',
          justifyContent: 'space-around',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(91, 74, 63, 0.08)',
        }}
      >
        {(alreadyDone
          ? [
              { id: 4, label: 'สรุปวันนี้', icon: '🔥' },
              { id: 3, label: 'โหลความรู้สึก', icon: '🫙' },
              { id: 5, label: 'บันทึกของฉัน', icon: '📖' },
            ]
          : [
              { id: 1, label: 'หน้าแรก', icon: '🏠' },
              { id: 2, label: 'เช็คอิน', icon: '📝' },
              { id: 3, label: 'โหลความรู้สึก', icon: '🫙' },
              { id: 5, label: 'บันทึกของฉัน', icon: '📖' },
            ]
        ).map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                sound.playClick()
                setActiveTab(t.id as 1 | 2 | 3 | 4 | 5)
              }}
              style={{
                border: 'none',
                background: isActive ? 'var(--text-brown)' : 'transparent',
                color: isActive ? '#FFF8EF' : 'var(--text-brown-light)',
                padding: '6px 14px',
                borderRadius: 99,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isActive ? '0 4px 12px rgba(91, 74, 63, 0.2)' : 'none',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>

      <style jsx global>{`
        @keyframes pulseGlow {
          from { transform: scale(0.9); opacity: 0.7; }
          to { transform: scale(1.15); opacity: 1; }
        }
        @keyframes fireBounce {
          from { transform: translateY(0) scale(0.96); }
          to { transform: translateY(-8px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}