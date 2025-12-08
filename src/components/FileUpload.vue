<template>
  <div class="file-upload">
    <div 
      class="upload-area"
      :class="{ 'dark': isDarkMode, 'dragover': isDragover }"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <input 
        ref="fileInput"
        type="file" 
        id="file-input" 
        accept=".xlsx,.xls"
        @change="handleFileSelect"
        style="display: none"
      />
      <label for="file-input" class="upload-label">
        <div class="upload-icon">📁</div>
        <p class="upload-text">点击或拖拽Excel文件到此处</p>
        <p class="upload-hint">支持 .xlsx 和 .xls 格式</p>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isDarkMode: Boolean
})

const emit = defineEmits(['file-uploaded'])

const isDragover = ref(false)
const fileInput = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('file-uploaded', file)
    // 清空input的value，确保下次选择同一文件时也能触发change事件
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleDrop = (event) => {
  isDragover = false
  const file = event.dataTransfer.files[0]
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    emit('file-uploaded', file)
    // 清空input的value
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } else {
    alert('请上传Excel文件（.xlsx 或 .xls）')
  }
}
</script>

<style scoped>
.file-upload {
  margin-bottom: 2rem;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
}

.upload-area:hover {
  border-color: #4a90e2;
  background: #f0f7ff;
}

.upload-area.dragover {
  border-color: #4a90e2;
  background: #e8f4ff;
  transform: scale(1.02);
}

.upload-area.dark {
  background: #2a2a2a;
  border-color: #555;
}

.upload-area.dark:hover {
  border-color: #6a9bd8;
  background: #1e1e1e;
}

.upload-area.dark.dragover {
  border-color: #6a9bd8;
  background: #252525;
}

.upload-label {
  cursor: pointer;
  display: block;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0.5rem 0;
  color: #333;
}

.dark .upload-text {
  color: #e0e0e0;
}

.upload-hint {
  font-size: 0.9rem;
  color: #666;
  margin: 0.5rem 0 0;
}

.dark .upload-hint {
  color: #aaa;
}
</style>

