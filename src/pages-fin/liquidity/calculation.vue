<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="流动性测算" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无流动性测算数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openDetail(item)"
        >
          <view class="mb-12rpx text-28rpx text-[#333] font-500">
            时点 {{ item.point || '-' }}
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              本月末应保有现金：{{ formatAmount(item.requiredCashReserve) }}
            </view>
            <view class="line-clamp-1">
              本月应融入最低额：
              <text class="text-[#f5222d]">{{ formatAmount(item.minFinancingRequired) }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 全字段详情弹层 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          时点 {{ activeItem?.point || '-' }}
        </view>
        <view
          v-for="field in detailFields"
          :key="field.label"
          class="flex border-b border-[#f2f2f2] py-16rpx last:border-b-0"
        >
          <view class="mr-16rpx flex-1 text-24rpx text-[#999]">
            {{ field.label }}
          </view>
          <view class="text-24rpx text-[#333]">
            {{ field.value }}
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { LiquidityCalculationVO } from '@/api/fin/liquidity'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'
import { getLiquidityCalculationPage } from '@/api/fin/liquidity'

defineOptions({
  name: 'FinLiquidityCalculationList',
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

function formatAmount(value?: number) {
  return value == null ? '-' : value.toLocaleString('zh-CN')
}

const list = ref<LiquidityCalculationVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getLiquidityCalculationPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 详情弹层：全字段只读 */
const showDetail = ref(false)
const activeItem = ref<LiquidityCalculationVO>()

const detailFields = computed(() => {
  const c = activeItem.value
  if (!c) {
    return []
  }
  return [
    { label: '上月末账面现金资产', value: formatAmount(c.lastMonthCash) },
    { label: '本月刚兑总额（本+息）', value: formatAmount(c.currentMonthFinancingTotal) },
    { label: '本月收租总额', value: formatAmount(c.currentMonthRentTotal) },
    { label: '本月新增投放总额', value: formatAmount(c.newInvestment) },
    { label: '本月资金净流出额', value: formatAmount(c.currentMonthNetOutflow) },
    { label: '未来30天刚兑总额', value: formatAmount(c.future30dFinancingTotal) },
    { label: '未来30天租金回收总额', value: formatAmount(c.future30dRentTotal) },
    { label: '本月预计融入资金', value: formatAmount(c.expectedFinancing) },
    { label: '备付金比例', value: c.reserveRatio == null ? '-' : `${(c.reserveRatio * 100).toFixed(0)}%` },
    { label: '本月末应保有现金资产', value: formatAmount(c.requiredCashReserve) },
    { label: '本月应融入资金最低额', value: formatAmount(c.minFinancingRequired) },
    { label: '备注', value: c.remark || '-' },
    { label: '创建时间', value: formatDateTime(c.createTime) },
  ]
})

function openDetail(item: LiquidityCalculationVO) {
  activeItem.value = item
  showDetail.value = true
}
</script>
