<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="指标值溯源" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!rootNode" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadTrace">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 指标值概要 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ rootNode.value.indicatorName || rootNode.value.indicatorCode || `指标 #${rootNode.value.indicatorId}` }}
            </text>
            <wd-tag :type="rootNode.value.status === 1 ? 'error' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ rootNode.value.status === 1 ? '失败' : '成功' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view>
              指标值：<text class="text-30rpx text-[#018d71] font-500">{{ rootNode.value.value ?? '-' }}</text>
            </view>
            <view>
              编码：{{ rootNode.value.indicatorCode || '-' }}{{ rootNode.value.memberName ? ` · 成员：${rootNode.value.memberName}` : '' }}
            </view>
            <view>
              版本：{{ rootNode.value.batchDate || '-' }} · 规则 R{{ rootNode.value.ruleVersionNo ?? '-' }}{{ rootNode.value.ruleVersionInferred ? '（现行推断）' : '' }}
            </view>
            <view v-if="rootNode.value.errorMsg" class="text-[#f5222d]">
              {{ rootNode.value.errorMsg }}
            </view>
            <view>
              计算时间：{{ rootNode.value.computeTime ? formatDateTime(rootNode.value.computeTime) : '-' }}
            </view>
          </view>
        </view>

        <!-- 取数链路（本值 → 逐级 LINK 引用，缩进层级展示） -->
        <view class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            取数链路
          </view>
          <view class="space-y-12rpx">
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
              <!-- 来源明细 -->
              <view
                v-for="source in node.sources"
                :key="source.id"
                class="mt-8rpx text-24rpx text-[#777]"
              >
                <view>
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
                <view v-if="source.transformDesc && (source.sourceType === 1 || source.sourceType === 2)" class="text-[#999]">
                  变换：{{ source.transformDesc }}
                </view>
                <!-- 底稿原文 / 来源报表 kkFileView 预览 -->
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
          <view v-if="!traceNodes.length" class="py-40rpx text-center text-26rpx text-[#999]">
            暂无溯源数据
          </view>
        </view>
        <view class="h-180rpx" />
      </template>
    </scroll-view>

    <!-- 底部操作栏：单指标重算 -->
    <view v-if="rootNode && canCompute" class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button type="primary" block :loading="computing" :disabled="computing" @click="handleCompute">
        重算该指标
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { IndicatorSourceTreeNodeVO, IndicatorValueSourceVO } from '@/api/rpt/dataIndicatorValue'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { computeDataIndicatorValue, getIndicatorValueSourceTree, SOURCE_TYPE_LABELS } from '@/api/rpt/dataIndicatorValue'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'RptIndicatorValueTrace',
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

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

/** 重算权限（rpt:data-indicator-value:compute） */
const canCompute = computed(() => hasAccessByCodes(['rpt:data-indicator-value:compute']))

const valueId = ref<number>()
const loading = ref(true)
const computing = ref(false)
const rootNode = ref<IndicatorSourceTreeNodeVO>()

/** 链路树按「本值 → 逐级 LINK 引用」拍平为缩进节点列表 */
const traceNodes = computed<IndicatorSourceTreeNodeVO[]>(() => {
  const nodes: IndicatorSourceTreeNodeVO[] = []
  const walk = (node: IndicatorSourceTreeNodeVO) => {
    nodes.push(node)
    node.children?.forEach(walk)
  }
  if (rootNode.value) {
    walk(rootNode.value)
  }
  return nodes
})

/** 加载来源链路树 */
async function loadTrace() {
  if (!valueId.value) {
    return
  }
  loading.value = true
  try {
    rootNode.value = await getIndicatorValueSourceTree(valueId.value)
  } catch (e) {
    console.error('加载溯源链路失败：', e)
    rootNode.value = undefined
  } finally {
    loading.value = false
  }
}

function sourceFileUrl(source: IndicatorValueSourceVO): string | undefined {
  return source.sourceType === 6 ? source.sourceReportUrl : source.sourceFileUrl
}

/** 底稿原文 / 来源报表统一走 kkfileview 预览 */
function previewSource(source: IndicatorValueSourceVO) {
  const url = sourceFileUrl(source)
  if (!url) {
    return
  }
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(source.sourceFileName || source.sourceReportName || '')}`,
  })
}

/** 单指标重算：二次确认后按当前数据版本异步触发，落库后可在列表刷新查看 */
function handleCompute() {
  const value = rootNode.value?.value
  if (!value?.batchId || !value.indicatorId) {
    toast.show('缺少数据版本或指标信息，无法重算')
    return
  }
  dialog.confirm({
    title: '确认重算',
    msg: `确认在数据版本 ${value.batchDate || value.batchId} 下重算【${value.indicatorName || value.indicatorCode || '该指标'}】？重算为异步执行，完成后值将更新。`,
  }).then(async () => {
    computing.value = true
    try {
      await computeDataIndicatorValue({ batchId: value.batchId!, indicatorId: value.indicatorId })
      toast.show('已提交重算，稍后刷新列表查看最新值')
    } catch (e: any) {
      toast.show(e?.message || '重算提交失败')
    } finally {
      computing.value = false
    }
  }).catch(() => {})
}

onLoad((query) => {
  valueId.value = Number(query?.id)
  loadTrace()
})
</script>
