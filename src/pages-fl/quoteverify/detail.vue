<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="复核详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 展示视图切换：差异明细 / 全量对照 -->
    <view v-if="batch?.status === 1" class="flex gap-16rpx bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in viewChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentView === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleViewChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!batch" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDetail">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 批次概要 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ batch.quoteName || batch.fileName || `复核批次 #${batch.id}` }}
            </text>
            <wd-tag :type="statusTagType" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view>
              {{ batch.verifyType === 2 ? '计提表复核' : '报价表复核' }} · 基准：{{ batch.basisType === 1 ? (batch.quoteCode || '关联方案') : '临时参数' }}
            </view>
            <view>
              容差：{{ batch.tolerance }}{{ batch.toleranceUnit === 2 ? '%' : ' 元' }} · 口径：{{ batch.importTaxMode === 1 ? '含税' : '去税' }}
            </view>
            <view v-if="batch.dataPeriod">
              数据期间：{{ batch.dataPeriod }}
            </view>
            <view v-if="batch.errorMsg" class="text-[#f5222d]">
              {{ batch.errorMsg }}
            </view>
          </view>
          <!-- 汇总指标（核对完成才有） -->
          <view v-if="batch.status === 1" class="grid grid-cols-3 mt-16rpx gap-12rpx border-t border-t-[#f0f0f0] pt-16rpx">
            <view class="text-center">
              <view class="text-24rpx text-[#999]">
                一致率
              </view>
              <view class="text-28rpx text-[#333] font-500">
                {{ formatPercent(batch.matchRate) }}%
              </view>
            </view>
            <view class="text-center">
              <view class="text-24rpx text-[#999]">
                差异行数
              </view>
              <view class="text-28rpx font-500" :class="batch.diffCount ? 'text-[#f5222d]' : 'text-[#333]'">
                {{ batch.diffCount ?? 0 }}
              </view>
            </view>
            <view class="text-center">
              <view class="text-24rpx text-[#999]">
                差异合计
              </view>
              <view class="text-28rpx font-500" :class="batch.totalDiff ? 'text-[#f5222d]' : 'text-[#333]'">
                {{ formatMoney(batch.totalDiff) }}
              </view>
            </view>
          </view>
        </view>

        <!-- 差异明细（分页列表） -->
        <template v-if="currentView === 'diff'">
          <view
            v-for="item in diffList"
            :key="item.id"
            class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
                {{ item.matchKey }} · {{ fieldLabel(item.fieldName) }}
              </text>
              <wd-tag :type="diffTagType(item.conclusion)" plain class="ml-16rpx flex-shrink-0">
                {{ diffLabel(item.conclusion) }}
              </wd-tag>
            </view>
            <view class="text-24rpx text-[#777] space-y-4rpx">
              <view>导入值：{{ formatMoney(item.importValue) }}</view>
              <view>系统值：{{ formatMoney(item.systemValue) }}</view>
              <view>
                差额 <text class="text-[#f5222d]">{{ formatMoney(item.diffValue) }}</text>
                <template v-if="item.diffRatio != null">
                  （{{ formatPercent(item.diffRatio) }}%）
                </template>
              </view>
            </view>
          </view>
          <view v-if="diffHasMore" class="pb-40rpx text-center text-24rpx text-[#018d71]" @click="loadMoreDiffs">
            加载更多
          </view>
          <view v-else-if="diffList.length" class="pb-40rpx text-center text-24rpx text-[#999]">
            没有更多了
          </view>
          <view v-else class="py-60rpx text-center text-26rpx text-[#999]">
            暂无差异明细
          </view>
        </template>

        <!-- 全量对照 -->
        <template v-else>
          <view
            v-for="(row, index) in compareRows"
            :key="index"
            class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
                {{ row.label || row.matchKey }}
              </text>
              <wd-tag :type="diffTagType(row.conclusion)" plain class="ml-16rpx flex-shrink-0">
                {{ diffLabel(row.conclusion) }}
              </wd-tag>
            </view>
            <view class="text-24rpx text-[#777] space-y-4rpx">
              <view>导入：租金 {{ formatMoney(row.importCash) }} · 本金 {{ formatMoney(row.importCorpus) }} · 利息 {{ formatMoney(row.importInterest) }}</view>
              <view>系统：租金 {{ formatMoney(row.systemCash) }} · 本金 {{ formatMoney(row.systemCorpus) }} · 利息 {{ formatMoney(row.systemInterest) }}</view>
              <view v-if="row.diff">
                差额 <text class="text-[#f5222d]">{{ formatMoney(row.diff) }}</text>
              </view>
            </view>
          </view>
          <view v-if="compareRows.length" class="pb-40rpx text-center text-24rpx text-[#999]">
            共 {{ compareRows.length }} 行对照
          </view>
          <view v-else class="py-60rpx text-center text-26rpx text-[#999]">
            暂无对照数据
          </view>
        </template>
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteVerifyBatchVO, QuoteVerifyCompareRowVO, QuoteVerifyDiffVO } from '@/api/fl/quoteVerify'
import { navigateBackPlus } from '@/utils'
import { getQuoteVerify, getQuoteVerifyCompareRows, getQuoteVerifyDiffPage, VERIFY_FIELD_LABELS } from '@/api/fl/quoteVerify'
import { formatMoney, formatPercent } from '@/utils/format'
import { computed, ref } from 'vue'

