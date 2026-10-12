<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="银行流水" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 资金方向筛选条 -->
    <view class="flex gap-16rpx bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in directionChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentDirection === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleDirectionChange(chip.value)"
      >
        {{ chip.label }}
      </view>
      <view class="ml-auto flex items-center text-24rpx text-[#018d71]" @click="openFilter">
        筛选
        <wd-icon name="filter" size="28rpx" color="#018d71" custom-class="ml-4rpx" />
      </view>
    </view>

    <!-- 收支汇总横幅 -->
    <view class="flex items-center justify-around bg-white px-24rpx pb-20rpx text-center">
      <view>
        <view class="text-24rpx text-[#999]">
          收入合计
        </view>
        <view class="text-28rpx text-[#52c41a] font-500">
          {{ formatMoney(summary?.incomeTotal) }}
        </view>
      </view>
      <view>
        <view class="text-24rpx text-[#999]">
          支出合计
        </view>
        <view class="text-28rpx text-[#f5222d] font-500">
          {{ formatMoney(summary?.expenseTotal) }}
        </view>
      </view>
      <view>
        <view class="text-24rpx text-[#999]">
          净额
        </view>
        <view class="text-28rpx text-[#333] font-500">
          {{ formatMoney(summary?.netAmount) }}
        </view>
      </view>
    </view>

    <!-- 流水列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无流水数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.counterpartyOrgName || item.counterpartyAccountName || item.summary || '流水' }}
            </view>
            <view class="ml-16rpx flex-shrink-0 text-right">
              <view class="text-28rpx font-500" :class="item.direction === 1 ? 'text-[#52c41a]' : 'text-[#f5222d]'">
                {{ item.direction === 1 ? '+' : '-' }}{{ formatMoney(item.amount) }}
              </view>
              <view class="text-22rpx text-[#999]">
                {{ item.directionName || (item.direction === 1 ? '收入' : '支出') }} · {{ item.currency || 'CNY' }}
              </view>
            </view>
          </view>
          <view class="text-24rpx text-[#777] space-y-4rpx">
            <view class="line-clamp-1">
              交易日期：{{ item.transDate || '-' }}{{ item.transTime ? ` ${item.transTime}` : '' }}
            </view>
            <view v-if="item.summary" class="line-clamp-2">
              摘要：{{ item.summary }}
            </view>
            <view class="line-clamp-1">
              己方：{{ item.ownAccountName || item.ownAccountNo || '-' }}
            </view>
            <view v-if="item.counterpartyBankName" class="line-clamp-1">
              对方银行：{{ item.counterpartyBankName }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 筛选弹层 -->
    <wd-popup v-model="showFilter" position="bottom" custom-class="yd-search-form-popup" closable safe-area-inset-bottom>
      <view class="yd-search-form-container">
        <view class="yd-search-form-title">
          流水筛选
        </view>
        <yd-search-picker
          v-model="filterForm.ownAccountNo"
          label="己方账户"
          :columns="accountColumns"
          all-option
        />
        <yd-search-date-range v-model="filterForm.transDate" label="交易日期" />
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            对方关键字
          </view>
          <wd-input
            v-model="filterForm.counterpartyKeyword"
            placeholder="对方机构/账户名/账号"
            clearable
          />
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" plain @click="handleFilterReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleFilterConfirm">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { BankFlowSummaryVO, BankFlowVO } from '@/api/fin/bankFlow'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getBankFlowOwnAccounts, getBankFlowPage, getBankFlowSummary } from '@/api/fin/bankFlow'
import { formatMoney } from '@/utils/format'

defineOptions({
  name: 'FinBankFlowList',
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

/** 资金方向：1 收入 2 支出 */
const directionChips = [
  { label: '全部', value: -1 },
  { label: '收入', value: 1 },
  { label: '支出', value: 2 },
]
const currentDirection = ref(-1)
const list = ref<BankFlowVO[]>([])
const pagingRef = ref<any>()
const summary = ref<BankFlowSummaryVO>()

/** 已生效筛选条件（确定后生效） */
const appliedFilter = ref<{
  counterpartyKeyword?: string
  ownAccountNo?: string
  transDate?: string[]
}>({})

function handleDirectionChange(value: number) {
  if (currentDirection.value === value) {
    return
  }
  currentDirection.value = value
  pagingRef.value?.reload()
  refreshSummary()
}

function filterParams() {
  return {
    direction: currentDirection.value === -1 ? undefined : currentDirection.value,
    ...appliedFilter.value,
  }
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getBankFlowPage({ pageNo, pageSize, ...filterParams() })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

async function refreshSummary() {
  try {
    summary.value = await getBankFlowSummary(filterParams())
  } catch {
    // 汇总失败不影响列表
  }
}
refreshSummary()

// ========== 筛选弹层 ==========

const showFilter = ref(false)
const accountOptions = ref<string[]>([])
const accountColumns = ref<{ label: string, value: string }[]>([])
const filterForm = ref<{
  counterpartyKeyword?: string
  ownAccountNo?: string
  transDate: [any, any]
}>({ transDate: [undefined, undefined] })

function openFilter() {
  filterForm.value = {
    counterpartyKeyword: appliedFilter.value.counterpartyKeyword,
    ownAccountNo: appliedFilter.value.ownAccountNo,
    transDate: (appliedFilter.value.transDate as unknown as [any, any]) || [undefined, undefined],
  }
  if (!accountOptions.value.length) {
    getBankFlowOwnAccounts().then((accounts) => {
      accountOptions.value = accounts ?? []
      accountColumns.value = accountOptions.value.map(account => ({ label: account, value: account }))
    }).catch(() => {})
  }
  showFilter.value = true
}

function handleFilterReset() {
  filterForm.value = { transDate: [undefined, undefined] }
  appliedFilter.value = {}
  showFilter.value = false
  pagingRef.value?.reload()
  refreshSummary()
}

function handleFilterConfirm() {
  const transDate = filterForm.value.transDate?.[0] && filterForm.value.transDate?.[1]
    ? [formatDay(filterForm.value.transDate[0]), formatDay(filterForm.value.transDate[1])]
    : undefined
  appliedFilter.value = {
    counterpartyKeyword: filterForm.value.counterpartyKeyword?.trim() || undefined,
    ownAccountNo: filterForm.value.ownAccountNo || undefined,
    transDate,
  }
  showFilter.value = false
  pagingRef.value?.reload()
  refreshSummary()
}

/** 日期选择值 → yyyy-MM-dd（后端 LocalDate 解析格式） */
function formatDay(value: any): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
</script>
