<template>
  <view class="h-full">
    <!-- 加载中 -->
    <view v-if="loading" class="flex flex-col items-center justify-center pt-320rpx">
      <wd-loading color="#018d71" />
      <text class="mt-24rpx text-26rpx text-[#999]">正在加载预览…</text>
    </view>
    <!-- 加载失败：提供下载兜底 -->
    <view v-else-if="failed" class="flex flex-col items-center justify-center px-60rpx pt-320rpx">
      <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
      <text class="mt-24rpx text-30rpx text-[#333]">预览加载失败</text>
      <text class="mt-12rpx text-center text-26rpx text-[#999]">文件服务可能暂不可用，可尝试下载后打开</text>
      <wd-button class="mt-48rpx" type="primary" plain @click="handleDownload">
        下载文件
      </wd-button>
      <wd-button class="mt-24rpx" type="text" @click="loadPreview">
        重试预览
      </wd-button>
    </view>
    <!-- 预览 -->
    <web-view v-else-if="previewUrl" :src="previewUrl" />
  </view>
</template>

<script lang="ts" setup>
import { getFilePreviewUrl } from '@/api/kkfileview'

defineOptions({
  name: 'CommonFilePreview',
})

definePage({
  style: {
    navigationBarTitleText: '文件预览',
  },
})

const loading = ref(true)
const failed = ref(false)
const previewUrl = ref('')
const fileUrl = ref('')
const fileName = ref('')

/** 获取预览地址并打开 */
async function loadPreview() {
  if (!fileUrl.value) {
    failed.value = true
    loading.value = false
    return
  }
  loading.value = true
  failed.value = false
  try {
    const data = await getFilePreviewUrl({ fileUrl: fileUrl.value, fileName: fileName.value })
    previewUrl.value = data.previewUrl
  } catch (e: any) {
    console.error('获取预览地址失败：', e)
    failed.value = true
  } finally {
    loading.value = false
  }
}

/** 下载兜底：App 端用下载管理器，H5 直接新窗口打开 */
function handleDownload() {
  // #ifdef H5
  window.open(fileUrl.value)
  // #endif
  // #ifndef H5
  uni.setClipboardData({
    data: fileUrl.value,
    success: () => {
      uni.showToast({ title: '文件地址已复制', icon: 'none' })
    },
  })
  // #endif
}

onLoad((query) => {
  fileUrl.value = decodeURIComponent(query?.fileUrl || '')
  fileName.value = decodeURIComponent(query?.fileName || '')
  if (fileName.value) {
    uni.setNavigationBarTitle({ title: fileName.value })
  }
  loadPreview()
})
</script>
