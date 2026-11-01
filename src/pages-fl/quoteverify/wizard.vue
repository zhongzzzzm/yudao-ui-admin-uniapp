<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="发起复核" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 步骤一：选择文件并解析 -->
      <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center gap-12rpx">
          <view class="h-40rpx w-40rpx flex items-center justify-center rounded-full bg-[#018d71] text-24rpx text-white">
            1
          </view>
          <text class="text-28rpx text-[#333] font-500">
            上传复核文件
          </text>
        </view>

        <!-- 复核类型 -->
        <view class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            复核类型<text class="text-[#f5222d]"> *</text>
          </view>
          <view class="flex gap-16rpx">
            <view
              v-for="opt in verifyTypeOptions"
              :key="opt.value"
              class="flex-1 rounded-12rpx py-16rpx text-center text-26rpx"
              :class="verifyType === opt.value ? 'bg-[#e6f7f1] text-[#018d71] font-500' : 'bg-[#f7f8f9] text-[#666]'"
              @click="handleVerifyTypeChange(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>

        <!-- 文件选择 -->
        <view class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            复核文件（Excel）<text class="text-[#f5222d]"> *</text>
          </view>
          <view
            class="min-h-88rpx flex items-center justify-between rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx"
            @click="chooseFile"
          >
            <text class="line-clamp-1 flex-1 text-26rpx" :class="filePath ? 'text-[#333]' : 'text-[#bbb]'">
              {{ fileName || '点击选择文件' }}
            </text>
            <wd-icon name="arrow-right" size="28rpx" color="#999" />
          </view>
          <view class="mt-8rpx text-22rpx text-[#bbb]">
            按模板格式导入第三方报价 / 计提数据；解析仅预览不落库
          </view>
        </view>

        <wd-button type="primary" block :loading="parsing" :disabled="parsing || !filePath" @click="handleParse">
          {{ parseResult ? '重新解析' : '上传并解析' }}
        </wd-button>
      </view>

      <!-- 解析预览 -->
      <view v-if="parseResult" class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx text-28rpx text-[#333] font-500">
          解析预览
        </view>
        <view class="grid grid-cols-3 gap-12rpx text-center">
          <view class="rounded-12rpx bg-[#f7f8f9] py-16rpx">
            <view class="text-24rpx text-[#999]">
              总行数
            </view>
            <view class="text-28rpx text-[#333] font-500">
              {{ parseResult.totalRows ?? 0 }}
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] py-16rpx">
            <view class="text-24rpx text-[#999]">
              可比对行
            </view>
            <view class="text-28rpx text-[#018d71] font-500">
              {{ parseResult.comparableRows ?? 0 }}
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] py-16rpx">
            <view class="text-24rpx text-[#999]">
              错误行
            </view>
            <view class="text-28rpx font-500" :class="parseResult.errorCount ? 'text-[#f5222d]' : 'text-[#333]'">
              {{ parseResult.errorCount ?? 0 }}
            </view>
          </view>
        </view>

        <!-- 表头映射 -->
        <view v-if="headerMappingEntries.length" class="mt-16rpx">
          <view class="mb-8rpx text-24rpx text-[#999]">
            表头映射
          </view>
          <view class="flex flex-wrap gap-8rpx">
            <wd-tag v-for="([column, field]) in headerMappingEntries" :key="column" type="info" plain size="small">
              {{ column }} → {{ field }}
            </wd-tag>
          </view>
        </view>

        <!-- 行级错误 -->
        <view v-if="parseResult.errors?.length" class="mt-16rpx">
          <view class="mb-8rpx text-24rpx text-[#f5222d]">
            行级错误
          </view>
          <view
            v-for="(err, index) in parseResult.errors.slice(0, 10)"
            :key="index"
            class="mt-4rpx text-24rpx text-[#777]"
          >
            第 {{ err.rowNo ?? '-' }} 行：{{ err.reason }}
          </view>
          <view v-if="parseResult.errors.length > 10" class="mt-4rpx text-22rpx text-[#bbb]">
            仅展示前 10 条
          </view>
        </view>

        <!-- 样例行 -->
        <view v-if="sampleRowsText" class="mt-16rpx">
          <view class="mb-8rpx text-24rpx text-[#999]">
            样例数据（首行）
          </view>
          <view class="max-h-240rpx overflow-auto whitespace-pre-wrap rounded-12rpx bg-[#f7f8f9] p-16rpx text-22rpx text-[#555] font-mono">
            {{ sampleRowsText }}
          </view>
        </view>
      </view>

      <!-- 步骤二：核对配置 -->
      <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center gap-12rpx">
          <view class="h-40rpx w-40rpx flex items-center justify-center rounded-full bg-[#018d71] text-24rpx text-white">
            2
          </view>
          <text class="text-28rpx text-[#333] font-500">
            核对配置
          </text>
        </view>

        <!-- 比对基准 -->
        <view class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            比对基准<text class="text-[#f5222d]"> *</text>
          </view>
          <picker mode="selector" :range="basisLabels" :value="basisIndex(basisType)" @change="handleBasisChange">
            <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="basisType ? 'text-[#333]' : 'text-[#bbb]'">
              {{ basisLabelOf(basisType) || '请选择比对基准' }}
            </view>
          </picker>
          <!-- 关联方案：选择报价方案 -->
          <template v-if="basisType === 1">
            <picker
              class="mt-12rpx"
              mode="selector"
              :range="quoteLabels"
              :value="quoteIndex(quoteId)"
              @change="handleQuoteChange"
            >
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="quoteId ? 'text-[#333]' : 'text-[#bbb]'">
                {{ quoteLabelOf(quoteId) || '请选择报价方案' }}
              </view>
            </picker>
          </template>
          <view v-else-if="basisType === 2" class="mt-12rpx rounded-12rpx bg-[#fffbe6] p-16rpx text-24rpx text-[#fa8c16]">
            临时参数需逐项编辑测算参数（App 暂不支持），请前往 PC 端发起，或在上方改用「关联方案」基准
          </view>
        </view>

        <!-- 容差 + 单位 -->
        <view class="mb-16rpx flex gap-16rpx">
          <view class="flex-1">
            <view class="mb-8rpx text-26rpx text-[#666]">
              容差值
            </view>
            <input
              v-model="toleranceText"
              type="digit"
              placeholder="默认 0.01"
              class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx text-26rpx"
            >
          </view>
          <view class="w-200rpx">
            <view class="mb-8rpx text-26rpx text-[#666]">
              容差单位
            </view>
            <picker mode="selector" :range="unitLabels" :value="toleranceUnit === 2 ? 1 : 0" @change="e => toleranceUnit = Number(e.detail.value) === 1 ? 2 : 1">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx text-[#333]">
                {{ toleranceUnit === 2 ? '%' : '元' }}
              </view>
            </picker>
          </view>
        </view>

        <!-- 导入口径 -->
        <view class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            导入口径
          </view>
          <view class="flex gap-16rpx">
            <view
              v-for="opt in taxModeOptions"
              :key="opt.value"
              class="flex-1 rounded-12rpx py-16rpx text-center text-26rpx"
              :class="importTaxMode === opt.value ? 'bg-[#e6f7f1] text-[#018d71] font-500' : 'bg-[#f7f8f9] text-[#666]'"
              @click="importTaxMode = opt.value"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>

        <!-- 备注 -->
        <view>
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
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部提交 -->
    <view class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button type="primary" block :loading="creating" :disabled="creating || !canCreate" @click="handleCreate">
        发起核对
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteCalcVO } from '@/api/fl/quoteCalc'
import type { QuoteVerifyParseRespVO } from '@/api/fl/quoteVerify'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getQuoteCalcSimpleList } from '@/api/fl/quoteCalc'
import { createQuoteVerify, parseQuoteVerify } from '@/api/fl/quoteVerify'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'FlQuoteVerifyWizard',
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

