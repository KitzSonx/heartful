// lib/date.ts - Helper functions สำหรับจัดการวันที่ใน Timezone Asia/Bangkok (GMT+7)

/**
 * คืนค่าสตริงวันที่ในรูปแบบ YYYY-MM-DD ตามเขตเวลา Asia/Bangkok
 */
export function getBangkokDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date) // คืนค่า YYYY-MM-DD
}

/**
 * คืนค่าสตริงวันที่ย้อนหลัง n วัน ตามเขตเวลา Asia/Bangkok
 */
export function getBangkokDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return getBangkokDateString(d)
}

/**
 * สร้างรายการวันที่ย้อนหลัง 7 วัน (รวมวันนี้) ใน Timezone Asia/Bangkok
 */
export function getBangkokPastDays(count: number = 7): string[] {
  const dates: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    dates.push(getBangkokDaysAgo(i))
  }
  return dates
}