defineOptions({
  name: 'FlQuoteVerifyDetail',
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

const PAGE_SIZE = 20

const loading = ref(false)
const batch = ref<QuoteVerifyBatchVO>()
const batchId = ref<number>()

const viewChips: { label: string, value: 'diff' | 'compare' }[] = [
  { label: '差异明细', value: 'diff' },
  { label: '全量对照', value: 'compare' },
]
const currentView = ref<'diff' | 'compare'>('diff')

const statusTagType = computed<'primary' | 'success' | 'warning' | 'error'>(() => {
  if (batch.value?.status === 2) {
    return 'error'
  }
  if (batch.value?.status === 0) {
    return 'primary'
  }
  return batch.value?.conclusion === 2 ? 'warning' : 'success'
})
const statusLabel = computed(() => {
  if (batch.value?.status === 2) {
    return '核对失败'
  }
  if (batch.value?.status === 0) {
    return '核对中'
  }
  return batch.value?.conclusion === 2 ? '存在差异' : '全部一致'
})

function fieldLabel(field?: string): string {
  return VERIFY_FIELD_LABELS[field ?? ''] ?? field ?? '-'
}

/** 结论文案：1 一致 2 差异 3 导入多余 4 系统多余 */
function diffLabel(conclusion?: number): string {
  return { 1: '一致', 2: '差异', 3: '导入多余', 4: '系统多余' }[conclusion ?? 0] ?? '-'
}

function diffTagType(conclusion?: number): 'success' | 'warning' | 'error' {
  if (conclusion === 1) {
    return 'success'
  }
  return conclusion === 2 ? 'warning' : 'error'
}

// ========== 差异明细分页 ==========

const diffList = ref<QuoteVerifyDiffVO[]>([])
const diffPageNo = ref(1)
const diffHasMore = ref(false)
const diffLoading = ref(false)

async function loadDiffs(reset: boolean) {
  if (!batchId.value || diffLoading.value) {
    return
  }
  diffLoading.value = true
  try {
    if (reset) {
      diffPageNo.value = 1
      diffList.value = []
    }
    const data = await getQuoteVerifyDiffPage(batchId.value, {
      pageNo: diffPageNo.value,
      pageSize: PAGE_SIZE,
    })
    diffList.value.push(...data.list)
    diffHasMore.value = diffPageNo.value * PAGE_SIZE < data.total
    diffPageNo.value += 1
  } finally {
    diffLoading.value = false
  }
}

function loadMoreDiffs() {
  loadDiffs(false)
}

// ========== 全量对照 ==========

const compareRows = ref<QuoteVerifyCompareRowVO[]>([])

async function loadCompareRows() {
  if (!batchId.value) {
    return
  }
  const data = await getQuoteVerifyCompareRows(batchId.value)
  compareRows.value = data.rows ?? []
}

function handleViewChange(value: 'diff' | 'compare') {
  if (currentView.value === value) {
    return
  }
  currentView.value = value
  if (value === 'compare' && !compareRows.value.length) {
    loadCompareRows().catch(() => {})
  }
}

onLoad((query) => {
  batchId.value = Number(query?.id)
  loadDetail()
})

async function loadDetail() {
  if (!batchId.value) {
    return
  }
  loading.value = true
  try {
    batch.value = await getQuoteVerify(batchId.value)
    // 已完成才有差异/对照
    if (batch.value?.status === 1) {
      await loadDiffs(true)
    }
  } finally {
    loading.value = false
  }
}
</script>
