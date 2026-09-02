<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="发票台账" placeholder safe-area-inset-top fixed @click-left="handleBack"
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
      empty-view-text="暂无发票台账数据"
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
              {{ item.description || '发票比对记录' }}
            </view>
            <wd-tag v-if="item.status != null" :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="line-clamp-1 text-26rpx text-[#777]">
            创建时间：{{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 详情弹层（文件类字段展示文件名，可点击预览） -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          {{ activeItem?.description || '台账详情' }}
        </view>
        <view v-for="section in detailSections" :key="section.label" class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            {{ section.label }}
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="mb-8rpx text-24rpx text-[#333]">
              {{ section.name }}
            </view>
            <wd-button
              v-if="section.url && section.canPreview"
              size="small"
              type="primary"
              plain
              @click="previewFile(section.url, section.name)"
            >
              预览文件
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { InvoiceLedgerVO } from '@/api/fin/invoiceLedger'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getFileNameFromUrl } from '@/utils/download'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'
import { getInvoiceLedgerPage } from '@/api/fin/invoiceLedger'

defineOptions({
  name: 'InvoiceLedgerList',
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

const { hasAccessByCodes } = useAccess()
const canDownloadResult = hasAccessByCodes(['fin:invoice-ledger:downloadResult'])

const list = ref<InvoiceLedgerVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getInvoiceLedgerPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 状态：0 处理中 1 处理完成 2 处理失败（FinDataStatusEnum） */
function statusLabel(status?: number): string {
  return ({ 0: '处理中', 1: '处理完成', 2: '处理失败' } as Record<number, string>)[status ?? -1] ?? '未知'
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

/** 详情弹层：源文件所有可见用户均可预览，结果文件需 downloadResult 权限 */
const showDetail = ref(false)
const activeItem = ref<InvoiceLedgerVO | null>(null)
const detailSections = computed(() => [
  {
    label: '发票台账',
    url: activeItem.value?.invoice,
    name: activeItem.value?.invoice ? getFileNameFromUrl(activeItem.value.invoice) : '-',
    canPreview: true,
  },
  {
    label: '明细账',
    url: activeItem.value?.ledger,
    name: activeItem.value?.ledger ? getFileNameFromUrl(activeItem.value.ledger) : '-',
    canPreview: true,
  },
  {
    label: '比对结果',
    url: activeItem.value?.result,
    name: activeItem.value?.result ? getFileNameFromUrl(activeItem.value.result) : '-',
    canPreview: canDownloadResult,
  },
])

function openDetail(item: InvoiceLedgerVO) {
  activeItem.value = item
  showDetail.value = true
}

/** 统一走 kkfileview 预览 */
function previewFile(url: string, name?: string) {
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(name || '')}`,
  })
}
</script>
