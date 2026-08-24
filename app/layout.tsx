// layout.tsx - ตั้งค่าฟอนต์ Itim และโครงสร้างพื้นฐานของแอป
import type { Metadata } from 'next'
import { Itim } from 'next/font/google' // 1. เปลี่ยนเป็นนำเข้าฟอนต์ Itim
import '../styles/globals.css'

// 2. ตั้งค่าการใช้งานฟอนต์ Itim
const itim = Itim({
  subsets: ['thai', 'latin'],
  weight: ['400'], // Itim ปกติจะมีน้ำหนักเดียวคือ 400 ครับ
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Heartful — รักตัวเองทุกวัน',
  description: 'ติดตามสุขภาพกาย ใจ และสังคม เพื่อชีวิตที่ดีขึ้นทุกวัน',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={itim.className}>
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </body>
    </html>
  )
}