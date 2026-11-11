<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="落表批次详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />
    <view class="bg-[#fffbe6] px-24rpx py-12rpx text-24rpx text-[#fa8c16]">
      {{ FETCH_READONLY_TIP }}
    </view>

    <view v-if="loading" class="flex flex-col items-center pt-240rpx">
      <wd-loading color="#018d71" />
    </view>
    <view v-else-if="!batch" class="flex flex-col items-center pt-240rpx">
      <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
      <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
      <wd-button class="mt-32rpx" size="small" plain @click="loadBatch">
        重试
      </wd-button>
    </view>

    <template v-else>
      <!-- 批次摘要 -->
      <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
            {{ batch.scriptName || `批次 #${batch.id}` }}
          </text>
          <wd-tag :type="batchStatusTagType(batch.status)" plain class="ml-16rpx flex-shrink-0">
            {{ batchStatusLabel(batch.status) }}
          </wd-tag>
        </view>
        <view class="text-26rpx text-[#777] space-y-6rpx">
          <view>批次 #{{ batch.id }} · {{ dataTypeLabel(batch.dataType) }} · 期间：{{ displayValue(batch.period) }}</view>
          <view>触发：{{ triggerSourceLabel(batch.triggerSource) }} · 取数时间：{{ formatDateTime(batch.fetchTime) || '-' }}</view>
          <view>
            落表行数：{{ batch.rowCount ?? 0 }} · 标准化成功 {{ batch.parsedCount ?? 0 }} · 解析异常 <text :class="batch.errorCount ? 'text-[#f5222d]' : ''">{{ batch.errorCount ?? 0 }}</text>
          </view>
          <view>超上限截断：{{ displayBoolean(batch.truncated) }}</view>
          <view v-if="batch.errorMsg" class="text-[#f5222d]">
            {{ batch.errorMsg }}
          </view>
          <view v-if="batch.fileUrl" class="text-[#018d71]" @click="openOriginalFile">
            查看原始留档：{{ displayValue(batch.fileName) }}
          </view>
        </view>
      </view>

      <!-- 行数据视图切换 -->
      <view class="flex gap-16rpx bg-white px-24rpx py-16rpx">
        <view
          v-for="chip in rowModeChips"
          :key="chip.value"
          class="flex-1 rounded-full py-10rpx text-center text-26rpx"
          :class="rowMode === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
          @click="handleRowModeChange(chip.value)"
        >
          {{ chip.label }}
        </view>
      </view>
      <view class="flex gap-16rpx bg-white px-24rpx pb-16rpx">
        <view
          v-for="chip in parseStatusChips"
          :key="chip.value"
          class="rounded-full px-24rpx py-8rpx text-24rpx"
          :class="currentParseStatus === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
          @click="handleParseStatusChange(chip.value)"
        >
          {{ chip.label }}
        </view>
      </view>

      <z-paging
        ref="pagingRef"
        v-model="rows"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无落表行数据"
        @query="queryRows"
      >
        <view class="px-24rpx">
          <view
            v-for="row in rows"
            :key="row.id"
            class="mb-20rpx overflow-hidden rounded-16rpx bg-white p-20rpx shadow-sm"
            :class="row.parseStatus === 2 ? 'border border-[#f5222d]' : ''"
          >
            <view class="mb-12rpx flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
                第 {{ row.rowNo ?? '-' }} 行 · {{ displayValue(row.matchKey) }}
              </text>
              <wd-tag :type="parseStatusTagType(row.parseStatus)" plain class="ml-16rpx flex-shrink-0">
                {{ parseStatusLabel(row.parseStatus) }}
              </wd-tag>
            </view>
            <view v-if="row.parseError" class="mb-12rpx text-24rpx text-[#f5222d]">
              解析异常：{{ row.parseError }}
            </view>
            <view class="max-h-400rpx overflow-auto whitespace-pre-wrap break-all rounded-12rpx bg-[#f7f8f9] p-16rpx text-22rpx text-[#555] font-mono">
              {{ rowJson(row) }}
            </view>
          </view>
          <view class="h-180rpx" />
        </view>
      </z-paging>

      <!-- 发起校验：读取校验配置或输入临时参数 -->
      <view class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
        <view v-if="!canVerifyNow" class="mb-8rpx text-22rpx text-[#fa8c16]">
          仅成功的非空落表批次可发起校验；无权限或配置调整请到 PC 管理台操作
        </view>
        <wd-button type="primary" block :disabled="!canVerifyNow" @click="goCreateVerify">
          发起校验
        </wd-button>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteFetchBatchVO, QuoteFetchRowVO } from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { computed, nextTick, ref } from 'vue'
import { getFetchBatch, getFetchBatchRowPage } from '@/api/fl/quoteFetch'
import {
  batchStatusLabel,
  batchStatusTagType,
  dataTypeLabel,
  displayBoolean,
  displayValue,
  FETCH_READONLY_TIP,
  formatJson,
  parseStatusLabel,
  parseStatusTagType,
  triggerSourceLabel,
} from '../utils'

type RowMode = 'std' | 'raw'

defineOptions({
  name: 'FlQuoteFetchDataDetail',
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

const { hasAccessByCodes } = useAccess()
const loading = ref(false)
const batch = ref<QuoteFetchBatchVO>()
const batchId = ref<number>()
const rows = ref<QuoteFetchRowVO[]>([])
const pagingRef = ref<any>()

const rowModeChips: { label: string, value: RowMode }[] = [
  { label: '标准化', value: 'std' },
  { label: '原始 JSON', value: 'raw' },
]
const rowMode = ref<RowMode>('std')
const parseStatusChips = [
  { label: '全部', value: -1 },
  { label: '正常', value: 1 },
  { label: '异常', value: 2 },
]
const currentParseStatus = ref(-1)

const canVerify = computed(() => hasAccessByCodes(['fl:fetch-data:verify']))
const canVerifyNow = computed(() => canVerify.value
  && batch.value?.status === 1
  && (batch.value?.rowCount ?? 0) > 0)

onLoad((query) => {
  batchId.value = Number(query?.id)
  loadBatch()
})

async function loadBatch() {
  if (!batchId.value) {
    return
  }
  loading.value = true
  try {
    batch.value = await getFetchBatch(batchId.value)
  } catch {
    batch.value = undefined
  } finally {
    loading.value = false
    await nextTick()
    if (batch.value) {
      pagingRef.value?.reload()
    }
  }
}

async function queryRows(pageNo: number, pageSize: number) {
  if (!batchId.value) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getFetchBatchRowPage(batchId.value, {
      pageNo,
      pageSize,
      parseStatus: currentParseStatus.value === -1 ? undefined : currentParseStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function handleRowModeChange(value: RowMode) {
  if (rowMode.value === value) {
    return
  }
  rowMode.value = value
}

function handleParseStatusChange(value: number) {
  if (currentParseStatus.value === value) {
    return
  }
  currentParseStatus.value = value
  pagingRef.value?.reload()
}

function rowJson(row: QuoteFetchRowVO): string {
  return formatJson(rowMode.value === 'std' ? row.std : row.raw)
}

function openOriginalFile() {
  openAttachment(batch.value?.fileUrl)
}

function goCreateVerify() {
  if (!batchId.value || !canVerifyNow.value) {
    return
  }
  uni.navigateTo({ url: `/pages-fl/quotefetch/data/create-verify?id=${batchId.value}` })
}
</script>
