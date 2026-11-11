<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="取数脚本" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

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
        v-model="keyword"
        class="min-h-72rpx flex-1 rounded-12rpx bg-[#f7f8f9] px-20rpx text-26rpx"
        type="text"
        confirm-type="search"
        placeholder="搜索脚本名称"
        @confirm="reloadList"
      >
      <view class="rounded-12rpx bg-[#e6f7f1] px-24rpx py-16rpx text-26rpx text-[#018d71]" @click="reloadList">
        搜索
      </view>
    </view>
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx pb-12rpx">
      <view
        v-for="chip in dataTypeChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentDataType === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleDataTypeChange(chip.value)"
      >
        {{ chip.label }}
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
      empty-view-text="暂无取数脚本"
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
              {{ item.name || `脚本 #${item.id}` }}
            </text>
            <wd-tag :type="enabledTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ enabledLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              {{ dataTypeLabel(item.dataType) }} · {{ fetchTypeLabel(item.fetchType) }} · 版本 v{{ displayValue(item.version ?? 1) }}
            </view>
            <view class="line-clamp-1">
              通道：{{ item.fetchType === 3 ? 'HTTP 接口' : (displayValue(item.datasourceName)) }} · 期间：{{ periodStrategyLabel(item.periodStrategy) }}{{ item.periodValue ? `（${item.periodValue}）` : '' }}
            </view>
            <view class="line-clamp-1">
              关联任务：{{ displayValue(item.jobName || item.jobId) }} · 行数上限：{{ displayValue(item.rowLimit) }}
            </view>
            <view class="line-clamp-1">
              最近取数：<text :class="item.lastBatchStatus === 2 ? 'text-[#f5222d]' : ''">{{ item.lastBatchId ? batchStatusLabel(item.lastBatchStatus) : '暂无' }}</text>
              · {{ item.lastBatchRowCount ?? 0 }} 行 · {{ formatDateTime(item.lastFetchTime) || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteFetchScriptVO } from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'
import { getFetchScriptPage } from '@/api/fl/quoteFetch'
import {
  batchStatusLabel,
  dataTypeLabel,
  displayValue,
  enabledLabel,
  enabledTagType,
  FETCH_READONLY_TIP,
  FETCH_TABS,
  fetchTypeLabel,
  goFetchTab,
  periodStrategyLabel,
} from '../utils'

defineOptions({
  name: 'FlQuoteFetchScriptList',
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

const currentPath = '/pages-fl/quotefetch/script/list'
const dataTypeChips = [
  { label: '全部类型', value: -1 },
  { label: '报价表', value: 1 },
  { label: '计提表', value: 2 },
]
const statusChips = [
  { label: '全部状态', value: -1 },
  { label: '启用', value: 0 },
  { label: '停用', value: 1 },
]
const currentDataType = ref(-1)
const currentStatus = ref(-1)
const keyword = ref('')
const list = ref<QuoteFetchScriptVO[]>([])
const pagingRef = ref<any>()

function reloadList() {
  pagingRef.value?.reload()
}

function handleDataTypeChange(value: number) {
  if (currentDataType.value === value) {
    return
  }
  currentDataType.value = value
  reloadList()
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
    const data = await getFetchScriptPage({
      pageNo,
      pageSize,
      name: keyword.value.trim() || undefined,
      dataType: currentDataType.value === -1 ? undefined : currentDataType.value,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: QuoteFetchScriptVO) {
  uni.navigateTo({ url: `/pages-fl/quotefetch/script/detail?id=${item.id}` })
}
</script>
