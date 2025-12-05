import * as XLSX from 'xlsx'

/**
 * 导出打卡记录为Excel文件
 * @param {Array} records - 打卡记录数组
 * @param {string} filename - 文件名（可选）
 */
export function exportToExcel(records, filename = '打卡记录') {
  if (!records || records.length === 0) {
    alert('没有可导出的打卡记录')
    return
  }

  console.log('📤 [Excel导出] 开始导出打卡记录，记录数:', records.length)

  // 创建打卡详情数据
  const detailData = []
  
  // 表头
  detailData.push(['日期', '打卡类型', '实际打卡时间'])
  
  // 数据行（只导出下班记录）
  records.forEach(record => {
    if (record.type && (record.type.includes('下班') || record.type === '下班')) {
      detailData.push([
        record.date || '',
        record.type || '下班',
        record.time || ''
      ])
    }
  })

  // 创建概况统计数据（简化版，只包含基本信息）
  const overviewData = []
  overviewData.push(['概况统计'])
  overviewData.push(['导出时间', new Date().toLocaleString('zh-CN')])
  overviewData.push(['记录总数', records.length])
  overviewData.push(['下班记录数', detailData.length - 1]) // 减去表头

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  
  // 创建工作表
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData)
  
  // 设置列宽
  overviewSheet['!cols'] = [{ wch: 15 }, { wch: 30 }]
  detailSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }]
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, overviewSheet, '概况统计与打卡明细')
  XLSX.utils.book_append_sheet(workbook, detailSheet, '打卡详情')
  
  // 生成文件名（包含日期）
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const finalFilename = `${filename}_${dateStr}.xlsx`
  
  // 导出文件
  XLSX.writeFile(workbook, finalFilename)
  
  console.log('✅ [Excel导出] 导出完成:', finalFilename)
}

