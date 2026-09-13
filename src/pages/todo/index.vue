<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="待办" placeholder safe-area-inset-top fixed />

    <!-- 事项类型切换（按权限过滤，无权限的 tab 不展示） -->
    <wd-tabs v-model="activeTab" sticky>
      <wd-tab v-for="tab in availableTabs" :key="tab.name" :title="tab.label" :name="tab.name" />
    </wd-tabs>

    <!-- 无任何待办权限时的兜底提示 -->
    <view v-if="availableTabs.length === 0" class="flex flex-col items-center pt-240rpx">
      <wd-icon name="info-circle" size="80rpx" color="#bbb" />
      <text class="mt-24rpx text-28rpx text-[#999]">暂无可用的待办事项</text>
    </view>

    <template v-else>
      <!-- 关键字搜索 -->
      <view class="bg-white px-24rpx pb-16rpx">
        <wd-search
          v-model="keyword"
          :placeholder="searchPlaceholder"
          hide-cancel
          @search="handleSearch"
          @clear="handleSearch"
        />
      </view>

      <!-- 状态筛选条 -->
      <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx pb-16rpx">
        <view
          v-for="chip in currentChips"
          :key="chip.label"
          class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
          :class="currentStatus === chip.value
            ? 'bg-[#018d71] text-white'
            : 'bg-[#f5f6f8] text-[#666]'"
          @click="handleStatusChange(chip.value)"
        >
          {{ chip.label }}
        </view>
      </view>

      <!-- 列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无待办事项"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm"
            @click="handleItemClick(item)"
          >
            <view class="p-24rpx">
              <!-- 卡片头：标题 + 状态 -->
              <view class="mb-12rpx flex items-center justify-between">
                <view class="flex-1 overflow-hidden text-30rpx text-[#333] font-semibold">
                  <text class="line-clamp-1">{{ itemTitle(item) }}</text>
                </view>
                <wd-tag :type="itemTagType(item)" plain class="ml-16rpx flex-shrink-0">
                  {{ itemTagText(item) }}
                </wd-tag>
              </view>
              <!-- 摘要字段 -->
              <view class="text-26rpx text-[#777] space-y-6rpx">
                <view v-for="(line, idx) in itemSummary(item)" :key="idx" class="line-clamp-1">
                  {{ line }}
                </view>
              </view>
              <!-- 截止日提示 -->
              <view
                v-if="deadlineHint(item)"
                class="mt-12rpx text-24rpx"
                :class="deadlineHint(item)!.danger ? 'text-[#f5222d]' : 'text-[#fa8c16]'"
              >
                {{ deadlineHint(item)!.text }}
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { TaxReportFilingVO } from '@/api/rpt/filing'
import type { FilingReviewVO } from '@/api/rpt/review'
import type { TaxLedgerVO } from '@/api/tax/ledger'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { FILING_COMBINED_STAGE, FILING_STAGE_TAG_TYPE, getTaxReportFilingPage, getTaxReportFilingStats } from '@/api/rpt/filing'
import { getFilingReviewPage } from '@/api/rpt/review'
import { getTaxLedgerPage } from '@/api/tax/ledger'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { tabbarStore } from '@/tabbar/store'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'Todo',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { hasAccessByCodes } = useAccess()
type TodoTab = 'filing' | 'ledger' | 'review'

/** 按权限过滤后的可用 tab（无权限的 tab 不展示，避免点击后 403） */
const availableTabs = computed<{ label: string, name: TodoTab }[]>(() => {
  const tabs: { label: string, name: TodoTab }[] = []
  if (hasAccessByCodes(['rpt:tax-report-filing:query'])) {
    tabs.push({ label: '报送任务', name: 'filing' })
  }
  if (hasAccessByCodes(['tax:ledger:query', 'tax:ledger:query-all'])) {
    tabs.push({ label: '办税待办', name: 'ledger' })
  }
  if (hasAccessByCodes(['rpt:filing-review:query-all', 'rpt:filing-review:submit'])) {
    tabs.push({ label: '复核回看', name: 'review' })
  }
  return tabs
})

const activeTab = ref<TodoTab>(availableTabs.value[0]?.name ?? 'filing')
const list = ref<any[]>([])
const pagingRef = ref<any>()

/**
 * 各事项类型的状态筛选 chip（value 语义见各 API）
 *
 * 办税台账仅两态：0 待办理（办理流在途，等待办税人提交办理）/ 1 已办理（提交办结）；
 * done 标记该 chip 属已完结口径，用于隐藏截止日提示。
 */
