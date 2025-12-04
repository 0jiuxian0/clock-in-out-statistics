/**
 * 2025年中国法定节假日列表
 */
export const HOLIDAYS_2025 = [
  // 元旦
  '2025-01-01',
  
  // 春节
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
  '2025-02-01', '2025-02-02', '2025-02-03',
  
  // 清明节
  '2025-04-04', '2025-04-05', '2025-04-06',
  
  // 劳动节
  '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05',
  
  // 端午节
  '2025-05-31', '2025-06-01', '2025-06-02',
  
  // 中秋节
  '2025-10-06', '2025-10-07', '2025-10-08',
  
  // 国庆节
  '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05',
]

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 检查日期是否为节假日
 */
export function isHoliday(date, customExcludedDates = []) {
  const dateStr = formatDate(date)
  return HOLIDAYS_2025.includes(dateStr) || customExcludedDates.includes(dateStr)
}

