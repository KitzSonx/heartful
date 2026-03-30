'use client'
import { useState } from 'react'

const rooms = [
  { name: 'ม.4/1', done: 37, total: 40, complete: 30, alert: 0 },
  { name: 'ม.4/2', done: 34, total: 40, complete: 28, alert: 1 },
  { name: 'ม.4/3', done: 32, total: 40, complete: 20, alert: 2 },
  { name: 'ม.5/1', done: 38, total: 40, complete: 35, alert: 0 },
  { name: 'ม.5/2', done: 24, total: 40, complete: 15, alert: 4 },
  { name: 'ม.5/3', done: 18, total: 40, complete: 10, alert: 6 },
  { name: 'ม.6/1', done: 36, total: 40, complete: 31, alert: 0 },
  { name: 'ม.6/2', done: 22, total: 40, complete: 12, alert: 5 },
]

const alerts = [
  { name: 'สมชาย ใจดี',    room: 'ม.5/3', days: 5, type: 'miss',  color: '#f87171' },
  { name: 'มานี มีสุข',    room: 'ม.6/2', days: 3, type: 'low',   color: '#fb923c' },
  { name: 'วิชัย รักดี',   room: 'ม.5/2', days: 4, type: 'miss',  color: '#f87171' },
  { name: 'สุดา แสนดี',   room: 'ม.4/3', days: 2, type: 'low',   color: '#facc15' },
]

const behaviors = [
  { label: 'ดื่มน้ำเพียงพอ',       pct: 88, color: '#99f6e4' },
  { label: 'กินผักผลไม้',          pct: 74, color: '#86efac' },
  { label: 'ขอบคุณ 3 อย่าง',      pct: 61, color: '#c4b5fd' },
  { label: 'ลดหวาน มัน เค็ม',     pct: 55, color: '#f9a8d4' },
  { label: 'ออกกำลังกาย 6,000+ ก้าว', pct: 42, color: '#fb923c' },
]

export default function TeacherDashboard() {
  const [tab, setTab] = useState<'overview' | 'rooms' | 'alerts'>('overview')

  const totalDone = rooms.reduce((a, r) => a + r.done, 0)
  const totalComplete = rooms.reduce((a, r) => a + r.complete, 0)
  const totalAlert = rooms.reduce((a, r) => a + r.alert, 0)
  const totalStudents = rooms.reduce((a, r) => a + r.total, 0)

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: '24px 16px 48px',
      fontFamily: 'var(--font-body)',
      animation: 'fadeUp 0.5s ease both',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 4 }}>
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400 }}>
          Dashboard <span className="grad-text">ครูแนะแนว</span>
        </h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { num: totalDone,     label: 'บันทึกแล้ววันนี้', sub: `จาก ${totalStudents} คน`, color: '#99f6e4' },
          { num: totalComplete, label: 'หัวใจเต็ม ❤',       sub: 'mission complete',      color: '#f9a8d4' },
          { num: totalAlert,    label: 'ต้องดูแล ⚠',        sub: 'กลุ่มเสี่ยง',            color: '#f87171' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{s.num}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: 4,
      }}>
        {(['overview', 'rooms', 'alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 8px', borderRadius: 9,
            border: 'none',
            background: tab === t ? 'rgba(167,139,250,0.18)' : 'transparent',
            color: tab === t ? 'var(--purple-soft)' : 'var(--text-hint)',
            fontSize: 13, fontWeight: tab === t ? 500 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: 'var(--font-body)',
          }}>
            {t === 'overview' ? 'ภาพรวม' : t === 'rooms' ? 'รายห้อง' : `แจ้งเตือน (${totalAlert})`}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="glass" style={{ padding: '20px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: 'var(--text-secondary)' }}>
              📊 พฤติกรรมยอดนิยมวันนี้
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {behaviors.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 160, flexShrink: 0 }}>{b.label}</span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 7 }}>
                    <div style={{
                      width: `${b.pct}%`, height: 7,
                      borderRadius: 99, background: b.color,
                      boxShadow: `0 0 8px ${b.color}60`,
                      transition: 'width 0.8s cubic-bezier(.34,1.56,.64,1)',
                    }}/>
                  </div>
                  <span style={{ fontSize: 11, color: b.color, width: 34, textAlign: 'right', fontWeight: 500 }}>{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Avg sleep */}
          <div className="glass" style={{ padding: '18px 20px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--text-secondary)' }}>🌙 การนอนหลับเฉลี่ย</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-around', textAlign: 'center' }}>
              {[
                { label: 'น้อยกว่า 4 ชม.', pct: 12, color: '#f87171' },
                { label: '4–6 ชม.',        pct: 28, color: '#fb923c' },
                { label: '6–7 ชม.',        pct: 38, color: '#86efac' },
                { label: '7–8 ชม.',        pct: 22, color: '#99f6e4' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: s.color }}>{s.pct}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rooms tab */}
      {tab === 'rooms' && (
        <div style={{ animation: 'fadeUp 0.3s ease both', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rooms.map(r => {
            const donePct = Math.round((r.done / r.total) * 100)
            return (
              <div key={r.name} className="glass" style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, width: 56, color: 'var(--text-primary)' }}>{r.name}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 8 }}>
                    <div style={{
                      width: `${donePct}%`, height: 8, borderRadius: 99,
                      background: donePct >= 80 ? 'linear-gradient(to right, #c4b5fd, #f9a8d4)'
                                 : donePct >= 60 ? '#c4b5fd'
                                 : '#fb923c',
                      transition: 'width 0.6s',
                    }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text-hint)' }}>
                    <span>{r.done}/{r.total} บันทึก</span>
                    <span style={{ color: '#f9a8d4' }}>❤ {r.complete} complete</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 48, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: donePct >= 80 ? '#99f6e4' : '#f87171' }}>
                    {donePct}%
                  </span>
                  {r.alert > 0 && (
                    <span style={{
                      background: '#f87171', color: 'white',
                      borderRadius: 99, fontSize: 10, fontWeight: 500,
                      padding: '2px 6px',
                    }}>
                      ⚠{r.alert}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div style={{ animation: 'fadeUp 0.3s ease both', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            นักเรียนที่ไม่บันทึก 3 วันขึ้นไป หรือคะแนนต่ำกว่า 30%
          </p>
          {alerts.map((a, i) => (
            <div key={i} className="glass" style={{
              padding: '14px 16px',
              borderLeft: `3px solid ${a.color}`,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 99,
                background: a.color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {a.type === 'miss' ? '😶' : '📉'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{a.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {a.room} · {a.type === 'miss' ? `ไม่บันทึก ${a.days} วัน` : `คะแนนต่ำ ${a.days} วันติด`}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: a.color,
                background: a.color + '18',
                padding: '4px 10px', borderRadius: 99,
              }}>
                {a.type === 'miss' ? 'ติดต่อด่วน' : 'ติดตาม'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}