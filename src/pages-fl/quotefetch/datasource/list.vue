<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="取数数据源" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 取数域三个只读列表 -->
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

    <!-- D8：移动端不提供配置编辑 -->
    <view class="bg-[#fffbe6] px-24rpx py-12rpx text-24rpx text-[#fa8c16]">
      {{ FETCH_READONLY_TIP }}
    </view>

    <!-- 名称与状态筛选 -->
    <view class="flex items-center gap-16rpx bg-white px-24rpx py-16rpx">
      <input
        v-model="keyword"
        class="min-h-72rpx flex-1 rounded-12rpx bg-[#f7f8f9] px-20rpx text-26rpx"
        type="text"
        confirm-type="search"
        placeholder="搜索数据源名称"
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
      empty-view-text="暂无取数数据源"
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
              {{ item.name || `数据源 #${item.id}` }}
            </text>
            <wd-tag :type="enabledTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ enabledLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              类型：{{ dbTypeLabel(item.dbType) }} · 引用脚本：{{ displayValue(item.scriptCount) }}
            </view>
            <view class="line-clamp-1">
              最近测试：<text :class="item.lastTestStatus === 2 ? 'text-[#f5222d]' : ''">{{ testStatusLabel(item.lastTestStatus) }}</text>
              · {{ formatDateTime(item.lastTestTime) || '暂无时间' }}
            </view>
            <view v-if="item.lastTestError" class="line-clamp-2 text-[#f5222d]">
              {{ item.lastTestError }}
            </view>
            <view v-if="item.diagInfo" class="line-clamp-2">
              诊断：{{ item.diagInfo }}
            </view>
            <view class="line-clamp-1">
              连接串：{{ displayValue(item.url) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteFetchDatasourceVO } from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'
import { getFetchDatasourcePage } from '@/api/fl/quoteFetch'
import {
  dbTypeLabel,
  displayValue,
  enabledLabel,
  enabledTagType,
  FETCH_READONLY_TIP,
  FETCH_TABS,
  goFetchTab,
  testStatusLabel,
} from '../utils'

defineOptions({
  name: 'FlQuoteFetchDatasourceList',
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

const currentPath = '/pages-fl/quotefetch/datasource/list'
const statusChips = [
  { label: '全部', value: -1 },
  { label: '启用', value: 0 },
  { label: '停用', value: 1 },
]
const currentStatus = ref(-1)
const keyword = ref('')
const list = ref<QuoteFetchDatasourceVO[]>([])
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
    const data = await getFetchDatasourcePage({
      pageNo,
      pageSize,
      name: keyword.value.trim() || undefined,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: QuoteFetchDatasourceVO) {
  uni.navigateTo({ url: `/pages-fl/quotefetch/datasource/detail?id=${item.id}` })
}
</script>
