<template>
  <div class="statistics">
    <div class="section-header">
      <h2>{{ monthName || '统计信息' }}</h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">总工作日数</div>
        <div class="stat-value">{{ statistics.totalWorkdays }} 天</div>
      </div>

      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">已过去工作日</div>
        <div class="stat-value">{{ statistics.pastWorkdays }} 天</div>
      </div>

      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">实际上班天数</div>
        <div class="stat-value highlight">{{ statistics.actualWorkedDays }} 天</div>
        <div class="stat-hint">（有打卡记录的天数）</div>
      </div>

      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">{{ monthName ? '剩余工作日' : '本月剩余工作日' }}</div>
        <div class="stat-value">{{ statistics.remainingWorkdays }} 天</div>
      </div>

      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">{{ monthName ? '已加班时长' : '本月已加班时长' }}</div>
        <div class="stat-value highlight">{{ statistics.totalOvertime.toFixed(1) }} 小时</div>
      </div>

      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">距离22小时还差</div>
        <div class="stat-value" :class="{ 'warning': statistics.remainingHours > 0 }">
          {{ statistics.remainingHours.toFixed(1) }} 小时
        </div>
      </div>

      <div class="stat-card" :class="{ 'dark': isDarkMode }">
        <div class="stat-label">平均每天需加班</div>
        <div class="stat-value" :class="{ 'warning': statistics.avgHoursPerDay > 0 }">
          {{ statistics.avgHoursPerDay.toFixed(2) }} 小时/天
        </div>
      </div>
    </div>

    <!-- 日历视图 -->
    <div class="calendars-container">
      <div class="calendar-section" :class="{ 'dark': isDarkMode }">
        <h3 class="calendar-section-title">工作日设置</h3>
        <p class="calendar-section-hint">点击日期切换工作日状态（绿色=工作日，灰色=非工作日）</p>
        <CalendarView
          :year="activeMonthYear"
          :month="activeMonthMonth"
          mode="workday"
          :custom-config="customConfig"
          :is-dark-mode="isDarkMode"
          @date-click="handleWorkdayDateClick"
          @month-change="handleCalendarMonthChange"
        />
      </div>

      <div class="calendar-section" :class="{ 'dark': isDarkMode }">
        <h3 class="calendar-section-title">打卡记录设置</h3>
        <p class="calendar-section-hint">点击日期添加/排除打卡记录（蓝色=导入记录，黄色=自定义记录，灰色=无记录）</p>
        <CalendarView
          :year="activeMonthYear"
          :month="activeMonthMonth"
          mode="clock"
          :custom-config="customConfig"
          :processed-records="processedRecords"
          :is-dark-mode="isDarkMode"
          @date-click="handleClockDateClick"
          @month-change="handleCalendarMonthChange"
        />
      </div>
    </div>

    <!-- 打卡记录输入模态框 -->
    <div v-if="showClockInputModal" class="modal-overlay" @click="closeClockInputModal">
      <div class="modal-content" :class="{ 'dark': isDarkMode }" @click.stop>
        <div class="modal-header">
          <h3>设置打卡记录</h3>
          <button class="close-btn" @click="closeClockInputModal">×</button>
        </div>
        <div class="modal-body">
          <p class="hint">日期: {{ clockInputDate }}</p>
          <div class="clock-input-group">
            <label>下班时间（可选）：</label>
            <input 
              type="time" 
              v-model="clockInputTime"
              class="time-input"
              :class="{ 'dark': isDarkMode }"
              placeholder="如：20:30"
            />
            <p class="hint-small">留空则仅排除此日打卡记录，不计算加班时长</p>
          </div>
          <div class="modal-actions">
            <button 
              class="btn-secondary"
              :class="{ 'dark': isDarkMode }"
              @click="closeClockInputModal"
            >
              取消
            </button>
            <button 
              class="btn-primary"
              :class="{ 'dark': isDarkMode }"
              @click="confirmClockInput"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import CalendarView from './CalendarView.vue'

