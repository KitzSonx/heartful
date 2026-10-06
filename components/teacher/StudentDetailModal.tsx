// components/teacher/StudentDetailModal.tsx - Modal รายละเอียดคะแนนรายข้อและการประเมินทักษะดูแลตนเองสำหรับครูแนะแนว
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import type { DiaryEntry, Profile, JarNote } from '../../types/database'

interface StudentDetailModalProps {
  studentId: string
  initialProfile?: {
    id: string
    student_id?: string | null
    full_name: string
    room: string
    student_number?: number | null
    streak: number
    last_diary_date?: string | null
  }
  initialEntry?: DiaryEntry | null
  onClose: () => void
}

const MOOD_LABEL: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'สุขใจ', emoji: '😊' },
  calm: { label: 'ผ่อนคลาย', emoji: '🍃' },
  proud: { label: 'ภูมิใจ', emoji: '✨' },
  tired: { label: 'เหนื่อยล้า', emoji: '🥱' },
  sleepy: { label: 'ง่วงนอน', emoji: '😴' },
  worried: { label: 'กังวลใจ', emoji: '😰' },
  sad: { label: 'เศร้าใจ', emoji: '😢' },
  hurt: { label: 'เสียใจ', emoji: '💔' },
  angry: { label: 'หงุดหงิด', emoji: '😤' },
  afraid: { label: 'กลัว', emoji: '😨' },
  shocked: { label: 'ตกใจ', emoji: '😲' },
  shy: { label: 'เขินอาย', emoji: '🙈' },
}

