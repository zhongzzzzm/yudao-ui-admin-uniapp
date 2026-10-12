<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="指标值查询" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 计算状态筛选条 -->
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

    <!-- 指标值列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无指标值"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openTrace(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.indicatorName || item.indicatorCode || `指标 #${item.indicatorId}` }}
            </view>
            <wd-tag :type="item.status === 1 ? 'error' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ item.status === 1 ? '失败' : '成功' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              指标值：<text class="text-[#018d71] font-500">{{ item.value ?? '-' }}</text>
            </view>
            <view class="line-clamp-1">
              编码：{{ item.indicatorCode || '-' }}{{ item.memberName ? ` · 成员：${item.memberName}` : '' }}
            </view>
            <view class="line-clamp-1">
              版本：{{ item.batchDate || '-' }} · 规则 R{{ item.ruleVersionNo ?? '-' }}{{ item.ruleVersionInferred ? '（现行推断）' : '' }}
            </view>
            <view v-if="item.errorMsg" class="line-clamp-2 text-[#f5222d]">
              {{ item.errorMsg }}
            </view>
            <view class="line-clamp-1">
              计算时间：{{ item.computeTime ? formatDateTime(item.computeTime) : '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 溯源弹层：来源明细 + LINK 链路树 -->
    <wd-popup v-model="showTrace" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-75vh overflow-auto p-24rpx">
        <view class="mb-8rpx text-30rpx text-[#333] font-500">
          指标溯源
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          {{ activeItem?.indicatorName || '-' }} · {{ activeItem?.batchDate || '-' }}
        </view>
        <view v-if="traceLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="traceTree" class="space-y-12rpx">
          <view
            v-for="(node, index) in traceNodes"
            :key="index"
            class="rounded-12rpx p-20rpx"
            :class="index === 0 ? 'bg-[#e6f7f1]' : 'bg-[#f7f8f9]'"
            :style="{ marginLeft: `${Math.min(index, 4) * 24}rpx` }"
          >
            <view class="flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-26rpx text-[#333] font-500">
                {{ node.value.indicatorName || node.value.indicatorCode || `指标 #${node.value.indicatorId}` }}
              </text>
              <text class="ml-12rpx flex-shrink-0 text-26rpx text-[#018d71] font-500">
                {{ node.value.value ?? '-' }}
              </text>
            </view>
            <view
              v-for="source in node.sources"
              :key="source.id"
              class="mt-8rpx text-24rpx text-[#777]"
            >
              <view class="line-clamp-1">
                {{ SOURCE_TYPE_LABELS[source.sourceType] || '来源' }}：
                <template v-if="source.sourceType === 1 || source.sourceType === 2">
                  {{ source.sourceFileName || '底稿' }} · {{ source.sheetName || `Sheet${(source.sheetIndex ?? 0) + 1}` }} · {{ source.sourceType === 1 ? source.cellRef : `行 ${source.rowNo ?? '-'}` }}
                </template>
                <template v-else-if="source.sourceType === 6">
                  {{ source.sourceReportName || '报表' }}
                </template>
                <template v-else>
                  {{ source.remark || source.transformDesc || '-' }}
                </template>
                <text v-if="source.rawValue != null" class="text-[#018d71]">（原值 {{ source.rawValue }}）</text>
              </view>
              <view
                v-if="sourceFileUrl(source)"
                class="mt-4rpx text-[#018d71]"
                @click="previewSource(source)"
              >
                查看原文 ›
              </view>
            </view>
          </view>
        </view>
        <view v-else class="py-40rpx text-center text-26rpx text-[#999]">
          暂无溯源数据
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { DataIndicatorValueVO, IndicatorSourceTreeNodeVO, IndicatorValueSourceVO } from '@/api/rpt/dataIndicatorValue'
import { navigateBackPlus } from '@/utils'
import { getDataIndicatorValuePage, getIndicatorValueSourceTree, SOURCE_TYPE_LABELS } from '@/api/rpt/dataIndicatorValue'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'

defineOptions({
  name: 'RptIndicatorValueList',
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

const statusChips = [
  { label: '全部', value: -1 },
  { label: '成功', value: 0 },
  { label: '失败', value: 1 },
]
const currentStatus = ref(-1)
const list = ref<DataIndicatorValueVO[]>([])
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
    const data = await getDataIndicatorValuePage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// ========== 溯源弹层 ==========

const showTrace = ref(false)
const activeItem = ref<DataIndicatorValueVO>()
const traceTree = ref<IndicatorSourceTreeNodeVO>()
const traceLoading = ref(false)

/** 链路树按「本值 → 逐级 LINK 引用」拍平为缩进节点列表 */
const traceNodes = computed<IndicatorSourceTreeNodeVO[]>(() => {
  const nodes: IndicatorSourceTreeNodeVO[] = []
  const walk = (node: IndicatorSourceTreeNodeVO) => {
    nodes.push(node)
    node.children?.forEach(walk)
  }
  if (traceTree.value) {
    walk(traceTree.value)
  }
  return nodes
})

function openTrace(item: DataIndicatorValueVO) {
  activeItem.value = item
  traceTree.value = undefined
  showTrace.value = true
  traceLoading.value = true
  getIndicatorValueSourceTree(item.id).then((tree) => {
    traceTree.value = tree
  }).finally(() => {
    traceLoading.value = false
  })
}

function sourceFileUrl(source: IndicatorValueSourceVO): string | undefined {
  return source.sourceType === 6 ? source.sourceReportUrl : source.sourceFileUrl
}

/** 统一走 kkfileview 预览 */
function previewSource(source: IndicatorValueSourceVO) {
  const url = sourceFileUrl(source)
  if (!url) {
    return
  }
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(source.sourceFileName || source.sourceReportName || '')}`,
  })
}
</script>
