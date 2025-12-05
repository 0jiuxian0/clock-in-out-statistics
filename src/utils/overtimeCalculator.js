import { parseDate } from './workdayCalculator.js'
import { formatDate } from './holidays.js'

/**
 * 解析时间字符串为小时数
 * @param {string} timeStr - 时间字符串，如 "20:09" 或 "20:09:00"
 * @returns {number} 小时数（24小时制）
 */
function parseTime(timeStr) {
  if (!timeStr) {
    return null
  }
  
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    const result = hours + minutes / 60
    return result
  }
  
  return null
}

/**
 * 计算加班时长（以半小时为单位）
 * @param {string} clockTime - 下班打卡时间，如 "20:09"
 * @returns {number} 加班时长（小时），如 1.5 表示 1.5小时
 */
export function calculateOvertimeHours(clockTime) {
  if (!clockTime) {
    return 0
  }
  
  const time = parseTime(clockTime)
  if (time === null) {
    return 0
  }
  
  // 加班时间自19:00起算
  const overtimeStart = 19.0
  
  if (time < overtimeStart) {
    return 0
  }
  
  // 计算加班时长（小时）
  const overtimeHours = time - overtimeStart
  const roundedHours = Math.floor(overtimeHours * 2) / 2
  
  // 以半小时为单位向下取整
  // 例如：19:00-20:05 = 1.083小时 -> 1.0小时
  //      19:00-20:30 = 1.5小时 -> 1.5小时
  //      19:00-20:35 = 1.583小时 -> 1.5小时
  //      19:00-21:00 = 2.0小时 -> 2.0小时
  return roundedHours
}

/**
 * 处理打卡记录，计算加班时长
 * @param {Array} records - 打卡记录数组
 * @param {Object} customConfig - 自定义配置对象
 * @returns {Array} 处理后的记录，包含加班时长
 */
