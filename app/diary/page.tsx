'use client'
import { useState, useMemo } from 'react'
import Mascot from '../../components/ui/Mascot'
import HeartMeter from '../../components/ui/HeartMeter'
import CheckItem from '../../components/diary/CheckItem'
import SleepSlider from '../../components/diary/SleepSlider'
import StepsPicker from '../../components/diary/StepsPicker'
import SectionHeader from '../../components/diary/SectionHeader'

const MAX_PTS = 26

export default function DiaryPage() {
  const [pts, setPts] = useState(0)
  const [breakdown, setBreakdown] = useState({ body: 0, mind: 0, social: 0 })
  const [gratitude, setGratitude] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const addPts = (cat: keyof typeof breakdown, delta: number) => {
    setPts(p => Math.min(MAX_PTS, Math.max(0, p + delta)))
    setBreakdown(b => ({ ...b, [cat]: Math.max(0, b[cat] + delta) }))
  }

  const pct = Math.round((pts / MAX_PTS) * 100)

  const mascotMood = pct === 0 ? 'sad' : pct < 40 ? 'neutral' : pct < 80 ? 'good' : 'great'

  const gratitudePts = useMemo(() => {
    const lines = gratitude.split('\n').filter(l => l.trim().length > 3)
    return gratitude.trim().length > 15 ? 3 : 0
  }, [gratitude])

  const isComplete = pct >= 100

  if (submitted) return <MissionComplete pts={pts} />

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: '24px 16px 40px',
      fontFamily: 'var(--font-body)',
      animation: 'fadeUp 0.5s ease both',
    }}>

      {/* Top greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 3 }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, lineHeight: 1.2 }}>
            สวัสดี, <span className="grad-text">ณัฐ</span> 👋
          </h1>
        </div>
        <div style={{
          padding: '6px 12px',
          borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 13,
          color: 'var(--purple-soft)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔥 <strong>5</strong> วัน
        </div>
      </div>

      {/* Heart + Mascot row */}
      <div className="glass" style={{
        padding: '28px 24px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 30% 50%, rgba(167,139,250,0.08) 0%, transparent 60%),
                        radial-gradient(circle at 70% 50%, rgba(236,72,153,0.06) 0%, transparent 60%)`,
        }}/>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Mascot mood={mascotMood} size={110} pct={pct} />
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>
            {pct === 0 ? 'เริ่มวันใหม่กันเลย!' :
             pct < 40 ? 'เริ่มได้แล้ว ไปต่อนะ' :
             pct < 80 ? 'ดีมาก! ใกล้แล้ว 💜' :
             'เยี่ยมมาก! เกือบถึงแล้ว!'}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <HeartMeter pct={pct} pts={pts} maxPts={MAX_PTS} size={130} />
        </div>
      </div>

      {/* ===== BODY SECTION ===== */}
      <div className="glass" style={{ padding: '20px', marginBottom: 14 }}>
        <SectionHeader
          category="body"
          title="ร่างกาย (Physical)"
          pts={breakdown.body}
          maxPts={13}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Sleep */}
          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>
              🌙 นอนหลับกี่ชั่วโมง?
            </p>
            <SleepSlider onChange={(p) => addPts('body', p)} />
          </div>

          {/* Steps */}
          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>
              🚶 จำนวนก้าวเดินวันนี้
            </p>
            <StepsPicker onChange={(p) => addPts('body', p)} />
          </div>

          <CheckItem label="กินผักผลไม้วันนี้" pts={2} category="body" onChange={(c) => addPts('body', c ? 2 : -2)} />
          <CheckItem label="ลดหวาน มัน เค็ม" pts={2} category="body" onChange={(c) => addPts('body', c ? 2 : -2)} />
          <CheckItem label="ดื่มน้ำ 6–8 แก้ว" pts={1} category="body" onChange={(c) => addPts('body', c ? 1 : -1)} />
        </div>
      </div>

      {/* ===== MIND SECTION ===== */}
      <div className="glass" style={{ padding: '20px', marginBottom: 14 }}>
        <SectionHeader
          category="mind"
          title="จิตใจ (Mental)"
          pts={breakdown.mind}
          maxPts={7}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CheckItem label="สังเกตและยอมรับอารมณ์ตัวเอง" pts={2} category="mind" onChange={(c) => addPts('mind', c ? 2 : -2)} />
          <CheckItem label="จำกัดเวลาเสพโซเชียลมีเดีย" pts={1} category="mind" onChange={(c) => addPts('mind', c ? 1 : -1)} />
          <CheckItem label="ทำสมาธิหรือหายใจลึกๆ" pts={1} category="mind" onChange={(c) => addPts('mind', c ? 1 : -1)} />

          {/* Gratitude */}
          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                🙏 ขอบคุณ 3 อย่างวันนี้
              </p>
              <span style={{
                fontSize: 11, color: gratitudePts > 0 ? 'var(--purple-soft)' : 'var(--text-hint)',
                background: gratitudePts > 0 ? 'rgba(196,181,253,0.15)' : 'rgba(255,255,255,0.05)',
                padding: '2px 8px', borderRadius: 99, fontWeight: 500,
              }}>
                +{gratitudePts}/3 pt
              </span>
            </div>
            <textarea
              value={gratitude}
              onChange={(e) => {
                setGratitude(e.target.value)
                const newPts = e.target.value.trim().length > 15 ? 3 : 0
                const oldPts = gratitudePts
                if (newPts !== oldPts) addPts('mind', newPts - oldPts)
              }}
              placeholder="วันนี้ขอบคุณ...&#10;1. ขอบคุณที่มีวันใหม่&#10;2. ขอบคุณที่มีเพื่อนดี&#10;3. ขอบคุณตัวเองที่พยายาม"
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.7,
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== SOCIAL SECTION ===== */}
      <div className="glass" style={{ padding: '20px', marginBottom: 24 }}>
        <SectionHeader
          category="social"
          title="สังคม (Social)"
          pts={breakdown.social}
          maxPts={6}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CheckItem label="ใช้เวลากับคนที่รักวันนี้" pts={2} category="social" onChange={(c) => addPts('social', c ? 2 : -2)} />
          <CheckItem label="ทำดีหรือช่วยเหลือคนอื่น" pts={2} category="social" onChange={(c) => addPts('social', c ? 2 : -2)} />
          <CheckItem label="จัดระเบียบห้อง/โต๊ะเรียน" pts={1} category="social" onChange={(c) => addPts('social', c ? 1 : -1)} />
          <CheckItem label="กล้าพูดหรือแสดงความคิดเห็น" pts={1} category="social" onChange={(c) => addPts('social', c ? 1 : -1)} />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={() => setSubmitted(true)}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          background: isComplete
            ? 'linear-gradient(135deg, #f472b6, #a78bfa)'
            : pts > 0
            ? 'linear-gradient(135deg, rgba(167,139,250,0.8), rgba(236,72,153,0.6))'
            : 'rgba(255,255,255,0.08)',
          color: 'white',
          fontSize: 15,
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          boxShadow: isComplete ? '0 8px 32px rgba(244,114,182,0.4)' : 'none',
          transition: 'all 0.3s',
          letterSpacing: '0.01em',
        }}
      >
        {isComplete ? '❤️ บันทึกและรับ Mission Complete!' : pts > 0 ? `บันทึกวันนี้ (${pts}/${MAX_PTS} pt)` : 'กรอกข้อมูลแล้วบันทึก'}
      </button>
    </div>
  )
}

function MissionComplete({ pts }: { pts: number }) {
  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: '48px 24px',
      textAlign: 'center',
      animation: 'fadeUp 0.6s ease both',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ marginBottom: 24 }}>
        <Mascot mood="great" size={160} />
      </div>

      <div style={{ fontSize: 48, marginBottom: 8 }}>❤️</div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 32, fontWeight: 400,
        marginBottom: 8,
      }}>
        <span className="grad-text">รักตัวเองสำเร็จ!</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32 }}>
        หัวใจเต็มดวงแล้ววันนี้ 🎉
      </p>

      <div className="glass" style={{ padding: '24px', marginBottom: 16, textAlign: 'left' }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: 'var(--text-secondary)' }}>สรุปวันนี้</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'กาย', emoji: '💪', color: '#99f6e4' },
            { label: 'ใจ', emoji: '🧘', color: '#c4b5fd' },
            { label: 'สังคม', emoji: '🤝', color: '#f9a8d4' },
          ].map(c => (
            <div key={c.label} style={{
              flex: 1, textAlign: 'center', padding: '14px 8px',
              borderRadius: 14, background: c.color + '12',
              border: `1px solid ${c.color}25`,
            }}>
              <div style={{ fontSize: 24 }}>{c.emoji}</div>
              <div style={{ fontSize: 12, color: c.color, fontWeight: 500, marginTop: 6 }}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 500, color: 'var(--purple-soft)' }}>⭐ {pts}</span>
          <span style={{ fontSize: 14, color: 'var(--text-hint)' }}> / 26 คะแนน</span>
        </div>
      </div>

      {/* Streak */}
      <div className="glass" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--text-secondary)' }}>🔥 ทำต่อเนื่อง 5 วันแล้ว!</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {['จ','อ','พ','พฤ','ศ','ส','อา'].map((d, i) => (
            <div key={d} style={{
              width: 36, height: 36, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500,
              background: i < 5 ? 'rgba(167,139,250,0.25)' : i === 6 ? 'rgba(153,246,228,0.15)' : 'rgba(255,255,255,0.05)',
              color: i < 5 ? 'var(--purple-soft)' : i === 6 ? 'var(--teal-soft)' : 'var(--text-hint)',
              border: i === 6 ? '1.5px solid rgba(153,246,228,0.35)' : '1px solid transparent',
            }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-hint)', marginTop: 8 }}>
        ทำพรุ่งนี้ต่อเพื่อรักษา streak ไว้นะ 💜
      </p>
    </div>
  )
}