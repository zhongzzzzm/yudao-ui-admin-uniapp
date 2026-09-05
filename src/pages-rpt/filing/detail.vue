<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="任务详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!filing" class="flex flex-col items-center pt-240rpx">
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
            <text class="flex-1 text-32rpx text-[#333] font-semibold">{{ filing.templateName }}</text>
            <wd-tag :type="stageTagType" plain class="ml-16rpx flex-shrink-0">
              {{ stageLabel }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">报送</text>
              <text class="flex-1 text-[#333]">{{ filing.submitName || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">报送截止</text>
              <text
                class="flex-1"
                :class="deadlineDanger ? 'text-[#f5222d]' : 'text-[#333]'"
              >
                {{ filing.submitDeadline || '-' }}{{ deadlineText ? `（${deadlineText}）` : '' }}
              </text>
            </view>
            <view v-if="filing.reviewTotalCount != null" class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">复核进度</text>
              <text class="flex-1 text-[#333]">
                {{ filing.reviewDoneCount ?? 0 }}/{{ filing.reviewTotalCount }}
                <text v-if="filing.reviewPendingForMe" class="ml-8rpx text-[#fa8c16]">本部门待复核</text>
              </text>
            </view>
            <view class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">创建时间</text>
              <text class="flex-1 text-[#333]">{{ formatDateTime(filing.createTime) }}</text>
            </view>
            <view v-if="filing.errorMsg" class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">失败原因</text>
              <text class="flex-1 text-[#f5222d]">{{ filing.errorMsg }}</text>
            </view>
            <view v-if="missingText" class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">缺失项</text>
              <text class="flex-1 text-[#fa8c16]">{{ missingText }}</text>
            </view>
          </view>
        </view>

        <!-- 复核部门列表 -->
        <view v-if="reviews.length" class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            部门复核情况
          </view>
          <view
            v-for="review in reviews"
            :key="review.id"
            class="flex items-center justify-between border-b border-b-[#f7f8f9] px-24rpx py-20rpx last:border-b-0"
            @click="goReview(review)"
          >
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                {{ review.deptName || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                底稿 {{ review.draftCount ?? 0 }} 份
              </view>
            </view>
            <wd-tag
              :type="review.reviewStatus === 1
                ? (review.reviewResult === 2 ? 'error' : 'success') : 'warning'" plain
            >
              {{ review.reviewStatus === 1 ? (review.reviewResult === 2 ? '复核有误' : '复核无误') : '待复核' }}
            </wd-tag>
          </view>
        </view>

        <!-- 结果网格 -->
        <view v-if="gridError && !grid" class="m-24rpx mt-0 flex flex-col items-center rounded-16rpx bg-white px-24rpx py-40rpx shadow-sm">
          <wd-icon name="exclamation-circle" size="60rpx" color="#fa8c16" />
          <text class="mt-16rpx text-center text-26rpx text-[#999]">结果文件解析失败：{{ gridError }}</text>
          <text class="mt-8rpx text-24rpx text-[#bbb]">可尝试「预览结果文件」或稍后重试</text>
          <wd-button class="mt-24rpx" size="small" plain @click="loadDetail">
            重试
          </wd-button>
        </view>
        <view v-if="grid" class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            报表结果
          </view>
          <wd-tabs v-model="activeSheet">
            <wd-tab v-for="(sheet, idx) in grid.sheets" :key="idx" :title="sheet.name" :name="idx" />
          </wd-tabs>
          <scroll-view class="max-h-800rpx" scroll-x scroll-y>
            <view class="p-16rpx">
              <view v-for="(row, rIdx) in activeRows" :key="rIdx" class="flex">
                <view
                  v-for="(cell, cIdx) in row"
                  :key="cIdx"
                  class="min-w-140rpx border border-b-0 border-r-0 border-[#f0f0f0] px-12rpx py-10rpx text-24rpx text-[#333]"
                  :class="rIdx === 0 ? 'bg-[#fafafa] font-500' : ''"
                  @click="handleCellTap(cellRef(rIdx, cIdx))"
                >
                  {{ cell }}
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="px-24rpx pb-16rpx pt-8rpx text-22rpx text-[#bbb]">
            点击单元格可查看填充日志
          </view>
        </view>
        <view class="h-180rpx" />
      </template>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="filing" class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <view class="flex gap-20rpx">
        <wd-button
          v-if="filing.resultFile"
          class="flex-1"
          type="primary"
          plain
          :disabled="acting"
          @click="goPreview"
        >
          预览结果文件
        </wd-button>
        <wd-button
          v-if="canExecute"
          class="flex-1"
          type="primary"
          :loading="acting"
          :disabled="acting"
          @click="handleExecute"
        >
          执行
        </wd-button>
      </view>
    </view>

    <!-- 单元格填充日志弹层 -->
    <wd-popup v-model="showCellLogs" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-60vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          单元格 {{ activeCellRef }} 填充日志
        </view>
        <view v-if="cellLogsLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="cellLogs.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          该单元格暂无填充日志
        </view>
        <view v-else class="space-y-16rpx">
          <view
            v-for="log in cellLogs"
            :key="log.id"
            class="rounded-12rpx bg-[#f7f8f9] p-20rpx"
          >
            <view class="mb-8rpx flex items-center justify-between">
              <text class="text-26rpx text-[#333] font-500">
                {{ log.indicatorName || log.sourceDesc || '填充记录' }}
              </text>
              <wd-tag :type="log.hitStatus === 0 ? 'success' : (log.hitStatus === 2 ? 'error' : 'info')" plain>
                {{ log.hitStatus === 0 ? '命中' : (log.hitStatus === 2 ? '失败' : '未命中') }}
              </wd-tag>
            </view>
            <view class="text-24rpx text-[#777]">
              填充值：{{ log.fillValue || '-' }}
            </view>
            <view v-if="log.errorMsg" class="mt-4rpx text-24rpx text-[#f5222d]">
              {{ log.errorMsg }}
            </view>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FilingCellLogVO, TaxReportFilingVO } from '@/api/rpt/filing'
import { navigateBackPlus } from '@/utils'
import type { FilingReviewVO as ReviewVO } from '@/api/rpt/review'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  executeTaxReportFilingAsync,
  FILING_COMBINED_STAGE,
  FILING_STAGE_TAG_TYPE,
  getTaxReportFiling,
  getTaxReportFilingCellLogs,
  getTaxReportFilingResultGrid,
} from '@/api/rpt/filing'
import { getFilingReviewListByFiling } from '@/api/rpt/review'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'FilingDetail',
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

const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const filingId = ref<number>()
const loading = ref(true)
const acting = ref(false)
const filing = ref<TaxReportFilingVO | null>(null)
const grid = ref<Awaited<ReturnType<typeof getTaxReportFilingResultGrid>> | null>(null)
const gridError = ref('')
const reviews = ref<ReviewVO[]>([])
const activeSheet = ref(0)

/** 执行权限（rpt:tax-report-filing:execute） */
const canExecute = computed(() => hasAccessByCodes(['rpt:tax-report-filing:execute']))

const stageLabel = computed(() =>
  (FILING_COMBINED_STAGE as Record<string, string>)[filing.value?.combinedStage ?? ''] ?? '待执行')
const stageTagType = computed(() =>
  FILING_STAGE_TAG_TYPE[filing.value?.combinedStage ?? ''] ?? 'info')

const activeRows = computed(() => grid.value?.sheets[activeSheet.value]?.rows ?? [])

/** 缺失项汇总文案 */
const missingText = computed(() => {
  const f = filing.value
  if (!f) {
    return ''
  }
  const parts: string[] = []
  if (f.missingDraftNames?.length) {
    parts.push(`底稿：${f.missingDraftNames.join('、')}`)
  }
  if (f.missingReportNames?.length) {
    parts.push(`前置报表：${f.missingReportNames.join('、')}`)
  }
  if (f.missingConfigNames?.length) {
    parts.push(`配置：${f.missingConfigNames.join('、')}`)
  }
  return parts.join('；')
})

/** 截止日文案 */
const deadlineDanger = computed(() => {
  if (!filing.value?.submitDeadline) {
    return false
  }
  return new Date(filing.value.submitDeadline).getTime() < Date.now()
})
const deadlineText = computed(() => {
  if (!filing.value?.submitDeadline || ['reviewDone', 'generated'].includes(filing.value.combinedStage ?? '')) {
    return ''
  }
  const days = Math.ceil((new Date(filing.value.submitDeadline).getTime() - Date.now()) / 86400000)
  if (days < 0) {
    return `已逾期 ${-days} 天`
  }
  if (days <= 3) {
    return days === 0 ? '今天截止' : `${days} 天后截止`
  }
  return ''
})

/** 加载详情、复核列表与结果网格 */
async function loadDetail() {
  if (!filingId.value) {
    return
  }
  loading.value = true
  try {
    filing.value = await getTaxReportFiling(filingId.value)
    getFilingReviewListByFiling(filingId.value).then((list) => {
      reviews.value = list
    }).catch(() => {})
    if (filing.value.resultFile) {
      getTaxReportFilingResultGrid(filingId.value).then((data) => {
        grid.value = data
      }).catch((e) => {
        // 历史任务的结果文件可能已失效（如存储地址不可达），明确提示而非静默
        console.error('加载结果网格失败：', e)
        gridError.value = e?.message || '结果文件解析失败'
      })
    }
  } catch (e) {
    console.error('加载任务详情失败：', e)
    filing.value = null
  } finally {
    loading.value = false
  }
}

/** 执行：二次确认 → 提交异步执行 → 轮询状态 */
function handleExecute() {
  dialog.confirm({
    title: '确认执行',
    msg: `确认执行【${filing.value?.templateName || '报送任务'}】？`,
  }).then(async () => {
    acting.value = true
    try {
      await executeTaxReportFilingAsync(filingId.value!)
      uni.showToast({ title: '已提交执行', icon: 'none' })
      pollStatus(0)
    } catch (e: any) {
      uni.showToast({ title: e?.message || '执行提交失败', icon: 'none' })
      acting.value = false
    }
  }).catch(() => {})
}

/** 执行后轮询任务状态（3 秒一次，最多 10 次） */
async function pollStatus(times: number) {
  if (times >= 10) {
    acting.value = false
    uni.showToast({ title: '执行耗时较长，可稍后在列表查看', icon: 'none' })
    return
  }
  await new Promise(resolve => setTimeout(resolve, 3000))
  try {
    const latest = await getTaxReportFiling(filingId.value!)
    if (latest.combinedStage === 'generating') {
      pollStatus(times + 1)
      return
    }
    filing.value = latest
    acting.value = false
    uni.showToast({ title: '状态已更新', icon: 'none' })
  } catch {
    acting.value = false
  }
}

/** 预览结果文件 */
function goPreview() {
  const fileUrl = filing.value?.resultFile || ''
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(fileUrl)}&fileName=${encodeURIComponent(filing.value?.templateName || '结果文件')}`,
  })
}

/** 单元格地址（0 基 → A1 表示法） */
function cellRef(rIdx: number, cIdx: number): string {
  let col = ''
  let n = cIdx
  do {
    col = String.fromCharCode(65 + (n % 26)) + col
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return `${col}${rIdx + 1}`
}

/** 单元格日志弹层 */
const showCellLogs = ref(false)
const cellLogsLoading = ref(false)
const cellLogs = ref<FilingCellLogVO[]>([])
const activeCellRef = ref('')

async function handleCellTap(refStr: string) {
  activeCellRef.value = refStr
  showCellLogs.value = true
  cellLogsLoading.value = true
  cellLogs.value = []
  try {
    cellLogs.value = await getTaxReportFilingCellLogs(filingId.value!, refStr)
  } catch {
    cellLogs.value = []
  } finally {
    cellLogsLoading.value = false
  }
}

/** 跳转复核详情（仅本部门待复核时开放办理） */
function goReview(review: ReviewVO) {
  if (review.reviewStatus === 1) {
    return
  }
  uni.navigateTo({ url: `/pages-rpt/review/detail?id=${review.id}&filingId=${filingId.value}&deptId=${review.deptId}` })
}

onLoad((query) => {
  filingId.value = Number(query?.id)
  loadDetail()
})
</script>