export function processClockRecords(records, customConfig = {}) {
  console.log('🔄 [记录处理] 开始处理打卡记录')
  console.log('🔄 [记录处理] 原始记录数量:', records.length)
  console.log('🔄 [记录处理] 自定义配置:', customConfig)
  
  const excludedClockRecords = customConfig.excludedClockRecords || []
  const customClockRecords = customConfig.customClockRecords || []
  
  // 按日期分组，同一天取最晚的下班记录
  const dateMap = new Map()
  let processedCount = 0
  let skippedCount = 0
  
  // 先处理用户自定义的打卡记录
  customClockRecords.forEach(customRecord => {
    const dateStr = customRecord.date
    if (dateStr) {
      const clockTime = customRecord.time || ''
      const overtimeHours = clockTime ? calculateOvertimeHours(clockTime) : 0
      dateMap.set(dateStr, {
        date: dateStr,
        originalDate: dateStr,
        clockTime: clockTime,
        overtimeHours: overtimeHours,
        hasClockRecord: true,
        isCustom: true // 标记为自定义记录
      })
      processedCount++
      console.log(`📝 [记录处理] 添加自定义打卡记录: ${dateStr} ${clockTime || '(空)'}`)
    }
  })
  
  records.forEach((record, index) => {
    const date = parseDate(record.date)
    if (!date) {
      skippedCount++
      if (index < 3) {
        console.warn(`⚠️ [记录处理] 记录 ${index} 日期解析失败:`, record.date)
      }
      return
    }
    
    const dateStr = formatDate(date)
    
    // 如果该日期被用户排除，跳过
    if (excludedClockRecords.includes(dateStr)) {
      skippedCount++
      console.log(`⏭️ [记录处理] 跳过排除的打卡记录: ${dateStr}`)
      return
    }
    
    // 如果该日期已有自定义记录，跳过原始记录
    if (dateMap.has(dateStr) && dateMap.get(dateStr).isCustom) {
      skippedCount++
      console.log(`⏭️ [记录处理] 跳过原始记录（已有自定义记录）: ${dateStr}`)
      return
    }
    
    const clockTime = record.time || ''
    
    // 如果clockTime为空，仍然记录，但加班时长为0
    if (!dateMap.has(dateStr)) {
      const overtimeHours = clockTime ? calculateOvertimeHours(clockTime) : 0
      const newRecord = {
        date: dateStr,
        originalDate: record.date,
        clockTime: clockTime,
        overtimeHours: overtimeHours,
        hasClockRecord: true // 标记是否有打卡记录（即使时间为空也算有记录）
      }
      dateMap.set(dateStr, newRecord)
      processedCount++
      
      if (processedCount <= 5) {
        console.log(`📅 [记录处理] 新日期记录 ${processedCount}:`, {
          日期: dateStr,
          原始日期: record.date,
          打卡时间: clockTime || '(空)',
          加班时长: overtimeHours
        })
      }
    } else {
      // 如果已有记录，比较时间，取最晚的
      const existing = dateMap.get(dateStr)
      const existingTime = parseTime(existing.clockTime)
      const currentTime = parseTime(clockTime)
      
      // 如果新记录有时间且比现有记录晚，更新
      if (currentTime && existingTime && currentTime > existingTime) {
        console.log(`🔄 [记录处理] 更新日期 ${dateStr} 的记录，新时间更晚: ${clockTime} > ${existing.clockTime}`)
        existing.clockTime = clockTime
        existing.overtimeHours = calculateOvertimeHours(clockTime)
      } else if (currentTime && !existingTime) {
        // 如果现有记录没有时间，新记录有时间，使用新记录
        console.log(`🔄 [记录处理] 更新日期 ${dateStr} 的记录，使用新时间: ${clockTime}`)
        existing.clockTime = clockTime
        existing.overtimeHours = calculateOvertimeHours(clockTime)
      }
    }
  })
  
  const result = Array.from(dateMap.values())
  console.log(`✅ [记录处理] 处理完成 - 处理了 ${processedCount} 条记录，跳过 ${skippedCount} 条`)
  console.log('📊 [记录处理] 处理后的记录总数:', result.length)
  console.log('📊 [记录处理] 前5条处理后的记录:', result.slice(0, 5).map(r => ({
    日期: r.date,
    打卡时间: r.clockTime || '(空)',
    加班时长: r.overtimeHours
  })))
  
  // 统计有加班时长的记录
  const overtimeRecords = result.filter(r => r.overtimeHours > 0)
  console.log(`📊 [记录处理] 有加班时长的记录数: ${overtimeRecords.length}/${result.length}`)
  if (overtimeRecords.length > 0) {
    console.log('📊 [记录处理] 有加班时长的记录:', overtimeRecords.slice(0, 5))
  }
  
  return result
}

/**
 * 计算当月总加班时长
 * @param {Array} processedRecords - 处理后的打卡记录
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {number} 总加班时长（小时）
 */
export function calculateTotalOvertime(processedRecords, year, month) {
  console.log(`📈 [总加班计算] 开始计算 ${year}年${month}月的总加班时长`)
  console.log(`📈 [总加班计算] 处理后的记录总数: ${processedRecords.length}`)
  
  let total = 0
  let matchedCount = 0
  const matchedRecords = []
  
  processedRecords.forEach(record => {
    // record.date 已经是 YYYY-MM-DD 格式
    if (record.date) {
      const date = new Date(record.date + 'T00:00:00')
      if (date.getFullYear() === year && date.getMonth() + 1 === month) {
        const hours = record.overtimeHours || 0
        total += hours
        matchedCount++
        if (hours > 0) {
          matchedRecords.push({
            日期: record.date,
            打卡时间: record.clockTime || '(空)',
            加班时长: hours
          })
        }
      }
    }
  })
  
  console.log(`📈 [总加班计算] ${year}年${month}月 - 匹配记录数: ${matchedCount}, 总加班时长: ${total}小时`)
  if (matchedRecords.length > 0) {
    console.log(`📈 [总加班计算] 有加班时长的记录:`, matchedRecords)
  } else {
    console.warn(`⚠️ [总加班计算] 没有找到有加班时长的记录！`)
  }
  
  return total
}

