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

    <!-- 功能操作条：导入 / 批次 / 模板 / 导出 -->
    <view class="flex items-center gap-16rpx bg-white px-24rpx pb-16rpx">
      <wd-button v-if="canImport" size="small" type="primary" @click="goImport">
        导入流水
      </wd-button>
      <wd-button size="small" plain @click="goBatches">
        导入批次
      </wd-button>
      <wd-button v-if="canTemplate" size="small" plain @click="goTemplates">
        解析模板
      </wd-button>
      <wd-button v-if="canExport" size="small" plain :loading="exporting" @click="handleExport">
        导出
      </wd-button>
    </view>

    <!-- 批次筛选横幅（从导入批次页跳入时显示） -->
    <view
      v-if="appliedFilter.batchId != null"
      class="mx-24rpx my-16rpx flex items-center justify-between rounded-16rpx bg-[#e6f7f1] px-24rpx py-16rpx text-24rpx text-[#018d71]"
    >
      <view class="min-w-0 flex-1 truncate">
        按导入批次（{{ appliedFilter.batchId }}）筛选中
      </view>
      <view class="ml-16rpx flex-shrink-0" @click="clearBatchFilter">
        取消
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
            <view v-if="item.sourceFileName" class="line-clamp-1">
              来源：{{ item.sourceFileName }}{{ item.sourceRow ? ` 第 ${item.sourceRow} 行` : '' }}
            </view>
          </view>
          <!-- 卡片操作：行名待补录标记 + 编辑 / 删除 -->
          <view
            v-if="canUpdate || canDelete || item.counterpartyBankFilled === 0"
            class="mt-16rpx flex items-center justify-end gap-16rpx border-t border-t-[#f5f6f8] pt-16rpx"
          >
            <wd-tag v-if="item.counterpartyBankFilled === 0" type="warning" plain class="mr-auto">
              行名待补录
            </wd-tag>
            <wd-button
              v-if="canUpdate"
              size="small"
              plain
              type="primary"
              @click="goEdit(item)"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="canDelete"
              size="small"
              plain
              type="error"
              @click="onDelete(item)"
            >
              删除
            </wd-button>
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
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { deleteBankFlow, getBankFlowOwnAccounts, getBankFlowPage, getBankFlowSummary } from '@/api/fin/bankFlow'
import { useAccess } from '@/hooks/useAccess'
import { downloadApiFile } from '@/utils/download'
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

const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

/** 操作权限（与 PC 端按钮权限一致） */
const canImport = hasAccessByCodes(['fin:bank-flow:import'])
const canExport = hasAccessByCodes(['fin:bank-flow:export'])
const canUpdate = hasAccessByCodes(['fin:bank-flow:update'])
const canDelete = hasAccessByCodes(['fin:bank-flow:delete'])
const canTemplate = hasAccessByCodes(['fin:bank-flow-template:query'])

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

/** 已生效筛选条件（确定后生效；batchId 由导入批次页跳入时注入） */
const appliedFilter = ref<{
  batchId?: number
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

// ========== 功能入口：导入 / 批次 / 模板 / 导出 ==========

function goImport() {
  uni.navigateTo({ url: '/pages-fin/bankflow/import' })
}

function goBatches() {
  uni.navigateTo({ url: '/pages-fin/bankflow/batches' })
}

function goTemplates() {
  uni.navigateTo({ url: '/pages-fin/bankflow/template/list' })
}

/** 按当前筛选条件导出 Excel（标准 9 列 + 来源文件名/行号） */
const exporting = ref(false)
async function handleExport() {
  exporting.value = true
  try {
    await downloadApiFile('/fin/bank-flow/export-excel', filterParams(), '银行流水.xlsx')
  } catch {
    // 下载失败提示已由工具层处理
  } finally {
    exporting.value = false
  }
}

/** 清除批次筛选（从导入批次页跳入时携带 batchId） */
function clearBatchFilter() {
  appliedFilter.value.batchId = undefined
  pagingRef.value?.reload()
  refreshSummary()
}

// ========== 编辑 / 删除 ==========

/** 编辑流水（补录对方行名等字段），整条数据经 URL 传给编辑页 */
function goEdit(item: BankFlowVO) {
  const data = encodeURIComponent(JSON.stringify(item))
  uni.navigateTo({ url: `/pages-fin/bankflow/edit?data=${data}` })
}

/** 删除单条流水（软删除，可重导原文件恢复） */
function onDelete(item: BankFlowVO) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除该笔流水（${item.transDate} ${formatMoney(item.amount)}）？删除后可重新导入原文件恢复。`,
  }).then(async () => {
    try {
      await deleteBankFlow(item.id)
      uni.showToast({ title: '已删除', icon: 'none' })
      pagingRef.value?.reload()
      refreshSummary()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

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
    batchId: appliedFilter.value.batchId,
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

// ========== 生命周期：批次参数注入 + 导入/编辑后刷新 ==========

onLoad((query) => {
  // 从导入批次页「查看流水」跳入：按批次过滤
  if (query?.batchId) {
    appliedFilter.value.batchId = Number(query.batchId)
    pagingRef.value?.reload()
    refreshSummary()
  }
})

// 导入 / 编辑 / 批次删除完成后刷新列表与汇总
uni.$on('fin:bankflow:reload', () => {
  pagingRef.value?.reload()
  refreshSummary()
})
onUnload(() => {
  uni.$off('fin:bankflow:reload')
})
</script>
