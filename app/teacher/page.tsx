// app/teacher/page.tsx - Teacher Dashboard (Warm Pastel Design System 100% ตาม Prototype)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getRoomSummaryToday, getAtRiskStudents, getBehaviorStats, getDailyStats } from '../../lib/supabase-teacher'
import type { RoomSummary, AtRiskStudent, BehaviorStats, DailyStats, Profile } from '../../types/database'

export default function TeacherDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'rooms' | 'alerts'>('overview')
  const [stats, setStats] = useState<DailyStats>({ totalStudents: 0, entriesCount: 0, completeCount: 0, atRiskCount: 0 })
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [alerts, setAlerts] = useState<AtRiskStudent[]>([])
  const [behaviors, setBehaviors] = useState<BehaviorStats[]>([])
  const [teacherProfile, setTeacherProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const loadDashboardData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [s, r, a, b] = await Promise.all([
        getDailyStats(),
        getRoomSummaryToday(),
        getAtRiskStudents(),
        getBehaviorStats(),
      ])
      setStats(s)
      setRooms(r)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: 32, height: 32 }}>
            <rect width="40" height="40" rx="10" fill="#FFC7D1" />
            <path
              d="M20 31.5C20 31.5 8 23.5 8 15.5C8 11.5 11 8.5 15 8.5C17.5 8.5 19.2 9.8 20 11C20.8 9.8 22.5 8.5 25 8.5C29 8.5 32 11.5 32 15.5C32 23.5 20 31.5 20 31.5Z"
              fill="#5B4A3F"
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-brown)' }}>
            Heartful <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-brown-light)' }}>· ครูแนะแนว</span>
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
      <main style={{ flex: 1, width: '100%', maxWidth: 760, margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* Date header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-brown)', marginTop: 2 }}>
            แดชบอร์ดติดตามสุขภาพใจนักเรียน 📊
          </h1>
        </div>

        {/* Stat Cards (Responsive Grid) */}
        <div className="teacher-stats-grid">
          {[
            { num: stats.entriesCount, label: 'บันทึกแล้ววันนี้', sub: `จาก ${stats.totalStudents} คน`, bg: '#FFF0E5', color: '#D96B27' },
            { num: stats.completeCount, label: 'หัวใจเต็มดวง ❤️', sub: 'mission complete', bg: '#FFFDF9', color: 'var(--text-brown)' },
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
                boxShadow: '0 4px 12px rgba(91,74,63,0.06)',
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>
                {refreshing ? '...' : s.num}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-brown)', marginTop: 2, fontFamily: 'var(--font-display)' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-brown-light)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
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
          {(['overview', 'rooms', 'alerts'] as const).map((t) => (
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
              {t === 'overview' ? 'ภาพรวม' : t === 'rooms' ? 'รายห้อง' : `แจ้งเตือน${stats.atRiskCount > 0 ? ` (${stats.atRiskCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 18, animation: 'fadeUp 0.3s ease both' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>
              📈 สถิติพฤติกรรมสุขภาพกาย-ใจ 7 วันย้อนหลัง
            </h3>
            {behaviors.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-brown-light)', textAlign: 'center', padding: '24px 0' }}>
                ยังไม่มีข้อมูลบันทึกในรอบ 7 วันที่ผ่านมา
              </p>
            ) : (
              behaviors.map((b, i) => (
                <div key={i} className="behavior-item">
                  <span className="behavior-label">
                    {b.label}
                  </span>
                  <div style={{ flex: 1, background: '#EFE4D6', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', borderRadius: 99, background: 'var(--text-brown)', transition: 'width 0.6s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-brown)', width: 40, textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                    {b.pct}%
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Rooms */}
        {tab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.3s ease both' }}>
            {rooms.length === 0 ? (
              <div style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 32, textAlign: 'center', color: 'var(--text-brown-light)' }}>
                ยังไม่มีข้อมูลห้องเรียนในระบบ
              </div>
            ) : (
              rooms.map((r) => {
                const donePct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0
                return (
                  <div
                    key={r.name}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 18,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, width: 70, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                      ห้อง {r.name}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: '#EFE4D6', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${donePct}%`,
                            height: '100%',
                            borderRadius: 99,
                            background: donePct >= 80 ? 'var(--accent-sage-deep)' : donePct >= 50 ? 'var(--accent-peach-deep)' : '#FFB5B5',
                            transition: 'width 0.6s',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: 'var(--text-brown-light)' }}>
                        <span>{r.done}/{r.total} บันทึกแล้ว</span>
                        <span style={{ color: '#D96B27' }}>❤ {r.complete} complete</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)', minWidth: 44, textAlign: 'right' }}>
                      {donePct}%
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab 3: Alerts */}
        {tab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.3s ease both' }}>
            <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginBottom: 4 }}>
              นักเรียนที่ไม่บันทึกไดอารี่ 3 วันขึ้นไป (Real-time Detection)
            </p>
            {alerts.length === 0 ? (
              <div style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1.5px solid var(--card-border)', borderRadius: 24, padding: 36, textAlign: 'center', color: 'var(--text-brown-light)' }}>
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
                      background: isUrgent ? '#FFF5F5' : 'rgba(255, 255, 255, 0.9)',
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