/** 发起核对权限（fl:quote-verify:create） */
const canAccess = computed(() => hasAccessByCodes(['fl:quote-verify:create']))

// ========== 步骤一：文件与解析 ==========

/** 复核类型：1 报价表 2 计提表 */
const verifyTypeOptions = [
  { label: '报价表复核', value: 1 },
  { label: '计提表复核', value: 2 },
]
const verifyType = ref(1)

const filePath = ref('')
const fileName = ref('')
const parsing = ref(false)
const creating = ref(false)
const parseResult = ref<QuoteVerifyParseRespVO>()

const headerMappingEntries = computed(() => Object.entries(parseResult.value?.headerMapping ?? {}))
const sampleRowsText = computed(() => {
  const rows = parseResult.value?.sampleRows ?? []
  if (!rows.length) {
    return ''
  }
  try {
    return JSON.stringify(rows[0], null, 2)
  } catch {
    return ''
  }
})

function handleVerifyTypeChange(value: number) {
  if (verifyType.value === value) {
    return
  }
  verifyType.value = value
  // 类型切换后旧解析结果失效，需重新解析
  parseResult.value = undefined
}

/** 选文件：小程序走会话文件，H5 走文件选择，App 端提示限制 */
function chooseFile() {
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res) => {
      const file = res.tempFiles?.[0]
      if (file) {
        filePath.value = file.path
        fileName.value = file.name || '复核文件'
      }
    },
  })
  // #endif
  // #ifdef H5
  uni.chooseFile?.({
    count: 1,
    success: (res: any) => {
      const path = res.tempFilePaths?.[0]
      if (path) {
        filePath.value = path
        fileName.value = res.tempFiles?.[0]?.name || '复核文件'
      }
    },
  })
  // #endif
  // #ifdef APP-PLUS
  toast.show('App 端暂不支持文件选择，请使用小程序或 H5')
  // #endif
}

