// lib/sound.ts - Web Audio API Sound Effects (ทำงานได้ 100% ทุกบราวเซอร์โดยไม่ต้องโหลดไฟล์ภายนอก)

class SoundFX {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // เสียงปุ่มคลิกทั่วไป (Soft Click)
  playClick() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(420, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } catch {}
  }

  // เสียงแตะเลือกสติกเกอร์ / ตัวเลือก (Bubble Pop)
  playPop() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(320, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.08)

      gain.gain.setValueAtTime(0.28, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    } catch {}
  }

  // เสียงหยอดเรื่องดีๆ ลงโหล (Sweet Chime)
  playJarDrop() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + i * 0.06)

        gain.gain.setValueAtTime(0.18, now + i * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + i * 0.06)
        osc.stop(now + i * 0.06 + 0.25)
      })
    } catch {}
  }

  // เสียงสำเร็จ ส่งคำตอบ / Streak ไฟลุก (Celebration Fanfare)
  playSuccess() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime
      const melody = [
        { f: 523.25, d: 0.1 },  // C5
        { f: 659.25, d: 0.1 },  // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.50, d: 0.35 } // C6 (long)
      ]

      let time = now
      melody.forEach(({ f, d }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(f, time)

        gain.gain.setValueAtTime(0.24, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + d)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(time)
        osc.stop(time + d)
        time += d * 0.85
      })
    } catch {}
  }
}

export const sound = new SoundFX()
