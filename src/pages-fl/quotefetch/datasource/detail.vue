<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据源详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />
    <view class="bg-[#fffbe6] px-24rpx py-12rpx text-24rpx text-[#fa8c16]">
      {{ FETCH_READONLY_TIP }}
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <view v-else-if="!datasource" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDetail">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 基本信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">
              {{ datasource.name || `数据源 #${datasource.id}` }}
            </text>
            <wd-tag :type="enabledTagType(datasource.status)" plain class="ml-16rpx flex-shrink-0">
              {{ enabledLabel(datasource.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">数据源编号</text>
              <text class="flex-1 text-[#333]">{{ displayValue(datasource.id) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">数据库类型</text>
              <text class="flex-1 text-[#333]">{{ dbTypeLabel(datasource.dbType) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">连接串</text>
              <text class="flex-1 break-all text-[#333]">{{ displayValue(datasource.url) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">连接用户名</text>
              <text class="flex-1 text-[#333]">{{ displayValue(datasource.username) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">驱动类</text>
              <text class="flex-1 break-all text-[#333]">{{ displayValue(datasource.driverClass) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">引用脚本数</text>
              <text class="flex-1 text-[#333]">{{ displayValue(datasource.scriptCount) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">创建时间</text>
              <text class="flex-1 text-[#333]">{{ formatDateTime(datasource.createTime) || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">备注</text>
              <text class="flex-1 text-[#333]">{{ displayValue(datasource.remark) }}</text>
            </view>
          </view>
        </view>

        <!-- 最近测试结果与诊断 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between border-b border-b-[#f0f0f0] pb-12rpx">
            <text class="text-28rpx text-[#333] font-500">
              最近测试与诊断
            </text>
            <wd-tag :type="testStatusTagType(datasource.lastTestStatus)" plain>
              {{ testStatusLabel(datasource.lastTestStatus) }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">测试时间</text>
              <text class="flex-1 text-[#333]">{{ formatDateTime(datasource.lastTestTime) || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">失败原因</text>
              <text class="flex-1" :class="datasource.lastTestError ? 'text-[#f5222d]' : 'text-[#333]'">
                {{ displayValue(datasource.lastTestError) }}
              </text>
            </view>
            <view>
              <view class="mb-8rpx text-[#999]">
                诊断信息
              </view>
              <view
                class="whitespace-pre-wrap rounded-12rpx bg-[#f7f8f9] p-16rpx text-24rpx"
                :class="datasource.lastTestStatus === 2 ? 'text-[#f5222d]' : 'text-[#555]'"
              >
                {{ displayValue(datasource.diagInfo) }}
              </view>
            </view>
          </view>
        </view>
        <view class="h-80rpx" />
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteFetchDatasourceVO } from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'
import { getFetchDatasource } from '@/api/fl/quoteFetch'
import {
  dbTypeLabel,
  displayValue,
  enabledLabel,
  enabledTagType,
  FETCH_READONLY_TIP,
  testStatusLabel,
  testStatusTagType,
} from '../utils'

defineOptions({
  name: 'FlQuoteFetchDatasourceDetail',
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

const loading = ref(false)
const datasource = ref<QuoteFetchDatasourceVO>()
const datasourceId = ref<number>()

onLoad((query) => {
  datasourceId.value = Number(query?.id)
  loadDetail()
})

async function loadDetail() {
  if (!datasourceId.value) {
    return
  }
  loading.value = true
  try {
    datasource.value = await getFetchDatasource(datasourceId.value)
  } catch {
    datasource.value = undefined
  } finally {
    loading.value = false
  }
}
</script>
