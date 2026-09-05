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
    <!-- 图片：直接展示原图（不依赖 kkFileView），点击可缩放 -->
    <view v-else-if="isImage" class="h-100vh w-full flex items-center justify-center bg-[#f0f2f5]" @click="previewImage">
      <image :src="fileUrl" mode="aspectFit" class="h-90vh w-full" />
    </view>
    <!-- 文档：kkFileView 预览 -->
    <template v-else-if="previewUrl">
      <web-view :src="previewUrl" />
      <!-- #ifdef H5 -->
      <!-- 悬浮兜底：kkFileView 服务不可达时 web-view 会黑屏，保留下载/重试出路 -->
      <view class="absolute right-24rpx top-16rpx z-1000 flex gap-12rpx">
        <wd-button size="small" plain custom-class="!bg-white/90" @click="handleDownload">
          下载
        </wd-button>
        <wd-button size="small" plain custom-class="!bg-white/90" @click="loadPreview">
          重试
        </wd-button>
      </view>
      <!-- #endif -->
    </template>
  </view>
</template>

<script lang="ts" setup>
import { getFilePreviewUrl } from '@/api/kkfileview'
import { computed } from 'vue'

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

/** 图片类型直接展示原图，不依赖 kkFileView 服务 */
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
const isImage = computed(() => {
  const name = decodeURIComponent(fileUrl.value.split('?')[0])
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  return IMAGE_EXTS.includes(ext)
})

/** 点击图片调系统预览（支持缩放） */
function previewImage() {
  if (fileUrl.value) {
    uni.previewImage({ urls: [fileUrl.value] })
  }
}

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
  // 图片直接展示，不请求 kkFileView
  if (isImage.value) {
    loading.value = false
    return
  }
  loadPreview()
})
</script>
