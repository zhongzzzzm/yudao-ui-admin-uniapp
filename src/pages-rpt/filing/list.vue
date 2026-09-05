<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="报送任务" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 阶段筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in stageChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentStage === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleStageChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <!-- 任务列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无报送任务"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm"
          @click="goDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
                {{ item.templateName || '报送任务' }}
              </view>
              <wd-tag :type="stageTagType(item.combinedStage)" plain class="ml-16rpx flex-shrink-0">
                {{ stageLabel(item.combinedStage) }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#777] space-y-6rpx">
              <view class="line-clamp-1">
                报送：{{ item.submitName || '-' }}
              </view>
              <view v-if="item.reviewTotalCount != null" class="line-clamp-1">
                复核进度：{{ item.reviewDoneCount ?? 0 }}/{{ item.reviewTotalCount }}
              </view>
              <view class="line-clamp-1">
                创建时间：{{ formatDateTime(item.createTime) }}
              </view>
            </view>
            <view
              v-if="deadlineHint(item)"
              class="mt-12rpx text-24rpx"
              :class="deadlineHint(item)!.danger ? 'text-[#f5222d]' : 'text-[#fa8c16]'"
            >
              {{ deadlineHint(item)!.text }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TaxReportFilingVO } from '@/api/rpt/filing'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import {
  FILING_COMBINED_STAGE,
  FILING_STAGE_TAG_TYPE,
  getTaxReportFilingPage,
} from '@/api/rpt/filing'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'FilingList',
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

/** 阶段筛选：按业务动作组织 */
const stageChips = [
  { label: '可生成', value: 'canGenerate' },
  { label: '待生成', value: 'waitGenerate' },
  { label: '生成失败', value: 'generateFail' },
  { label: '待复核', value: 'waitReview' },
  { label: '已完成', value: 'reviewDone' },
  { label: '全部', value: '' },
]
const currentStage = ref('canGenerate')
const list = ref<TaxReportFilingVO[]>([])
const pagingRef = ref<any>()

function handleStageChange(value: string) {
  if (currentStage.value === value) {
    return
  }
  currentStage.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTaxReportFilingPage({
      pageNo,
      pageSize,
      combinedStatus: currentStage.value || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function stageLabel(stage?: string) {
  return (FILING_COMBINED_STAGE as Record<string, string>)[stage ?? ''] ?? '待执行'
}

function stageTagType(stage?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' {
  return FILING_STAGE_TAG_TYPE[stage ?? ''] ?? 'info'
}

/** 截止日提示（临近 3 天标橙、逾期标红） */
function deadlineHint(item: TaxReportFilingVO): { text: string, danger: boolean } | null {
  if (!item.submitDeadline || ['reviewDone', 'generated'].includes(item.combinedStage ?? '')) {
    return null
  }
  const days = Math.ceil((new Date(item.submitDeadline).getTime() - Date.now()) / 86400000)
  if (days < 0) {
    return { text: `报送已逾期 ${-days} 天`, danger: true }
  }
  if (days <= 3) {
    return { text: days === 0 ? '报送今天截止' : `报送 ${days} 天后截止`, danger: false }
  }
  return null
}

function goDetail(item: TaxReportFilingVO) {
  uni.navigateTo({ url: `/pages-rpt/filing/detail?id=${item.id}` })
}
</script>
