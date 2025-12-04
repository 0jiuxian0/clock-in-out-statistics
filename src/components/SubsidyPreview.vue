<template>
  <div class="subsidy-preview">
    <h2>补贴金额预估</h2>
    
    <div class="subsidy-card" :class="{ 'dark': isDarkMode, 'eligible': subsidy.eligible }">
      <div class="subsidy-header">
        <div class="subsidy-label">当前预估补贴</div>
        <div class="subsidy-amount">
          <span class="currency">¥</span>
          <span class="amount">{{ subsidy.subsidyAmount.toFixed(2) }}</span>
        </div>
      </div>
      <div class="subsidy-details">
        <div class="detail-item">
          <span class="detail-label">累计加班时长：</span>
          <span class="detail-value">{{ subsidy.totalHours.toFixed(1) }} 小时</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">补贴标准：</span>
          <span class="detail-value">{{ subsidy.message }}</span>
        </div>
        <div v-if="!subsidy.eligible" class="warning-message">
          ⚠️ 还需加班 {{ (22 - subsidy.totalHours).toFixed(1) }} 小时才能达到补贴门槛
        </div>
      </div>
    </div>

    <div class="tiers-section">
      <h3>补贴档位说明</h3>
      <div class="tiers-list">
        <div 
          v-for="(tier, index) in tiers" 
          :key="index"
          class="tier-item"
          :class="{ 
            'dark': isDarkMode,
            'active': isInTier(subsidy.totalHours, tier),
            'current': isCurrentTier(subsidy.totalHours, tier)
          }"
        >
          <div class="tier-range">
            <span v-if="tier.min === 0">0小时</span>
            <span v-else>{{ tier.min }}小时</span>
            <span> - </span>
            <span v-if="tier.max === Infinity">∞</span>
            <span v-else>{{ tier.max }}小时</span>
          </div>
          <div class="tier-rate">{{ tier.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateSubsidy, getSubsidyTiers } from '../utils/subsidyCalculator.js'

const props = defineProps({
  totalOvertime: Number,
  isDarkMode: Boolean
})

const subsidy = computed(() => calculateSubsidy(props.totalOvertime))
const tiers = computed(() => getSubsidyTiers())

const isInTier = (hours, tier) => {
  return hours >= tier.min && hours < tier.max
}

const isCurrentTier = (hours, tier) => {
  return hours >= tier.min && hours < tier.max && tier.rate > 0
}
</script>

<style scoped>
.subsidy-preview {
  margin-bottom: 2rem;
}

.subsidy-preview h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.subsidy-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  transition: all 0.3s;
}

.subsidy-card.eligible {
  border-color: #4a90e2;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
}

.subsidy-card.dark {
  background: #2a2a2a;
  border-color: #444;
}

.subsidy-card.dark.eligible {
  border-color: #4a90e2;
  background: linear-gradient(135deg, #1a2332 0%, #2a2a2a 100%);
}

.subsidy-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.subsidy-label {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.subsidy-card.dark .subsidy-label {
  color: #aaa;
}

.subsidy-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.currency {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a90e2;
}

.amount {
  font-size: 3rem;
  font-weight: bold;
  color: #4a90e2;
}

.subsidy-details {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.subsidy-card.dark .subsidy-details {
  border-top-color: #444;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.detail-label {
  color: #666;
}

.subsidy-card.dark .detail-label {
  color: #aaa;
}

.detail-value {
  font-weight: 500;
  color: #333;
}

.subsidy-card.dark .detail-value {
  color: #e0e0e0;
}

.warning-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 6px;
  color: #856404;
  text-align: center;
}

.subsidy-card.dark .warning-message {
  background: #3d2f1a;
  color: #ffc107;
}

.tiers-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.tiers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tier-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.tier-item.dark {
  background: #2a2a2a;
  border-color: #444;
}

.tier-item.active {
  background: #e8f4ff;
  border-color: #4a90e2;
}

.tier-item.dark.active {
  background: #1a2332;
  border-color: #4a90e2;
}

.tier-item.current {
  background: #4a90e2;
  color: white;
  border-color: #357abd;
  font-weight: bold;
}

.tier-range {
  font-size: 0.95rem;
}

.tier-rate {
  font-size: 0.95rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .subsidy-amount .amount {
    font-size: 2.5rem;
  }
  
  .tier-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>

