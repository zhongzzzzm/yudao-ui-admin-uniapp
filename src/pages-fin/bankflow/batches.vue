<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="导入批次" placeholder safe-area-inset-top fixed @click-left="handleBack"
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

    <!-- 批次列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无导入批次"
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
              {{ item.fileName || `批次 ${item.id}` }}
            </view>
            <wd-tag class="ml-16rpx flex-shrink-0" :type="statusTagType(item.status)" plain>
              {{ batchStatusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#777] space-y-4rpx">
            <view class="line-clamp-1">
              模板：{{ item.templateName || '-' }} · {{ matchTypeLabel(item.matchType) }}
            </view>
            <view class="flex flex-wrap gap-x-24rpx">
              <text>共 {{ item.totalRows ?? 0 }} 行</text>
              <text class="text-[#52c41a]">成功 {{ item.successRows ?? 0 }}</text>
              <text class="text-[#fa8c16]">重复 {{ item.duplicateRows ?? 0 }}</text>
              <text class="text-[#f5222d]">异常 {{ item.errorRows ?? 0 }}</text>
            </view>
            <view class="line-clamp-1">
              {{ item.operator || '-' }} · {{ formatDateTime(item.createTime) }}
            </view>
          </view>
          <!-- 批次操作：查看流水 / 下载异常明细 / 删除流水 -->
          <view class="mt-16rpx flex justify-end gap-16rpx border-t border-t-[#f5f6f8] pt-16rpx">
            <wd-button size="small" plain @click="goFlows(item)">
              查看流水
            </wd-button>
            <wd-button
              v-if="(item.errorRows ?? 0) > 0"
              size="small"
              plain
              @click="downloadErrorsCsv(item)"
            >
              下载异常明细
            </wd-button>
            <wd-button
              v-if="(item.successRows ?? 0) > 0 && canDelete"
              size="small"
              plain
              type="error"
              @click="onDeleteBatch(item)"
            >
              删除流水
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { BankFlowImportBatchVO } from '@/api/fin/bankFlow'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { batchStatusLabel, deleteBankFlowBatch, getBankFlowBatchPage, matchTypeLabel } from '@/api/fin/bankFlow'
import { useAccess } from '@/hooks/useAccess'
import { downloadTextFileH5 } from '@/utils/download'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'FinBankFlowBatches',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

/** 删除批次流水权限 */
const canDelete = hasAccessByCodes(['fin:bank-flow:delete'])

function handleBack() {
  navigateBackPlus()
}

/** 批次状态：0 进行中 1 完成 2 失败 */
const statusChips = [
  { label: '全部', value: -1 },
  { label: '进行中', value: 0 },
  { label: '完成', value: 1 },
  { label: '失败', value: 2 },
]
const currentStatus = ref(-1)
const list = ref<BankFlowImportBatchVO[]>([])
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
    const data = await getBankFlowBatchPage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusTagType(status?: number): 'primary' | 'success' | 'error' | 'info' {
  if (status === 1) {
    return 'success'
  }
  if (status === 2) {
    return 'error'
  }
  if (status === 0) {
    return 'primary'
  }
  return 'info'
}

/** 查看该批次导入的流水（跳转流水列表并按批次过滤） */
function goFlows(item: BankFlowImportBatchVO) {
  uni.navigateTo({ url: `/pages-fin/bankflow/list?batchId=${item.id}` })
}

/** 删除整个批次的流水（软删除，批次记录保留并标记作废；可重导原文件恢复） */
function onDeleteBatch(item: BankFlowImportBatchVO) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除「${item.fileName || `批次 ${item.id}`}」导入的全部流水（成功 ${item.successRows ?? 0} 行）？删除后可重新导入原文件恢复。`,
  }).then(async () => {
    try {
      const count = await deleteBankFlowBatch(item.id)
      uni.showToast({ title: `已删除 ${count ?? 0} 行流水`, icon: 'none' })
      // 批次流水变动同步流水列表
      uni.$emit('fin:bankflow:reload')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 下载批次异常行明细（CSV，含 BOM 防 Excel 乱码；H5 端可用） */
function downloadErrorsCsv(item: BankFlowImportBatchVO) {
  const errors = item.errors || []
  if (!errors.length) {
    toast.show('该批次没有异常明细')
    return
  }
  const lines = [
    '行号,原因',
    ...errors.map(e => `${e.rowNo},"${e.reason.replace(/"/g, '""')}"`),
  ]
  // #ifdef H5
  downloadTextFileH5(`\uFEFF${lines.join('\n')}`, `${item.fileName || `批次${item.id}`}_异常明细.csv`, 'text/csv;charset=utf-8')
  // #endif
  // #ifndef H5
  toast.show('异常明细请前往 H5 端或 PC 端下载')
  // #endif
}
</script>
