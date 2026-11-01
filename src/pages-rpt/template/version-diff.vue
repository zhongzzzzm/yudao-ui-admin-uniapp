<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="版本差异对比" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 对比对象 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="flex items-center justify-between text-26rpx">
        <text class="text-[#018d71] font-500">基准 {{ sourceLabel }}</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
        <text class="text-[#fa8c16] font-500">对比 {{ targetLabel }}</text>
      </view>
      <view class="mt-8rpx flex gap-16rpx text-24rpx text-[#999]">
        <text>新增 {{ countOf('ADDED') }}</text>
        <text>变更 {{ countOf('CHANGED') }}</text>
        <text>删除 {{ countOf('REMOVED') }}</text>
      </view>
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 空态 / 加载失败 -->
      <view v-else-if="!items.length" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="check-circle" size="80rpx" color="#52c41a" />
        <text class="mt-24rpx text-28rpx text-[#999]">{{ error || '两版本无差异' }}</text>
        <wd-button v-if="error" class="mt-32rpx" size="small" plain @click="loadDiff">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 差异明细：单元格级上下对照 -->
        <view
          v-for="(item, index) in items"
          :key="index"
          class="m-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-500">
              {{ item.cellRef }}
            </text>
            <wd-tag :type="diffTagType(item.diffType)" plain>
              {{ diffTypeLabel(item.diffType) }}
            </wd-tag>
          </view>
          <!-- 上下对照：基准值（旧） vs 对比值（新） -->
          <view class="text-24rpx space-y-8rpx">
            <view class="rounded-12rpx bg-[#f7f8f9] p-16rpx">
              <view class="mb-4rpx text-[#999]">
                基准 {{ sourceLabel }}
              </view>
              <view class="text-[#333]" :class="{ 'line-through text-[#bbb]': item.diffType === 'REMOVED' }">
                {{ item.sourceSummary || '（无）' }}
              </view>
            </view>
            <view class="rounded-12rpx bg-[#e6f7f1] p-16rpx">
              <view class="mb-4rpx text-[#999]">
                对比 {{ targetLabel }}
              </view>
              <view class="text-[#333]" :class="{ 'text-[#bbb]': item.diffType === 'ADDED' && !item.targetSummary }">
                {{ item.targetSummary || '（无）' }}
              </view>
            </view>
          </view>
          <!-- 字段级差异明细 -->
          <view v-if="item.fieldDiffs?.length" class="mt-12rpx border-t border-t-[#f7f8f9] pt-12rpx space-y-8rpx">
            <view v-for="(field, fIdx) in item.fieldDiffs" :key="fIdx" class="text-24rpx">
              <text class="text-[#999]">{{ field.field }}：</text>
              <text class="text-[#f5222d]">{{ field.oldValue || '（空）' }}</text>
              <text class="mx-8rpx text-[#999]">→</text>
              <text class="text-[#018d71]">{{ field.newValue || '（空）' }}</text>
            </view>
          </view>
        </view>
        <view class="pb-40rpx text-center text-24rpx text-[#999]">
          共 {{ items.length }} 处差异
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TemplateVersionDiffItem } from '@/api/rpt/template'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { diffTaxReportTemplateVersion, TEMPLATE_DIFF_TYPE_LABELS } from '@/api/rpt/template'

defineOptions({
  name: 'RptTemplateVersionDiff',
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

const sourceVersionId = ref<number>()
const targetVersionId = ref<number>()
const sourceLabel = ref('')
const targetLabel = ref('')
const loading = ref(true)
const error = ref('')
const items = ref<TemplateVersionDiffItem[]>([])

function countOf(type: string): number {
  return items.value.filter(item => item.diffType === type).length
}

function diffTypeLabel(type: string): string {
  return TEMPLATE_DIFF_TYPE_LABELS[type] ?? type
}

function diffTagType(type: string): 'success' | 'warning' | 'error' {
  if (type === 'ADDED') {
    return 'success'
  }
  return type === 'CHANGED' ? 'warning' : 'error'
}

async function loadDiff() {
  if (!sourceVersionId.value || !targetVersionId.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await diffTaxReportTemplateVersion(sourceVersionId.value, targetVersionId.value)
    items.value = data.items ?? []
  } catch (e: any) {
    console.error('加载版本差异失败：', e)
    items.value = []
    error.value = e?.message || '加载版本差异失败'
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  sourceVersionId.value = Number(query?.sourceVersionId)
  targetVersionId.value = Number(query?.targetVersionId)
  sourceLabel.value = decodeURIComponent(query?.sourceLabel || '版本')
  targetLabel.value = decodeURIComponent(query?.targetLabel || '版本')
  loadDiff()
})
</script>
