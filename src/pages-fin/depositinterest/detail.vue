<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="结息详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

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
        <!-- 批次信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">
              {{ batch.accountName || batch.accountCode || batch.description || `结息测算 #${batch.id}` }}
            </text>
            <wd-tag :type="batch.calcMode === 2 ? 'primary' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ batch.calcMode === 2 ? '期间试算' : '结息核对' }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">科目</text>
              <text class="flex-1 text-[#333]">{{ batch.accountCode || '-' }}</text>
            </view>
            <view v-if="batch.period" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">账期</text>
              <text class="flex-1 text-[#333]">{{ batch.period }}</text>
            </view>
            <view v-if="batch.calcMode === 2" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">试算区间</text>
              <text class="flex-1 text-[#333]">
                {{ batch.periodStart || '-' }} ~ {{ batch.periodEnd || '-' }} · 年利率 {{ formatPercent(batch.annualRate) }}%
              </text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">计算利息</text>
              <text class="flex-1 text-[#018d71] font-500">{{ formatMoney(batch.totalInterest) }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">计息天数</text>
              <text class="flex-1 text-[#333]">{{ batch.totalDays ?? 0 }} 天</text>
            </view>
            <view v-if="batch.description" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">备注</text>
              <text class="flex-1 text-[#333]">{{ batch.description }}</text>
            </view>
            <view v-if="batch.fileUrl" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">明细账</text>
              <text class="flex-1 text-[#018d71]" @click="previewFile(batch.fileUrl!, batch.fileName)">
                {{ batch.fileName || '查看原文' }} ›
              </text>
            </view>
          </view>
        </view>

        <!-- 结息区间汇总 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            结息区间（{{ settlements.length }} 段）
          </view>
          <view v-if="!settlements.length" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
            暂无结息区间
          </view>
          <view
            v-for="settlement in settlements"
            :key="settlement.id"
            class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx last:border-b-0"
            @click="openDailyDetail(settlement)"
          >
            <view class="flex items-center justify-between">
              <text class="flex-1 text-26rpx text-[#333]">
                {{ settlement.periodStart }} ~ {{ settlement.periodEnd }}
              </text>
              <text class="ml-12rpx flex-shrink-0 text-26rpx text-[#018d71] font-500">
                {{ formatMoney(settlement.totalInterest) }}
              </text>
            </view>
            <view class="mt-4rpx flex items-center justify-between text-24rpx text-[#999]">
              <text>{{ settlement.days }} 天</text>
              <text v-if="settlement.bookedInterest != null" :class="settlement.interestDiff ? 'text-[#f5222d]' : ''">
                账内 {{ formatMoney(settlement.bookedInterest) }} · 差额 {{ formatMoney(settlement.interestDiff) }}
              </text>
              <text v-else>点击看逐日计息 ›</text>
            </view>
            <view class="mt-8rpx flex flex-wrap gap-8rpx">
              <view
                v-for="segment in settlement.segments"
                :key="segment.id"
                class="rounded-8rpx bg-[#f7f8fa] px-12rpx py-6rpx text-22rpx text-[#666]"
              >
                {{ segment.segStart }}~{{ segment.segEnd }} · {{ formatPercent(segment.annualRate) }}% · 日均 {{ formatMoney(segment.avgBalance) }} → {{ formatMoney(segment.interest) }}
              </view>
            </view>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 逐日计息明细弹层 -->
    <wd-popup v-model="showDaily" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-75vh overflow-auto p-24rpx">
        <view class="mb-8rpx text-30rpx text-[#333] font-500">
          逐日计息明细
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          {{ activeSettlement?.periodStart }} ~ {{ activeSettlement?.periodEnd }} · {{ activeSettlement?.days }} 天
        </view>
        <view v-if="dailyLoading && !dailyList.length" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="!dailyList.length" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无计息明细
        </view>
        <view v-else class="space-y-12rpx">
          <view
            v-for="detail in dailyList"
            :key="detail.id"
            class="rounded-12rpx bg-[#f7f8f9] p-20rpx"
          >
            <view class="flex items-center justify-between text-26rpx text-[#333]">
              <text>{{ detail.balanceDate }}</text>
              <text class="font-500">
                +{{ formatMoney(detail.dailyInterest) }}
              </text>
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              余额 {{ formatMoney(detail.balance) }} · 年利率 {{ formatPercent(detail.annualRate) }}% · 日利率 {{ detail.dailyRate }}
            </view>
            <view v-if="detail.sourceDesc" class="mt-4rpx text-22rpx text-[#999]">
              {{ detail.sourceDesc }}
            </view>
          </view>
        </view>
        <view v-if="dailyLoading" class="py-16rpx text-center">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="dailyHasMore" class="py-16rpx text-center text-24rpx text-[#018d71]" @click="loadMoreDaily">
          加载更多
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { DepositInterestDetailVO, DepositInterestVO, DepositSettlementVO } from '@/api/fin/depositInterest'
import { navigateBackPlus } from '@/utils'
import { getDepositInterest, getDepositInterestDetailPage, getDepositInterestSettlements } from '@/api/fin/depositInterest'
import { getFileNameFromUrl } from '@/utils/download'
import { formatMoney, formatPercent } from '@/utils/format'
import { ref } from 'vue'

defineOptions({
  name: 'FinDepositInterestDetail',
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
const batch = ref<DepositInterestVO>()
const settlements = ref<DepositSettlementVO[]>([])
const batchId = ref<number>()

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
    batch.value = await getDepositInterest(batchId.value)
    settlements.value = await getDepositInterestSettlements(batchId.value) ?? []
  } finally {
    loading.value = false
  }
}

// ========== 逐日计息明细弹层 ==========

const showDaily = ref(false)
const activeSettlement = ref<DepositSettlementVO>()
const dailyList = ref<DepositInterestDetailVO[]>([])
const dailyPageNo = ref(1)
const dailyHasMore = ref(false)
const dailyLoading = ref(false)

function openDailyDetail(settlement: DepositSettlementVO) {
  activeSettlement.value = settlement
  dailyList.value = []
  dailyPageNo.value = 1
  dailyHasMore.value = false
  showDaily.value = true
  loadMoreDaily()
}

async function loadMoreDaily() {
  const settlementId = activeSettlement.value?.id
  if (!settlementId || dailyLoading.value) {
    return
  }
  dailyLoading.value = true
  try {
    const data = await getDepositInterestDetailPage({
      pageNo: dailyPageNo.value,
      pageSize: PAGE_SIZE,
      settlementId,
    })
    dailyList.value.push(...data.list)
    dailyHasMore.value = dailyPageNo.value * PAGE_SIZE < data.total
    dailyPageNo.value += 1
  } finally {
    dailyLoading.value = false
  }
}

/** 统一走 kkfileview 预览 */
function previewFile(url: string, name?: string) {
  const fileName = name || getFileNameFromUrl(url)
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(fileName || '')}`,
  })
}
</script>
