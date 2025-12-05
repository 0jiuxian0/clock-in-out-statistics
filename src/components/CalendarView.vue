<template>
  <div class="calendar-view" :class="{ 'dark': isDarkMode }">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth" :class="{ 'dark': isDarkMode }">‹</button>
      <h3 class="calendar-title">{{ year }}年{{ month }}月</h3>
      <button class="nav-btn" @click="nextMonth" :class="{ 'dark': isDarkMode }">›</button>
    </div>
    
    <div class="calendar-weekdays">
      <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
    </div>
    
    <div class="calendar-days">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="calendar-day"
        :class="getDayClass(day)"
        :style="getDayStyle(day)"
        @click="handleDayClick(day)"
        :title="getDayTooltip(day)"
      >
        <span class="day-number">{{ day ? day.getDate() : '' }}</span>
        <span v-if="day && isCustomRecord(day)" class="custom-indicator" :class="{ 'dark': isDarkMode }">⭐</span>
        <span v-if="day && getDayBadge(day)" class="day-badge" :class="getDayBadgeClass(day)">
          {{ getDayBadge(day) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatDate } from '../utils/holidays.js'
import { isHoliday } from '../utils/holidays.js'
import { getWorkdaysInMonth } from '../utils/workdayCalculator.js'

const props = defineProps({
  year: Number,
  month: Number,
  mode: {
    type: String,
    required: true,
    validator: (value) => ['workday', 'clock'].includes(value)
  },
  customConfig: Object,
  processedRecords: Array, // 用于打卡日历显示原始记录
  isDarkMode: Boolean
})

const emit = defineEmits(['date-click', 'month-change'])

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const currentYear = ref(props.year)
const currentMonth = ref(props.month)

watch(() => [props.year, props.month], ([newYear, newMonth]) => {
  currentYear.value = newYear
  currentMonth.value = newMonth
})

// 计算日历天数
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // 转换为周一到周日（0-6）
  const daysInMonth = lastDay.getDate()
  
  const days = []
  
  // 上个月的日期
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(prevYear, prevMonth - 1, prevMonthLastDay - i))
  }
  
  // 当前月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month - 1, day))
  }
  
  // 下个月的日期（补齐到42个格子）
  const remaining = 42 - days.length
  for (let day = 1; day <= remaining; day++) {
    days.push(new Date(year, month, day))
  }
  
  return days
})

// 获取日期样式类
const getDayClass = (day) => {
  if (!day) return ''
  
  const dateStr = formatDate(day)
  const dayOfWeek = day.getDay()
  const isToday = isDateToday(day)
  const isCurrentMonth = day.getMonth() + 1 === currentMonth.value
  
  const classes = []
  
  if (!isCurrentMonth) {
    classes.push('other-month')
  }
  
  if (isToday) {
    classes.push('today')
  }
  
  if (props.mode === 'workday') {
    // 工作日日历
    const customWorkdays = props.customConfig?.customWorkdays || []
    const excludedWorkdays = props.customConfig?.excludedWorkdays || []
    const isDefaultWorkday = isDefaultWorkdayCheck(day)
    
    if (customWorkdays.includes(dateStr)) {
      classes.push('custom-workday')
    } else if (excludedWorkdays.includes(dateStr)) {
      classes.push('excluded-workday')
    } else if (isDefaultWorkday) {
      classes.push('default-workday')
    } else {
      classes.push('default-non-workday')
    }
  } else {
    // 打卡记录日历
    const excludedClockRecords = props.customConfig?.excludedClockRecords || []
    const customClockRecords = props.customConfig?.customClockRecords || []
    const hasOriginalRecord = hasOriginalClockRecord(day)
    
    if (excludedClockRecords.includes(dateStr)) {
      classes.push('excluded-clock')
    } else if (customClockRecords.some(r => r.date === dateStr)) {
      classes.push('custom-clock')
    } else if (hasOriginalRecord) {
      classes.push('has-clock')
    } else {
      classes.push('no-clock')
    }
  }
  
  return classes.join(' ')
}