const statusChips: Record<TodoTab, { label: string, value: any, done?: boolean }[]> = {
  filing: [
    { label: '可生成', value: 'canGenerate' },
    { label: '待生成', value: 'waitGenerate' },
    { label: '生成失败', value: 'generateFail' },
    { label: '待复核', value: 'waitReview' },
  ],
  ledger: [
    { label: '待办理', value: [0] },
    { label: '已办理', value: [1], done: true },
  ],
  review: [
    // 复核动作已接入审批引擎，App 侧仅回看分派记录与结论
    { label: '待复核', value: 0 },
    { label: '已复核', value: 1, done: true },
  ],
}

const currentChips = computed(() => statusChips[activeTab.value])
const currentStatus = ref<any>(statusChips[activeTab.value]?.[0]?.value ?? 0)

/** 关键字搜索：各 tab 的搜索口径见后端 keyword 参数 */
const keyword = ref('')
const searchPlaceholder = computed(() => ({
  filing: '搜索模板 / 报送名称',
  ledger: '搜索公司 / 办税人 / 所属期',
  review: '搜索模板名称',
})[activeTab.value])

/** 触发搜索（确认或清空时） */
function handleSearch() {
  pagingRef.value?.reload()
}

/**
 * 切换事项类型：重置到默认筛选并刷新列表
 *
 * 用 watch(activeTab) 而非 wd-tabs 的 change 事件：change 先于 update:modelValue 触发，
 * 在 change 里读 activeTab 拿到的是旧值，会导致新 tab 携带旧筛选参数请求报错。
 */
watch(activeTab, () => {
  currentStatus.value = statusChips[activeTab.value][0].value
  keyword.value = ''
  pagingRef.value?.reload()
})

/** 切换状态筛选 */
function handleStatusChange(value: any) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

/** 拉取当前事项类型的分页数据（关键字三个 tab 均下发给后端模糊匹配） */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const kw = keyword.value.trim() || undefined
    let result: { list: any[], total: number }
    if (activeTab.value === 'filing') {
      result = await getTaxReportFilingPage({ pageNo, pageSize, combinedStatus: currentStatus.value, keyword: kw })
    } else if (activeTab.value === 'ledger') {
      result = await getTaxLedgerPage({ pageNo, pageSize, statusList: currentStatus.value, keyword: kw })
    } else {
      result = await getFilingReviewPage({ pageNo, pageSize, reviewStatus: currentStatus.value, keyword: kw })
    }
    pagingRef.value?.completeByTotal(result.list, result.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 卡片主标题 */
function itemTitle(item: any): string {
  if (activeTab.value === 'filing') {
    return (item as TaxReportFilingVO).templateName || '报送任务'
  }
  if (activeTab.value === 'ledger') {
    const ledger = item as TaxLedgerVO
    return `${ledger.companyName || '公司'} · ${getDictLabel(DICT_TYPE.TAX_TYPE, ledger.taxType) || '办税任务'}`
  }
  const review = item as FilingReviewVO
  return review.templateName || '底稿复核'
}

/** 卡片摘要行 */
function itemSummary(item: any): string[] {
  if (activeTab.value === 'filing') {
    const filing = item as TaxReportFilingVO
    const lines = [`报送：${filing.submitName || '-'}`]
    if (filing.reviewTotalCount != null) {
      lines.push(`复核进度：${filing.reviewDoneCount ?? 0}/${filing.reviewTotalCount}`)
    }
    lines.push(`创建时间：${formatDateTime(filing.createTime)}`)
    return lines
  }
  if (activeTab.value === 'ledger') {
    const ledger = item as TaxLedgerVO
    return [
      `所属期：${ledger.period || '-'} · 办税人：${ledger.taxPerson || '-'}`,
      `申报日期：${ledger.submitDate || '未申报'}`,
    ]
  }
  const review = item as FilingReviewVO
  return [
    `负责部门：${review.deptName || '-'} · 底稿 ${review.draftCount ?? 0} 份`,
    `底稿：${(review.draftNames || []).join('、') || '-'}`,
  ]
}

/** 状态标签文本 */
function itemTagText(item: any): string {
  if (activeTab.value === 'filing') {
    const stage = (item as TaxReportFilingVO).combinedStage ?? ''
    return (FILING_COMBINED_STAGE as Record<string, string>)[stage] ?? '未知'
  }
  if (activeTab.value === 'ledger') {
    return getDictLabel(DICT_TYPE.TAX_LEDGER_STATUS, (item as TaxLedgerVO).status) || '未知'
  }
  return getDictLabel(DICT_TYPE.REPORT_FILING_REVIEW_STATUS, (item as FilingReviewVO).reviewStatus) || '未知'
}

/** 状态标签类型（wot-ui wd-tag 的 type，无 error 取值，error 统一归一为 danger） */
function itemTagType(item: any): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (activeTab.value === 'filing') {
    const stage = (item as TaxReportFilingVO).combinedStage ?? ''
    const type = FILING_STAGE_TAG_TYPE[stage]
    if (type === 'error') {
      return 'danger'
    }
    return type ?? 'info'
  }
  if (activeTab.value === 'ledger') {
    // 0待办理=需处理，1已办理=完结
    const status = (item as TaxLedgerVO).status
    return status === 0 ? 'warning' : 'success'
  }
  return (item as FilingReviewVO).reviewStatus === 0 ? 'warning' : 'success'
}