const props = defineProps({
  statistics: Object,
  monthName: String,
  customConfig: Object,
  processedRecords: Array,
  activeMonth: Object,
  isDarkMode: Boolean
})

const emit = defineEmits(['update-custom-config', 'month-change'])

// 打卡记录输入模态框
const showClockInputModal = ref(false)
const clockInputDate = ref('')
const clockInputTime = ref('')

// 日历显示的月份（从activeMonth获取，如果没有则使用当前月份）
const activeMonthYear = computed(() => {
  if (props.activeMonth) {
    return props.activeMonth.year
  }
  const today = new Date()
  return today.getFullYear()
})

const activeMonthMonth = computed(() => {
  if (props.activeMonth) {
    return props.activeMonth.month
  }
  const today = new Date()
  return today.getMonth() + 1
})

// 工作日设置
const newCustomWorkday = ref('')
const newExcludedWorkday = ref('')

// 打卡记录设置
const newExcludedClockRecord = ref('')
const newCustomRecord = reactive({ date: '', time: '' })

// 工作日操作（互斥处理：同一天不能既添加又排除）
const addCustomWorkday = () => {
  if (newCustomWorkday.value) {
    const date = newCustomWorkday.value
    const updated = {
      ...props.customConfig,
      customWorkdays: [...(props.customConfig.customWorkdays || []).filter(d => d !== date), date],
      excludedWorkdays: (props.customConfig.excludedWorkdays || []).filter(d => d !== date) // 从排除列表中移除
    }
    emit('update-custom-config', updated)
    newCustomWorkday.value = ''
  }
}

const removeCustomWorkday = (date) => {
  const updated = {
    ...props.customConfig,
    customWorkdays: (props.customConfig.customWorkdays || []).filter(d => d !== date)
  }
  emit('update-custom-config', updated)
}

const addExcludedWorkday = () => {
  if (newExcludedWorkday.value) {
    const date = newExcludedWorkday.value
    const updated = {
      ...props.customConfig,
      excludedWorkdays: [...(props.customConfig.excludedWorkdays || []).filter(d => d !== date), date],
      customWorkdays: (props.customConfig.customWorkdays || []).filter(d => d !== date) // 从添加列表中移除
    }
    emit('update-custom-config', updated)
    newExcludedWorkday.value = ''
  }
}

const removeExcludedWorkday = (date) => {
  const updated = {
    ...props.customConfig,
    excludedWorkdays: (props.customConfig.excludedWorkdays || []).filter(d => d !== date)
  }
  emit('update-custom-config', updated)
}

// 打卡记录操作
const addExcludedClockRecord = () => {
  if (newExcludedClockRecord.value) {
    const updated = {
      ...props.customConfig,
      excludedClockRecords: [...(props.customConfig.excludedClockRecords || []), newExcludedClockRecord.value]
    }
    emit('update-custom-config', updated)
    newExcludedClockRecord.value = ''
  }
}

const removeExcludedClockRecord = (date) => {
  const updated = {
    ...props.customConfig,
    excludedClockRecords: (props.customConfig.excludedClockRecords || []).filter(d => d !== date)
  }
  emit('update-custom-config', updated)
}

const addCustomClockRecord = () => {
  if (newCustomRecord.date) {
    const updated = {
      ...props.customConfig,
      customClockRecords: [
        ...(props.customConfig.customClockRecords || []).filter(r => r.date !== newCustomRecord.date),
        { date: newCustomRecord.date, time: newCustomRecord.time || '' }
      ]
    }
    emit('update-custom-config', updated)
    newCustomRecord.date = ''
    newCustomRecord.time = ''
  }
}

const removeCustomClockRecord = (date) => {
  const updated = {
    ...props.customConfig,
    customClockRecords: (props.customConfig.customClockRecords || []).filter(r => r.date !== date)
  }
  emit('update-custom-config', updated)
}

