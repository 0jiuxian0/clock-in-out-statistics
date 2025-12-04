/**
 * 计算加班补贴金额
 * @param {number} totalHours - 总加班时长（小时）
 * @returns {Object} 包含补贴金额和详细信息
 */
export function calculateSubsidy(totalHours) {
  if (totalHours < 22) {
    return {
      eligible: false,
      totalHours: totalHours,
      subsidyAmount: 0,
      rate: 0,
      message: '未达到22小时补贴门槛'
    }
  }
  
  let rate = 0
  let subsidyAmount = 0
  
  if (totalHours >= 22 && totalHours < 44) {
    rate = 15
    subsidyAmount = totalHours * rate
  } else if (totalHours >= 44 && totalHours < 66) {
    rate = 20
    subsidyAmount = totalHours * rate
  } else if (totalHours >= 66 && totalHours < 90) {
    rate = 23
    subsidyAmount = totalHours * rate
  } else if (totalHours >= 90) {
    rate = 25
    subsidyAmount = totalHours * rate
    // 封顶2500元
    if (subsidyAmount > 2500) {
      subsidyAmount = 2500
    }
  }
  
  return {
    eligible: true,
    totalHours: totalHours,
    subsidyAmount: subsidyAmount,
    rate: rate,
    message: `当前补贴标准: ${rate}元/小时`
  }
}

/**
 * 获取补贴档位信息
 * @returns {Array} 补贴档位数组
 */
export function getSubsidyTiers() {
  return [
    { min: 0, max: 22, rate: 0, label: '未达到补贴门槛' },
    { min: 22, max: 44, rate: 15, label: '15元/小时' },
    { min: 44, max: 66, rate: 20, label: '20元/小时' },
    { min: 66, max: 90, rate: 23, label: '23元/小时' },
    { min: 90, max: Infinity, rate: 25, label: '25元/小时（封顶2500元）' }
  ]
}

