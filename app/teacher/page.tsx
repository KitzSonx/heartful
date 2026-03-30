'use client'
import { useState, useEffect } from 'react'
import { getRoomSummaryToday, getAtRiskStudents, getBehaviorStats, getDailyStats } from '../../lib/supabase-teacher'

const TEACHER_PASSWORD = '1234'

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (pw === TEACHER_PASSWORD) {
      onAuth()
    } else {
      setError('รหัสผ่านไม่ถูกต้อง')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPw('')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '0 auto', padding: '80px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', animation: 'fadeUp 0.5s ease both' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, marginBottom: 8 }}>
        <span className="grad-text">Teacher Dashboard</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>กรุณากรอกรหัสผ่านสำหรับครู</p>

      <div style={{ animation: shake ? 'shakeX 0.4s ease' : 'none' }}>
        <input
          type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="รหัสผ่าน"
          style={{
            width: '100%', padding: '14px', borderRadius: 12, marginBottom: 12,
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}`,
            fontSize: 18, textAlign: 'center', letterSpacing: '0.3em',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none',
          }}
        />
        {error && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{error}</p>}
        <button onClick={submit} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          color: 'white', fontSize: 15, fontWeight: 500,
          fontFamily: 'var(--font-body)', cursor: 'pointer',
        }}>
          เข้าสู่ระบบ
        </button>
      </div>
      <style>{`@keyframes shakeX { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
    </div>
  )
}

export default function TeacherDashboard() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'overview' | 'rooms' | 'alerts'>('overview')
  const [stats, setStats] = useState({ totalStudents: 0, entriesCount: 0, completeCount: 0, atRiskCount: 0 })
  const [rooms, setRooms] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [behaviors, setBehaviors] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('teacher_auth') === '1') {
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed) loadAll()
  }, [authed])

  async function loadAll() {
    setLoadingData(true)
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
    } catch (e) { console.error(e) }
    setLoadingData(false)
  }

  const handleAuth = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('teacher_auth', '1')
    setAuthed(true)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('teacher_auth')
    setAuthed(false)
  }

  if (!authed) return <PasswordGate onAuth={handleAuth} />

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px 48px', fontFamily: 'var(--font-body)', animation: 'fadeUp 0.5s ease both' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400 }}>
            Dashboard <span className="grad-text">ครูแนะแนว</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAll} disabled={loadingData} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            {loadingData ? 'กำลังโหลด...' : '↻ รีเฟรช'}
          </button>
          <button onClick={handleLogout} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { num: stats.entriesCount,  label: 'บันทึกแล้ววันนี้', sub: `จาก ${stats.totalStudents} คน`, color: '#99f6e4' },
          { num: stats.completeCount, label: 'หัวใจเต็ม ❤',      sub: 'mission complete',             color: '#f9a8d4' },
          { num: stats.atRiskCount,   label: 'ต้องดูแล ⚠',       sub: 'ไม่บันทึก 3+ วัน',             color: '#f87171' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{loadingData ? '...' : s.num}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4 }}>
        {(['overview', 'rooms', 'alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none',
            background: tab === t ? 'rgba(167,139,250,0.18)' : 'transparent',
            color: tab === t ? 'var(--purple-soft)' : 'var(--text-hint)',
            fontSize: 13, fontWeight: tab === t ? 500 : 400,
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
          }}>
            {t === 'overview' ? 'ภาพรวม' : t === 'rooms' ? 'รายห้อง' : `แจ้งเตือน${stats.atRiskCount > 0 ? ` (${stats.atRiskCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="glass" style={{ padding: '18px', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--text-secondary)' }}>📊 พฤติกรรมยอดนิยม (7 วันที่ผ่านมา)</p>
            {loadingData ? (
              <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center' }}>กำลังโหลด...</p>
            ) : behaviors.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center' }}>ยังไม่มีข้อมูล</p>
            ) : behaviors.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 170, flexShrink: 0 }}>{b.label}</span>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 7 }}>
                  <div style={{ width: `${b.pct}%`, height: 7, borderRadius: 99, background: b.color, transition: 'width 0.8s' }} />
                </div>
                <span style={{ fontSize: 11, color: b.color, width: 34, textAlign: 'right', fontWeight: 500 }}>{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rooms */}
      {tab === 'rooms' && (
        <div style={{ animation: 'fadeUp 0.3s ease both', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loadingData ? (
            <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center', padding: '20px 0' }}>กำลังโหลด...</p>
          ) : rooms.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center', padding: '20px 0' }}>ยังไม่มีข้อมูลห้อง</p>
          ) : rooms.map(r => {
            const donePct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0
            return (
              <div key={r.name} className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500, width: 60, color: 'var(--text-primary)' }}>{r.name}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 8 }}>
                    <div style={{ width: `${donePct}%`, height: 8, borderRadius: 99, background: donePct >= 80 ? 'linear-gradient(to right, #c4b5fd, #f9a8d4)' : donePct >= 60 ? '#c4b5fd' : '#fb923c', transition: 'width 0.6s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-hint)' }}>
                    <span>{r.done}/{r.total} บันทึก</span>
                    <span style={{ color: '#f9a8d4' }}>❤ {r.complete} complete</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 48, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: donePct >= 80 ? '#99f6e4' : '#f87171' }}>{donePct}%</span>
                  {donePct < 60 && <span style={{ background: '#f87171', color: 'white', borderRadius: 99, fontSize: 9, fontWeight: 500, padding: '2px 6px' }}>⚠</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Alerts */}
      {tab === 'alerts' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>นักเรียนที่ไม่บันทึก 3 วันขึ้นไป</p>
          {loadingData ? (
            <p style={{ fontSize: 13, color: 'var(--text-hint)', textAlign: 'center', padding: '20px 0' }}>กำลังโหลด...</p>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-hint)', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              ไม่มีนักเรียนกลุ่มเสี่ยงในขณะนี้
            </div>
          ) : alerts.map((a, i) => {
            const days = a.days_since_last_entry ?? 0
            const isUrgent = days >= 5
            const color = isUrgent ? '#f87171' : days >= 3 ? '#fb923c' : '#facc15'
            return (
              <div key={i} className="glass" style={{ padding: '12px 16px', marginBottom: 8, borderLeft: `3px solid ${color}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 99, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {isUrgent ? '😶' : '📉'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{a.full_name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {a.room}{a.student_number ? ` · เลขที่ ${a.student_number}` : ''} · {a.last_diary_date ? `ไม่บันทึก ${days} วัน` : 'ยังไม่เคยบันทึก'}
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color, background: color + '18', padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                  {isUrgent ? 'ติดต่อด่วน' : 'ติดตาม'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}