// app/teacher/page.tsx - Teacher Dashboard (Warm Pastel Design System 100% ตาม Prototype)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { getRoomSummaryToday, getAtRiskStudents, getBehaviorStats, getDailyStats, getAllStudentsWithStatus } from '../../lib/supabase-teacher'
import type { RoomSummary, AtRiskStudent, BehaviorStats, DailyStats, Profile, StudentWithStatus } from '../../types/database'

export default function TeacherDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'rooms' | 'overview' | 'alerts'>('rooms')
  const [stats, setStats] = useState<DailyStats>({ totalStudents: 0, entriesCount: 0, completeCount: 0, atRiskCount: 0 })
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [alerts, setAlerts] = useState<AtRiskStudent[]>([])
  const [behaviors, setBehaviors] = useState<BehaviorStats[]>([])
  const [students, setStudents] = useState<StudentWithStatus[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null) // เช่น "4", "5", "6"
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)  // เช่น "4/1", "4/2"
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [teacherProfile, setTeacherProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const loadDashboardData = useCallback(async () => {
    setRefreshing(true)
    try {
      // ดึงนักเรียน+ห้อง+สถิติผ่าน API route ที่ใช้ service role (ข้าม RLS ได้)
      const res = await fetch('/api/teacher/students')
      if (res.ok) {
        const json = await res.json()
        setStudents(json.students ?? [])
        setRooms(json.rooms ?? [])
        setStats(json.stats ?? { totalStudents: 0, entriesCount: 0, completeCount: 0, atRiskCount: 0 })
      } else {
        console.error('API /api/teacher/students error:', res.status)
      }

      // ดึง alerts และ behaviors แยก (ยังใช้ client ได้เพราะ at_risk_students เป็น view ที่ตั้ง policy ไว้แล้ว)
      const [a, b] = await Promise.all([
        getAtRiskStudents(),
        getBehaviorStats(),
      ])
      setAlerts(a)
      setBehaviors(b)
    } catch (e) {
      console.error('โหลดข้อมูลสถิติไม่สำเร็จ:', e)
    }
    setRefreshing(false)
  }, [])


  useEffect(() => {
    let isMounted = true

    const checkTeacherAuth = async () => {
      setLoading(true)

      // 1. ตรวจสอบสถานะครูผ่าน API Session ก่อน
      try {
        const res = await fetch('/api/auth/teacher-me')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setTeacherProfile({
              id: 'teacher-master',
              full_name: data.fullName || 'ครูแนะแนว (ผู้ดูแลระบบ)',
              room: 'ห้องแนะแนว',
              role: 'teacher',
              total_points: 0,
              streak: 0,
            })
            await loadDashboardData()
            if (isMounted) setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('Teacher session check error:', err)
      }

      // 2. Fallback ตรวจสอบผ่าน Supabase Auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return

      if (!user) {
        router.push('/login?redirect=/teacher')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!isMounted) return

      if (!profile || profile.role !== 'teacher') {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setTeacherProfile(profile as Profile)
      await loadDashboardData()
      setLoading(false)
    }

    void checkTeacherAuth()
    return () => {
      isMounted = false
    }
  }, [router, loadDashboardData])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/teacher-logout', { method: 'POST' })
    } catch { /* ignore */ }
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // แยกชั้นเรียนจากห้อง รองรับทั้ง "4.1" และ "4/1" → "4"
  const getGrade = (room: string) => {
    const m = room.match(/(\d+)[./]\d+/)
    return m ? m[1] : room.replace(/[^\d]/g, '').charAt(0) || '?'
  }

  // สร้าง Map: grade → list of unique room names
  const gradeMap = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    students.forEach((s) => {
      if (!s.room) return
      const g = getGrade(s.room)
      if (!map[g]) map[g] = new Set()
      map[g].add(s.room)
    })
    return map
  }, [students])

  const sortedGrades = useMemo(() => Object.keys(gradeMap).sort((a, b) => Number(a) - Number(b)), [gradeMap])

  // ห้องในชั้นที่เลือก
  const roomsInGrade = useMemo(() => {
    if (!selectedGrade || !gradeMap[selectedGrade]) return []
    return [...gradeMap[selectedGrade]].sort()
  }, [gradeMap, selectedGrade])

  // นักเรียนในห้องที่เลือก (กรองด้วย searchQuery ด้วย)
  const studentsInRoom = useMemo(() => {
    if (!selectedRoom) return []
    const cleanSearch = searchQuery.trim().toLowerCase()
    return students.filter((s) => {
      const matchRoom = s.room === selectedRoom
      const matchSearch =
        !cleanSearch ||
        s.full_name.toLowerCase().includes(cleanSearch) ||
        (s.student_id && s.student_id.toLowerCase().includes(cleanSearch)) ||
        (s.student_number != null && String(s.student_number).includes(cleanSearch))
      return matchRoom && matchSearch
    }).sort((a, b) => (a.student_number ?? 999) - (b.student_number ?? 999))
  }, [students, selectedRoom, searchQuery])


  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)', color: 'var(--text-brown-light)', fontFamily: 'var(--font-body)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>กำลังเปิดระบบแดชบอร์ดครู... 👩‍🏫</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)', padding: 16 }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'rgba(255, 255, 255, 0.9)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(91,74,63,0.1)' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🚫</div>
          <h2 style={{ fontSize: 20, color: '#c0392b', marginBottom: 8, fontFamily: 'var(--font-display)' }}>ไม่มีสิทธิ์เข้าถึง</h2>
          <p style={{ fontSize: 14, color: 'var(--text-brown-light)', marginBottom: 20 }}>
            หน้านี้สงวนไว้สำหรับครูแนะแนวและบุคลากรของโรงเรียนเท่านั้น
          </p>
          <button
            onClick={() => router.push('/diary')}
            style={{
              padding: '10px 22px',
              borderRadius: 99,
              border: '2px solid var(--text-brown)',
              background: 'var(--accent-peach)',
              color: 'var(--text-brown)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
            }}
          >
            กลับไปหน้าไดอารี่นักเรียน
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg-cream)', fontFamily: 'var(--font-body)' }}>
      {/* Top Navbar */}
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
          flexWrap: 'wrap',
          gap: 8,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: 34, height: 34, flexShrink: 0 }}>
            <rect width="40" height="40" rx="12" fill="#FFC7D1" />
            <path
              d="M20 31.5C20 31.5 8 23.5 8 15.5C8 11.5 11 8.5 15 8.5C17.5 8.5 19.2 9.8 20 11C20.8 9.8 22.5 8.5 25 8.5C29 8.5 32 11.5 32 15.5C32 23.5 20 31.5 20 31.5Z"
              fill="#5B4A3F"
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-brown)' }}>
            Heartful <span style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--text-brown-light)' }}>· ครูแนะแนว</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {teacherProfile && (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
              👤 {teacherProfile.full_name.split(' ')[0]}
            </span>
          )}
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            style={{
              padding: '5px 12px',
              borderRadius: 99,
              border: '1.5px solid var(--card-border)',
              background: '#FFFDF9',
              color: 'var(--text-brown)',
              fontSize: 12.5,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)',
            }}
          >
            {refreshing ? '...' : '↻ รีเฟรช'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '5px 12px',
              borderRadius: 99,
              border: '1.5px solid var(--card-border)',
              background: '#FFFDF9',
              color: 'var(--text-brown-light)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
            }}
          >
            🚪 ออก
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, width: '100%', maxWidth: 780, margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* Date header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-brown)', marginTop: 2 }}>
            แดชบอร์ดติดตามห้องเรียนและนักเรียน 📊
          </h1>
        </div>

        {/* Stat Cards Overview Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { num: rooms.length, label: 'ห้องเรียนทั้งหมด', sub: 'ในระบบ', bg: 'rgba(255, 255, 255, 0.92)', color: 'var(--text-brown)' },
            { num: stats.totalStudents, label: 'นักเรียนในระบบ', sub: 'มีบัญชีแล้ว', bg: '#FFFDF9', color: 'var(--text-brown)' },
            { num: `${stats.entriesCount}/${stats.totalStudents}`, label: 'บันทึกแล้ววันนี้', sub: `${stats.totalStudents > 0 ? Math.round((stats.entriesCount / stats.totalStudents) * 100) : 0}% ของทั้งหมด`, bg: '#FFF0E5', color: '#D96B27' },
            { num: stats.atRiskCount, label: 'ต้องติดตาม ⚠️', sub: 'ไม่บันทึก 3+ วัน', bg: '#FFF0F0', color: '#c0392b' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: s.bg,
                border: '1.5px solid var(--card-border)',
                borderRadius: 20,
                padding: '14px 10px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(91,74,63,0.05)',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>
                {refreshing ? '...' : s.num}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-brown)', marginTop: 2, fontFamily: 'var(--font-display)' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-brown-light)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 20,
            background: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            padding: 4,
          }}
        >
          {(['rooms', 'overview', 'alerts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 12,
                border: 'none',
                background: tab === t ? 'var(--text-brown)' : 'transparent',
                color: tab === t ? '#FFF8EF' : 'var(--text-brown-light)',
                fontSize: 13.5,
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-display)',
                boxShadow: tab === t ? '0 4px 12px rgba(91,74,63,0.2)' : 'none',
              }}
            >
              {t === 'rooms' ? `🏫 รายห้อง & นักเรียน (${rooms.length} ห้อง)` : t === 'overview' ? '📈 สถิติรวม' : `⚠️ แจ้งเตือน (${stats.atRiskCount})`}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: รายห้อง & นักเรียน (ม. → ห้อง) ================= */}
        {tab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.3s ease both' }}>

            {/* Step 1 – เลือกชั้น ม. */}
            <div
              style={{
                background: 'rgba(255,255,255,0.94)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 22,
                padding: '16px 18px',
                boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', marginBottom: 10, fontWeight: 500 }}>
                STEP 1 · เลือกชั้นมัธยม
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sortedGrades.length === 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>ยังไม่มีนักเรียนในระบบ</span>
                ) : (
                  sortedGrades.map((g) => {
                    const isSel = selectedGrade === g
                    const count = students.filter((s) => s.room && getGrade(s.room) === g).length
                    return (
                      <button
                        key={g}
                        onClick={() => {
                          setSelectedGrade(g)
                          setSelectedRoom(null)
                          setSearchQuery('')
                        }}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 14,
                          border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                          background: isSel ? 'var(--text-brown)' : '#FFFDF9',
                          color: isSel ? '#FFF8EF' : 'var(--text-brown)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 15,
                          fontWeight: isSel ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                          boxShadow: isSel ? '0 4px 14px rgba(91,74,63,0.22)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 64,
                        }}
                      >
                        <span>ม.{g}</span>
                        <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>{count} คน</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Step 2 – เลือกห้อง (แสดงเฉพาะเมื่อเลือกชั้นแล้ว) */}
            {selectedGrade && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.94)',
                  border: '1.5px solid var(--card-border)',
                  borderRadius: 22,
                  padding: '16px 18px',
                  boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
                  animation: 'fadeUp 0.25s ease both',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', marginBottom: 10, fontWeight: 500 }}>
                  STEP 2 · เลือกห้องใน ม.{selectedGrade}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {roomsInGrade.map((room) => {
                    const isSel = selectedRoom === room
                    const done = students.filter((s) => s.room === room && s.today_submitted).length
                    const total = students.filter((s) => s.room === room).length
                    return (
                      <button
                        key={room}
                        onClick={() => { setSelectedRoom(room); setSearchQuery('') }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 14,
                          border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                          background: isSel ? 'var(--accent-peach)' : '#FFFDF9',
                          color: 'var(--text-brown)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontWeight: isSel ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                          boxShadow: isSel ? '0 4px 12px rgba(91,74,63,0.15)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 72,
                        }}
                      >
                        <span>ห้อง {room}</span>
                        <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.75 }}>
                          {done}/{total} บันทึกแล้ว
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3 – ตารางนักเรียน (แสดงเฉพาะเมื่อเลือกห้องแล้ว) */}
            {selectedRoom && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1.5px solid var(--card-border)',
                  borderRadius: 22,
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(91,74,63,0.06)',
                  animation: 'fadeUp 0.25s ease both',
                }}
              >
                {/* Table header bar */}
                <div
                  style={{
                    padding: '13px 18px',
                    borderBottom: '1.5px solid var(--card-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    background: 'rgba(239,228,214,0.35)',
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-brown)' }}>
                      ห้อง {selectedRoom}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-brown-light)', marginLeft: 8 }}>
                      นักเรียนในระบบ {studentsInRoom.length} คน
                      {' · '}
                      บันทึกแล้ววันนี้ {studentsInRoom.filter((s) => s.today_submitted).length} คน
                    </span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นชื่อ / รหัสนักเรียน / เลขที่"
                    style={{
                      padding: '7px 13px',
                      borderRadius: 10,
                      border: '1.5px solid var(--card-border)',
                      background: '#FFFDF9',
                      fontSize: 13,
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-brown)',
                      outline: 'none',
                      width: 220,
                    }}
                  />
                </div>

                {/* Spreadsheet-style table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, fontFamily: 'var(--font-body)' }}>
                    <thead>
                      <tr style={{ background: 'rgba(239,228,214,0.55)', borderBottom: '1.5px solid var(--card-border)' }}>
                        {['เลขที่', 'ชื่อ-สกุล', 'รหัสนักเรียน', 'สถานะวันนี้', 'Streak', 'แจ้งเตือน'].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              padding: '10px 14px',
                              textAlign: i === 0 ? 'center' : 'left',
                              fontFamily: 'var(--font-display)',
                              fontWeight: 600,
                              fontSize: 12,
                              color: 'var(--text-brown-light)',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studentsInRoom.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-brown-light)', fontSize: 13 }}>
                            ไม่พบนักเรียนตามเงื่อนไขที่ค้นหา
                          </td>
                        </tr>
                      ) : (
                        studentsInRoom.map((st, idx) => {
                          const isAlert = st.need_counselor
                          const rowBg = isAlert
                            ? '#FFF5F5'
                            : idx % 2 === 0
                            ? 'rgba(255,255,255,0.95)'
                            : 'rgba(255,253,249,0.8)'
                          return (
                            <tr
                              key={st.id}
                              style={{
                                background: rowBg,
                                borderBottom: '1px solid rgba(200,186,168,0.3)',
                                transition: 'background 0.15s',
                              }}
                            >
                              {/* เลขที่ */}
                              <td style={{ padding: '11px 14px', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-brown)', fontSize: 14 }}>
                                {st.student_number ?? '—'}
                              </td>
                              {/* ชื่อ */}
                              <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-brown)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.full_name}
                              </td>
                              {/* รหัส */}
                              <td style={{ padding: '11px 14px', color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)', fontSize: 12.5 }}>
                                {st.student_id ?? '—'}
                              </td>
                              {/* สถานะวันนี้ */}
                              <td style={{ padding: '11px 14px' }}>
                                {st.today_submitted ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      background: 'rgba(198,217,190,0.45)',
                                      border: '1px solid var(--accent-sage-deep)',
                                      color: '#2d7a4f',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      fontFamily: 'var(--font-display)',
                                      padding: '3px 10px',
                                      borderRadius: 99,
                                    }}
                                  >
                                    {st.today_mood && (
                                      <Image src={`/moodpics/${st.today_mood}.svg`} alt={st.today_mood} width={14} height={14} unoptimized />
                                    )}
                                    บันทึกแล้ว
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      background: '#F5F5F5',
                                      border: '1px solid #DDD',
                                      color: '#999',
                                      fontSize: 12,
                                      padding: '3px 10px',
                                      borderRadius: 99,
                                      fontFamily: 'var(--font-display)',
                                    }}
                                  >
                                    ยังไม่บันทึก
                                  </span>
                                )}
                              </td>
                              {/* Streak */}
                              <td style={{ padding: '11px 14px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 13 }}>
                                <span style={{ color: st.streak > 0 ? '#D96B27' : 'var(--text-brown-light)', fontWeight: st.streak > 0 ? 700 : 400 }}>
                                  {st.streak > 0 ? `🔥 ${st.streak}` : '—'}
                                </span>
                              </td>
                              {/* แจ้งเตือน */}
                              <td style={{ padding: '11px 14px' }}>
                                {st.need_counselor ? (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      background: '#FFE5E5',
                                      border: '1px solid #FF9AA2',
                                      color: '#c0392b',
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      fontFamily: 'var(--font-display)',
                                      padding: '3px 10px',
                                      borderRadius: 99,
                                    }}
                                  >
                                    🚨 ขอคุย
                                  </span>
                                ) : (
                                  <span style={{ color: '#CCC', fontSize: 13 }}>—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Placeholder when nothing selected yet */}
            {!selectedGrade && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1.5px dashed var(--card-border)',
                  borderRadius: 22,
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: 'var(--text-brown-light)',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-brown)' }}>
                  เลือกชั้นมัธยมเพื่อเริ่มดูรายชื่อนักเรียน
                </p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  ข้อมูลจะแสดงเป็นตารางรายชื่อสำหรับห้องที่เลือก
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ภาพรวมสถิติพฤติกรรม 7 วัน ================= */}
        {tab === 'overview' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.92)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 20, animation: 'fadeUp 0.3s ease both', boxShadow: '0 4px 14px rgba(91,74,63,0.05)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>
              📈 สถิติพฤติกรรมสุขภาพกาย-ใจ 7 วันย้อนหลัง
            </h3>
            {behaviors.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-brown-light)', textAlign: 'center', padding: '24px 0' }}>
                ยังไม่มีข้อมูลบันทึกในรอบ 7 วันที่ผ่านมา
              </p>
            ) : (
              behaviors.map((b, i) => (
                <div key={i} className="behavior-item" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-brown)' }}>{b.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>{b.pct}%</span>
                  </div>
                  <div style={{ background: '#EFE4D6', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', borderRadius: 99, background: 'var(--text-brown)', transition: 'width 0.6s' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 3: แจ้งเตือนกลุ่มเสี่ยง ================= */}
        {tab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.3s ease both' }}>
            <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginBottom: 4 }}>
              นักเรียนที่ไม่บันทึกไดอารี่ 3 วันขึ้นไป (Real-time Detection)
            </p>
            {alerts.length === 0 ? (
              <div style={{ background: 'rgba(255, 255, 255, 0.92)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 36, textAlign: 'center', color: 'var(--text-brown-light)' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
                <h4 style={{ fontSize: 16, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>ไม่มีนักเรียนกลุ่มเสี่ยงในขณะนี้</h4>
                <p style={{ fontSize: 13, marginTop: 4 }}>ทุกคนบันทึกและดูแลสุขภาพใจอย่างสม่ำเสมอ</p>
              </div>
            ) : (
              alerts.map((a, i) => {
                const days = a.days_since_last_entry ?? 0
                const isUrgent = days >= 5
                return (
                  <div
                    key={i}
                    style={{
                      background: isUrgent ? '#FFF5F5' : 'rgba(255, 255, 255, 0.92)',
                      border: `1.5px solid ${isUrgent ? '#FFB5B5' : 'var(--card-border)'}`,
                      borderRadius: 18,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{isUrgent ? '😶' : '📉'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                        {a.full_name} {a.student_id ? `(${a.student_id})` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-brown-light)', marginTop: 2 }}>
                        ห้อง {a.room} {a.student_number ? `· เลขที่ ${a.student_number}` : ''} · {a.last_diary_date ? `ไม่บันทึก ${days} วัน` : 'ยังไม่เคยบันทึก'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        color: isUrgent ? '#c0392b' : '#D96B27',
                        background: isUrgent ? '#FFE5E5' : '#FFF0E5',
                        padding: '4px 12px',
                        borderRadius: 99,
                      }}
                    >
                      {isUrgent ? 'ติดต่อด่วน' : 'ติดตาม'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}