// 处理工作日日历点击
const handleWorkdayDateClick = ({ date }) => {
  const customWorkdays = props.customConfig?.customWorkdays || []
  const excludedWorkdays = props.customConfig?.excludedWorkdays || []
  
  let updated = { ...props.customConfig }
  
  if (customWorkdays.includes(date)) {
    // 如果已在自定义工作日中，移除
    updated.customWorkdays = customWorkdays.filter(d => d !== date)
  } else if (excludedWorkdays.includes(date)) {
    // 如果已在排除列表中，移除（恢复默认）
    updated.excludedWorkdays = excludedWorkdays.filter(d => d !== date)
  } else {
    // 判断默认是否是工作日
    const dateObj = new Date(date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // 需要导入isHoliday来判断
    // 这里简化处理：如果是周末，添加到自定义工作日；否则添加到排除列表
    if (isWeekend) {
      // 周末，添加到自定义工作日（调休）
      updated.customWorkdays = [...customWorkdays.filter(d => d !== date), date]
      updated.excludedWorkdays = excludedWorkdays.filter(d => d !== date) // 互斥
    } else {
      // 工作日，添加到排除列表
      updated.excludedWorkdays = [...excludedWorkdays.filter(d => d !== date), date]
      updated.customWorkdays = customWorkdays.filter(d => d !== date) // 互斥
    }
  }
  
  emit('update-custom-config', updated)
}

// 处理打卡记录日历点击
const handleClockDateClick = ({ date }) => {
  console.log('🕐 [打卡日历] 点击日期:', date)
  const excludedClockRecords = props.customConfig?.excludedClockRecords || []
  const customClockRecords = props.customConfig?.customClockRecords || []
  const customRecord = customClockRecords.find(r => r.date === date)
  
  let updated = { ...props.customConfig }
  
  if (customRecord) {
    // 如果已有自定义记录，删除
    updated.customClockRecords = customClockRecords.filter(r => r.date !== date)
    emit('update-custom-config', updated)
  } else if (excludedClockRecords.includes(date)) {
    // 如果已在排除列表中，移除（恢复原始记录）
    updated.excludedClockRecords = excludedClockRecords.filter(d => d !== date)
    emit('update-custom-config', updated)
  } else {
    // 打开输入模态框
    clockInputDate.value = date
    clockInputTime.value = ''
    showClockInputModal.value = true
  }
}

// 关闭打卡记录输入模态框
const closeClockInputModal = () => {
  showClockInputModal.value = false
  clockInputDate.value = ''
  clockInputTime.value = ''
}

// 确认打卡记录输入
const confirmClockInput = () => {
  const date = clockInputDate.value
  const time = clockInputTime.value.trim()
  const excludedClockRecords = props.customConfig?.excludedClockRecords || []
  const customClockRecords = props.customConfig?.customClockRecords || []
  
  let updated = { ...props.customConfig }
  
  if (time === '') {
    // 空输入，排除打卡记录
    updated.excludedClockRecords = [...excludedClockRecords.filter(d => d !== date), date]
    updated.customClockRecords = customClockRecords.filter(r => r.date !== date) // 互斥
  } else {
    // 有输入，添加自定义打卡记录
    // 验证时间格式（time input已经保证了格式，但再验证一次）
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      updated.customClockRecords = [
        ...customClockRecords.filter(r => r.date !== date),
        { date, time }
      ]
      updated.excludedClockRecords = excludedClockRecords.filter(d => d !== date) // 互斥
    } else {
      alert('时间格式不正确，请输入 HH:MM 格式，如 20:30')
      return
    }
  }
  
  emit('update-custom-config', updated)
  closeClockInputModal()
}

// 处理日历月份切换
const handleCalendarMonthChange = (monthItem) => {
  emit('month-change', monthItem)
}
</script>

<style scoped>
.statistics {
  margin-bottom: 2rem;
}

.calendars-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.calendar-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
}

.calendar-section.dark {
  background: #2a2a2a;
  border-color: #444;
}

.calendar-section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.calendar-section.dark .calendar-section-title {
  color: #e0e0e0;
}

.calendar-section-hint {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1rem 0;
}

