'use client'
import { useEffect, useState, useRef } from 'react'
import type { CachedProfile } from '../../lib/localStorage'

interface StreakResultProps {
  pts: number
  maxPts: number
  profile: CachedProfile
  streak: number
  weekDays: { date: string; entry: any }[]
  isComplete: boolean
}

// Particle สำหรับหัวใจและดาว
function Particle({ delay, x }: { delay: number; x: number }) {
  const emojis = ['❤️', '💜', '✨', '🌟', '💫']
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  return (
    <span style={{
      position: 'absolute',
      left: `${x}%`,
      bottom: '-10%',
      fontSize: Math.random() * 16 + 12,
      animation: `floatUp ${Math.random() * 2 + 2.5}s ease-out forwards`,
      animationDelay: `${delay}s`,
      opacity: 0,
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {emoji}
    </span>
  )
}

// คอมโพเนนต์สะเก็ดไฟ (Sparks) ที่ลอยขึ้นจากกองไฟ
function Spark({ delay, left, size, duration }: { delay: number; left: number; size: number; duration: number }) {
  return (
    <div
      className="spark"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

export default function StreakResult({ pts, maxPts, profile, streak, weekDays, isComplete }: StreakResultProps) {
  const pct = Math.round((pts / maxPts) * 100)
  const [phase, setPhase] = useState(0)
  const [heartFill, setHeartFill] = useState(0)
  const [showParticles, setShowParticles] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [isIgniting, setIsIgniting] = useState(false) // State สำหรับจังหวะจุดระเบิด
  const cardRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)
  const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

  // สร้าง Config สำหรับสะเก็ดไฟล่วงหน้า
  const sparksConfig = useRef(Array.from({ length: 15 }, () => ({
    left: Math.random() * 100,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 1.5 + 1
  }))).current

  const particles = Array.from({ length: 18 }, (_, i) => ({
    delay: i * 0.12,
    x: Math.random() * 90 + 5,
  }))

  useEffect(() => {
    // phase 1: fade in ชื่อ
    const t1 = setTimeout(() => setPhase(1), 300)
    
    // phase 2: 🔥 จุดระเบิดไฟ STREAK!
    const t2 = setTimeout(() => {
      setPhase(2)
      setIsIgniting(true)
      // ปิดเอฟเฟกต์ระเบิดเบื้องต้นหลังผ่านไป 0.8 วิ ให้เหลือแค่ไฟลุกปกติ
      setTimeout(() => setIsIgniting(false), 800)
    }, 900)

    // phase 3: หัวใจเติม
    const t3 = setTimeout(() => { setPhase(3); animateHeart() }, 2000)
    // phase 4: week dots
    const t4 = setTimeout(() => setPhase(4), 2800)
    
    if (isComplete) setTimeout(() => setShowParticles(true), 2400)
    setTimeout(() => setShowShare(true), 3600)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [isComplete])

  function animateHeart() {
    let start = 0
    const target = pct
    const duration = 1200
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setHeartFill(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const handleShare = async () => {
    const text = `💜 วันนี้ฉันดูแลตัวเองได้ ${pts}/${maxPts} คะแนน\n🔥 ทำต่อเนื่อง ${streak} วันแล้ว!\n${isComplete ? '❤️ หัวใจเต็มดวง Mission Complete!' : `หัวใจ ${pct}%`}\n\n#Heartful #รักตัวเอง`
    if (navigator.share) {
      await navigator.share({ title: 'Heartful — รักตัวเองวันนี้', text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('คัดลอกข้อความแล้ว! เอาไปแปะได้เลย 💜')
    }
  }

  const heartPath = "M50 82 C50 82 10 55 10 28 C10 14 20 6 32 6 C39 6 45 10 50 16 C55 10 61 6 68 6 C80 6 90 14 90 28 C90 55 50 82 50 82Z"
  const fillY = 90 - (heartFill / 100) * 84

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px 40px', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)',
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: isComplete
          ? 'radial-gradient(ellipse at 50% 40%, rgba(244,114,182,0.18) 0%, transparent 65%), radial-gradient(ellipse at 30% 70%, rgba(167,139,250,0.15) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 50% 40%, rgba(167,139,250,0.15) 0%, transparent 65%)',
        transition: 'background 1s',
      }}/>

      {showParticles && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {particles.map((p, i) => <Particle key={i} delay={p.delay} x={p.x} />)}
        </div>
      )}

      {/* Card */}
      <div ref={cardRef} style={{
        width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 32, padding: '36px 24px 32px', position: 'relative', zIndex: 2,
        opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>

        {/* ชื่อ */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 6 }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, lineHeight: 1.15,
            background: 'linear-gradient(135deg, #c4b5fd, #f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {isComplete ? 'รักตัวเองสำเร็จ!' : 'บันทึกแล้ววันนี้'}
          </h1>
        </div>

        {/* 🔥 THE ULTIMATE STREAK FIRE 🔥 */}
        <div style={{
          textAlign: 'center', marginBottom: 32, position: 'relative',
          opacity: phase >= 2 ? 1 : 0,
          // ถ้ากำลังจุดระเบิด (isIgniting) ให้กระเด้งแรงๆ
          transform: phase >= 2 ? (isIgniting ? 'scale(1.15) translateY(-5px)' : 'scale(1) translateY(0)') : 'scale(0.5) translateY(40px)',
          transition: 'opacity 0.6s, transform 0.6s cubic-bezier(.34,1.56,.64,1)',
        }}>
          
          {/* แสงเรืองรองด้านหลัง */}
          <div className="fire-ambient-glow" style={{
            opacity: isIgniting ? 1 : 0.6,
            transform: isIgniting ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(1)',
          }} />

          {/* คลื่นกระแทกตอนจุดระเบิด (Shockwave) */}
          {isIgniting && <div className="ignition-shockwave" />}

          <div style={{
            position: 'relative', width: 100, height: 110, margin: '0 auto',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1,
            marginBottom: 8
          }}>
            
            {/* สะเก็ดไฟ (Sparks) */}
            <div className="sparks-container">
              {sparksConfig.map((s, i) => (
                <Spark key={i} delay={s.delay} left={s.left} size={s.size} duration={s.duration} />
              ))}
            </div>

            {/* เลเยอร์ไฟ 4 ชั้นเพื่อความสมจริง */}
            <div className="flame-layer flame-back"></div>
            <div className="flame-layer flame-main"></div>
            <div className="flame-layer flame-core"></div>
            <div className="flame-layer flame-inner-white"></div>
            
            {/* ฐานกองไฟ (เพื่อให้ดูมีมิติไม่ลอย) */}
            <div className="fire-base"></div>
          </div>

          {/* ตัวเลข Streak */}
          <div style={{
            fontSize: 92, fontWeight: 800, fontFamily: 'var(--font-display)',
            background: 'linear-gradient(180deg, #fffbeb 0%, #facc15 30%, #f97316 70%, #ea580c 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1, zIndex: 2, position: 'relative',
            textShadow: isIgniting ? '0 0 40px rgba(234,88,12,0.8)' : '0 8px 24px rgba(234,88,12,0.4)',
            letterSpacing: '-3px',
            transform: isIgniting ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.4s cubic-bezier(.34,1.56,.64,1), text-shadow 0.4s'
          }}>
            {streak}
          </div>
          <div style={{ 
            fontSize: 18, color: isIgniting ? '#facc15' : 'var(--text-secondary)', 
            fontWeight: 700, marginTop: 4, zIndex: 1, position: 'relative',
            transition: 'color 0.5s'
          }}>
            วันติดต่อกัน
          </div>
        </div>

        {/* Heart meter */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, 
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 24, padding: '16px 20px', marginBottom: 24,
          opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s, transform 0.5s',
        }}>
          <div style={{ position: 'relative', width: 80, height: 72 }}>
            <svg width="80" height="72" viewBox="0 0 100 90" overflow="visible" style={{
              filter: isComplete && heartFill >= 95 ? 'drop-shadow(0 0 15px rgba(244,114,182,0.6))' : 'drop-shadow(0 4px 10px rgba(167,139,250,0.3))',
              animation: isComplete && heartFill >= 95 ? 'pulseHeart 1.2s ease-in-out infinite' : 'none',
            }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity="0.95"/>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.85"/>
                </linearGradient>
                <clipPath id="hclip"><path d={heartPath}/></clipPath>
              </defs>
              <path d={heartPath} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              <g clipPath="url(#hclip)">
                <rect x="0" y={fillY} width="100" height={90 - fillY} fill="url(#hg)" style={{ transition: 'y 0.05s linear, height 0.05s linear' }} />
              </g>
              <path d={heartPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 2 }}>คะแนนวันนี้</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 24, color: 'white', fontWeight: 700 }}>{heartFill}%</span>
              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>({pts}/{maxPts})</span>
            </div>
          </div>
        </div>

        {/* Week dots */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s, transform 0.5s', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {weekDays.map((d, i) => {
              const dow = new Date(d.date + 'T00:00:00').getDay()
              const isToday = d.date === today
              const done = !!d.entry
              return (
                <div key={i} style={{
                  width: 38, height: 38, borderRadius: 12, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, gap: 2,
                  background: isToday ? 'rgba(153,246,228,0.15)' : done ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  color: isToday ? 'var(--teal-soft)' : done ? 'var(--purple-soft)' : 'var(--text-hint)',
                  border: isToday ? '1px solid rgba(153,246,228,0.4)' : done ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
                  transition: `opacity 0.4s ${i * 0.07}s, transform 0.4s ${i * 0.07}s`,
                  opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? 'scale(1)' : 'scale(0.7)',
                }}>
                  <span>{dayLabels[dow]}</span>
                  {done && <span style={{ fontSize: 8 }}>❤</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        /* --- CSS ส่วนโครงสร้างและจิปาถะ --- */
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120vh) scale(0.5) rotate(45deg); opacity: 0; }
        }
        @keyframes pulseHeart {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.07); }
        }

        /* --- THE ULTIMATE FIRE CSS --- */
        .fire-ambient-glow {
          position: absolute; top: 40%; left: 50%;
          width: 200px; height: 200px; 
          background: radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(249,115,22,0.1) 40%, transparent 70%);
          animation: ambientPulse 2s ease-in-out infinite alternate;
          z-index: 0; pointer-events: none; transition: all 0.5s;
        }

        @keyframes ambientPulse {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
        }

        .ignition-shockwave {
          position: absolute; top: 50%; left: 50%;
          width: 20px; height: 20px; border-radius: 50%;
          border: 4px solid rgba(250, 204, 21, 0.8);
          transform: translate(-50%, -50%);
          animation: shockwave 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          pointer-events: none; z-index: 0;
        }

        @keyframes shockwave {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; border-width: 10px; }
          100% { transform: translate(-50%, -50%) scale(20); opacity: 0; border-width: 0px; }
        }

        .flame-layer {
          position: absolute;
          bottom: 0;
          border-radius: 50% 0 50% 50%;
          transform-origin: center bottom;
          transform: rotate(-45deg);
        }

        /* เลเยอร์ 1: ไฟพื้นหลังสีแดงเข้ม (สูงและกว้างสุด โบกสะบัดช้าๆ) */
        .flame-back {
          width: 80px; height: 80px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
          animation: flicker-back 2.5s ease-in-out infinite alternate;
          bottom: 2px;
        }

        /* เลเยอร์ 2: ไฟหลักสีส้ม (สว่างและพริ้ว) */
        .flame-main {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.8);
          animation: flicker-main 1.2s ease-in-out infinite alternate;
          bottom: 6px;
        }

        /* เลเยอร์ 3: แกนไฟสีเหลือง (ความร้อนสูง สั่นเร็ว) */
        .flame-core {
          width: 35px; height: 35px;
          background: linear-gradient(135deg, #fde047 0%, #eab308 100%);
          box-shadow: 0 0 15px rgba(253, 224, 71, 0.9);
          animation: flicker-core 0.8s ease-in-out infinite alternate;
          bottom: 10px;
        }

        /* เลเยอร์ 4: จุดขาวใจกลาง (ร้อนที่สุด) */
        .flame-inner-white {
          width: 15px; height: 15px;
          background: #ffffff;
          box-shadow: 0 0 10px rgba(255, 255, 255, 1);
          animation: flicker-inner 0.5s ease-in-out infinite alternate;
          bottom: 12px;
        }

        .fire-base {
          position: absolute; bottom: -5px;
          width: 40px; height: 10px;
          background: rgba(0,0,0,0.4);
          border-radius: 50%;
          filter: blur(4px);
        }

        /* --- Keyframes สำหรับความพริ้วไหวที่ต่างกันของแต่ละชั้น --- */
        @keyframes flicker-back {
          0%   { transform: rotate(-45deg) scale(1) skewX(2deg); filter: blur(2px); }
          50%  { transform: rotate(-42deg) scale(1.05) skewX(-2deg); filter: blur(3px); }
          100% { transform: rotate(-48deg) scale(0.95) skewX(3deg); filter: blur(2px); }
        }
        @keyframes flicker-main {
          0%   { transform: rotate(-45deg) scale(1); }
          33%  { transform: rotate(-40deg) scale(1.08) scaleY(1.1) skewX(5deg); }
          66%  { transform: rotate(-50deg) scale(0.95) scaleY(1.05) skewX(-5deg); }
          100% { transform: rotate(-43deg) scale(1.02); }
        }
        @keyframes flicker-core {
          0%   { transform: rotate(-45deg) scale(1); }
          100% { transform: rotate(-48deg) scale(1.15) translateY(-2px); }
        }
        @keyframes flicker-inner {
          0%   { transform: rotate(-45deg) scale(1) translateY(0); opacity: 0.8; }
          100% { transform: rotate(-42deg) scale(1.2) translateY(-1px); opacity: 1; }
        }

        /* --- Sparks (สะเก็ดไฟ) --- */
        .sparks-container {
          position: absolute;
          width: 100%; height: 200px;
          bottom: 20px; left: 0;
          pointer-events: none;
        }
        .spark {
          position: absolute;
          bottom: 0;
          background: #fde047;
          border-radius: 50%;
          box-shadow: 0 0 6px #facc15, 0 0 10px #ea580c;
          animation: fly-spark linear infinite;
          opacity: 0;
        }

        @keyframes fly-spark {
          0%   { transform: translateY(0) scale(1) translateX(0); opacity: 1; }
          50%  { opacity: 0.8; }
          100% { transform: translateY(-150px) scale(0) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}