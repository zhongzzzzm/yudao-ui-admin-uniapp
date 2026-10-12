<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="报价复核" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 结论筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in conclusionChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentConclusion === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleConclusionChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <!-- 复核批次列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无复核记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.quoteName || item.fileName || `复核批次 #${item.id}` }}
            </view>
            <wd-tag :type="statusTagType(item)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              {{ verifyTypeLabel(item.verifyType) }} · 基准：{{ item.basisType === 1 ? (item.quoteCode || '关联方案') : '临时参数' }} · {{ item.importTaxMode === 1 ? '含税' : '去税' }}
            </view>
            <view class="line-clamp-1">
              容差：{{ item.tolerance }}{{ item.toleranceUnit === 2 ? '%' : ' 元' }} · 一致率 {{ formatPercent(item.matchRate) }}%
            </view>
            <view class="line-clamp-1">
              差异行数：<text :class="item.diffCount ? 'text-[#f5222d]' : ''">{{ item.diffCount ?? 0 }}</text>
              · 差异合计 {{ formatMoney(item.totalDiff) }}
            </view>
            <view v-if="item.errorMsg" class="line-clamp-2 text-[#f5222d]">
              {{ item.errorMsg }}
            </view>
            <view class="line-clamp-1">
              创建时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteVerifyBatchVO } from '@/api/fl/quoteVerify'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatMoney, formatPercent } from '@/utils/format'
import { ref } from 'vue'
import { getQuoteVerifyPage } from '@/api/fl/quoteVerify'

defineOptions({
  name: 'FlQuoteVerifyList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

function handleBack() {
  navigateBackPlus()
}

/** 核对结论筛选：-1 全部 */
const conclusionChips = [
  { label: '全部', value: -1 },
  { label: '存在差异', value: 2 },
  { label: '全部一致', value: 1 },
]
const currentConclusion = ref(-1)
const list = ref<QuoteVerifyBatchVO[]>([])
const pagingRef = ref<any>()

function handleConclusionChange(value: number) {
  if (currentConclusion.value === value) {
    return
  }
  currentConclusion.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getQuoteVerifyPage({
      pageNo,
      pageSize,
      conclusion: currentConclusion.value === -1 ? undefined : currentConclusion.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function verifyTypeLabel(verifyType?: number): string {
  return verifyType === 2 ? '计提表复核' : '报价表复核'
}

/** 核对中=primary / 失败=error / 有差异=warning / 全部一致=success */
function statusTagType(item: QuoteVerifyBatchVO): 'primary' | 'success' | 'warning' | 'error' {
  if (item.status === 2) {
    return 'error'
  }
  if (item.status === 0) {
    return 'primary'
  }
  return item.conclusion === 2 ? 'warning' : 'success'
}

function statusLabel(item: QuoteVerifyBatchVO): string {
  if (item.status === 2) {
    return '核对失败'
  }
  if (item.status === 0) {
    return '核对中'
  }
  return item.conclusion === 2 ? '存在差异' : '全部一致'
}

function goDetail(item: QuoteVerifyBatchVO) {
  uni.navigateTo({ url: `/pages-fl/quoteverify/detail?id=${item.id}` })
}
</script>
