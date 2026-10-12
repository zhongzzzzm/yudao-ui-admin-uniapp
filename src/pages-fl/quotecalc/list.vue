<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="报价测算" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 状态筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in statusChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentStatus === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleStatusChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <!-- 方案列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无报价方案"
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
              {{ item.quotName || item.quotCode || '报价方案' }}
            </view>
            <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              编号：{{ item.quotCode || '-' }} · 客户：{{ item.customerName || '-' }}
            </view>
            <view class="line-clamp-1">
              投放：{{ formatMoney(item.totalAmount) }} · 利率 {{ formatPercent(item.finalRate) }}% · {{ getDictLabel(DICT_TYPE.FL_QUOTE_PAY_FREQ, item.paymentFreq) || '-' }}付{{ item.leaseTimes ? ` ${item.leaseTimes} 期` : '' }}
            </view>
            <view class="line-clamp-1">
              项目 IRR：{{ formatPercent(item.projectIrr) }}% · 租金 IRR：{{ formatPercent(item.rentIrr) }}%
            </view>
            <view class="line-clamp-1">
              净融资额：{{ formatMoney(item.netFinanceCash) }}（{{ formatPercent(item.netFinanceRatio) }}%）
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteCalcVO } from '@/api/fl/quoteCalc'
import { navigateBackPlus } from '@/utils'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatMoney, formatPercent } from '@/utils/format'
import { ref } from 'vue'
import { getQuoteCalcPage } from '@/api/fl/quoteCalc'

defineOptions({
  name: 'FlQuoteCalcList',
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

/** 方案状态：0 草稿 1 已确认（QuoteStatusEnum） */
const statusChips = [
  { label: '全部', value: -1 },
  { label: '草稿', value: 0 },
  { label: '已确认', value: 1 },
]
const currentStatus = ref(-1)
const list = ref<QuoteCalcVO[]>([])
const pagingRef = ref<any>()

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getQuoteCalcPage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status?: number): string {
  return getDictLabel(DICT_TYPE.FL_QUOTE_STATUS, status) || (status === 1 ? '已确认' : '草稿')
}

function statusTagType(status?: number): 'success' | 'info' {
  return status === 1 ? 'success' : 'info'
}

function goDetail(item: QuoteCalcVO) {
  uni.navigateTo({ url: `/pages-fl/quotecalc/detail?id=${item.id}` })
}
</script>