/** 上传解析（不落库） */
async function handleParse() {
  if (!filePath.value) {
    toast.show('请先选择复核文件')
    return
  }
  parsing.value = true
  try {
    parseResult.value = await parseQuoteVerify(verifyType.value, filePath.value)
    if ((parseResult.value?.comparableRows ?? 0) === 0) {
      toast.show('解析完成，但没有可参与比对的行')
    } else {
      toast.show(`解析成功：可比对 ${parseResult.value?.comparableRows} 行`)
    }
  } catch (e: any) {
    parseResult.value = undefined
    toast.show(e?.message || '解析失败，请检查文件格式')
  } finally {
    parsing.value = false
  }
}

// ========== 步骤二：核对配置 ==========

/** 比对基准：1 关联方案 2 临时参数 */
const basisOptions = [
  { label: '关联方案（按已测算方案比对）', value: 1 },
  { label: '临时参数（App 暂不支持）', value: 2 },
]
const basisLabels = basisOptions.map(o => o.label)
function basisIndex(value?: number) {
  return basisOptions.findIndex(o => o.value === value)
}
function basisLabelOf(value?: number) {
  return basisOptions.find(o => o.value === value)?.label
}
const basisType = ref<number>(0)

/** 关联方案选项（精简列表） */
const quotes = ref<QuoteCalcVO[]>([])
const quoteLabels = computed(() => quotes.value.map(q => `${q.quotName || q.quotCode || `方案 #${q.id}`}${q.quotCode ? `（${q.quotCode}）` : ''}`))
const quoteId = ref<number>()

function quoteIndex(id?: number) {
  return quotes.value.findIndex(q => q.id === id)
}
function quoteLabelOf(id?: number) {
  return quotes.value[quoteIndex(id)]?.quotName
}

/** 容差单位选项 */
const unitLabels = ['元', '%']

/** 导入口径选项：1 含税 2 去税 */
const taxModeOptions = [
  { label: '含税', value: 1 },
  { label: '去税', value: 2 },
]

/** 容差 / 单位 / 口径 / 备注 */
const toleranceText = ref('')
const toleranceUnit = ref(1)
const importTaxMode = ref(1)
const memo = ref('')

function handleBasisChange(e: any) {
  const option = basisOptions[Number(e.detail.value)]
  if (!option) {
    return
  }
  if (option.value === 2) {
    toast.show('临时参数基准请在 PC 端配置')
    return
  }
  basisType.value = option.value
  if (option.value === 1 && !quotes.value.length) {
    loadQuotes().catch(() => {})
  }
}

function handleQuoteChange(e: any) {
  const quote = quotes.value[Number(e.detail.value)]
  if (quote?.id) {
    quoteId.value = quote.id
  }
}

async function loadQuotes() {
  quotes.value = await getQuoteCalcSimpleList() ?? []
}

/** 是否可发起核对 */
const canCreate = computed(() => {
  if (!canAccess.value || !parseResult.value || !basisType.value) {
    return false
  }
  return basisType.value === 1 ? !!quoteId.value : false
})

// ========== 发起核对 ==========

function handleCreate() {
  if (!filePath.value || !parseResult.value) {
    toast.show('请先上传并解析复核文件')
    return
  }
  if (basisType.value !== 1 || !quoteId.value) {
    toast.show('请选择比对基准方案')
    return
  }
  const tolerance = Number(toleranceText.value)
  if (toleranceText.value && (!Number.isFinite(tolerance) || tolerance < 0)) {
    toast.show('容差值必须为非负数字')
    return
  }
  dialog.confirm({
    title: '发起核对',
    msg: '确认发起核对？将按所选基准与容差逐行比对并生成核对报告。',
  }).then(() => {
    doCreate()
  }).catch(() => {})
}

async function doCreate() {
  creating.value = true
  try {
    const batchId = await createQuoteVerify({
      verifyType: verifyType.value,
      basisType: basisType.value,
      quoteId: quoteId.value,
      tolerance: toleranceText.value ? Number(toleranceText.value) : undefined,
      toleranceUnit: toleranceUnit.value,
      importTaxMode: importTaxMode.value,
      memo: memo.value || undefined,
    }, filePath.value)
    toast.show('已发起核对')
    // 直接进入核对报告页
    setTimeout(() => {
      uni.redirectTo({ url: `/pages-fl/quoteverify/detail?id=${batchId}` })
    }, 500)
  } catch (e: any) {
    toast.show(e?.message || '发起核对失败')
  } finally {
    creating.value = false
  }
}
</script>
