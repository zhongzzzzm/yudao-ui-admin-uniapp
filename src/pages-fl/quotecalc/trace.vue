<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="计算过程" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!trace" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadTrace">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 测算概要 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-30rpx text-[#333] font-semibold">
              引擎测算记录 #{{ trace.id ?? '-' }}
            </text>
            <wd-tag :type="trace.status === 1 ? 'error' : 'success'" plain>
              {{ trace.status === 1 ? '失败' : '成功' }}
            </wd-tag>
          </view>
          <view class="grid grid-cols-2 gap-y-16rpx text-26rpx">
            <view>
              <view class="text-24rpx text-[#999]">
                引擎版本
              </view>
              <view class="text-[#333]">
                {{ trace.engineVersion || '-' }}
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                总耗时
              </view>
              <view class="text-[#333]">
                {{ trace.totalCostMs ?? 0 }} ms
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                步骤数
              </view>
              <view class="text-[#333]">
                {{ trace.steps?.length ?? trace.stepCount ?? 0 }}
              </view>
            </view>
            <view>
              <view class="text-24rpx text-[#999]">
                测算时间
              </view>
              <view class="text-[#333]">
                {{ trace.createTime ? formatDateTime(trace.createTime) : '-' }}
              </view>
            </view>
          </view>
          <view v-if="trace.status === 1" class="mt-16rpx rounded-12rpx bg-[#fff1f0] p-16rpx text-24rpx text-[#f5222d]">
            测算失败：{{ trace.errorMsg || '未知原因' }}
          </view>
        </view>

        <!-- 步骤时间线 -->
        <view class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-20rpx text-28rpx text-[#333] font-500">
            计算步骤
          </view>
          <!-- 左侧竖线 + 状态圆点的时间线布局 -->
          <view class="relative">
            <view class="absolute bottom-8rpx left-14rpx top-8rpx w-2rpx bg-[#e5e6eb]" />
            <view
              v-for="step in trace.steps"
              :key="step.stepNo"
              class="relative mb-24rpx pl-48rpx last:mb-0"
            >
              <!-- 状态圆点 -->
              <view
                class="absolute left-8rpx top-8rpx h-16rpx w-16rpx rounded-full"
                :class="step.status === 2 ? 'bg-[#f5222d]' : (step.status === 1 ? 'bg-[#bbb]' : 'bg-[#52c41a]')"
              />
              <view class="flex items-center justify-between">
                <view class="min-w-0 flex flex-1 items-center gap-12rpx">
                  <text class="line-clamp-1 text-28rpx text-[#333] font-500">
                    {{ step.stepNo }}. {{ step.stepName }}
                  </text>
                  <wd-tag :type="stepTagType(step.status)" plain class="flex-shrink-0">
                    {{ stepStatusLabel(step.status) }}
                  </wd-tag>
                </view>
                <text class="ml-12rpx flex-shrink-0 text-22rpx text-[#bbb]">
                  {{ step.costMs ?? 0 }} ms
                </text>
              </view>
              <view class="mt-4rpx text-22rpx text-[#bbb]">
                {{ step.stepCode }}
              </view>
              <view v-if="step.skipReason" class="mt-8rpx text-24rpx text-[#999]">
                跳过原因：{{ step.skipReason }}
              </view>
              <view v-if="step.errorMsg" class="mt-8rpx text-24rpx text-[#f5222d]">
                {{ step.errorMsg }}
              </view>
              <!-- 公式代入 -->
              <template v-if="step.status !== 1">
                <view v-if="formulasOf(step).length" class="mt-12rpx rounded-12rpx bg-[#f7f8f9] p-16rpx">
                  <view class="mb-8rpx text-22rpx text-[#999]">
                    公式代入
                  </view>
                  <view v-for="(formula, fIdx) in formulasOf(step)" :key="fIdx" class="mb-8rpx last:mb-0">
                    <view class="text-24rpx text-[#333]">
                      {{ formula.desc }}
                    </view>
                    <view class="text-24rpx text-[#018d71] font-mono">
                      {{ formula.expression }}
                    </view>
                    <view v-if="formula.basis" class="text-22rpx text-[#bbb]">
                      {{ formula.basis }}
                    </view>
                  </view>
                </view>
                <!-- 本步输出（点击展开/收起 JSON） -->
                <view v-if="outputOf(step)" class="mt-12rpx" @click="toggleOutput(step.stepNo)">
                  <view class="flex items-center justify-between text-24rpx text-[#018d71]">
                    <text>本步输出</text>
                    <wd-icon :name="expandedOutputs.has(step.stepNo) ? 'arrow-up' : 'arrow-down'" size="24rpx" />
                  </view>
                  <view
                    v-if="expandedOutputs.has(step.stepNo)"
                    class="mt-8rpx max-h-480rpx overflow-auto whitespace-pre-wrap rounded-12rpx bg-[#f7f8f9] p-16rpx text-22rpx text-[#555] font-mono"
                  >
                    {{ outputOf(step) }}
                  </view>
                </view>
              </template>
            </view>
          </view>
        </view>
        <view class="h-40rpx" />
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteTraceStepVO, QuoteTraceVO } from '@/api/fl/quoteCalc'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getQuoteCalcTrace } from '@/api/fl/quoteCalc'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'FlQuoteCalcTrace',
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

interface CalcFormulaItem {
  desc: string // 公式描述
  expression: string // 代入后的表达式
  basis?: string // 取数依据
}

const traceId = ref<number>()
const loading = ref(true)
const trace = ref<QuoteTraceVO>()

/** 展开本步输出的步骤序号集合 */
const expandedOutputs = ref<Set<number>>(new Set())

function toggleOutput(stepNo?: number) {
  if (stepNo == null) {
    return
  }
  const next = new Set(expandedOutputs.value)
  if (next.has(stepNo)) {
    next.delete(stepNo)
  } else {
    next.add(stepNo)
  }
  expandedOutputs.value = next
}

function stepStatusLabel(status?: number): string {
  if (status === 2) {
    return '失败'
  }
  return status === 1 ? '跳过' : '成功'
}

function stepTagType(status?: number): 'success' | 'info' | 'error' {
  if (status === 2) {
    return 'error'
  }
  if (status === 1) {
    return 'info'
  }
  return 'success'
}

/** 步骤公式代入列表（formulaJson 解析，格式异常时降级为空） */
function formulasOf(step: QuoteTraceStepVO): CalcFormulaItem[] {
  if (!step.formulaJson) {
    return []
  }
  try {
    return JSON.parse(step.formulaJson) as CalcFormulaItem[]
  } catch {
    return []
  }
}

/** 步骤输出（格式化 JSON） */
function outputOf(step: QuoteTraceStepVO): string {
  if (!step.outputJson) {
    return ''
  }
  try {
    return JSON.stringify(JSON.parse(step.outputJson), null, 2)
  } catch {
    return step.outputJson
  }
}

async function loadTrace() {
  if (!traceId.value) {
    return
  }
  loading.value = true
  try {
    trace.value = await getQuoteCalcTrace(traceId.value)
  } catch (e) {
    console.error('加载计算过程失败：', e)
    trace.value = undefined
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  traceId.value = Number(query?.traceId)
  loadTrace()
})
</script>
