<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="报表对比" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 状态筛选条：选项来自 validation_data_status 字典 -->
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

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无报表对比任务"
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
              {{ item.description || '报表对比任务' }}
            </view>
            <wd-tag :type="statusTagType(item.comparisonStatus)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.comparisonStatus) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              改前：{{ fileName(item.beforeReport) }}
            </view>
            <view class="line-clamp-1">
              改后：{{ fileName(item.afterReport) }}
            </view>
            <view class="line-clamp-1">
              创建时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 详情弹层 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          {{ activeItem?.description || '对比任务详情' }}
        </view>

        <view v-for="section in fileSections" :key="section.label" class="mb-16rpx">
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

        <view class="text-24rpx text-[#999]">
          对比状态：{{ statusLabel(activeItem?.comparisonStatus) }} · 创建时间：{{ formatDateTime(activeItem?.createTime) }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportComparisonVO } from '@/api/validation/comparison'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getFileNameFromUrl } from '@/utils/download'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'
import { getReportComparisonPage } from '@/api/validation/comparison'

defineOptions({
  name: 'ValidationComparisonList',
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
const canDownloadResult = hasAccessByCodes(['validation:report-comparison:downloadResult'])

const currentStatus = ref(-1)
const list = ref<ReportComparisonVO[]>([])
const pagingRef = ref<any>()

/** 筛选项：全部 + 字典选项（字典未加载时只显示「全部」） */
const statusChips = computed(() => [
  { label: '全部', value: -1 },
  ...getDictOptions(DICT_TYPE.VALIDATION_DATA_STATUS).map(item => ({
    label: item.label,
    value: Number(item.value),
  })),
])

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportComparisonPage({
      pageNo,
      pageSize,
      comparisonStatus: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status?: number): string {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.VALIDATION_DATA_STATUS, status) || '未知'
}

function statusTagType(status?: number): 'success' | 'error' | 'info' {
  if (status === 1) {
    return 'success'
  }
  if (status === 2) {
    return 'error'
  }
  return 'info'
}

function fileName(url?: string) {
  return url ? getFileNameFromUrl(url) : '-'
}

/** 详情弹层：改前/改后源文件可预览，结果文件需 downloadResult 权限 */
const showDetail = ref(false)
const activeItem = ref<ReportComparisonVO | null>(null)

const fileSections = computed(() => {
  const item = activeItem.value
  if (!item) {
    return []
  }
  return [
    { label: '改前报表', url: item.beforeReport, canPreview: true },
    { label: '改后报表', url: item.afterReport, canPreview: true },
    { label: '对比结果', url: item.comparisonResult, canPreview: canDownloadResult },
  ].map(section => ({
    ...section,
    name: section.url ? getFileNameFromUrl(section.url) : '-',
  }))
})

function openDetail(item: ReportComparisonVO) {
  activeItem.value = item
  showDetail.value = true
}

function previewFile(url: string, name?: string) {
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(name || '')}`,
  })
}
</script>
