<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="落表数据" placeholder safe-area-inset-top fixed @click-left="handleBack"
    >
      <template #right>
        <view class="text-26rpx text-[#018d71]" @click="openTrendPanel">
          差异趋势
        </view>
      </template>
    </wd-navbar>

    <view class="flex gap-16rpx bg-white px-24rpx py-16rpx">
      <view
        v-for="tab in FETCH_TABS"
        :key="tab.path"
        class="flex-1 rounded-full py-12rpx text-center text-26rpx"
        :class="tab.path === currentPath ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="goFetchTab(tab.path, currentPath)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="bg-[#fffbe6] px-24rpx py-12rpx text-24rpx text-[#fa8c16]">
      {{ FETCH_READONLY_TIP }}
    </view>

    <view class="flex items-center gap-16rpx bg-white px-24rpx py-16rpx">
      <input
        v-model="periodKeyword"
        class="min-h-72rpx flex-1 rounded-12rpx bg-[#f7f8f9] px-20rpx text-26rpx"
        type="text"
        confirm-type="search"
        placeholder="搜索取数期间，如 2026-08"
        @confirm="reloadList"
      >
      <view class="rounded-12rpx bg-[#e6f7f1] px-24rpx py-16rpx text-26rpx text-[#018d71]" @click="reloadList">
        搜索
      </view>
    </view>
    <view class="flex gap-16rpx bg-white px-24rpx pb-16rpx">
      <view
        v-for="chip in statusChips"
        :key="chip.value"
        class="rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentStatus === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleStatusChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无落表批次"
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
            <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.scriptName || `批次 #${item.id}` }}
            </text>
            <wd-tag :type="batchStatusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ batchStatusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              批次 #{{ item.id }} · {{ dataTypeLabel(item.dataType) }} · 期间：{{ displayValue(item.period) }}
            </view>
            <view class="line-clamp-1">
              触发：{{ triggerSourceLabel(item.triggerSource) }} · 取数时间：{{ formatDateTime(item.fetchTime) || '-' }}
            </view>
            <view class="line-clamp-1">
              行数：{{ item.rowCount ?? 0 }} · 标准化成功 {{ item.parsedCount ?? 0 }} · 异常 <text :class="item.errorCount ? 'text-[#f5222d]' : ''">{{ item.errorCount ?? 0 }}</text>
            </view>
            <view v-if="item.truncated" class="text-[#fa8c16]">
              已达到行数上限，数据被截断
            </view>
            <view v-if="item.errorMsg" class="line-clamp-2 text-[#f5222d]">
              {{ item.errorMsg }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 方案维度差异趋势（只读） -->
    <view v-if="showTrendPanel" class="fixed inset-0 z-50 flex items-end bg-black/40" @click="showTrendPanel = false">
      <view class="h-[72vh] w-full overflow-hidden rounded-t-24rpx bg-white" @click.stop>
        <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
          <text class="text-30rpx text-[#333] font-500">
            差异趋势
          </text>
          <text class="text-26rpx text-[#018d71]" @click="showTrendPanel = false">
            关闭
          </text>
        </view>
        <scroll-view class="h-[60vh] px-24rpx py-20rpx" scroll-y>
          <view class="mb-12rpx text-26rpx text-[#666]">
            报价方案
          </view>
          <picker
            v-if="quoteLabels.length"
            mode="selector"
            :range="quoteLabels"
            :value="trendQuoteIndex"
            @change="handleTrendQuoteChange"
          >
            <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#333]">
              {{ quoteLabels[trendQuoteIndex] || '请选择报价方案' }}
            </view>
          </picker>
          <view v-else class="rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#999]">
            暂无报价方案
          </view>

          <view class="mt-20rpx flex gap-16rpx">
            <view
              v-for="month in monthOptions"
              :key="month"
              class="flex-1 rounded-12rpx py-12rpx text-center text-26rpx"
              :class="months === month ? 'bg-[#e6f7f1] text-[#018d71] font-500' : 'bg-[#f7f8f9] text-[#666]'"
              @click="handleMonthChange(month)"
            >
              近 {{ month }} 期
            </view>
          </view>

          <wd-button class="mt-20rpx" size="small" plain block :loading="trendLoading" :disabled="trendLoading" @click="loadTrend">
            刷新趋势
          </wd-button>

          <view v-if="trendLoading" class="py-60rpx text-center text-26rpx text-[#999]">
            正在加载趋势...
          </view>
          <view v-else-if="!trendRows.length" class="py-60rpx text-center text-26rpx text-[#999]">
            暂无趋势数据
          </view>
          <template v-else>
            <view v-for="row in trendRows" :key="row.period" class="mt-20rpx rounded-16rpx bg-[#f7f8f9] p-20rpx">
              <view class="flex items-center justify-between text-26rpx text-[#333]">
                <text>{{ row.period }}</text>
                <text>{{ row.batchCount ?? 0 }} 批</text>
              </view>
              <view class="mt-8rpx text-24rpx text-[#777]">
                平均一致率：{{ formatMatchPercent(row.avgMatchRate) }} · 差异行数：{{ row.totalDiffCount ?? 0 }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#777]">
                发生额差额合计：{{ formatMoney(row.totalDiff) }}
              </view>
              <view class="mt-12rpx h-12rpx overflow-hidden rounded-full bg-white">
                <view class="h-full rounded-full bg-[#018d71]" :style="trendBarStyle(row.avgMatchRate)" />
              </view>
            </view>
          </template>
          <view class="h-40rpx" />
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteCalcVO } from '@/api/fl/quoteCalc'
import type { QuoteFetchBatchVO, QuoteFetchTrendVO } from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { computed, ref } from 'vue'
import { getQuoteCalcSimpleList } from '@/api/fl/quoteCalc'
import { getFetchBatchPage, getFetchDataTrend } from '@/api/fl/quoteFetch'
import {
  batchStatusLabel,
  batchStatusTagType,
  dataTypeLabel,
  displayValue,
  FETCH_READONLY_TIP,
  FETCH_TABS,
  formatMatchPercent,
  goFetchTab,
  normalizePercent,
  triggerSourceLabel,
} from '../utils'

defineOptions({
  name: 'FlQuoteFetchDataList',
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

const toast = useToast()
const currentPath = '/pages-fl/quotefetch/data/list'
const statusChips = [
  { label: '全部', value: -1 },
  { label: '成功', value: 1 },
  { label: '失败', value: 2 },
]
const currentStatus = ref(-1)
const periodKeyword = ref('')
const list = ref<QuoteFetchBatchVO[]>([])
const pagingRef = ref<any>()

function reloadList() {
  pagingRef.value?.reload()
}

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  reloadList()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getFetchBatchPage({
      pageNo,
      pageSize,
      period: periodKeyword.value.trim() || undefined,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: QuoteFetchBatchVO) {
  uni.navigateTo({ url: `/pages-fl/quotefetch/data/detail?id=${item.id}` })
}

// ========== 差异趋势 ==========

const monthOptions = [6, 12, 24]
const showTrendPanel = ref(false)
const trendLoading = ref(false)
const months = ref(12)
const quotes = ref<QuoteCalcVO[]>([])
const selectedQuoteIndex = ref(0)
const trendRows = ref<QuoteFetchTrendVO[]>([])

const quoteLabels = computed(() => quotes.value.map(quote => quote.quotName || quote.quotCode || `方案 #${quote.id}`))
const trendQuoteIndex = computed(() => Math.max(0, selectedQuoteIndex.value))

async function loadQuotes() {
  try {
    quotes.value = await getQuoteCalcSimpleList()
    if (!quotes.value.length) {
      selectedQuoteIndex.value = -1
    }
  } catch (error: any) {
    quotes.value = []
    selectedQuoteIndex.value = -1
    toast.show(error?.message || '报价方案加载失败')
  }
}

async function openTrendPanel() {
  showTrendPanel.value = true
  if (!quotes.value.length) {
    await loadQuotes()
  }
  await loadTrend()
}

async function loadTrend() {
  const quoteId = quotes.value[selectedQuoteIndex.value]?.id
  if (!quoteId) {
    trendRows.value = []
    return
  }
  trendLoading.value = true
  try {
    trendRows.value = await getFetchDataTrend(quoteId, months.value)
  } catch (error: any) {
    trendRows.value = []
    toast.show(error?.message || '差异趋势加载失败')
  } finally {
    trendLoading.value = false
  }
}

function handleTrendQuoteChange(event: any) {
  selectedQuoteIndex.value = Number(event.detail.value)
  loadTrend()
}

function handleMonthChange(value: number) {
  if (months.value === value) {
    return
  }
  months.value = value
  loadTrend()
}

function trendBarStyle(value: unknown) {
  return { width: `${normalizePercent(value) ?? 0}%` }
}
</script>
