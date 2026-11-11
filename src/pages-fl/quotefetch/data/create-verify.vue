<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="发起校验" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />
    <view class="bg-[#fffbe6] px-24rpx py-12rpx text-24rpx text-[#fa8c16]">
      {{ FETCH_READONLY_TIP }}
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>
      <view v-else-if="!batch" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">落表批次加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadPageData">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 待校验批次摘要 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
            {{ batch.scriptName || `批次 #${batch.id}` }}
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view>批次 #{{ batch.id }} · {{ dataTypeLabel(batch.dataType) }} · 期间：{{ displayValue(batch.period) }}</view>
            <view>取数状态：{{ batchStatusLabel(batch.status) }} · 落表 {{ batch.rowCount ?? 0 }} 行 · 取数时间 {{ formatDateTime(batch.fetchTime) || '-' }}</view>
            <view>
              标准化成功 {{ batch.parsedCount ?? 0 }} · 解析异常 <text :class="batch.errorCount ? 'text-[#f5222d]' : ''">{{ batch.errorCount ?? 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 校验方式 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            校验方式
          </view>
          <view class="flex gap-16rpx">
            <view
              v-for="chip in modeChips"
              :key="chip.value"
              class="flex-1 rounded-12rpx py-16rpx text-center text-26rpx"
              :class="mode === chip.value ? 'bg-[#e6f7f1] text-[#018d71] font-500' : 'bg-[#f7f8f9] text-[#666]'"
              @click="handleModeChange(chip.value)"
            >
              {{ chip.label }}
            </view>
          </view>
        </view>

        <!-- 按校验配置核对 -->
        <view v-if="mode === 'config'" class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            选择校验配置
          </view>
          <picker
            v-if="configLabels.length"
            mode="selector"
            :range="configLabels"
            :value="safeConfigIndex"
            @change="handleConfigChange"
          >
            <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#333]">
              {{ configLabels[safeConfigIndex] || '请选择校验配置' }}
            </view>
          </picker>
          <view v-else class="rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#999]">
            暂无启用的校验配置，请切换临时参数或到 PC 管理台配置
          </view>

          <view v-if="selectedConfig" class="mt-16rpx rounded-12rpx bg-[#f7f8f9] p-20rpx text-24rpx text-[#777] space-y-6rpx">
            <view>比对方案：{{ displayValue(selectedConfig.quoteName || selectedConfig.quoteCode) }}</view>
            <view>
              容差：{{ displayValue(selectedConfig.tolerance) }}{{ selectedConfig.toleranceUnit === 2 ? '%' : ' 元' }} · 口径：{{ selectedConfig.importTaxMode === 2 ? '去税' : '含税' }}
            </view>
            <view>自动校验：{{ displayBoolean(selectedConfig.autoVerify) }} · 周汇总：{{ displayBoolean(selectedConfig.weeklyDigest) }}</view>
            <view>比对范围：{{ selectedConfig.compareScope === 1 ? '全事件（含保证金/服务费）' : '仅租金/投放四类' }}</view>
            <view>状态：{{ selectedConfig.status === 0 ? '启用' : '停用' }}</view>
          </view>
        </view>

        <!-- 临时参数核对 -->
        <view v-else class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            临时校验参数
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            比对方案<text class="text-[#f5222d]"> *</text>
          </view>
          <picker
            v-if="quoteLabels.length"
            mode="selector"
            :range="quoteLabels"
            :value="safeQuoteIndex"
            @change="handleQuoteChange"
          >
            <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#333]">
              {{ quoteLabels[safeQuoteIndex] || '请选择报价方案' }}
            </view>
          </picker>
          <view v-else class="rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#999]">
            暂无可比对报价方案
          </view>

          <view class="mb-8rpx mt-20rpx text-26rpx text-[#666]">
            差异容差
          </view>
          <input
            v-model="toleranceText"
            class="min-h-72rpx w-full rounded-12rpx bg-[#f7f8f9] px-20rpx text-26rpx"
            type="digit"
            placeholder="默认 0.01，不能小于 0"
          >
          <view class="mt-16rpx flex gap-16rpx">
            <view
              v-for="chip in unitChips"
              :key="chip.value"
              class="flex-1 rounded-12rpx py-12rpx text-center text-26rpx"
              :class="toleranceUnit === chip.value ? 'bg-[#e6f7f1] text-[#018d71] font-500' : 'bg-[#f7f8f9] text-[#666]'"
              @click="handleUnitChange(chip.value)"
            >
              {{ chip.label }}
            </view>
          </view>

          <view class="mb-8rpx mt-20rpx text-26rpx text-[#666]">
            导入金额口径
          </view>
          <view class="flex gap-16rpx">
            <view
              v-for="chip in taxModeChips"
              :key="chip.value"
              class="flex-1 rounded-12rpx py-12rpx text-center text-26rpx"
              :class="importTaxMode === chip.value ? 'bg-[#e6f7f1] text-[#018d71] font-500' : 'bg-[#f7f8f9] text-[#666]'"
              @click="handleTaxModeChange(chip.value)"
            >
              {{ chip.label }}
            </view>
          </view>
          <view class="mt-8rpx text-22rpx text-[#bbb]">
            临时参数按所选报价方案的最新测算结果与落表数据核对；修改配置请在 PC 管理台操作
          </view>
        </view>

        <!-- 备注 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-8rpx text-26rpx text-[#666]">
            备注
          </view>
          <textarea
            v-model="memo"
            :maxlength="200"
            placeholder="选填"
            class="min-h-100rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
          />
        </view>
        <view class="h-180rpx" />
      </template>
    </scroll-view>

    <view class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <view v-if="!canAccess" class="mb-8rpx text-22rpx text-[#fa8c16]">
        当前账号无「从落表批次发起校验」权限
      </view>
      <wd-button
        type="primary"
        block
        :loading="submitting"
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
      >
        发起校验并查看报告
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteCalcVO } from '@/api/fl/quoteCalc'
import type {
  QuoteFetchBatchCreateVerifyParams,
  QuoteFetchBatchVO,
  QuoteVerifyConfigVO,
} from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'
import { getQuoteCalcSimpleList } from '@/api/fl/quoteCalc'
import { createFetchVerify, getFetchBatch, getQuoteVerifyConfigPage } from '@/api/fl/quoteFetch'
import {
  batchStatusLabel,
  dataTypeLabel,
  displayBoolean,
  displayValue,
  FETCH_READONLY_TIP,
} from '../utils'

type VerifyMode = 'config' | 'temporary'

defineOptions({
  name: 'FlQuoteFetchCreateVerify',
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

const toast = useToast()
const { hasAccessByCodes } = useAccess()
const loading = ref(false)
const submitting = ref(false)
const batch = ref<QuoteFetchBatchVO>()
const batchId = ref<number>()
const configs = ref<QuoteVerifyConfigVO[]>([])
const quotes = ref<QuoteCalcVO[]>([])
const selectedConfigIndex = ref(0)
const selectedQuoteIndex = ref(0)

const modeChips: { label: string, value: VerifyMode }[] = [
  { label: '校验配置', value: 'config' },
  { label: '临时参数', value: 'temporary' },
]
const unitChips = [
  { label: '按元', value: 1 },
  { label: '按百分比', value: 2 },
]
const taxModeChips = [
  { label: '含税', value: 1 },
  { label: '去税', value: 2 },
]
const mode = ref<VerifyMode>('config')
const toleranceText = ref('0.01')
const toleranceUnit = ref(1)
const importTaxMode = ref(1)
const memo = ref('')

const canAccess = computed(() => hasAccessByCodes(['fl:fetch-data:verify']))
const configLabels = computed(() => configs.value.map(config => config.name || `配置 #${config.id}`))
const quoteLabels = computed(() => quotes.value.map(quote => quote.quotName || quote.quotCode || `方案 #${quote.id}`))
const safeConfigIndex = computed(() => Math.max(0, selectedConfigIndex.value))
const safeQuoteIndex = computed(() => Math.max(0, selectedQuoteIndex.value))
const selectedConfig = computed(() => configs.value[selectedConfigIndex.value])
const selectedQuote = computed(() => quotes.value[selectedQuoteIndex.value])
const canSubmit = computed(() => {
  if (!batchId.value || !canAccess.value) {
    return false
  }
  if (mode.value === 'config') {
    return !!selectedConfig.value?.id
  }
  const tolerance = toleranceText.value.trim()
  const toleranceValid = !tolerance || (Number.isFinite(Number(tolerance)) && Number(tolerance) >= 0)
  return !!selectedQuote.value?.id && toleranceValid
})

onLoad((query) => {
  batchId.value = Number(query?.id)
  loadPageData()
})

async function loadPageData() {
  if (!batchId.value) {
    return
  }
  loading.value = true
  try {
    batch.value = await getFetchBatch(batchId.value)
    await Promise.all([
      loadConfigs(batch.value?.dataType),
      loadQuotes(),
    ])
  } catch {
    batch.value = undefined
  } finally {
    loading.value = false
  }
}

async function loadConfigs(dataType?: number) {
  try {
    const data = await getQuoteVerifyConfigPage({
      pageNo: 1,
      pageSize: 100,
      status: 0,
      dataType,
    })
    configs.value = data.list ?? []
    selectedConfigIndex.value = configs.value.length ? 0 : -1
  } catch (error: any) {
    configs.value = []
    selectedConfigIndex.value = -1
    toast.show(error?.message || '校验配置加载失败')
  }
}

async function loadQuotes() {
  try {
    quotes.value = await getQuoteCalcSimpleList()
    selectedQuoteIndex.value = quotes.value.length ? 0 : -1
  } catch (error: any) {
    quotes.value = []
    selectedQuoteIndex.value = -1
    toast.show(error?.message || '报价方案加载失败')
  }
}

function handleModeChange(value: VerifyMode) {
  if (mode.value === value) {
    return
  }
  mode.value = value
}

function handleConfigChange(event: any) {
  selectedConfigIndex.value = Number(event.detail.value)
}

function handleQuoteChange(event: any) {
  selectedQuoteIndex.value = Number(event.detail.value)
}

function handleUnitChange(value: number) {
  toleranceUnit.value = value
}

function handleTaxModeChange(value: number) {
  importTaxMode.value = value
}

function buildPayload(): QuoteFetchBatchCreateVerifyParams {
  const payload: QuoteFetchBatchCreateVerifyParams = {
    batchId: batchId.value!,
    memo: memo.value.trim() || undefined,
  }
  if (mode.value === 'config') {
    const configId = selectedConfig.value?.id
    if (!configId) {
      throw new Error('请选择启用的校验配置')
    }
    payload.configId = configId
    return payload
  }
  const quoteId = selectedQuote.value?.id
  if (!quoteId) {
    throw new Error('请选择比对方案')
  }
  const tolerance = toleranceText.value.trim()
  payload.quoteId = quoteId
  payload.tolerance = tolerance ? Number(tolerance) : 0.01
  payload.toleranceUnit = toleranceUnit.value
  payload.importTaxMode = importTaxMode.value
  return payload
}

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) {
    toast.show('请先补全校验参数')
    return
  }
  submitting.value = true
  try {
    const verifyId = await createFetchVerify(buildPayload())
    toast.show('已发起校验，正在打开报告')
    setTimeout(() => {
      uni.redirectTo({ url: `/pages-fl/quoteverify/detail?id=${verifyId}` })
    }, 500)
  } catch (error: any) {
    toast.show(error?.message || '发起校验失败')
  } finally {
    submitting.value = false
  }
}
</script>