// 获取日期徽章（显示打卡时间）
const getDayBadge = (day) => {
  if (!day) return ''
  
  const dateStr = formatDate(day)
  
  if (props.mode === 'clock') {
    const excludedClockRecords = props.customConfig?.excludedClockRecords || []
    // 如果已排除，不显示时间
    if (excludedClockRecords.includes(dateStr)) {
      return ''
    }
    
    // 优先显示自定义记录的时间
    const customClockRecords = props.customConfig?.customClockRecords || []
    const customRecord = customClockRecords.find(r => r.date === dateStr)
    if (customRecord && customRecord.time) {
      return customRecord.time.substring(0, 5) // 显示时间，如 "20:30"
    }
    
    // 显示原始记录的时间
    if (props.processedRecords) {
      const originalRecord = props.processedRecords.find(r => r.date === dateStr && !r.isCustom)
      if (originalRecord && originalRecord.clockTime) {
        return originalRecord.clockTime.substring(0, 5) // 显示时间，如 "20:30"
      }
    }
  }
  
  return ''
}

// 获取徽章样式类
const getDayBadgeClass = (day) => {
  return 'badge-time'
}

// 获取日期提示
const getDayTooltip = (day) => {
  if (!day) return ''
  
  const dateStr = formatDate(day)
  
  if (props.mode === 'workday') {
    const customWorkdays = props.customConfig?.customWorkdays || []
    const excludedWorkdays = props.customConfig?.excludedWorkdays || []
    
    if (customWorkdays.includes(dateStr)) {
      return '点击取消：从工作日中移除'
    } else if (excludedWorkdays.includes(dateStr)) {
      return '点击取消：恢复为默认工作日'
    } else if (isDefaultWorkdayCheck(day)) {
      return '点击排除：从工作日中排除'
    } else {
      return '点击添加：设为工作日（调休）'
    }
  } else {
    const excludedClockRecords = props.customConfig?.excludedClockRecords || []
    const customClockRecords = props.customConfig?.customClockRecords || []
    
    if (excludedClockRecords.includes(dateStr)) {
      return '点击恢复：使用原始打卡记录'
    } else if (customClockRecords.some(r => r.date === dateStr)) {
      return '点击删除：删除自定义打卡记录'
    } else if (hasOriginalClockRecord(day)) {
      return '点击排除：排除此日打卡记录，或点击添加自定义记录'
    } else {
      return '点击添加：添加自定义打卡记录'
    }
  }
}

// 处理日期点击
const handleDayClick = (day) => {
  if (!day) {
    console.log('⚠️ [日历] 日期为空')
    return
  }
  
  const dayMonth = day.getMonth() + 1
  if (dayMonth !== currentMonth.value) {
    console.log(`⚠️ [日历] 日期不属于当前月份: ${dayMonth} !== ${currentMonth.value}`)
    return
  }
  
  const dateStr = formatDate(day)
  console.log(`✅ [日历] 点击日期: ${dateStr}, 模式: ${props.mode}`)
  
  emit('date-click', {
    date: dateStr,
    dateObj: day
  })
}

// 上一个月
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  emit('month-change', { year: currentYear.value, month: currentMonth.value })
}

// 下一个月
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  emit('month-change', { year: currentYear.value, month: currentMonth.value })
}

// 判断是否是今天
const isDateToday = (date) => {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

// 判断是否是默认工作日
const isDefaultWorkdayCheck = (date) => {
  const dayOfWeek = date.getDay()
  // 排除周末
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false
  }
  // 排除节假日（不传入customExcludedDates，只检查法定节假日）
  const dateStr = formatDate(date)
  const HOLIDAYS_2025 = [
    '2025-01-01',
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2025-02-01', '2025-02-02', '2025-02-03',
    '2025-04-04', '2025-04-05', '2025-04-06',
    '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05',
    '2025-05-31', '2025-06-01', '2025-06-02',
    '2025-10-06', '2025-10-07', '2025-10-08',
    '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05',
  ]
  if (HOLIDAYS_2025.includes(dateStr)) {
    return false
  }
  return true
}

