<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="方案详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!quote" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDetail">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 基本信息 + 结果指标 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">
              {{ quote.quotName || quote.quotCode || '报价方案' }}
            </text>
            <wd-tag :type="status === 1 ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">方案编号</text>
              <text class="flex-1 text-[#333]">{{ quote.quotCode || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">客户名称</text>
              <text class="flex-1 text-[#333]">{{ quote.customerName || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">起租投放日</text>
              <text class="flex-1 text-[#333]">{{ quote.planDateLoan || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">总投放额</text>
              <text class="flex-1 text-[#333]">{{ formatMoney(quote.totalAmount) }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">租赁方式</text>
              <text class="flex-1 text-[#333]">{{ getDictLabel(DICT_TYPE.FL_QUOTE_LEASE_METHOD, quote.leaseMethod) || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">支付频率</text>
              <text class="flex-1 text-[#333]">
                {{ getDictLabel(DICT_TYPE.FL_QUOTE_PAY_FREQ, quote.paymentFreq) || '-' }}{{ quote.prepayFlag != null ? ` · ${getDictLabel(DICT_TYPE.FL_QUOTE_PREPAY, quote.prepayFlag) || ''}` : '' }} · {{ quote.leaseTimes ?? '-' }} 期
              </text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">最终利率</text>
              <text class="flex-1 text-[#333]">{{ formatPercent(quote.finalRate) }}%</text>
            </view>
            <view v-if="quote.memo" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">备注</text>
              <text class="flex-1 text-[#333]">{{ quote.memo }}</text>
            </view>
          </view>
        </view>

        <!-- 结果指标 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx border-b border-b-[#f0f0f0] pb-12rpx text-28rpx text-[#333] font-500">
            测算结果
          </view>
          <view class="grid grid-cols-2 gap-y-20rpx">
            <view>
              <view class="text-24rpx text-[#999]">
                项目 IRR
              </view>
              <view class="text-30rpx text-[#018d71] font-500">
                {{ formatPercent(quote.projectIrr) }}%
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                租金 IRR
              </view>
              <view class="text-30rpx text-[#018d71] font-500">
                {{ formatPercent(quote.rentIrr) }}%
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                净融资额
              </view>
              <view class="text-30rpx text-[#333] font-500">
                {{ formatMoney(quote.netFinanceCash) }}
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                净融资比例
              </view>
              <view class="text-30rpx text-[#333] font-500">
                {{ formatPercent(quote.netFinanceRatio) }}%
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                租金总额
              </view>
              <view class="text-30rpx text-[#333] font-500">
                {{ formatMoney(quote.leaseCashSum) }}
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                总债务
              </view>
              <view class="text-30rpx text-[#333] font-500">
                {{ formatMoney(quote.totalDebt) }}
              </view>
            </view>
          </view>
        </view>

        <!-- 投放计划 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            投放计划（{{ quote.loanPlans?.length ?? 0 }} 期）
          </view>
          <view v-if="!quote.loanPlans?.length" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
            暂无投放计划
          </view>
          <view
            v-for="(plan, index) in quote.loanPlans"
            v-else
            :key="index"
            class="flex items-center justify-between border-b border-b-[#f7f8f9] px-24rpx py-16rpx text-26rpx last:border-b-0"
          >
            <text class="text-[#333]">{{ plan.planDate || '-' }}</text>
            <text class="mx-16rpx flex-1 text-[#999]">{{ getDictLabel(DICT_TYPE.FL_QUOTE_PAY_METHOD, plan.payMethod) || '-' }}</text>
            <text class="text-[#333] font-500">{{ formatMoney(plan.cash) }}</text>
          </view>
        </view>

        <!-- 租金规则 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            租金规则（{{ quote.rentRules?.length ?? 0 }} 段）
          </view>
          <view v-if="!quote.rentRules?.length" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
            暂无租金规则
          </view>
          <view
            v-for="(rule, index) in quote.rentRules"
            v-else
            :key="index"
            class="border-b border-b-[#f7f8f9] px-24rpx py-16rpx text-26rpx last:border-b-0"
          >
            <view class="flex items-center justify-between">
              <text class="text-[#333]">第 {{ rule.startPeriod ?? '-' }} 期起</text>
              <text class="text-[#333] font-500">{{ rule.rentCash != null ? formatMoney(rule.rentCash) : '按规则计算' }}</text>
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ getDictLabel(DICT_TYPE.FL_QUOTE_CAL_METHOD, rule.calMethod) || '-' }} · {{ getDictLabel(DICT_TYPE.FL_QUOTE_PAY_FREQ, rule.paymentFreq) || '-' }}付
            </view>
          </view>
        </view>

        <!-- 手工收支 -->
        <view class="m-24rpx mb-40rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            手工收支（{{ quote.manualPlans?.length ?? 0 }} 笔）
          </view>
          <view v-if="!quote.manualPlans?.length" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
            暂无手工收支
          </view>
          <view
            v-for="(plan, index) in quote.manualPlans"
            v-else
            :key="index"
            class="border-b border-b-[#f7f8f9] px-24rpx py-16rpx text-26rpx last:border-b-0"
          >
            <view class="flex items-center justify-between">
              <text class="text-[#333]">{{ getDictLabel(DICT_TYPE.FL_QUOTE_MANUAL_KIND, plan.kind) || '收支' }} · {{ plan.planDate || '-' }}</text>
              <text class="font-500" :class="plan.direction === 1 ? 'text-[#52c41a]' : 'text-[#f5222d]'">
                {{ plan.direction === 1 ? '+' : '-' }}{{ formatMoney(plan.cash) }}
              </text>
            </view>
            <view v-if="plan.memo" class="mt-4rpx text-24rpx text-[#999]">
              {{ plan.memo }}
            </view>
          </view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteCalcVO } from '@/api/fl/quoteCalc'
import { navigateBackPlus } from '@/utils'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatMoney, formatPercent } from '@/utils/format'
import { computed, ref } from 'vue'
import { getQuoteCalc } from '@/api/fl/quoteCalc'

defineOptions({
  name: 'FlQuoteCalcDetail',
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
const quote = ref<QuoteCalcVO>()
const quoteId = ref<number>()

const status = computed(() => quote.value?.status)
const statusLabel = computed(() =>
  getDictLabel(DICT_TYPE.FL_QUOTE_STATUS, status.value) || (status.value === 1 ? '已确认' : '草稿'),
)

onLoad((query) => {
  quoteId.value = Number(query?.id)
  loadDetail()
})

async function loadDetail() {
  if (!quoteId.value) {
    return
  }
  loading.value = true
  try {
    quote.value = await getQuoteCalc(quoteId.value)
  } finally {
    loading.value = false
  }
}
</script>
