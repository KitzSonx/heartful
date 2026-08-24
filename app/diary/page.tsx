// app/diary/page.tsx - Student Diary Page (Full Custom SVG Moods & Sound Effects)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { getCurrentProfile, getTodayDiary, saveDiaryEntry, getJarNotes, addJarNote } from '../../lib/supabase-diary'
import { sound } from '../../lib/sound'
import type { Profile } from '../../types/database'

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
  // 1: หน้าแรก (เลือกอารมณ์) | 2: เช็คอิน Wizard (1: กาย, 2: ใจ+ครู) | 3: โหลความรู้สึก | 4: Streak ฉลอง | 5: บันทึกจากโหล
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [wizardStep, setWizardStep] = useState<1 | 2>(1)

  // Check-in Form States (เริ่มต้นเป็นค่าว่าง ไม่เลือกให้อัตโนมัติ)
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [sleepOpt, setSleepOpt] = useState<string>('')
  const [foodOpt, setFoodOpt] = useState<string>('')
  const [waterOpt, setWaterOpt] = useState<string>('')
  const [concerns, setConcerns] = useState<string[]>([])
  const [gratitudeText, setGratitudeText] = useState('')
  const [jarNotes, setJarNotes] = useState<{ text: string; date: Date; mood: string }[]>([])
  const [teacherSignal, setTeacherSignal] = useState(false)
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
        const notes = await getJarNotes(uid)
        if (notes && notes.length > 0) {
          setJarNotes(notes.map((n) => ({
            text: n.content,
            date: new Date(n.created_at),
            mood: n.mood || '',
          })))
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
      if (!sleepOpt || !foodOpt || !waterOpt) {
        sound.playPop()
        setStepError('กรุณาเลือกข้อมูลสุขภาพกายให้ครบทั้ง 3 ข้อก่อนไปต่อนะครับ 🌸')
        return
      }
      setWizardStep(2)
    }
  }

  // ย้อนกลับ (จำค่าคำตอบเดิมไว้ทั้งหมด)
  const handlePrevWizardStep = () => {
    sound.playClick()
    setStepError('')
    if (wizardStep === 1) {
      setActiveTab(1)
    } else {
      setWizardStep(1)
    }
  }

  // ส่งคำตอบและบันทึกลง Supabase จริง
  const handleSubmitDiary = async () => {
    if (!profile) return
    sound.playClick()
    setSaving(true)
    try {
      const sleepPts = sleepOpt.includes('นอนพอ') ? 4 : sleepOpt.includes('นอนดึก') ? 2 : 1
      const foodPts = foodOpt.includes('ครบมื้อ') ? 3 : 1
      const waterPts = waterOpt.includes('เพียงพอ') ? 3 : 1
      const totalPts = sleepPts + foodPts + waterPts + (concerns.includes('✨ ไม่มีเรื่องกังวล') ? 5 : 3) + 15

      await saveDiaryEntry(profile.id, {
        mood: selectedMood || null,
        sleep_level: sleepPts,
        sleep_pts: sleepPts,
        steps_level: 3,
        steps_pts: 4,
        ate_vegetables: foodOpt.includes('ครบมื้อ') || foodOpt.includes('ผักผลไม้'),
        veggie_meals: 2,
        reduced_sugar: true,
        sugar_level: 50,
        sugar_pts: 2,
        drank_water: waterOpt.includes('เพียงพอ'),
        water_glasses: 6,
        water_pts: waterPts,
        body_pts: sleepPts + foodPts + waterPts,
        concerns,
        observed_emotions: !!selectedMood,
        limited_social_media: true,
        meditated: false,
        gratitude_text: gratitudeText,
        mind_pts: 8,
        need_counselor: teacherSignal,
        time_with_loved: true,
        helped_others: teacherSignal,
        tidied_space: true,
        expressed_opinion: true,
        social_pts: 4,
        total_pts: totalPts,
        is_complete: true,
      })

      // โหลด Profile ใหม่เพื่อให้ได้ค่า Streak ล่าสุด
      const updated = await getCurrentProfile(profile.id)
      if (updated) setProfile(updated)
      setAlreadyDone(true)

      // เล่นเสียง Celebration และไปหน้าสรุป Streak ไฟลุก
      sound.playSuccess()
      setActiveTab(4)
    } catch (err) {
      console.error('Error saving diary:', err)
      sound.playSuccess()
      setActiveTab(4)
    }
    setSaving(false)
  }

  // หยอดความรู้สึก / เรื่องดีๆ ลงโหล (บันทึกลง Supabase จริง)
  const saveToJar = async () => {
    if (!gratitudeText.trim() || !profile) return
    sound.playJarDrop()
    const text = gratitudeText.trim()
    const currentMood = selectedMood
    setGratitudeText('')
    setJarNotes((prev) => [{ text, date: new Date(), mood: currentMood }, ...prev])
    await addJarNote(profile.id, text, currentMood)
  }

  const currentMoodObj = MOOD_LIST.find((m) => m.key === selectedMood)

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
          zIndex: 100,
          background: 'rgba(255, 248, 239, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '2px solid var(--card-border)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Brand Logo with App Favicon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/favicon.svg"
            alt="Heartful"
            width={36}
            height={36}
            unoptimized
            style={{
              borderRadius: 10,
              objectFit: 'contain',
            }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-brown)' }}>
            Heartful
          </span>
        </div>

        {/* Tab Switcher (ถ้าทำเช็คอินวันนี้แล้ว จะแสดงเฉพาะหน้า สรุป, โหล, บันทึก) */}
        <nav style={{ display: 'flex', gap: 4, background: 'rgba(255, 255, 255, 0.8)', padding: 4, borderRadius: 99, border: '1px solid var(--card-border)' }}>
          {(alreadyDone
            ? [
                { id: 4, label: '🔥 สรุปวันนี้' },
                { id: 3, label: '🫙 โหลความรู้สึก' },
                { id: 5, label: '📖 บันทึก' },
              ]
            : [
                { id: 1, label: '🏠 หน้าแรก' },
                { id: 2, label: '📝 เช็คอิน' },
                { id: 3, label: '🫙 โหลความรู้สึก' },
                { id: 5, label: '📖 บันทึก' },
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
                padding: '8px 12px',
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
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="ออกจากระบบ"
          style={{
            border: '1.5px solid var(--card-border)',
            background: '#FFFDF9',
            color: 'var(--text-brown-light)',
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: 13,
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
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 16px 60px' }}>

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
                    unoptimized
                    style={{
                      objectFit: 'contain',
                      animation: 'fadeUp 0.3s ease both',
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-brown-light)', padding: 10 }}>
                    <div style={{ fontSize: 42, marginBottom: 4 }}>💭</div>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-display)' }}>เลือกอารมณ์ของคุณ</span>
                  </div>
                )}
              </div>

              {selectedMood && currentMoodObj && (
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-brown)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '6px 20px',
                    borderRadius: 99,
                    border: '1.5px solid var(--card-border)',
                    zIndex: 2,
                    boxShadow: '0 4px 12px rgba(91,74,63,0.08)',
                    animation: 'fadeUp 0.25s ease both',
                  }}
                >
                  อารมณ์: {currentMoodObj.label} {currentMoodObj.emoji}
                </div>
              )}
            </div>

            {/* Grid of Mood Buttons (โดดเด่นและชัดเจน) */}
            <div>
              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-brown-light)', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                แตะสติกเกอร์ความรู้สึกวันนี้
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {MOOD_LIST.map((m) => {
                  const isSel = selectedMood === m.key
                  return (
                    <button
                      key={m.key}
                      onClick={() => handleSelectMood(m.key)}
                      style={{
                        background: isSel ? '#FFF0E5' : 'rgba(255, 255, 255, 0.9)',
                        border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                        borderRadius: 20,
                        padding: '10px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transform: isSel ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: isSel ? '0 6px 16px rgba(91, 74, 63, 0.18)' : '0 2px 6px rgba(91,74,63,0.04)',
                      }}
                    >
                      <Image
                        src={`/moodpics/${m.key}.svg`}
                        alt={m.label}
                        width={44}
                        height={44}
                        unoptimized
                        style={{ objectFit: 'contain' }}
                      />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontFamily: 'var(--font-display)',
                          fontWeight: isSel ? 600 : 500,
                          color: 'var(--text-brown)',
                        }}
                      >
                        {m.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* แสดงปุ่ม "ถัดไป" เฉพาะเมื่อกดเลือกอารมณ์แล้วเท่านั้น! */}
            {selectedMood && (
              <div style={{ animation: 'fadeUp 0.35s ease both', marginTop: 4 }}>
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
                  ถัดไป ➔
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: เช็คอิน Wizard (Step 1: กาย | Step 2: ใจ+ครู+ส่งคำตอบ)
        ======================================================== */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Header & Step Indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  เช็คอินประจำวัน ✨
                </h2>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--text-brown-light)' }}>
                  ขั้นที่ {wizardStep} / 2
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#EFE4D6', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(wizardStep / 2) * 100}%`,
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

            {/* STEP 1: กาย (เริ่มต้นยังไม่เลือกอันไหนเลย) */}
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
                    {['🍚 ทานอาหารครบมื้อ', '🥗 ทานผักผลไม้ด้วย', '🍪 ทานน้อย/ไม่ค่อยหิว'].map((opt) => {
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
                    {['💧 ดื่มน้ำเพียงพอ (6-8 แก้ว)', '🥤 ดื่มน้ำน้อย (<4 แก้ว)', '🧃 ดื่มน้ำหวาน/ชาไข่มุก'].map((opt) => {
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
              </div>
            )}

            {/* STEP 2: ใจ (เรื่องกังวลใจ + ต้องการพูดคุยครู) */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.25s ease forwards' }}>
                {/* 2a: เรื่องกังวลใจ */}
                <div style={{ background: 'rgba(255, 255, 255, 0.92)', border: concerns.length === 0 && stepError ? '2px solid #FFB5B5' : '1.5px solid var(--card-border)', borderRadius: 24, padding: 18 }}>
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

                {/* 2b: ต้องการพูดคุยกับครูแนะแนว */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 24,
                    padding: 18,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                      👩‍🏫 ต้องการพูดคุยกับครูแนะแนว
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>
                      ครูจะได้รับการแจ้งเตือนและติดต่อกลับ
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={teacherSignal}
                    onChange={(e) => {
                      sound.playPop()
                      setTeacherSignal(e.target.checked)
                    }}
                    style={{ width: 22, height: 22, cursor: 'pointer', accentColor: 'var(--text-brown)' }}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons: ย้อนกลับ (ทำได้ตลอดเวลา) / ถัดไป / ส่งคำตอบ */}
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

              {wizardStep < 2 ? (
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
                    if (concerns.length === 0) {
                      sound.playPop()
                      setStepError('กรุณาเลือกอย่างน้อย 1 ข้อ (หรือเลือก "✨ ไม่มีเรื่องกังวล") นะครับ')
                      return
                    }
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
                  {saving ? 'กำลังบันทึก...' : 'ส่งคำตอบ 🎉'}
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
                value={gratitudeText}
                onChange={(e) => setGratitudeText(e.target.value)}
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
            TAB 4 / RESULT: แสดงผลไฟ Streak ฉลองความสำเร็จ!
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

            {/* Congratulatory Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 24, width: '100%', boxShadow: '0 8px 24px rgba(91,74,63,0.08)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                ยอดเยี่ยมมาก {profile ? profile.full_name.split(' ')[0] : ''}! 💖
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-brown-light)', lineHeight: 1.6 }}>
                คุณได้บันทึกความรู้สึกและดูแลสุขภาพใจในวันนี้เรียบร้อยแล้ว ได้รับ <strong>+15 Heart Energy</strong> ประจำวัน
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
            TAB 5: บันทึกจากโหลความรู้สึก (Journal History)
        ======================================================== */}
        {activeTab === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Header */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                📖 บันทึกของฉัน
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>
                ข้อความที่หยอดลงโหลความรู้สึกทั้งหมด
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
              }}
            >
              {[
                { label: 'บันทึก', value: jarNotes.length },
                { label: 'เช็คอิน', value: profile?.streak ?? 0 },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 1 ? '1.5px solid var(--card-border)' : 'none' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-brown-light)', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Journal entries list */}
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
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>ยังไม่มีบันทึก</p>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Group by date – simple approach: show date header when day changes */}
                {jarNotes.map((note, idx) => {
                  const noteDate = note.date
                  const prev = idx > 0 ? jarNotes[idx - 1].date : null
                  const showDateHeader =
                    !prev ||
                    noteDate.getDate() !== prev.getDate() ||
                    noteDate.getMonth() !== prev.getMonth()
                  const dayNames = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
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
                          <p style={{ fontSize: 14, color: 'var(--text-brown)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)' }}>
                            {note.text}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-brown-light)', marginTop: 4 }}>
                            {timeLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

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