// 判断是否有原始打卡记录
const hasOriginalClockRecord = (date) => {
  if (!props.processedRecords) return false
  const dateStr = formatDate(date)
  return props.processedRecords.some(r => r.date === dateStr && !r.isCustom)
}

// 判断是否是自定义记录
const isCustomRecord = (day) => {
  if (!day || props.mode !== 'clock') return false
  const dateStr = formatDate(day)
  const customClockRecords = props.customConfig?.customClockRecords || []
  return customClockRecords.some(r => r.date === dateStr)
}

// 解析时间字符串为小时数（用于自定义记录）
const parseTime = (timeStr) => {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    return hours + minutes / 60
  }
  return null
}

// 获取日期的加班时长
const getOvertimeHours = (day) => {
  if (!day || props.mode !== 'clock') return 0
  
  const dateStr = formatDate(day)
  const excludedClockRecords = props.customConfig?.excludedClockRecords || []
  
  // 如果已排除，返回0
  if (excludedClockRecords.includes(dateStr)) {
    return 0
  }
  
  // 优先查找自定义记录
  const customClockRecords = props.customConfig?.customClockRecords || []
  const customRecord = customClockRecords.find(r => r.date === dateStr)
  if (customRecord) {
    // 如果有自定义记录但没有时间，返回0
    if (!customRecord.time) return 0
    // 计算自定义记录的加班时长
    const time = parseTime(customRecord.time)
    if (time === null || time < 19) return 0
    const overtimeHours = time - 19.0
    return Math.floor(overtimeHours * 2) / 2 // 向下取整到半小时
  }
  
  // 查找原始记录
  if (props.processedRecords) {
    const record = props.processedRecords.find(r => r.date === dateStr && !r.isCustom)
    if (record && record.overtimeHours) {
      return record.overtimeHours
    }
  }
  
  return 0
}

// 获取日期的热力图样式
const getDayStyle = (day) => {
  if (!day || props.mode !== 'clock') return {}
  
  const overtimeHours = getOvertimeHours(day)
  
  // 如果加班时长为0，不应用热力图颜色
  if (overtimeHours <= 0) {
    return {}
  }
  
  // 以半小时为单位，计算颜色深度
  // 0.5小时 -> 浅红，1小时 -> 稍深，1.5小时 -> 更深，2小时及以上 -> 最深
  const halfHourUnits = Math.floor(overtimeHours * 2) // 转换为半小时单位
  const maxIntensity = 8 // 最大强度（对应4小时及以上）
  const intensity = Math.min(halfHourUnits, maxIntensity)
  
  // 计算颜色：从浅红到深红
  // 浅色模式：从 #ffe0e0 (255, 224, 224) 到 #ff0000 (255, 0, 0)
  // 深色模式：从 #4a1a1a (74, 26, 26) 到 #ff0000 (255, 0, 0)
  const baseRed = 255
  
  if (props.isDarkMode) {
    // 深色模式：从暗红色到亮红色
    // 起始颜色：rgb(74, 26, 26) - 暗红色
    // 结束颜色：rgb(255, 0, 0) - 亮红色
    const startRed = 74
    const startGreen = 26
    const startBlue = 26
    const endRed = 255
    const endGreen = 0
    const endBlue = 0
    
    // 根据强度计算颜色（从暗红到亮红）
    const ratio = intensity / maxIntensity
    const red = Math.floor(startRed + (endRed - startRed) * ratio)
    const green = Math.floor(startGreen + (endGreen - startGreen) * ratio)
    const blue = Math.floor(startBlue + (endBlue - startBlue) * ratio)
    
    return {
      backgroundColor: `rgb(${red}, ${green}, ${blue})`
    }
  } else {
    // 浅色模式：从浅红到深红
    const baseGreen = 224
    const baseBlue = 224
    
    // 计算RGB值（红色分量保持255，绿色和蓝色分量递减）
    const ratio = intensity / maxIntensity
    const green = Math.floor(baseGreen * (1 - ratio * 0.8))
    const blue = Math.floor(baseBlue * (1 - ratio * 0.8))
    
    return {
      backgroundColor: `rgb(${baseRed}, ${green}, ${blue})`
    }
  }
}
</script>

