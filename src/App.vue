<template>
  <div :class="['app', { 'dark-mode': isDarkMode }]">
    <header class="header">
      <h1>打卡统计计算器</h1>
      <div class="header-actions">
        <button 
          class="clear-cache-btn" 
          @click="clearCache"
          :aria-label="'清除缓存数据'"
          title="清除缓存数据"
        >
          🗑️ 清除缓存
        </button>
        <button class="theme-toggle" @click="toggleTheme" :aria-label="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <main class="main-content">
      <FileUpload 
        @file-uploaded="handleFileUploaded"
        :isDarkMode="isDarkMode"
      />

      <div v-if="activeMonth" class="statistics-container">
        <MonthTabs
          :months="monthsData && monthsData.length > 0 
            ? monthsData.map(m => ({ year: m.year, month: m.month }))
            : [{ year: activeMonth.year, month: activeMonth.month }]"
          :active-month="activeMonth"
          @month-change="handleMonthChange"
          :isDarkMode="isDarkMode"
        />

        <div v-if="currentMonthStats && activeMonth">
          <Statistics 
            :statistics="currentMonthStats"
            :month-name="formatMonthName(activeMonth.year, activeMonth.month)"
            :custom-config="customConfig"
            :processed-records="processedRecords"
            :active-month="activeMonth"
            @update-custom-config="updateCustomConfig"
            @month-change="handleMonthChange"
            :isDarkMode="isDarkMode"
          />
          
          <SubsidyPreview 
            :totalOvertime="currentMonthStats.totalOvertime"
            :isDarkMode="isDarkMode"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import FileUpload from './components/FileUpload.vue'
import Statistics from './components/Statistics.vue'
import SubsidyPreview from './components/SubsidyPreview.vue'
import MonthTabs from './components/MonthTabs.vue'
import { parseExcel, parseDetailData } from './utils/excelParser.js'
import { processClockRecords, calculateTotalOvertime } from './utils/overtimeCalculator.js'
import { getRemainingWorkdays, getTotalWorkdaysInMonth, getWorkdaysInMonth, parseDate } from './utils/workdayCalculator.js'
import { detectMonths, formatMonthName } from './utils/monthDetector.js'
import { formatDate } from './utils/holidays.js'

const isDarkMode = ref(false)
const monthsData = ref([]) // 存储所有月份的数据
const activeMonth = ref(null) // 当前选中的月份
const rawRecords = ref([])
const processedRecords = ref([]) // 处理后的打卡记录

// 自定义配置数据结构
const customConfig = ref({
  // 工作日自定义：添加的工作日（如调休的周六日）
  customWorkdays: [],
  // 排除的工作日（从工作日中排除）
  excludedWorkdays: [],
  // 打卡记录自定义：排除的打卡记录日期
  excludedClockRecords: [],
  // 新增的打卡记录：{ date: '2025-12-01', time: '20:30' }
  customClockRecords: []
})

// 当前月份的统计数据
const currentMonthStats = computed(() => {
  if (!activeMonth.value) return null
  const monthData = monthsData.value.find(m => 
    m.year === activeMonth.value.year && m.month === activeMonth.value.month
  )
  if (monthData) {
    return monthData.stats
  }
  // 如果没有数据，直接计算当前月份的统计数据（即使没有打卡记录）
  return calculateMonthStatistics(activeMonth.value.year, activeMonth.value.month)
})

