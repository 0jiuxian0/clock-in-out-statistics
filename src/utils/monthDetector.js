import { parseDate } from './workdayCalculator.js'
import { formatDate } from './holidays.js'

/**
 * 从打卡记录中识别所有包含的月份
 * @param {Array} records - 打卡记录数组
 * @returns {Array} 月份数组，格式: [{year: 2025, month: 8}, {year: 2025, month: 9}]
 */
export function detectMonths(records) {
  const monthSet = new Set()
  
  records.forEach(record => {
    if (record.date) {
      const date = parseDate(record.date)
      if (date) {
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`
        monthSet.add(key)
      }
    }
  })
  
  // 转换为数组并排序
  const months = Array.from(monthSet).map(key => {
    const [year, month] = key.split('-').map(Number)
    return { year, month }
  }).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
  
  // 如果当前月份不在列表中，也添加进去
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentKey = `${currentYear}-${currentMonth}`
  
  if (!monthSet.has(currentKey)) {
    months.push({ year: currentYear, month: currentMonth })
  }
  
  return months
}

/**
 * 格式化月份显示名称
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {string} 格式化后的月份名称，如 "2025年8月"
 */
export function formatMonthName(year, month) {
  return `${year}年${month}月`
}

