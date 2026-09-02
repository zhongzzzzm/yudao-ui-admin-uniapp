<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="错误原因" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 搜索：按规则编码/原因过滤 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search v-model="keyword" placeholder="搜索规则编码 / 原因" hide-cancel />
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex justify-center py-80rpx">
        <wd-loading color="#018d71" />
      </view>
      <view v-else-if="filteredList.length === 0" class="py-120rpx text-center text-26rpx text-[#999]">
        {{ keyword ? '没有匹配的错误原因' : '该任务没有未通过的规则' }}
      </view>
      <view v-else class="p-24rpx">
        <view
          v-for="item in filteredList"
          :key="item.id"
          class="mb-20rpx rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="copyReason(item)"
        >
          <view class="mb-8rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.ruleCode }}
            </view>
            <wd-tag v-if="!item.passed" type="error" plain class="ml-16rpx flex-shrink-0">
              未通过
            </wd-tag>
          </view>
          <view v-if="item.ruleDescription" class="line-clamp-2 mb-8rpx text-24rpx text-[#777]">
            {{ item.ruleDescription }}
          </view>
          <view class="whitespace-pre-wrap rounded-12rpx bg-[#f7f8f9] p-16rpx text-24rpx text-[#555]">
            {{ item.reason || '未维护原因' }}
          </view>
        </view>
        <view class="pb-24rpx text-center text-22rpx text-[#bbb]">
          点击卡片可复制原因
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TaskErrorReasonVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { computed, ref } from 'vue'
import { getTaskErrorReasons } from '@/api/validation/task'

defineOptions({
  name: 'ValidationErrorReasons',
})

function handleBack() {
  navigateBackPlus()
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const taskId = ref<number>()
const loading = ref(false)
const all = ref<TaskErrorReasonVO[]>([])
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    return all.value
  }
  return all.value.filter(item =>
    String(item.ruleCode || '').toLowerCase().includes(kw)
    || String(item.reason || '').toLowerCase().includes(kw)
    || String(item.ruleDescription || '').toLowerCase().includes(kw),
  )
})

async function load() {
  if (!taskId.value) {
    return
  }
  loading.value = true
  try {
    all.value = await getTaskErrorReasons(taskId.value) || []
  } catch {
    all.value = []
    uni.showToast({ title: '加载失败，请下拉重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function copyReason(item: TaskErrorReasonVO) {
  if (!item.reason) {
    return
  }
  uni.setClipboardData({
    data: item.reason,
    success: () => {
      uni.showToast({ title: '原因已复制', icon: 'none' })
    },
  })
}

onLoad((query) => {
  taskId.value = Number(query?.id)
  load()
})
</script>