export default function StudentDetailModal({
  studentId,
  initialProfile,
  initialEntry,
  onClose,
}: StudentDetailModalProps) {
  const [loading, setLoading] = useState(!initialEntry)
  const [profile, setProfile] = useState<Profile | null>((initialProfile as Profile) || null)
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntry ? [initialEntry] : [])
  const [jarNotes, setJarNotes] = useState<JarNote[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(initialEntry?.date || '')
  const [activeTab, setActiveTab] = useState<'breakdown' | 'guidance' | 'history'>('breakdown')

  // โหลดข้อมูลแบบเต็มของนักเรียนผ่าน API
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/teacher/student-detail?userId=${studentId}`)
        if (res.ok) {
          const data = await res.json()
          if (!isMounted) return
          if (data.profile) setProfile(data.profile)
          if (data.entries && data.entries.length > 0) {
            setEntries(data.entries)
            if (!selectedDate) {
              setSelectedDate(data.entries[0].date)
            }
          }
          if (data.jarNotes) setJarNotes(data.jarNotes)
        }
      } catch (err) {
        console.error('Error fetching student detail:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      isMounted = false
    }
  }, [studentId, selectedDate])

  // Entry ที่เลือกดูในปัจจุบัน
  const currentEntry = useMemo(() => {
    if (selectedDate) {
      const found = entries.find((e) => e.date === selectedDate)
      if (found) return found
    }
    return entries[0] || initialEntry || null
  }, [entries, selectedDate, initialEntry])

  // การวิเคราะห์ทักษะการรักและดูแลตนเอง (Guidance Counselor Assessment Engine)
  const analysis = useMemo(() => {
    if (!currentEntry) return null

    const strengths: string[] = []
    const needsImprovement: { title: string; category: 'body' | 'mind' | 'social'; tip: string }[] = []

    // 1. ตรวจสอบหมวดกาย
    if (currentEntry.sleep_pts >= 5) {
      strengths.push('🛌 พักผ่อนเพียงพอ (7-8 ชั่วโมง)')
    } else if (currentEntry.sleep_pts === 3) {
      needsImprovement.push({
        title: 'นอนดึก / พักผ่อน 5-6 ชม.',
        category: 'body',
        tip: 'ส่งเสริมการจัดตารางเวลาและสุขอนามัยการนอน (Sleep Hygiene) งดใช้อุปกรณ์จอสว่างก่อนนอนอย่างน้อย 30 นาที',
      })
    } else {
      needsImprovement.push({
        title: 'นอนน้อยมาก (< 5 ชั่วโมง) ⚠️',
        category: 'body',
        tip: 'สังเกตภาวะอ่อนล้าเรื้อรัง สอบถามสาเหตุว่าติดการบ้าน เล่นเกม หรือมีความเครียดรบกวนการนอนหรือไม่',
      })
    }

    if (currentEntry.drank_water || currentEntry.water_pts >= 3) {
      strengths.push('💧 ดื่มน้ำเพียงพอ 8 แก้ว/วัน')
    } else {
      needsImprovement.push({
        title: 'ดื่มน้ำน้อย (< 4 แก้ว)',
        category: 'body',
        tip: 'แนะนำให้พกขวดน้ำส่วนตัวและจิบน้ำระหว่างวัน เพื่อช่วยให้สมองสดชื่นและลดความตึงเครียดของร่างกาย',
      })
    }

    if (currentEntry.ate_vegetables || currentEntry.veggie_meals >= 2) {
      strengths.push('🥗 ทานผักผลไม้ในมื้ออาหาร')
    } else {
      needsImprovement.push({
        title: 'ทานผักผลไม้น้อย',
        category: 'body',
        tip: 'สอดแทรกความรู้เรื่องสารอาหาร วิตามิน และใยอาหารที่มีผลต่ออารมณ์และระดับพลังงานของร่างกาย',
      })
    }

    if (currentEntry.reduced_sugar || currentEntry.sugar_pts >= 3) {
      strengths.push('🧃 ลดหวาน / ควบคุมระดับน้ำตาลได้ดี')
    } else {
      needsImprovement.push({
        title: 'ดื่มน้ำหวาน / ทานหวานบ่อย',
        category: 'body',
        tip: 'เตือนเรื่องภาวะ Sugar Crash ที่ทำให้ง่วง อ่อนเพลีย หรือหงุดหงิดง่ายในช่วงบ่าย',
      })
    }

    if (currentEntry.steps_pts >= 3) {
      strengths.push('👟 ขยับกาย / ออกกำลังกายสม่ำเสมอ')
    } else if (currentEntry.steps_pts <= 1) {
      needsImprovement.push({
        title: 'ขยับกายน้อย / นั่งติดที่นาน',
        category: 'body',
        tip: 'กระตุ้นให้ลุกยืดเหยียดระหว่างคาบเรียน หรือเดินเร็วเบาๆ เพื่อกระตุ้นการไหลเวียนโลหิตและหลั่งสารเอ็นดอร์ฟิน',
      })
    }

    // 2. ตรวจสอบหมวดใจ
    if (currentEntry.observed_emotions) {
      strengths.push('👁️ สังเกตและรู้เท่าทันอารมณ์ตนเอง')
    } else {
      needsImprovement.push({
        title: 'ยังไม่ค่อยได้เช็คอินอารมณ์ตนเอง',
        category: 'mind',
        tip: 'ฝึกทักษะ Emotion Check-in ชวนตั้งชื่อให้อารมณ์ (Name it to tame it) เพื่อไม่ให้ความรู้สึกครอบงำพฤติกรรม',
      })
    }

    if (currentEntry.limited_social_media) {
      strengths.push('📱 ลดจอ / พักสายตาจากโซเชียลมีเดีย')
    } else {
      needsImprovement.push({
        title: 'ใช้เวลากับหน้าจอหรือโซเชียลมาก',
        category: 'mind',
        tip: 'แนะนำเทคนิค Digital Detox ช่วงสั้นๆ หรือพักสายตาทุก 20 นาที เพื่อลดภาวะ Information Overload',
      })
    }

    if (currentEntry.meditated) {
      strengths.push('🧘 ฝึกสมาธิ / หายใจลึกๆ ดูแลใจ')
    } else {
      needsImprovement.push({
        title: 'ยังไม่ได้ฝึกการผ่อนคลายจิตใจ',
        category: 'mind',
        tip: 'แนะนำเทคนิคการหายใจ 4-4-4-4 (Box Breathing) หรือการนับลมหายใจสั้นๆ 1-2 นาที เมื่อรู้สึกตื่นเต้นหรือวิตกกังวล',
      })
    }

    if (currentEntry.gratitude_text && currentEntry.gratitude_text.trim().length > 0) {
      strengths.push('🌸 มีความรู้สึกขอบคุณและมองเห็นสิ่งดีๆ รอบตัว')
    }

    if (currentEntry.concerns && currentEntry.concerns.length > 0 && !currentEntry.concerns.includes('✨ ไม่มีเรื่องกังวล')) {
      needsImprovement.push({
        title: `มีเรื่องกังวลใจ: ${currentEntry.concerns.join(', ')}`,
        category: 'mind',
        tip: 'ใช้หัวข้อที่นักเรียนกังวลใจนี้เป็นประเด็นเปิดใจพูดคุย โดยใช้วิธีรับฟังอย่างเข้าอกเข้าใจ (Active Listening) ไม่ตัดสิน',
      })
    }

    // 3. ตรวจสอบหมวดสังคม
    if (currentEntry.time_with_loved) {
      strengths.push('👨‍👩‍👧 ใช้เวลาที่มีคุณภาพกับคนที่รักหรือครอบครัว')
    } else {
      needsImprovement.push({
        title: 'อาจรู้สึกโดดเดี่ยว / มีเวลาให้คนใกล้ชิดน้อย',
        category: 'social',
        tip: 'สังเกตปฏิสัมพันธ์ของเด็กกับเพื่อนในห้อง หรือจัดกิจกรรมกลุ่มย่อยที่ช่วยให้เด็กได้เชื่อมต่อกับผู้อื่น',
      })
    }

    if (currentEntry.helped_others) {
      strengths.push('🤝 มีน้ำใจช่วยเหลือหรือให้กำลังใจผู้อื่น')
    }
    if (currentEntry.tidied_space) {
      strengths.push('🧹 จัดพื้นที่ส่วนตัว/โต๊ะเรียนเป็นระเบียบ')
    }
    if (currentEntry.expressed_opinion) {
      strengths.push('🗣️ กล้าแสดงความคิดเห็นอย่างสร้างสรรค์')
    }

    // สัญญาณเร่งด่วน
    const isCriticalHelp = currentEntry.need_counselor
    const totalScore = currentEntry.total_pts ?? 0

    let overallStatus: 'good' | 'moderate' | 'needs_care' = 'good'
    if (isCriticalHelp || totalScore < 12) {
      overallStatus = 'needs_care'
    } else if (totalScore < 18 || needsImprovement.length >= 4) {
      overallStatus = 'moderate'
    }

    return {
      strengths,
      needsImprovement,
      isCriticalHelp,
      overallStatus,
      totalScore,
    }
  }, [currentEntry])

  // ปิดเมื่อกด Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        background: 'rgba(50, 35, 25, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#FFFDF9',
          border: '2px solid var(--card-border)',
          borderRadius: 26,
          maxWidth: 780,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(91,74,63,0.22)',
          fontFamily: 'var(--font-body)',
          overflow: 'hidden',
          animation: 'fadeUp 0.25s ease both',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1.5px solid var(--card-border)',
            background: 'rgba(255, 248, 239, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                background: currentEntry?.mood ? 'rgba(255, 238, 217, 0.9)' : '#FFF0E5',
                border: '1.5px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(91,74,63,0.08)',
              }}
            >
              {currentEntry?.mood ? (
                <Image
                  src={`/moodpics/${currentEntry.mood}.svg`}
                  alt={currentEntry.mood}
                  width={30}
                  height={30}
                  unoptimized
                />
              ) : (
                <span style={{ fontSize: 22 }}>👤</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text-brown)',
                    margin: 0,
                  }}
                >
                  {profile?.full_name || initialProfile?.full_name || 'ข้อมูลนักเรียน'}
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'rgba(240, 232, 222, 0.8)',
                    color: 'var(--text-brown)',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  ห้อง {profile?.room || initialProfile?.room} · เลขที่ {profile?.student_number ?? initialProfile?.student_number ?? '—'}
                </span>
                {profile?.student_id && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                    (รหัส {profile.student_id})
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-brown-light)' }}>
                Streak: {profile?.streak ? `🔥 ${profile.streak} วันติดต่อกัน` : '—'} · บันทึกล่าสุด:{' '}
                {profile?.last_diary_date || 'ยังไม่มีบันทึก'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* วันที่บันทึก Dropdown */}
            {entries.length > 0 && (
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1.5px solid var(--card-border)',
                  background: '#FFFDF9',
                  color: 'var(--text-brown)',
                  fontSize: 12.5,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {entries.map((ent) => (
                  <option key={ent.date} value={ent.date}>
                    วันที่ {ent.date} ({MOOD_LABEL[ent.mood || '']?.label || 'ไม่มีอารมณ์'})
                  </option>
                ))}
              </select>
            )}

            {/* ปุ่มปิด */}
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1.5px solid var(--card-border)',
                background: '#FFFDF9',
                color: 'var(--text-brown)',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              title="ปิดหน้าต่าง"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(247, 242, 235, 0.8)',
            borderBottom: '1.5px solid var(--card-border)',
            padding: '4px 14px',
            gap: 8,
          }}
        >
          <button
            onClick={() => setActiveTab('breakdown')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'breakdown' ? 'var(--text-brown)' : 'transparent',
              color: activeTab === 'breakdown' ? '#FFF8EF' : 'var(--text-brown)',
              fontSize: 13,
              fontWeight: activeTab === 'breakdown' ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.15s',
            }}
          >
            📊 คะแนนรวม & รายข้อ
          </button>
          <button
            onClick={() => setActiveTab('guidance')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'guidance' ? 'var(--text-brown)' : 'transparent',
              color: activeTab === 'guidance' ? '#FFF8EF' : 'var(--text-brown)',
              fontSize: 13,
              fontWeight: activeTab === 'guidance' ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.15s',
              position: 'relative',
            }}
          >
            🎯 วิเคราะห์ทักษะ & คำแนะนำครู
            {analysis && analysis.needsImprovement.length > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: analysis.isCriticalHelp ? '#c0392b' : '#D96B27',
                  color: '#FFF',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 99,
                  fontWeight: 700,
                }}
              >
                {analysis.needsImprovement.length} จุด
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'history' ? 'var(--text-brown)' : 'transparent',
              color: activeTab === 'history' ? '#FFF8EF' : 'var(--text-brown)',
              fontSize: 13,
              fontWeight: activeTab === 'history' ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.15s',
            }}
          >
            📅 ประวัติ & โหลข้อความ ({entries.length})
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-brown-light)' }}>
              กำลังโหลดข้อมูลรายละเอียดนักเรียน... ⏳
            </div>
          ) : !currentEntry ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 20,
                border: '1.5px dashed var(--card-border)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-brown)', margin: 0 }}>
                ยังไม่พบข้อมูลบันทึกไดอารี่ของนักเรียนคนนี้
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginTop: 4 }}>
                นักเรียนยังไม่ได้ทำการบันทึกไดอารี่สุขภาวะในระบบ
              </p>
            </div>
          ) : (
            <>
              {/* Alert Banner กรณีขอคุยกับครู */}
              {currentEntry.need_counselor && (
                <div
                  style={{
                    background: '#FFF0F0',
                    border: '1.5px solid #FF9AA2',
                    borderRadius: 16,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 4px 12px rgba(235, 87, 87, 0.1)',
                  }}
                >
                  <span style={{ fontSize: 24 }}>🚨</span>
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#c0392b',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      นักเรียนส่งสัญญาณต้องการพูดคุยกับครูแนะแนว
                    </h5>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#882218' }}>
                      ในบันทึกวันที่ {currentEntry.date} นักเรียนกดเลือก &ldquo;อยากคุยกับครูแนะแนว&rdquo; คุณครูควรหาเวลานัดหมายพูดคุยเชิงลึก
                    </p>
                  </div>
                </div>
              )}

              {/* Score Snapshot Cards (3 ด้าน + คะแนนรวม) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {/* คะแนนรวม */}
                <div
                  style={{
                    background:
                      (currentEntry.total_pts ?? 0) >= 18
                        ? 'rgba(198, 222, 190, 0.45)'
                        : (currentEntry.total_pts ?? 0) >= 12
                        ? 'rgba(255, 238, 204, 0.55)'
                        : 'rgba(255, 220, 220, 0.5)',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 18,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    คะแนนรวมทั้งหมด
                  </span>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                    {currentEntry.total_pts ?? 0}
                    <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.7 }}> / 30</span>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10.5,
                      fontWeight: 600,
                      marginTop: 4,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: (currentEntry.total_pts ?? 0) >= 18 ? '#2d7a4f' : (currentEntry.total_pts ?? 0) >= 12 ? '#D96B27' : '#c0392b',
                      color: '#FFF',
                    }}
                  >
                    {(currentEntry.total_pts ?? 0) >= 18 ? '🟢 สุขภาวะดี' : (currentEntry.total_pts ?? 0) >= 12 ? '🟡 ปานกลาง' : '🔴 ควรดูแล'}
                  </span>
                </div>

                {/* ด้านกาย */}
                <div
                  style={{
                    background: '#FFF8F0',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 18,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    🏃 ดูแลกาย (Body)
                  </span>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#D96B27', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                    {currentEntry.body_pts ?? 0}
                    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}> / 17</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-brown-light)', marginTop: 2, display: 'block' }}>
                    นอน, น้ำ, ผัก, ก้าว, ลดหวาน
                  </span>
                </div>

                {/* ด้านใจ */}
                <div
                  style={{
                    background: '#F6F3FF',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 18,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    🧠 ดูแลใจ (Mind)
                  </span>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                    {currentEntry.mind_pts ?? 0}
                    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}> / 11</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-brown-light)', marginTop: 2, display: 'block' }}>
                    อารมณ์, ลดจอ, สมาธิ, ขอบคุณ
                  </span>
                </div>

                {/* ด้านสังคม */}
                <div
                  style={{
                    background: '#F0F9FF',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 18,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    🤝 สังคม & ครู (Social)
                  </span>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0284C7', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                    {currentEntry.social_pts ?? 0}
                    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}> / 9</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-brown-light)', marginTop: 2, display: 'block' }}>
                    คนที่รัก, ช่วยเหลือ, สื่อสาร
                  </span>
                </div>
              </div>

              {/* TAB 1: BREAKDOWN คะแนนรายข้อ */}
              {activeTab === 'breakdown' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* หมวด 1: กาย */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 18,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(91,74,63,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                        🌿 หมวดที่ 1: สุขภาพกาย (Body Wellness)
                      </h4>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#D96B27', fontFamily: 'var(--font-display)' }}>
                        {currentEntry.body_pts ?? 0} คะแนน
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* นอนหลับ */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🛌 การนอนหลับพักผ่อน</span>
                          <span style={{ fontSize: 12, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                            {currentEntry.sleep_pts >= 5 ? 'นอนพอ 7-8 ชม.' : currentEntry.sleep_pts === 3 ? 'นอนดึก 5-6 ชม.' : 'นอนน้อย <5 ชม.'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.sleep_pts >= 5 ? '#2d7a4f' : currentEntry.sleep_pts === 3 ? '#D96B27' : '#c0392b' }}>
                          +{currentEntry.sleep_pts ?? 0} / 5 คะแนน
                        </span>
                      </div>

                      {/* ดื่มน้ำ */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>💧 การดื่มน้ำสะอาด</span>
                          <span style={{ fontSize: 12, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                            {currentEntry.drank_water || currentEntry.water_glasses >= 8 ? 'เพียงพอ 8 แก้ว' : 'ดื่มน้ำน้อย 4 แก้ว'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.water_pts >= 3 ? '#2d7a4f' : '#D96B27' }}>
                          +{currentEntry.water_pts ?? 1} / 3 คะแนน
                        </span>
                      </div>

                      {/* ผักผลไม้ */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🥗 ทานผักและผลไม้</span>
                          <span style={{ fontSize: 12, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                            {currentEntry.ate_vegetables || currentEntry.veggie_meals >= 2 ? 'ทานผักผลไม้ 2 มื้อขึ้นไป' : 'ทานน้อย / ไม่ได้ทาน'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.ate_vegetables ? '#2d7a4f' : '#D96B27' }}>
                          {currentEntry.ate_vegetables ? '+3' : '+1'} / 3 คะแนน
                        </span>
                      </div>

                      {/* ลดหวาน */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🧃 การลดหวาน / น้ำตาล</span>
                          <span style={{ fontSize: 12, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                            {currentEntry.reduced_sugar || currentEntry.sugar_pts >= 3 ? 'ควบคุมน้ำตาลได้ดี (หวาน 25%)' : 'ดื่มน้ำหวาน (หวาน 75%)'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.sugar_pts >= 3 ? '#2d7a4f' : '#D96B27' }}>
                          +{currentEntry.sugar_pts ?? 1} / 3 คะแนน
                        </span>
                      </div>

                      {/* ขยับกาย */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>👟 การขยับกาย / จำนวนก้าว</span>
                          <span style={{ fontSize: 12, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                            {currentEntry.steps_pts >= 3 ? 'ออกกำลังกาย / 6,000+ ก้าว' : currentEntry.steps_pts === 2 ? 'พอสมควร 3,000-5,999 ก้าว' : 'ขยับกายน้อย <3,000 ก้าว'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.steps_pts >= 3 ? '#2d7a4f' : currentEntry.steps_pts === 2 ? '#D96B27' : '#c0392b' }}>
                          +{currentEntry.steps_pts ?? 1} / 3 คะแนน
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* หมวด 2: ใจ */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 18,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(91,74,63,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                        🧠 หมวดที่ 2: สุขภาพใจ & ความรู้สึก (Mind & Emotion)
                      </h4>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', fontFamily: 'var(--font-display)' }}>
                        {currentEntry.mind_pts ?? 0} คะแนน
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* อารมณ์วันนี้ */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🎭 อารมณ์เด่นประจำวัน</span>
                          <span style={{ fontSize: 12, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                            {currentEntry.mood ? `${MOOD_LABEL[currentEntry.mood]?.emoji || ''} ${MOOD_LABEL[currentEntry.mood]?.label || currentEntry.mood}` : 'ไม่ได้ระบุ'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-brown-light)' }}>
                          {currentEntry.observed_emotions ? '✅ สังเกตอารมณ์ (+2)' : '—'}
                        </span>
                      </div>

                      {/* ลดโซเชียล */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>📱 พักสายตา / ลดโซเชียลมีเดีย</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.limited_social_media ? '#2d7a4f' : '#999' }}>
                          {currentEntry.limited_social_media ? '+2 คะแนน (ทำ)' : '0 คะแนน (ไม่ได้ทำ)'}
                        </span>
                      </div>

                      {/* นั่งสมาธิ */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🧘 ฝึกสมาธิ / หายใจลึกๆ</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.meditated ? '#2d7a4f' : '#999' }}>
                          {currentEntry.meditated ? '+2 คะแนน (ทำ)' : '0 คะแนน (ไม่ได้ทำ)'}
                        </span>
                      </div>

                      {/* เรื่องกังวลใจ */}
                      <div style={{ padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13, marginBottom: 4 }}>
                          💭 เรื่องที่กำลังกังวลใจ:
                        </div>
                        {currentEntry.concerns && currentEntry.concerns.length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {currentEntry.concerns.map((c, i) => (
                              <span
                                key={i}
                                style={{
                                  background: c.includes('ไม่มี') ? 'rgba(198, 222, 190, 0.5)' : '#FFF0F0',
                                  color: c.includes('ไม่มี') ? '#2d7a4f' : '#c0392b',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: '3px 9px',
                                  borderRadius: 8,
                                }}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12.5, color: 'var(--text-brown-light)' }}>ไม่ได้ระบุ</span>
                        )}
                      </div>

                      {/* สิ่งที่ขอบคุณ 3 อย่าง */}
                      {currentEntry.gratitude_text && (
                        <div style={{ padding: '10px 12px', background: '#FFFBF2', borderRadius: 10, border: '1px solid #FFE4B5' }}>
                          <div style={{ fontWeight: 600, color: '#B45309', fontSize: 13, marginBottom: 4 }}>
                            🌸 3 สิ่งดีๆ ที่รู้สึกขอบคุณ (Gratitudes):
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-brown)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                            {currentEntry.gratitude_text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* หมวด 3: สังคม & สัมพันธภาพ */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 18,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(91,74,63,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                        🤝 หมวดที่ 3: สังคม & ความสัมพันธ์ (Social Connection)
                      </h4>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0284C7', fontFamily: 'var(--font-display)' }}>
                        {currentEntry.social_pts ?? 0} คะแนน
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>👨‍👩‍👧 ใช้เวลากับคนที่รัก / ครอบครัว</span>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.time_with_loved ? '#2d7a4f' : '#999' }}>
                          {currentEntry.time_with_loved ? '+2 คะแนน (ทำ)' : '0 คะแนน'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🤝 ช่วยเหลือ / ให้กำลังใจผู้อื่น</span>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.helped_others ? '#2d7a4f' : '#999' }}>
                          {currentEntry.helped_others ? '+2 คะแนน (ทำ)' : '0 คะแนน'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🧹 จัดเก็บห้อง / มุมโปรดให้เรียบร้อย</span>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.tidied_space ? '#2d7a4f' : '#999' }}>
                          {currentEntry.tidied_space ? '+2 คะแนน (ทำ)' : '0 คะแนน'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-brown)', fontSize: 13 }}>🗣️ กล้าพูดหรือแสดงความคิดเห็น</span>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.expressed_opinion ? '#2d7a4f' : '#999' }}>
                          {currentEntry.expressed_opinion ? '+2 คะแนน (ทำ)' : '0 คะแนน'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: currentEntry.need_counselor ? '#FFF0F0' : '#FFFDF9', borderRadius: 10, border: '1px solid rgba(200,186,168,0.3)' }}>
                        <span style={{ fontWeight: 600, color: currentEntry.need_counselor ? '#c0392b' : 'var(--text-brown)', fontSize: 13 }}>
                          🆘 ส่งสัญญาณขอคุยกับครูแนะแนว
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: currentEntry.need_counselor ? '#c0392b' : '#999' }}>
                          {currentEntry.need_counselor ? '🚨 ขอคุยกับครู' : 'ไม่ได้ส่งสัญญาณ'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: วิเคราะห์ทักษะ & คำแนะนำครูแนะแนว (ACTIONABLE GUIDANCE) */}
              {activeTab === 'guidance' && analysis && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* กล่องสรุปสถานะการดูแล */}
                  <div
                    style={{
                      background:
                        analysis.overallStatus === 'needs_care'
                          ? '#FFF0F0'
                          : analysis.overallStatus === 'moderate'
                          ? '#FFFBF0'
                          : '#F2F9F2',
                      border: `1.5px solid ${
                        analysis.overallStatus === 'needs_care'
                          ? '#FFB3BA'
                          : analysis.overallStatus === 'moderate'
                          ? '#FFE1A8'
                          : '#B7E4C7'
                      }`,
                      borderRadius: 18,
                      padding: '16px 18px',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color:
                          analysis.overallStatus === 'needs_care'
                            ? '#c0392b'
                            : analysis.overallStatus === 'moderate'
                            ? '#B45309'
                            : '#2d7a4f',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {analysis.overallStatus === 'needs_care'
                        ? '🚨 กลุ่มที่ต้องได้รับการดูแลเป็นพิเศษ (High Priority Care)'
                        : analysis.overallStatus === 'moderate'
                        ? '⚠️ กลุ่มที่ควรเฝ้าระวังและส่งเสริมทักษะ (Moderate Watchlist)'
                        : '🟢 กลุ่มที่มีทักษะการดูแลตนเองในเกณฑ์ดี (Healthy / Normal)'}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-brown)', lineHeight: 1.5 }}>
                      {analysis.overallStatus === 'needs_care'
                        ? 'นักเรียนมีคะแนนการดูแลตัวเองต่ำ หรือมีสัญญาณขอคุย/ความเครียด แนะนำให้ครูแนะแนวนัดพูดคุยรายบุคคลและสำรวจอุปสรรคในการดูแลใจของนักเรียน'
                        : analysis.overallStatus === 'moderate'
                        ? 'นักเรียนดูแลตัวเองได้บางด้านแต่ยังมีบางพฤติกรรมที่คะแนนน้อย ควรเสริมความรู้หรือจัดกิจกรรมกระตุ้นในด้านที่ได้คะแนนต่ำ'
                        : 'นักเรียนมีพฤติกรรมรักและดูแลตัวเองอย่างสม่ำเสมอ ควรชื่นชมและส่งเสริมให้รักษาความสม่ำเสมอนี้ต่อไป'}
                    </p>
                  </div>

                  {/* จุดที่ควรเสริมความรู้ / กระบวนการด่วน */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 18,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(91,74,63,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>💡</span>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                        จุดที่คะแนนต่ำ & สิ่งที่ครูแนะแนวควรเสริม ({analysis.needsImprovement.length} ประเด็น)
                      </h4>
                    </div>

                    {analysis.needsImprovement.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#2d7a4f', margin: 0 }}>
                        ✨ ยอดเยี่ยมมาก! ไม่พบข้อที่คะแนนต่ำในวันนี้ นักเรียนดูแลตัวเองได้ดีครบทุกด้าน
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {analysis.needsImprovement.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#FFFDF9',
                              border: '1px solid rgba(217, 107, 39, 0.25)',
                              borderLeft: '4px solid #D96B27',
                              borderRadius: 12,
                              padding: '10px 14px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#D96B27' }}>
                                {idx + 1}. {item.title}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: 'rgba(217, 107, 39, 0.1)',
                                  color: '#D96B27',
                                  padding: '1px 7px',
                                  borderRadius: 99,
                                }}
                              >
                                ด้าน{item.category === 'body' ? 'กาย' : item.category === 'mind' ? 'ใจ' : 'สังคม'}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-brown)', lineHeight: 1.45 }}>
                              <strong>📌 กระบวนการที่ควรเสริม:</strong> {item.tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* จุดแข็งและพฤติกรรมเชิงบวก */}
                  {analysis.strengths.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 18,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>🌟</span>
                        <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                          จุดเด่นและสิ่งที่ทำได้ดี (จุดชมเชย / Positive Reinforcement)
                        </h4>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {analysis.strengths.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(198, 222, 190, 0.45)',
                              border: '1px solid rgba(45, 122, 79, 0.2)',
                              color: '#2d7a4f',
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 10,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ประวัติย้อนหลัง & โหลข้อความ */}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* ตารางประวัติบันทึก */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px', fontSize: 14.5, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                      📅 ประวัติบันทึกไดอารี่สุขภาวะ ({entries.length} วันล่าสุด)
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: 'rgba(239,228,214,0.4)', borderBottom: '1px solid var(--card-border)' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>วันที่</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>อารมณ์</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>คะแนนรวม</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>กาย</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>ใจ</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>สังคม</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>เลือกดู</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((e) => (
                            <tr
                              key={e.date}
                              style={{
                                borderBottom: '1px solid rgba(200,186,168,0.25)',
                                background: selectedDate === e.date ? 'rgba(255, 238, 204, 0.4)' : 'transparent',
                              }}
                            >
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-brown)' }}>{e.date}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                {e.mood ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Image src={`/moodpics/${e.mood}.svg`} alt={e.mood} width={14} height={14} unoptimized />
                                    {MOOD_LABEL[e.mood]?.label}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: (e.total_pts ?? 0) >= 18 ? '#2d7a4f' : '#D96B27' }}>
                                {e.total_pts ?? 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.body_pts ?? 0}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.mind_pts ?? 0}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.social_pts ?? 0}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => setSelectedDate(e.date)}
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    border: '1px solid var(--card-border)',
                                    background: selectedDate === e.date ? 'var(--text-brown)' : '#FFFDF9',
                                    color: selectedDate === e.date ? '#FFF' : 'var(--text-brown)',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {selectedDate === e.date ? 'กำลังดู' : 'ดูวันนี้'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* โหลความรู้สึก */}
                  {jarNotes.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 18,
                        padding: 16,
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px', fontSize: 14.5, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                        🫙 ข้อความในโหลความรู้สึก (Jar of Gratitude)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {jarNotes.map((note) => (
                          <div
                            key={note.id}
                            style={{
                              padding: '10px 12px',
                              background: '#FFFBF2',
                              borderRadius: 10,
                              border: '1px solid #FFE4B5',
                              fontSize: 12.5,
                            }}
                          >
                            <p style={{ margin: 0, color: 'var(--text-brown)', whiteSpace: 'pre-line' }}>{note.content}</p>
                            <span style={{ fontSize: 10.5, color: 'var(--text-brown-light)', marginTop: 4, display: 'block' }}>
                              {new Date(note.created_at).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1.5px solid var(--card-border)',
            background: 'rgba(255, 248, 239, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-brown-light)' }}>
            💡 ข้อมูลนี้ช่วยให้ครูแนะแนวประเมินแนวทางส่งเสริมสุขภาวะรายบุคคลได้อย่างตรงจุด
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 99,
              border: '1.5px solid var(--text-brown)',
              background: 'var(--accent-peach)',
              color: 'var(--text-brown)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  )
}
