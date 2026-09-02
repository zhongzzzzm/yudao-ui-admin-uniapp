<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="title" placeholder safe-area-inset-top fixed @click-left="handleBack"
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

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      :empty-view-text="`暂无${title}数据`"
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
              {{ item.description || title }}
            </view>
            <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view v-for="section in sourceSections(item)" :key="section.label" class="line-clamp-1">
              {{ section.label }}：{{ section.name }}
            </view>
            <view class="line-clamp-1">
              创建时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 详情弹层：源文件可预览，结果文件按权限预览 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          {{ activeItem?.description || `${title}详情` }}
        </view>

        <view v-for="section in sourceSections(activeItem)" :key="section.label" class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            {{ section.label }}
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] p-20rpx text-24rpx text-[#333]">
            {{ section.name }}
          </view>
        </view>

        <!-- 结果文件 -->
        <view v-if="activeResultSection" class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            比对结果
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="mb-12rpx text-24rpx text-[#333]">
              {{ activeResultSection.name }}
            </view>
            <wd-button
              v-if="canDownloadResult"
              size="small"
              type="primary"
              plain
              @click="previewResult"
            >
              查看结果文件
            </wd-button>
          </view>
        </view>

        <view v-if="activeItem?.description" class="text-24rpx text-[#999]">
          创建时间：{{ formatDateTime(activeItem?.createTime) }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { PageParam, PageResult } from '@/http/types'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getFileNameFromUrl } from '@/utils/download'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** 页面/弹层标题（也是任务类型名） */
  title: string
  /** 分页查询函数 */
  fetchPage: (params: PageParam & { status?: number }) => Promise<PageResult<Record<string, any>>>
  /** 源文件字段：key 为 VO 字段名，label 为展示名 */
  sourceLabels: { key: string, label: string }[]
  /** 结果文件字段名，默认 result */
  resultKey?: string
  /** 查看结果文件的权限码（对齐 PC downloadResult） */
  downloadPermission?: string
}>(), {
  resultKey: 'result',
})

/** fin 比对任务通用状态：0 处理中 1 处理完成 2 处理失败（FinDataStatusEnum） */
const FIN_COMPARE_STATUS = [
  { label: '处理中', value: 0 },
  { label: '处理完成', value: 1 },
  { label: '处理失败', value: 2 },
] as const

function handleBack() {
  navigateBackPlus()
}

const { hasAccessByCodes } = useAccess()
const canDownloadResult = computed(() =>
  !props.downloadPermission || hasAccessByCodes([props.downloadPermission]),
)

const statusChips = [
  { label: '全部', value: -1 },
  ...FIN_COMPARE_STATUS.map(item => ({ label: item.label, value: item.value })),
]
const currentStatus = ref(-1)
const list = ref<Record<string, any>[]>([])
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
    const data = await props.fetchPage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status?: number): string {
  return FIN_COMPARE_STATUS.find(item => item.value === status)?.label ?? '未知'
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

/** 源文件区：文件名 + 是否可预览 */
function sourceSections(item?: Record<string, any>) {
  if (!item) {
    return []
  }
  return props.sourceLabels
    .map(({ key, label }) => ({ label, url: item[key] as string | undefined }))
    .map(({ label, url }) => ({ label, url, name: url ? getFileNameFromUrl(url) : '-' }))
}

function resultSection(item?: Record<string, any>) {
  if (!item) {
    return undefined
  }
  const url = item[props.resultKey] as string | undefined
  return url ? { url, name: getFileNameFromUrl(url) } : undefined
}

/** 详情弹层 */
const showDetail = ref(false)
const activeItem = ref<Record<string, any> | null>(null)

const activeResultSection = computed(() => resultSection(activeItem.value ?? undefined))

function openDetail(item: Record<string, any>) {
  activeItem.value = item
  showDetail.value = true
}

/** 统一走 kkfileview 预览，失败由预览页兜底 */
function previewFile(url: string, name?: string) {
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(name || '')}`,
  })
}

function previewResult() {
  const section = activeResultSection.value
  if (section) {
    previewFile(section.url, section.name)
  }
}
</script>
