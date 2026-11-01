<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="表样对比" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 对比对象 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="flex items-center justify-between text-26rpx">
        <text class="text-[#018d71] font-500">基准 {{ sourceLabel }}</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
        <text class="text-[#fa8c16] font-500">对比 {{ targetLabel }}</text>
      </view>
      <view v-if="diff" class="mt-8rpx text-24rpx" :class="diff.same ? 'text-[#52c41a]' : 'text-[#fa8c16]'">
        {{ diff.same ? '两版表样一致' : '存在表样差异' }}
      </view>
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!diff" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">{{ error || '加载失败' }}</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDiff">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 警告 -->
        <view
          v-for="(warning, index) in diff.warnings"
          :key="index"
          class="mx-24rpx mt-24rpx rounded-16rpx bg-[#fffbe6] p-20rpx text-24rpx text-[#fa8c16]"
        >
          {{ warning }}
        </view>

        <!-- 两版一致 -->
        <view v-if="diff.same" class="flex flex-col items-center pt-120rpx">
          <wd-icon name="check-circle" size="80rpx" color="#52c41a" />
          <text class="mt-24rpx text-28rpx text-[#999]">两版表样一致，无行差异</text>
        </view>

        <!-- Sheet 差异分组 -->
        <view
          v-for="(sheet, sIdx) in diff.sheetItems"
          :key="sIdx"
          class="m-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm"
        >
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <text class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ sheet.sheetName || `Sheet${sIdx + 1}` }}{{ sheet.targetSheetName ? ` → ${sheet.targetSheetName}` : '' }}
            </text>
            <wd-tag :type="sheetTagType(sheet.status)" plain class="ml-12rpx flex-shrink-0">
              {{ sheetStatusLabel(sheet.status) }}
            </wd-tag>
          </view>
          <!-- Sheet 统计 -->
          <view v-if="sheet.stats && sheet.status !== 'SAME'" class="flex flex-wrap gap-16rpx px-24rpx pt-16rpx text-24rpx text-[#777]">
            <text>新增 {{ sheet.stats.addedCount }}</text>
            <text>位移 {{ sheet.stats.shiftedCount }}</text>
            <text>歧义 {{ sheet.stats.ambiguousCount }}</text>
            <text>未匹配 {{ sheet.stats.unmatchedCount }}</text>
            <text>相同 {{ sheet.stats.sameCount }}</text>
          </view>
          <view v-if="sheet.headerChanged" class="px-24rpx pt-8rpx text-24rpx text-[#fa8c16]">
            表头发生变化
          </view>

          <!-- 行差异明细（上下对照） -->
          <view
            v-for="(row, rIdx) in sheet.rowItems || []"
            :key="rIdx"
            class="border-t border-t-[#f7f8f9] px-24rpx py-16rpx"
          >
            <view class="mb-8rpx flex items-center justify-between">
              <text class="text-24rpx text-[#999]">
                基准行 {{ row.oldRow ?? '-' }} → 对比行 {{ row.newRow ?? '-' }}
              </text>
              <wd-tag :type="rowTagType(row.diffType)" plain>
                {{ rowTypeLabel(row.diffType) }}
              </wd-tag>
            </view>
            <view class="text-24rpx space-y-6rpx">
              <view class="rounded-12rpx bg-[#f7f8f9] px-16rpx py-10rpx" :class="{ 'line-through text-[#bbb]': row.diffType === 'REMOVED' }">
                <text class="text-[#999]">基准：</text>{{ row.oldLabel || '（无）' }}
              </view>
              <view class="rounded-12rpx bg-[#e6f7f1] px-16rpx py-10rpx">
                <text class="text-[#999]">对比：</text>{{ row.newLabel || '（无）' }}
              </view>
              <view v-if="row.candidates?.length" class="text-[#fa8c16]">
                候选行：{{ row.candidates.join('、') }}
              </view>
            </view>
          </view>

          <!-- 被省略的明细条数 -->
          <view v-if="sheet.omittedCount" class="px-24rpx py-16rpx text-24rpx text-[#999]">
            差异过多，已省略 {{ sheet.omittedCount }} 条明细，完整对比请移步 PC 端
          </view>
        </view>
        <view class="h-40rpx" />
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { LayoutDiffRowItem, LayoutDiffSheetItem, SourceFileDefVersionLayoutDiffVO } from '@/api/rpt/sourceFileDef'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { LAYOUT_DIFF_TYPE_LABELS, layoutDiffSourceFileDefVersion } from '@/api/rpt/sourceFileDef'

defineOptions({
  name: 'RptSourceDefVersionDiff',
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
const diff = ref<SourceFileDefVersionLayoutDiffVO>()

function sheetStatusLabel(status: LayoutDiffSheetItem['status']): string {
  return { ADDED: '新增', CHANGED: '变更', REMOVED: '删除', SAME: '一致' }[status] ?? status
}

function sheetTagType(status: LayoutDiffSheetItem['status']): 'success' | 'warning' | 'error' | 'info' {
  if (status === 'SAME') {
    return 'success'
  }
  if (status === 'ADDED') {
    return 'warning'
  }
  return status === 'REMOVED' ? 'error' : 'warning'
}

function rowTypeLabel(type: LayoutDiffRowItem['diffType']): string {
  return LAYOUT_DIFF_TYPE_LABELS[type] ?? type
}

function rowTagType(type: LayoutDiffRowItem['diffType']): 'success' | 'warning' | 'error' {
  if (type === 'ADDED') {
    return 'success'
  }
  return type === 'REMOVED' ? 'error' : 'warning'
}

async function loadDiff() {
  if (!sourceVersionId.value || !targetVersionId.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    diff.value = await layoutDiffSourceFileDefVersion(sourceVersionId.value, targetVersionId.value)
  } catch (e: any) {
    console.error('加载表样对比失败：', e)
    diff.value = undefined
    error.value = e?.message || '加载表样对比失败'
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