<style scoped>
.calendar-view {
  background: transparent;
  border-radius: 8px;
  padding: 0;
  margin-bottom: 0;
}

.calendar-view.dark {
  background: transparent;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.calendar-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.calendar-view.dark .calendar-title {
  color: #e0e0e0;
}

.nav-btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #333;
}

.nav-btn:hover {
  background: #e8e8e8;
  border-color: #4a90e2;
}

.nav-btn.dark {
  background: #333;
  border-color: #555;
  color: #e0e0e0;
}

.nav-btn.dark:hover {
  background: #444;
  border-color: #6a9bd8;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: #666;
  padding: 0.5rem;
}

.calendar-view.dark .weekday {
  color: #aaa;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.calendar-day {
  aspect-ratio: 1;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 0.25rem;
  background: white;
  overflow: visible;
}

.calendar-view.dark .calendar-day {
  background: #1a1a1a;
  border-color: #444;
}

.calendar-day:hover {
  border-color: #4a90e2;
  transform: scale(1.05);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.calendar-day.other-month {
  opacity: 0.3;
  cursor: not-allowed;
}

.calendar-day.today {
  border-color: #4a90e2;
  border-width: 2px;
  font-weight: bold;
}

.day-number {
  font-size: 0.9rem;
  color: #333;
}

.calendar-view.dark .day-number {
  color: #e0e0e0;
}

.day-badge {
  font-size: 0.7rem;
  margin-top: 0.25rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: 500;
}

.badge-time {
  background: #4a90e2;
  color: white;
  font-weight: 600;
  display: block;
  text-align: center;
  white-space: nowrap;
}

.calendar-view.dark .badge-time {
  background: #5a9ee2;
  color: white;
}

/* 工作日日历样式 */
.calendar-day.default-workday {
  background: #e8f5e9;
}

.calendar-view.dark .calendar-day.default-workday {
  background: #1b5e20;
}

.calendar-day.default-non-workday {
  background: #f5f5f5;
}

.calendar-view.dark .calendar-day.default-non-workday {
  background: #1a1a1a;
}

.calendar-day.custom-workday {
  background: #c8e6c9;
  border-color: #4caf50;
}

.calendar-view.dark .calendar-day.custom-workday {
  background: #2e7d32;
  border-color: #66bb6a;
}

.calendar-day.excluded-workday {
  background: #ffcdd2;
  border-color: #f44336;
}

.calendar-view.dark .calendar-day.excluded-workday {
  background: #b71c1c;
  border-color: #e57373;
}

/* 打卡记录日历样式 */
.calendar-day.has-clock {
  background: #e3f2fd;
}

.calendar-view.dark .calendar-day.has-clock {
  background: #0d47a1;
}

.calendar-day.no-clock {
  background: #f5f5f5;
}

.calendar-view.dark .calendar-day.no-clock {
  background: #1a1a1a;
}

.calendar-day.excluded-clock {
  background: #ffcdd2;
  border-color: #f44336;
}

.calendar-view.dark .calendar-day.excluded-clock {
  background: #b71c1c;
  border-color: #e57373;
}

.calendar-day.custom-clock {
  /* 移除黄色背景，使用虚线边框标记 */
  border-style: dashed;
  border-width: 2px;
  border-color: #fbc02d;
}

.calendar-view.dark .calendar-day.custom-clock {
  border-color: #fdd835;
}

/* 自定义记录指示器（右上角图标） */
.custom-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.7rem;
  line-height: 1;
  color: #fbc02d;
  z-index: 2;
}

.calendar-view.dark .custom-indicator {
  color: #fdd835;
}

@media (max-width: 768px) {
  .calendar-view {
    padding: 1rem;
  }
  
  .calendar-day {
    padding: 0.15rem;
  }
  
  .day-number {
    font-size: 0.8rem;
  }
  
  .day-badge {
    font-size: 0.65rem;
  }
}
</style>

