<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据行明细" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view v-if="loading" class="flex justify-center py-120rpx">
          <wd-loading color="#018d71" />
        </view>

        <view v-else-if="loadFailed" class="py-120rpx text-center">
          <view class="mb-16rpx text-26rpx text-[#999]">
            加载失败
          </view>
          <wd-button size="small" plain @click="load">
            重试
          </wd-button>
        </view>

        <view v-else-if="!row" class="py-120rpx text-center text-26rpx text-[#999]">
          未找到该数据行（可能已被重新导入覆盖）
        </view>

        <template v-else>
          <view class="mb-20rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="text-28rpx text-[#333] font-500">
              {{ row.reportName || '报表数据' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              数据日期：{{ row.batchDate || '-' }} · 行号 {{ row.rowIndex ?? '-' }}
            </view>
          </view>

          <!-- 行数据按 JSON 键值对展示 -->
          <view class="rounded-16rpx bg-white p-24rpx shadow-sm">
            <view
              v-for="(item, idx) in rowEntries"
              :key="`${item.key}-${idx}`"
              class="flex border-b border-[#f2f2f2] py-16rpx last:border-b-0"
            >
              <view class="mr-16rpx w-240rpx flex-shrink-0 break-all text-24rpx text-[#999]">
                {{ item.key }}
              </view>
              <view class="flex-1 break-all text-24rpx text-[#333]">
                {{ item.value }}
              </view>
            </view>
            <view v-if="rowEntries.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
              该行没有数据
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ReportDataVO } from '@/api/validation/reportData'
import { navigateBackPlus } from '@/utils'
import { computed, ref } from 'vue'
import { getReportDataPage } from '@/api/validation/reportData'

defineOptions({
  name: 'ValidationReportDataRow',
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

const query = ref<{ reportId?: number, batchId?: number, rowIndex?: number }>({})
const loading = ref(false)
const loadFailed = ref(false)
const row = ref<ReportDataVO>()

/** 解析行 value（JSON 字符串）为键值对；解析失败时按原始文本展示 */
const rowEntries = computed<{ key: string, value: string }[]>(() => {
  const raw = row.value?.value
  if (raw == null || raw === '') {
    return []
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => ({
        key: item?.columnName ?? item?.name ?? `列${idx + 1}`,
        value: item?.value ?? String(item),
      }))
    }
    return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
      key,
      value: value == null ? '-' : typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
  } catch {
    return [{ key: '原始值', value: String(raw) }]
  }
})

async function load() {
  const { reportId, batchId, rowIndex } = query.value
  loading.value = true
  loadFailed.value = false
  try {
    const data = await getReportDataPage({ pageNo: 1, pageSize: 10, reportId, batchId, rowIndex })
    row.value = data.list[0]
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onLoad((q) => {
  query.value = {
    reportId: q?.reportId ? Number(q.reportId) : undefined,
    batchId: q?.batchId ? Number(q.batchId) : undefined,
    rowIndex: q?.rowIndex != null && q.rowIndex !== 'undefined' ? Number(q.rowIndex) : undefined,
  }
  load()
})
</script>