// 从localStorage加载数据
onMounted(() => {
  // 加载主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }

  // 加载自定义配置
  const savedConfig = localStorage.getItem('customConfig')
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig)
      // 确保所有字段都存在
      customConfig.value = {
        customWorkdays: parsed.customWorkdays || [],
        excludedWorkdays: parsed.excludedWorkdays || [],
        excludedClockRecords: parsed.excludedClockRecords || [],
        customClockRecords: parsed.customClockRecords || []
      }
    } catch (e) {
      console.error('加载自定义配置失败:', e)
      // 使用默认值
      customConfig.value = {
        customWorkdays: [],
        excludedWorkdays: [],
        excludedClockRecords: [],
        customClockRecords: []
      }
    }
  }

  // 加载统计数据
  const savedStatistics = localStorage.getItem('statistics')
  
  // 获取当前月份作为默认值
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  
  if (savedStatistics) {
    try {
      const data = JSON.parse(savedStatistics)
      monthsData.value = data.monthsData || []
      rawRecords.value = data.rawRecords || []
      processedRecords.value = data.processedRecords || []
      
      // 恢复选中的月份，默认选择当前月份
      const savedActiveMonth = data.activeMonth
      if (savedActiveMonth) {
        activeMonth.value = savedActiveMonth
      } else if (monthsData.value.length > 0) {
        // 如果没有保存的选中月份，选择当前月份或第一个月份
        const currentMonthData = monthsData.value.find(m => 
          m.year === currentYear && m.month === currentMonth
        )
        activeMonth.value = currentMonthData 
          ? { year: currentYear, month: currentMonth }
          : { year: monthsData.value[0].year, month: monthsData.value[0].month }
      } else {
        // 如果没有数据，默认显示当前月份
        activeMonth.value = { year: currentYear, month: currentMonth }
      }
    } catch (e) {
      console.error('加载统计数据失败:', e)
      // 如果加载失败，默认显示当前月份
      activeMonth.value = { year: currentYear, month: currentMonth }
    }
  } else {
    // 如果没有保存的数据，默认显示当前月份
    activeMonth.value = { year: currentYear, month: currentMonth }
  }
})

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// 处理文件上传
const handleFileUploaded = async (file) => {
  console.log('📤 [文件上传] 开始处理文件:', file.name)
  try {
    const { detail } = await parseExcel(file)
    console.log('📤 [文件上传] Excel解析完成，详情数据行数:', detail ? detail.length : 0)
    
    const records = parseDetailData(detail)
    console.log('📤 [文件上传] 解析出下班记录数:', records.length)
    rawRecords.value = records

    // 处理记录并计算统计
    calculateAllMonthsStatistics(records)
  } catch (error) {
    console.error('❌ [文件上传] 处理失败:', error)
    alert('处理文件失败: ' + error.message)
  }
}

// 计算所有月份的统计数据
const calculateAllMonthsStatistics = (records) => {
  // 处理打卡记录（考虑自定义配置）
  processedRecords.value = processClockRecords(records, customConfig.value)
  
  // 识别所有月份
  const months = detectMonths(records)
  
  // 为每个月份计算统计数据
  const allMonthsData = months.map(({ year, month }) => {
    const stats = calculateMonthStatistics(year, month)
    return {
      year,
      month,
      stats
    }
  })
  
  monthsData.value = allMonthsData
  
  // 设置默认选中的月份（只在没有选中月份或选中月份不在数据中时才设置）
  if (allMonthsData.length > 0) {
    // 如果已有选中的月份，检查是否还在数据中
    if (activeMonth.value) {
      const exists = allMonthsData.find(m => 
        m.year === activeMonth.value.year && m.month === activeMonth.value.month
      )
      if (exists) {
        // 选中的月份还在，保持不变
        return
      }
    }
    
    // 没有选中月份或选中的月份不在数据中，设置默认月份
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    
    const currentMonthData = allMonthsData.find(m => 
      m.year === currentYear && m.month === currentMonth
    )
    
    activeMonth.value = currentMonthData 
      ? { year: currentYear, month: currentMonth }
      : { year: allMonthsData[0].year, month: allMonthsData[0].month }
  }

  // 保存到localStorage
  saveToLocalStorage()
}