.calendar-section.dark .calendar-section-hint {
  color: #aaa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.exclude-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.exclude-btn:hover {
  background: #f5f5f5;
  border-color: #4a90e2;
}

.exclude-btn.dark {
  background: #2a2a2a;
  border-color: #555;
  color: #e0e0e0;
}

.exclude-btn.dark:hover {
  background: #333;
  border-color: #6a9bd8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.dark {
  background: #2a2a2a;
  border-color: #444;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-card.dark .stat-label {
  color: #aaa;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.stat-card.dark .stat-value {
  color: #e0e0e0;
}

.stat-hint {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.stat-card.dark .stat-hint {
  color: #777;
}

.stat-value.highlight {
  color: #4a90e2;
}

.stat-value.warning {
  color: #ff6b6b;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-content.dark {
  background: #2a2a2a;
  color: #e0e0e0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-content.dark .modal-header {
  border-bottom-color: #444;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
}

.modal-content.dark .close-btn {
  color: #aaa;
}

.close-btn:hover {
  color: #333;
}

.modal-content.dark .close-btn:hover {
  color: #e0e0e0;
}

.modal-body {
  padding: 1.5rem;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.modal-content.dark .hint {
  color: #aaa;
}

.config-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.modal-content.dark .config-tabs {
  border-bottom-color: #444;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
  position: relative;
  font-weight: 500;
}

.tab-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.tab-btn.dark {
  color: #aaa;
}

.tab-btn.dark:hover {
  background: #333;
  color: #e0e0e0;
}

.tab-btn.active {
  color: #4a90e2;
  background: #f0f7ff;
  font-weight: 600;
}

.tab-btn.active.dark {
  color: #6a9bd8;
  background: #1a2332;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #4a90e2;
}

.tab-btn.active.dark::after {
  background: #6a9bd8;
}

.config-section {
  margin-top: 1rem;
}

.config-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.modal-content.dark .config-section h4 {
  color: #e0e0e0;
}

.dates-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  min-height: 40px;
}

.custom-records-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  min-height: 40px;
}

.custom-record-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
}

.custom-record-item.dark {
  background: #2a2a2a;
  border-color: #444;
  color: #e0e0e0;
}

.custom-record-item .time {
  color: #4a90e2;
  font-weight: 500;
}

.custom-record-item.dark .time {
  color: #6a9bd8;
}

.custom-record-item button {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-record-item.dark button {
  color: #aaa;
}

.custom-record-item button:hover {
  color: #ff6b6b;
}

.custom-record-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.time-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.time-input.dark {
  background: #333;
  border-color: #555;
  color: #e0e0e0;
}

.modal-content.large {
  max-width: 700px;
}

.clock-input-group {
  margin: 1.5rem 0;
}

.clock-input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.modal-content.dark .clock-input-group label {
  color: #e0e0e0;
}

.hint-small {
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.5rem;
}

.modal-content.dark .hint-small {
  color: #777;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-primary.dark {
  background: #5a9ee2;
}

.btn-primary.dark:hover {
  background: #4a8ed2;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e8e8e8;
  border-color: #ccc;
}

.btn-secondary.dark {
  background: #333;
  color: #e0e0e0;
  border-color: #555;
}

.btn-secondary.dark:hover {
  background: #444;
  border-color: #666;
}

.excluded-dates-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  min-height: 40px;
}

.date-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.date-tag.dark {
  background: #333;
  color: #e0e0e0;
}

.date-tag button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-tag.dark button {
  color: #aaa;
}

.date-tag button:hover {
  color: #ff6b6b;
}

.date-input-group {
  display: flex;
  gap: 0.5rem;
}

.date-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.date-input.dark {
  background: #333;
  border-color: #555;
  color: #e0e0e0;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.add-btn:hover:not(:disabled) {
  background: #357abd;
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn.dark {
  background: #5a9ee2;
}

.add-btn.dark:hover:not(:disabled) {
  background: #4a8ed2;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .calendars-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .calendar-section {
    padding: 1rem;
  }
}
</style>

