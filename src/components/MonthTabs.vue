<template>
  <div class="month-tabs">
    <div class="tabs-container" :class="{ 'dark': isDarkMode }">
      <button
        v-for="monthItem in months"
        :key="`${monthItem.year}-${monthItem.month}`"
        class="tab-button"
        :class="{ 
          'active': isActive(monthItem),
          'dark': isDarkMode
        }"
        @click="$emit('month-change', monthItem)"
      >
        {{ formatMonthName(monthItem.year, monthItem.month) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatMonthName } from '../utils/monthDetector.js'

const props = defineProps({
  months: Array,
  activeMonth: Object,
  isDarkMode: Boolean
})

defineEmits(['month-change'])

const isActive = (monthItem) => {
  return props.activeMonth && 
         props.activeMonth.year === monthItem.year && 
         props.activeMonth.month === monthItem.month
}
</script>

<style scoped>
.month-tabs {
  margin-bottom: 2rem;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.tabs-container.dark {
  border-bottom-color: #444;
}

.tab-button {
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

.tab-button:hover {
  background: #f5f5f5;
  color: #333;
}

.tab-button.dark {
  color: #aaa;
}

.tab-button.dark:hover {
  background: #333;
  color: #e0e0e0;
}

.tab-button.active {
  color: #4a90e2;
  background: #f0f7ff;
  font-weight: 600;
}

.tab-button.active.dark {
  color: #6a9bd8;
  background: #1a2332;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #4a90e2;
}

.tab-button.active.dark::after {
  background: #6a9bd8;
}

@media (max-width: 768px) {
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>

