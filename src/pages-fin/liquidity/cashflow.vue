<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="流动性现金流" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无流动性现金流数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="text-28rpx text-[#333] font-500">
              {{ paymentTypeLabel(item.paymentType) }}
            </view>
            <view class="ml-16rpx flex-shrink-0 text-28rpx text-[#333] font-500">
              {{ item.amount == null ? '-' : item.amount.toLocaleString('zh-CN') }}
            </view>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              统计月份：{{ item.statMonth || '-' }} · 目标月份：{{ item.targetMonth || '-' }}
            </view>
            <view class="line-clamp-1">
              区间：{{ item.startDate || '-' }} ~ {{ item.endDate || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { LiquidityCashFlowVO } from '@/api/fin/liquidity'
import { navigateBackPlus } from '@/utils'
import { getLiquidityCashFlowPage, LIQUIDITY_PAYMENT_TYPE_MAP } from '@/api/fin/liquidity'
import { ref } from 'vue'

defineOptions({
  name: 'FinLiquidityCashFlowList',
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

function paymentTypeLabel(value?: number) {
  if (value == null) {
    return '-'
  }
  return LIQUIDITY_PAYMENT_TYPE_MAP[value] || `类型${value}`
}

const list = ref<LiquidityCashFlowVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getLiquidityCashFlowPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}
</script>
