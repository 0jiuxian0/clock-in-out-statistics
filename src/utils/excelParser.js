import * as XLSX from 'xlsx'

/**
 * 解析Excel文件
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 包含两个sheet的数据
 */
export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 获取两个sheet
        const sheetNames = workbook.SheetNames
        const overviewSheet = workbook.Sheets[sheetNames[0]] // 概况统计
        const detailSheet = workbook.Sheets[sheetNames[1]] || workbook.Sheets[sheetNames[0]] // 打卡详情
        
        const overviewData = XLSX.utils.sheet_to_json(overviewSheet, { header: 1 })
        const detailData = XLSX.utils.sheet_to_json(detailSheet, { header: 1 })
        
        resolve({
          overview: overviewData,
          detail: detailData
        })
      } catch (error) {
        reject(new Error('Excel文件解析失败: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 检测Excel格式类型
 * @param {Array} data - Excel数据
 * @returns {Object} 格式信息 { format: 'format1'|'format2', headerRow: number, dataStartRow: number }
 */
function detectFormat(data) {
  if (!data || data.length === 0) {
    return { format: 'format1', headerRow: 0, dataStartRow: 1 }
  }
  
  // 检查第一行是否包含标题（格式2的特征）
  const firstRow = data[0]
  const firstRowStr = firstRow ? firstRow.map(cell => String(cell || '')).join('') : ''
  
  // 格式2：第一行包含"打卡详情"或"概况统计"
  if (firstRowStr.includes('打卡详情') || firstRowStr.includes('概况统计')) {
    console.log('📊 [Excel解析] 检测到格式2（Excel源文件格式）')
    
    // 查找表头行（包含"日期"和"打卡类型"的行）
    let headerRow = -1
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      const rowStr = row.map(cell => String(cell || '')).join('')
      // 检查是否包含"日期"和"打卡类型"（或"类型"）
      if (rowStr.includes('日期') && (rowStr.includes('打卡类型') || rowStr.includes('类型'))) {
        headerRow = i
        break
      }
    }
    
    if (headerRow === -1) {
      console.warn('⚠️ [Excel解析] 无法找到表头行，使用默认位置')
      headerRow = 2 // 格式2默认表头在第3行（索引2）
    }
    
    // 数据起始行：表头行 + 2（跳过表头行和可能的空行）
    // 对于详情sheet，表头后通常有一个空行，所以+2
    let dataStartRow = headerRow + 2
    
    // 检查表头行+1是否是空行，如果不是，则数据从表头行+1开始
    const nextRow = data[headerRow + 1]
    if (nextRow && nextRow.length > 0 && !nextRow.every(cell => !cell || String(cell).trim() === '')) {
      // 下一行不是空行，数据从表头行+1开始
      dataStartRow = headerRow + 1
    }
    
    return { format: 'format2', headerRow, dataStartRow }
  } else {
    console.log('📊 [Excel解析] 检测到格式1（智能表格导出格式）')
    return { format: 'format1', headerRow: 0, dataStartRow: 1 }
  }
}

/**
 * 解析打卡详情数据
 * @param {Array} detailData - 打卡详情原始数据
 * @returns {Array} 解析后的打卡记录
 */
export function parseDetailData(detailData) {
  console.log('📊 [Excel解析] 开始解析打卡详情数据')
  console.log('📊 [Excel解析] 数据行数:', detailData ? detailData.length : 0)
  
  if (!detailData || detailData.length < 2) {
    console.warn('⚠️ [Excel解析] 数据为空或格式不正确')
    return []
  }
  
  // 检测格式
  const formatInfo = detectFormat(detailData)
  console.log('📊 [Excel解析] 格式信息:', formatInfo)
  
  const headers = detailData[formatInfo.headerRow]
  if (!headers || headers.length === 0) {
    console.error('❌ [Excel解析] 表头行为空')
    throw new Error('Excel格式不正确，无法找到表头')
  }
  
  console.log('📊 [Excel解析] 表头:', headers)
  const records = []
  
  // 找到关键列的索引（支持多种可能的列名）
  const dateIndex = headers.findIndex(h => {
    if (!h) return false
    const hStr = String(h).trim()
    return hStr.includes('日期') || hStr === '日期' || hStr === '时间'
  })
  const typeIndex = headers.findIndex(h => {
    if (!h) return false
    const hStr = String(h).trim()
    return hStr.includes('打卡类型') || hStr === '打卡类型' || hStr.includes('类型')
  })
  // 优先查找"实际打卡时间"，避免匹配到"应打卡时间"
  // Excel中有两列：应打卡时间（都是18:30）和实际打卡时间（真正的下班时间）
  let timeIndex = headers.findIndex(h => {
    if (!h) return false
    const hStr = String(h).trim()
    // 精确匹配"实际打卡时间"
    return hStr === '实际打卡时间'
  })
  
  // 如果找不到精确匹配，尝试包含"实际打卡时间"的列
  if (timeIndex === -1) {
    timeIndex = headers.findIndex(h => {
      if (!h) return false
      const hStr = String(h).trim()
      return hStr.includes('实际打卡时间')
    })
  }
  
  // 如果还是找不到，尝试其他包含"打卡时间"的列，但排除"应打卡时间"
  if (timeIndex === -1) {
    timeIndex = headers.findIndex(h => {
      if (!h) return false
      const hStr = String(h).trim()
      // 排除"应打卡时间"，只匹配其他包含"打卡时间"的列
      return hStr.includes('打卡时间') && 
             !hStr.includes('应打卡时间') && 
             hStr !== '应打卡时间'
    })
  }
  
  console.log('📊 [Excel解析] 列索引 - 日期:', dateIndex, '打卡类型:', typeIndex, '实际打卡时间:', timeIndex)
  if (timeIndex !== -1) {
    console.log('📊 [Excel解析] 实际打卡时间列名:', headers[timeIndex])
  }
  
  if (dateIndex === -1 || typeIndex === -1 || timeIndex === -1) {
    console.error('❌ [Excel解析] 缺少必要的列')
    throw new Error('Excel格式不正确，缺少必要的列')
  }
  
  // 解析数据行
  let processedCount = 0
  let skippedCount = 0
  
  for (let i = formatInfo.dataStartRow; i < detailData.length; i++) {
    const row = detailData[i]
    if (!row || row.length === 0) continue
    
    // 跳过空行（格式2可能在表头后有空行）
    if (row.every(cell => !cell || String(cell).trim() === '')) continue
    
    const date = row[dateIndex]
    const type = row[typeIndex]
    const time = row[timeIndex]
    
    // 只处理下班记录（即使time为空也要记录，因为可能是缺卡）
    if (type && (type.includes('下班') || type === '下班')) {
      if (date) {
        const record = {
          date: date,
          type: type,
          time: time || '', // 允许time为空（缺卡情况）
          rawRow: row
        }
        records.push(record)
        processedCount++
        
        // 打印前5条记录作为示例
        if (processedCount <= 5) {
          console.log(`📝 [Excel解析] 记录 ${processedCount}:`, {
            日期: date,
            类型: type,
            时间: time || '(空)',
            原始时间值: time
          })
        }
      } else {
        skippedCount++
      }
    } else {
      skippedCount++
    }
  }
  
  console.log(`✅ [Excel解析] 解析完成 - 处理了 ${processedCount} 条下班记录，跳过 ${skippedCount} 条`)
  console.log('📊 [Excel解析] 前3条记录详情:', records.slice(0, 3))
  
  return records
}