/** 截止日提示（临近 3 天标橙、逾期标红；已办结类行不再提示） */
function deadlineHint(item: any): { text: string, danger: boolean } | null {
  let deadline: string | undefined
  let settled = false
  if (activeTab.value === 'filing') {
    deadline = (item as TaxReportFilingVO).submitDeadline
  } else if (activeTab.value === 'ledger') {
    deadline = (item as TaxLedgerVO).deadline
    // 已办理（1）的行不再提示逾期，避免误导读为待处理
    settled = (item as TaxLedgerVO).status === 1
  }
  if (!deadline || settled || currentStatus.value?.done) {
    return null
  }
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) {
    return { text: `已逾期 ${-days} 天`, danger: true }
  }
  if (days <= 3) {
    return { text: days === 0 ? '今天截止' : `${days} 天后截止`, danger: false }
  }
  return null
}

/** 点击卡片进入对应详情 */
function handleItemClick(item: any) {
  if (activeTab.value === 'filing') {
    uni.navigateTo({ url: `/pages-rpt/filing/detail?id=${item.id}` })
  } else if (activeTab.value === 'ledger') {
    uni.navigateTo({ url: `/pages-tax/ledger/detail?id=${item.id}` })
  } else {
    // 复核详情页按 filingId 拉取复核记录列表后定位到当前条目，必须带全参数
    uni.navigateTo({ url: `/pages-rpt/review/detail?id=${item.id}&filingId=${item.filingId}&deptId=${item.deptId}` })
  }
}

/** 刷新待办角标（报送任务待办 + 办税待办 + 复核待办的数量之和） */
async function refreshBadge() {
  try {
    const [ledgerRes, reviewRes, filingStats, filingWaitReview] = await Promise.all([
      // 办税待办 = 待办理0（等待办税人提交办理）
      getTaxLedgerPage({ pageNo: 1, pageSize: 1, statusList: [0] }),
      getFilingReviewPage({ pageNo: 1, pageSize: 1, reviewStatus: 0 }),
      hasAccessByCodes(['rpt:tax-report-filing:query'])
        ? getTaxReportFilingStats().catch(() => null)
        : Promise.resolve(null),
      hasAccessByCodes(['rpt:tax-report-filing:query'])
        ? getTaxReportFilingPage({ pageNo: 1, pageSize: 1, combinedStatus: 'waitReview' }).catch(() => null)
        : Promise.resolve(null),
    ])
    // 报送任务待办 = 待执行（待生成/可生成）+ 执行失败 + 待复核
    const filingPending = (filingStats ? (filingStats.pending + filingStats.fail) : 0)
      + (filingWaitReview?.total ?? 0)
    const total = (ledgerRes.total ?? 0) + (reviewRes.total ?? 0) + filingPending
    tabbarStore.setTabbarItemBadge(1, total > 0 ? total : 0)
  } catch {
    // 角标刷新失败不影响页面，静默处理
  }
}

onShow(() => {
  refreshBadge()
})

// 字典预热：保证办税状态/税种标签能即时显示
getDictOptions(DICT_TYPE.TAX_TYPE)
getDictOptions(DICT_TYPE.TAX_LEDGER_STATUS)
getDictOptions(DICT_TYPE.REPORT_FILING_REVIEW_STATUS)
</script>