// 计算单个月份的统计数据
const calculateMonthStatistics = (year, month) => {
  console.log(`📊 [月份统计] 开始计算 ${year}年${month}月的统计数据`)
  console.log(`📊 [月份统计] 处理后的记录数: ${processedRecords.value.length}`)
  
  // 计算该月的加班时长
  const totalOvertime = calculateTotalOvertime(processedRecords.value, year, month)
  console.log(`📊 [月份统计] ${year}年${month}月 - 总加班时长: ${totalOvertime}小时`)
  
  // 计算实际上班天数（有打卡记录的日期，即使缺卡也算）
  const actualWorkedDays = processedRecords.value.filter(r => {
    if (!r.date) return false
    const date = new Date(r.date + 'T00:00:00')
    return date.getFullYear() === year && date.getMonth() + 1 === month
  }).length
  
  // 获取该月总工作日数（考虑工作日自定义）
  const totalWorkdays = getTotalWorkdaysInMonth(year, month, customConfig.value)
  
  // 计算已过去的工作日（从月初到今天）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDate(today)
  
  const allWorkdays = getWorkdaysInMonth(year, month, customConfig.value)
  
  // 判断是否是过去的月份
  const isPastMonth = year < today.getFullYear() || 
                      (year === today.getFullYear() && month < today.getMonth() + 1)
  
  let pastWorkdaysCount = 0
  if (isPastMonth) {
    // 如果是过去的月份，已过去工作日 = 总工作日
    pastWorkdaysCount = totalWorkdays
  } else if (year === today.getFullYear() && month === today.getMonth() + 1) {
    // 如果是当前月份，统计今天之前的工作日
    pastWorkdaysCount = allWorkdays.filter(dateStr => dateStr < todayStr).length
  } else {
    // 如果是未来月份，已过去工作日 = 0
    pastWorkdaysCount = 0
  }
  
  // 计算剩余工作日
  const remainingWorkdays = getRemainingWorkdays(year, month, actualWorkedDays, customConfig.value)
  
  // 计算距离22小时还差多少
  const targetHours = 22
  const remainingHours = Math.max(0, targetHours - totalOvertime)
  
  // 计算平均每天需要加班多少小时
  const avgHoursPerDay = remainingWorkdays > 0 ? (remainingHours / remainingWorkdays) : 0

  return {
    totalOvertime,
    actualWorkedDays, // 实际上班天数（有打卡记录的天数）
    totalWorkdays, // 总工作日数
    pastWorkdays: pastWorkdaysCount, // 已过去的工作日数
    remainingWorkdays,
    remainingHours,
    avgHoursPerDay
  }
}

// 切换月份
const handleMonthChange = (monthItem) => {
  activeMonth.value = monthItem
  saveToLocalStorage()
}

// 更新自定义配置
const updateCustomConfig = (config) => {
  customConfig.value = config
  // 保存当前选中的月份，避免重新计算时被重置
  const savedActiveMonth = activeMonth.value
  if (rawRecords.value.length > 0) {
    calculateAllMonthsStatistics(rawRecords.value)
    // 恢复之前选中的月份
    if (savedActiveMonth) {
      activeMonth.value = savedActiveMonth
    }
  }
  saveToLocalStorage()
}

// 清除缓存数据
const clearCache = () => {
  if (confirm('确定要清除所有缓存数据吗？这将清除统计数据、自定义配置等，但不会清除主题设置。')) {
    // 清除统计数据
    localStorage.removeItem('statistics')
    localStorage.removeItem('customConfig')
    
    // 重置数据
    monthsData.value = []
    activeMonth.value = null
    rawRecords.value = []
    processedRecords.value = []
    customConfig.value = {
      customWorkdays: [],
      excludedWorkdays: [],
      excludedClockRecords: [],
      customClockRecords: []
    }
    
    console.log('✅ [缓存清除] 已清除所有缓存数据')
    alert('缓存数据已清除')
  }
}

// 保存到localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('customConfig', JSON.stringify(customConfig.value))
  if (monthsData.value.length > 0) {
    localStorage.setItem('statistics', JSON.stringify({
      monthsData: monthsData.value,
      rawRecords: rawRecords.value,
      processedRecords: processedRecords.value,
      activeMonth: activeMonth.value
    }))
  }
}
</script>

