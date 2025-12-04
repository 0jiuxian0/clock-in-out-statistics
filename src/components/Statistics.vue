<template>
  <div class="statistics">
    <div class="section-header">
      <h2>{{ monthName || '统计信息' }}</h2>
      <button 
        class="exclude-btn"
        :class="{ 'dark': isDarkMode }"
        @click="showExcludeModal = true"
      >
        ⚙️ 排除日期
      </button>
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

    <!-- 排除日期模态框 -->
    <div v-if="showExcludeModal" class="modal-overlay" @click="showExcludeModal = false">
      <div class="modal-content" :class="{ 'dark': isDarkMode }" @click.stop>
        <div class="modal-header">
          <h3>排除日期设置</h3>
          <button class="close-btn" @click="showExcludeModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="hint">选择要排除的日期（这些日期的打卡记录将不计入统计）</p>
          <div class="excluded-dates-list">
            <div 
              v-for="date in customExcludedDates" 
              :key="date"
              class="date-tag"
              :class="{ 'dark': isDarkMode }"
            >
              {{ date }}
              <button @click="removeExcludedDate(date)">×</button>
            </div>
          </div>
          <div class="date-input-group">
            <input 
              type="date" 
              v-model="newExcludedDate"
              class="date-input"
              :class="{ 'dark': isDarkMode }"
            />
            <button 
              class="add-btn"
              :class="{ 'dark': isDarkMode }"
              @click="addExcludedDate"
              :disabled="!newExcludedDate"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  statistics: Object,
  monthName: String,
  customExcludedDates: Array,
  isDarkMode: Boolean
})

const emit = defineEmits(['update-excluded-dates'])

const showExcludeModal = ref(false)
const newExcludedDate = ref('')

const addExcludedDate = () => {
  if (newExcludedDate.value && !props.customExcludedDates.includes(newExcludedDate.value)) {
    const updated = [...props.customExcludedDates, newExcludedDate.value]
    emit('update-excluded-dates', updated)
    newExcludedDate.value = ''
  }
}

const removeExcludedDate = (date) => {
  const updated = props.customExcludedDates.filter(d => d !== date)
  emit('update-excluded-dates', updated)
}
</script>

<style scoped>
.statistics {
  margin-bottom: 2rem;
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
}
</style>

