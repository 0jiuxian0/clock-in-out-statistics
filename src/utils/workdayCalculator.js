import { isHoliday, formatDate } from './holidays.js'

/**
 * 获取指定月份的所有工作日
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {Object} customConfig - 自定义配置对象
 * @returns {Array} 工作日日期数组
 */
export function getWorkdaysInMonth(year, month, customConfig = {}) {
  const workdays = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  
  const customWorkdays = customConfig.customWorkdays || []
  const excludedWorkdays = customConfig.excludedWorkdays || []
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    const dateStr = formatDate(date)
    
    // 检查是否是用户自定义的工作日（如调休的周六日）
    if (customWorkdays.includes(dateStr)) {
      workdays.push(dateStr)
      continue
    }
    
    // 排除周末（周六=6, 周日=0）
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // 排除节假日
      if (!isHoliday(date, [])) {
        // 排除用户手动排除的工作日
        if (!excludedWorkdays.includes(dateStr)) {
          workdays.push(dateStr)
        }
      }
    }
  }
  
  return workdays
}

/**
 * 计算当月已上班天数
 * @param {Array} clockRecords - 打卡记录数组
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {number} 已上班天数
 */
export function getWorkedDays(clockRecords, year, month) {
  const workedDates = new Set()
  
  clockRecords.forEach(record => {
    if (record.date) {
      const date = parseDate(record.date)
      if (date && date.getFullYear() === year && date.getMonth() + 1 === month) {
        workedDates.add(formatDate(date))
      }
    }
  })
  
  return workedDates.size
}

/**
 * 计算当月剩余工作日（排除已过去的工作日）
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} workedDays - 已上班天数
 * @param {Object} customConfig - 自定义配置对象
 * @returns {number} 剩余工作日
 */
export function getRemainingWorkdays(year, month, workedDays, customConfig = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDate(today)
  
  // 获取该月所有工作日
  const allWorkdays = getWorkdaysInMonth(year, month, customConfig)
  
  // 过滤出未来的工作日（包括今天）
  const futureWorkdays = allWorkdays.filter(dateStr => {
    return dateStr >= todayStr
  })
  
  // 剩余工作日 = 未来工作日总数（包括今天）
  // 这个值表示从今天开始到月底还有多少个工作日
  return futureWorkdays.length
}

/**
 * 获取指定月份的所有工作日数量（不排除已过去的）
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {Object} customConfig - 自定义配置对象
 * @returns {number} 工作日总数
 */
export function getTotalWorkdaysInMonth(year, month, customConfig = {}) {
  return getWorkdaysInMonth(year, month, customConfig).length
}

/**
 * 解析日期字符串
 * @param {string} dateStr - 日期字符串，可能是 "2025年9月30日 星期二" 格式
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  
  // 处理 "2025年9月30日 星期二" 格式
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (match) {
    const year = parseInt(match[1])
    const month = parseInt(match[2])
    const day = parseInt(match[3])
    return new Date(year, month - 1, day)
  }
  
  // 处理标准日期格式
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date
  }
  
  return null
}

