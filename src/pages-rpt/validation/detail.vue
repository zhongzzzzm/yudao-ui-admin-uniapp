<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="校验任务详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 任务概要卡 -->
    <view class="bg-white px-24rpx pb-16rpx pt-20rpx">
      <view class="rounded-16rpx bg-[#f7f8f9] p-20rpx">
        <view class="mb-8rpx flex items-center justify-between">
          <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
            {{ task?.taskCode || '-' }}
          </view>
          <wd-tag v-if="task" :type="statusTagType(task.status)" plain class="ml-16rpx flex-shrink-0">
            {{ statusLabel(task.status) }}
          </wd-tag>
        </view>
        <view class="text-24rpx text-[#777] space-y-4rpx">
          <view>数据日期：{{ task?.batchDate || '-' }}</view>
          <view>
            规则：{{ task?.totalRuleCount ?? 0 }} 条，失败
            <text :class="task?.errorRuleCount ? 'text-[#f5222d]' : ''">{{ task?.errorRuleCount ?? 0 }}</text>
            条 · 耗时 {{ task?.durationSeconds ?? 0 }}s
          </view>
        </view>
        <view
          v-if="canQueryResultFile && attachments.length"
          class="mt-12rpx flex items-center justify-between border-t border-[#eee] pt-12rpx"
          @click="showAttachments = true"
        >
          <view class="text-24rpx text-[#018d71]">
            校验文件（{{ attachments.length }} 个报表）
          </view>
          <view class="text-24rpx text-[#999]">
            查看 ›
          </view>
        </view>
      </view>
    </view>

    <!-- 结果筛选 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx pb-16rpx">
      <view
        v-for="chip in resultChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentPassed === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleFilterChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无校验结果"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.ruleCode || '校验规则' }}
            </view>
            <wd-tag :type="item.passed ? 'success' : 'error'" plain class="ml-16rpx flex-shrink-0">
              {{ item.passed ? '通过' : '未通过' }}
            </wd-tag>
          </view>
          <view class="line-clamp-2 text-26rpx text-[#777]">
            {{ item.ruleDescription || '-' }}
          </view>
          <view v-if="!item.passed" class="mt-8rpx flex items-center justify-between">
            <view class="flex-1 text-24rpx text-[#f5222d]">
              错误 {{ item.errorCount ?? 0 }} 条 · 点击查看明细
            </view>
            <wd-tag :type="item.status ? 'success' : 'warning'" plain class="ml-16rpx flex-shrink-0">
              {{ item.status ? '已维护原因' : '未维护原因' }}
            </wd-tag>
          </view>
          <view
            v-if="!item.passed && canCorrectReason"
            class="mt-12rpx text-right"
            @click.stop="openReasonPopup(item)"
          >
            <wd-button size="small" plain>
              维护原因
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 结果明细弹层 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          错误明细
        </view>
        <view v-if="detailLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="details.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无错误明细
        </view>
        <view v-else class="space-y-16rpx">
          <view v-for="detail in details" :key="detail.id" class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="text-26rpx text-[#333]">
              {{ detail.description || '数据异常' }}
            </view>
            <view class="mt-8rpx flex items-center justify-between">
              <view class="flex-1 text-24rpx text-[#999]">
                {{ detail.reportName || '-' }} · 行号 {{ detail.rowIndex ?? '-' }}
              </view>
              <view
                v-if="task?.batchId && detail.reportId != null && canQueryReportData"
                class="ml-16rpx flex-shrink-0 text-24rpx text-[#018d71]"
                @click.stop="goReportData(detail)"
              >
                查看数据行 ›
              </view>
            </view>
          </view>
        </view>
        <view v-if="detailHasMore" class="py-16rpx text-center text-24rpx text-[#999]" @click="loadMoreDetails">
          加载更多
        </view>
      </view>
    </wd-popup>

    <!-- 纠正原因弹层：查看已有原因 + 补录 -->
    <wd-popup v-model="showReason" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-8rpx text-30rpx text-[#333] font-500">
          纠正原因
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          {{ activeResult?.ruleCode || '-' }} · {{ activeResult?.ruleDescription || '-' }}
        </view>

        <view v-if="reasonLoading" class="flex justify-center py-32rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="reasons.length === 0" class="py-24rpx text-center text-26rpx text-[#999]">
          暂无原因，请在下方补录
        </view>
        <view v-else class="space-y-12rpx">
          <view v-for="reason in reasons" :key="reason.id" class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="whitespace-pre-wrap text-26rpx text-[#333]">
              {{ reason.reason || '-' }}
            </view>
            <view v-if="reason.description" class="mt-6rpx text-24rpx text-[#999]">
              {{ reason.description }}
            </view>
          </view>
        </view>

        <view class="mt-24rpx border-t border-[#eee] pt-20rpx">
          <textarea
            v-model="newReason"
            :maxlength="200"
            placeholder="请输入纠正原因（生成校验文件前必须维护）"
            class="min-h-140rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
          />
          <view class="mt-8rpx flex items-center justify-between">
            <view class="text-22rpx text-[#bbb]">
              {{ newReason.length }}/200
            </view>
            <wd-button
              size="small"
              type="primary"
              :disabled="!newReason.trim() || reasonSubmitting"
              :loading="reasonSubmitting"
              @click="submitReason"
            >
              提交原因
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 校验文件弹层（dat/log 产物，点击预览） -->
    <wd-popup v-model="showAttachments" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          校验文件
        </view>
        <view v-for="file in attachments" :key="file.id" class="mb-16rpx rounded-12rpx bg-[#f7f8f9] p-20rpx">
          <view class="mb-8rpx text-26rpx text-[#333]">
            {{ file.reportName || '-' }}
          </view>
          <view class="flex gap-16rpx">
            <wd-button
              v-if="file.datFile"
              size="small"
              plain
              @click="previewFile(file.datFile!, `${file.reportName || '报表'}.dat`)"
            >
              查看dat
            </wd-button>
            <wd-button
              v-if="file.logFile"
              size="small"
              plain
              @click="previewFile(file.logFile!, `${file.reportName || '报表'}.log`)"
            >
              查看log
            </wd-button>
            <view v-if="!file.datFile && !file.logFile" class="text-24rpx text-[#999]">
              暂无产物文件
            </view>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 底部操作栏：按权限显示 -->
    <view
      v-if="canGenerate || canExportResult || canViewErrorReasons || canCopyReasons"
      class="flex flex-wrap gap-16rpx border-t border-[#eee] bg-white px-24rpx py-16rpx pb-[calc(16rpx+env(safe-area-inset-bottom))]"
    >
      <wd-button
        v-if="canGenerate"
        size="small"
        type="primary"
        :disabled="acting"
        @click="handleGenerate(0)"
      >
        生成校验结果
      </wd-button>
      <wd-button
        v-if="canGenerate"
        size="small"
        plain
        :disabled="acting"
        @click="handleGenerate(1)"
      >
        重新生成
      </wd-button>
      <wd-button
        v-if="canExportResult"
        size="small"
        type="primary"
        plain
        :disabled="acting"
        @click="handleDownload"
      >
        导出校验文件
      </wd-button>
      <wd-button v-if="canViewErrorReasons" size="small" plain @click="goErrorReasons">
        错误原因
      </wd-button>
      <wd-button
        v-if="canCopyReasons"
        size="small"
        plain
        :disabled="acting"
        @click="handleCopyReasons"
      >
        复制上次原因
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ReportResultDetailVO, ReportResultVO, ReportTaskVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { downloadApiFile } from '@/utils/download'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { ref } from 'vue'
import {
  copyLastReasons,
  generateValidationResult,
  getReportResultDetailPage,
  getReportResultPage,
  getReportTask,
  readyForDownload,
  readyForGenerate,
} from '@/api/validation/task'
import type { ReportResultReasonVO } from '@/api/validation/resultReason'
import {
  createReportResultReason,
  getReportResultReasonByResultId,
} from '@/api/validation/resultReason'
import type { ReportResultFileVO } from '@/api/validation/reportData'
import { getReportResultFilePage } from '@/api/validation/reportData'

defineOptions({
  name: 'ValidationTaskDetail',
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

// 权限：与 PC 端各操作按钮的权限码一致
const canGenerate = hasAccessByCodes(['validation:report-task:generate'])
const canExportResult = hasAccessByCodes(['validation:report-task:export-validation-result'])
const canViewErrorReasons = hasAccessByCodes(['validation:report-task:view-error-reasons'])
const canCopyReasons = hasAccessByCodes(['validation:report-task:update'])
const canCorrectReason = hasAccessByCodes(['validation:report-result-reason:correct'])
const canQueryReportData = hasAccessByCodes(['validation:report-data:query'])
const canQueryResultFile = hasAccessByCodes(['validation:report-result-file:query'])

const taskId = ref<number>()
const task = ref<ReportTaskVO>()
const acting = ref(false)

function statusLabel(status: number): string {
  return (['未执行', '执行中', '完成', '失败'] as const)[status] ?? '未知'
}

function statusTagType(status: number): 'primary' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'error'
  }
  if (status === 1) {
    return 'primary'
  }
  return 'info'
}

async function loadTask() {
  if (!taskId.value) {
    return
  }
  try {
    task.value = await getReportTask(taskId.value)
  } catch {
    task.value = undefined
  }
  loadAttachments()
}

/** 校验结果产物文件（dat/log） */
const showAttachments = ref(false)
const attachments = ref<ReportResultFileVO[]>([])

async function loadAttachments() {
  if (!taskId.value || !canQueryResultFile) {
    return
  }
  try {
    const data = await getReportResultFilePage({ pageNo: 1, pageSize: 50, taskId: taskId.value })
    attachments.value = data.list
  } catch {
    attachments.value = []
  }
}

/** 统一走 kkfileview 预览 */
function previewFile(url: string, name?: string) {
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(name || '')}`,
  })
}

// 结果列表（沿用原查询）
const resultChips = [
  { label: '未通过', value: 0 },
  { label: '已通过', value: 1 },
  { label: '全部', value: -1 },
]
const currentPassed = ref(0)
const list = ref<ReportResultVO[]>([])
const pagingRef = ref<any>()

function handleFilterChange(value: number) {
  if (currentPassed.value === value) {
    return
  }
  currentPassed.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportResultPage({
      pageNo,
      pageSize,
      taskId: taskId.value,
      passed: currentPassed.value === -1 ? undefined : currentPassed.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 明细弹层（分页加载） */
const showDetail = ref(false)
const detailLoading = ref(false)
const details = ref<ReportResultDetailVO[]>([])
const detailHasMore = ref(false)
const detailPageNo = ref(1)
const activeResultId = ref<number>()

function openDetail(item: ReportResultVO) {
  if (item.passed) {
    return
  }
  activeResultId.value = item.id
  showDetail.value = true
  details.value = []
  detailPageNo.value = 1
  loadDetails()
}

async function loadDetails() {
  if (!activeResultId.value) {
    return
  }
  detailLoading.value = details.value.length === 0
  try {
    const data = await getReportResultDetailPage({
      pageNo: detailPageNo.value,
      pageSize: 20,
      resultId: activeResultId.value,
    })
    details.value = [...details.value, ...data.list]
    detailHasMore.value = details.value.length < (data.total ?? 0)
    detailPageNo.value += 1
  } catch {
    details.value = []
    detailHasMore.value = false
  } finally {
    detailLoading.value = false
  }
}

function loadMoreDetails() {
  loadDetails()
}

/** 查看原始数据行（batchId 取任务概要，reportId/rowIndex 取明细行） */
function goReportData(detail: ReportResultDetailVO) {
  uni.navigateTo({
    url: `/pages-rpt/validation/report-data?reportId=${detail.reportId}&batchId=${task.value?.batchId}&rowIndex=${detail.rowIndex}`,
  })
}

/** 纠正原因弹层 */
const showReason = ref(false)
const reasonLoading = ref(false)
const reasonSubmitting = ref(false)
const reasons = ref<ReportResultReasonVO[]>([])
const newReason = ref('')
const activeResult = ref<ReportResultVO>()

function openReasonPopup(item: ReportResultVO) {
  activeResult.value = item
  newReason.value = ''
  showReason.value = true
  loadReasons()
}

async function loadReasons() {
  if (!activeResult.value) {
    return
  }
  reasonLoading.value = true
  try {
    reasons.value = await getReportResultReasonByResultId(activeResult.value.id)
  } catch {
    reasons.value = []
  } finally {
    reasonLoading.value = false
  }
}

async function submitReason() {
  const reason = newReason.value.trim()
  if (!reason || !activeResult.value || reasonSubmitting.value) {
    return
  }
  reasonSubmitting.value = true
  try {
    await createReportResultReason({
      resultId: activeResult.value.id,
      taskId: activeResult.value.taskId,
      reason,
    })
    uni.showToast({ title: '原因已提交', icon: 'none' })
    newReason.value = ''
    await loadReasons()
    // 本地同步维护状态，避免整页刷新
    activeResult.value.status = 1
  } catch (e: any) {
    uni.showToast({ title: e?.message || '提交失败，请重试', icon: 'none' })
  } finally {
    reasonSubmitting.value = false
  }
}

/** 任务级操作 */

/** 生成/重新生成校验结果（type：0 新生成 1 重新生成覆盖） */
function handleGenerate(type: 0 | 1) {
  if (!taskId.value) {
    return
  }
  dialog.confirm({
    title: type === 0 ? '确认生成' : '确认重新生成',
    msg: type === 0
      ? '将按当前数据版本生成校验结果文件，是否继续？'
      : '重新生成将覆盖已有校验结果文件，是否继续？',
  }).then(async () => {
    acting.value = true
    uni.showLoading({ title: '正在生成...', mask: true })
    try {
      const ready = await readyForGenerate(taskId.value!)
      if (!ready) {
        uni.hideLoading()
        uni.showToast({ title: '校验不通过的规则未维护原因，请先补录', icon: 'none' })
        return
      }
      await generateValidationResult(taskId.value!, type)
      uni.hideLoading()
      uni.showToast({ title: '生成成功，可导出校验文件', icon: 'none' })
      loadTask()
    } catch (e: any) {
      uni.hideLoading()
      uni.showToast({ title: e?.message || '生成失败，请重试', icon: 'none' })
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

/** 导出校验文件（zip 下载，H5 走浏览器下载，App/小程序下载后打开） */
async function handleDownload() {
  if (!taskId.value) {
    return
  }
  acting.value = true
  uni.showLoading({ title: '正在导出...', mask: true })
  try {
    const ready = await readyForDownload(taskId.value)
    if (!ready) {
      uni.hideLoading()
      uni.showToast({ title: '校验文件未生成完毕，请先生成', icon: 'none' })
      return
    }
    await downloadApiFile('/validation/report-task/download', { taskId: taskId.value }, '校验结果.zip')
    uni.hideLoading()
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '导出失败，请重试', icon: 'none' })
  } finally {
    acting.value = false
  }
}

/** 查看任务下所有错误原因 */
function goErrorReasons() {
  uni.navigateTo({ url: `/pages-rpt/validation/error-reasons?id=${taskId.value}` })
}

/** 复制上一任务的纠正原因 */
function handleCopyReasons() {
  if (!taskId.value) {
    return
  }
  dialog.confirm({
    title: '复制上次原因',
    msg: '将上一任务维护的纠正原因复制到本任务，已维护原因的结果不会被覆盖，是否继续？',
  }).then(async () => {
    acting.value = true
    try {
      const result = await copyLastReasons(taskId.value!)
      uni.showToast({ title: `复制完成：成功 ${result?.copied ?? 0} 条`, icon: 'none' })
      pagingRef.value?.reload()
    } catch (e: any) {
      uni.showToast({ title: e?.message || '复制失败，请重试', icon: 'none' })
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

onLoad((query) => {
  taskId.value = Number(query?.id)
  loadTask()
})
</script>
