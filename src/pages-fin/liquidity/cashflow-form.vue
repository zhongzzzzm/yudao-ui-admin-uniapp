<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="isEdit ? '编辑现金流' : '手工新增现金流'" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="m-24rpx mb-0 rounded-12rpx bg-[#e6f7f4] px-24rpx py-20rpx text-24rpx text-[#018d71]">
        手工补录流动性现金流明细（如节假日提前到账、保证金退还等），保存后可在下次测算时参与计算。
      </view>

      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <!-- 关联测算 -->
        <view class="form-item">
          <view class="form-label required">
            关联测算
          </view>
          <picker
            mode="selector"
            :range="calculationLabels"
            :value="calculationIndex"
            @change="handleCalculationChange"
          >
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="form.calculationId ? 'text-[#333]' : 'text-[#999]'">
                {{ calculationLabelOf(form.calculationId) || '请选择关联测算' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 统计月份 -->
        <view class="form-item">
          <view class="form-label required">
            统计月份
          </view>
          <picker mode="selector" :range="monthLabels" :value="statMonthIndex" @change="handleStatMonthChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="form.statMonth ? 'text-[#333]' : 'text-[#999]'">
                {{ form.statMonth || '请选择统计月份' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 目标月份 -->
        <view class="form-item">
          <view class="form-label required">
            目标月份
          </view>
          <picker mode="selector" :range="monthLabels" :value="targetMonthIndex" @change="handleTargetMonthChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="form.targetMonth ? 'text-[#333]' : 'text-[#999]'">
                {{ form.targetMonth || '请选择目标月份（这笔钱归属哪个月）' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 区间起始日期 -->
        <view class="form-item">
          <view class="form-label required">
            区间起始日期
          </view>
          <picker mode="date" :value="form.startDate" @change="e => (form.startDate = String(e.detail.value))">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="form.startDate ? 'text-[#333]' : 'text-[#999]'">
                {{ form.startDate || '请选择起始日期' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 区间结束日期 -->
        <view class="form-item">
          <view class="form-label required">
            区间结束日期
          </view>
          <picker mode="date" :value="form.endDate" @change="e => (form.endDate = String(e.detail.value))">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="form.endDate ? 'text-[#333]' : 'text-[#999]'">
                {{ form.endDate || '请选择结束日期' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 款项类型 -->
        <view class="form-item">
          <view class="form-label required">
            款项类型
          </view>
          <picker
            mode="selector"
            :range="paymentTypeOptions.map(o => o.label)"
            :value="paymentTypeIndex"
            @change="handlePaymentTypeChange"
          >
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="form.paymentType != null ? 'text-[#333]' : 'text-[#999]'">
                {{ paymentTypeLabelOf(form.paymentType) || '请选择款项类型' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 金额 -->
        <view class="form-item">
          <view class="form-label required">
            金额（元）
          </view>
          <wd-input v-model="form.amount" type="digit" no-border placeholder="请输入金额" />
        </view>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存 -->
    <view class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button class="flex-1" type="primary" :loading="submitting" @click="onSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { LiquidityCalculationVO, LiquidityCashFlowVO } from '@/api/fin/liquidity'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { computed, reactive, ref } from 'vue'
import {
  createLiquidityCashFlow,
  getLiquidityCalculationPage,
  getLiquidityCashFlow,
  LIQUIDITY_PAYMENT_TYPE_MAP,
  updateLiquidityCashFlow,
} from '@/api/fin/liquidity'

defineOptions({
  name: 'FinLiquidityCashFlowForm',
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

// ========== 通用选项 ==========

/** 生成近 24 个月的 yyyy-MM 列表（当月起往前推） */
function buildMonthOptions() {
  const list: string[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return list
}
const monthLabels = buildMonthOptions()

/** 款项类型选项（与后端字典一致） */
const paymentTypeOptions = Object.entries(LIQUIDITY_PAYMENT_TYPE_MAP).map(([value, label]) => ({
  label,
  value: Number(value),
}))

function paymentTypeLabelOf(value?: number) {
  if (value == null) {
    return ''
  }
  return LIQUIDITY_PAYMENT_TYPE_MAP[value] || `类型${value}`
}

const form = reactive({
  id: undefined as number | undefined,
  calculationId: undefined as number | undefined,
  statMonth: '',
  targetMonth: '',
  startDate: '',
  endDate: '',
  paymentType: undefined as number | undefined,
  amount: '',
})

// ========== 关联测算选择（近 50 条测算） ==========

const calculations = ref<LiquidityCalculationVO[]>([])
const calculationLabels = computed(() =>
  calculations.value.map(c => `时点 ${c.point || '-'} · 应保有 ${c.requiredCashReserve == null ? '-' : c.requiredCashReserve.toLocaleString('zh-CN')}`))
const calculationIndex = computed(() =>
  calculations.value.findIndex(c => c.id === form.calculationId))

function calculationLabelOf(id?: number) {
  const index = calculations.value.findIndex(c => c.id === id)
  return index >= 0 ? calculationLabels.value[index] : ''
}

function handleCalculationChange(e: any) {
  const item = calculations.value[Number(e.detail.value)]
  if (item) {
    form.calculationId = item.id
  }
}

async function loadCalculations() {
  try {
    const data = await getLiquidityCalculationPage({ pageNo: 1, pageSize: 50 })
    calculations.value = data.list ?? []
  } catch {
    // 加载失败不阻断表单，提交时再校验
  }
}

// ========== 表单 ==========

const statMonthIndex = computed(() => monthLabels.indexOf(form.statMonth))
const targetMonthIndex = computed(() => monthLabels.indexOf(form.targetMonth))
const paymentTypeIndex = computed(() =>
  paymentTypeOptions.findIndex(o => o.value === form.paymentType))

function handleStatMonthChange(e: any) {
  form.statMonth = monthLabels[Number(e.detail.value)] || ''
}
function handleTargetMonthChange(e: any) {
  form.targetMonth = monthLabels[Number(e.detail.value)] || ''
}
function handlePaymentTypeChange(e: any) {
  form.paymentType = paymentTypeOptions[Number(e.detail.value)]?.value
}

const isEdit = computed(() => form.id != null)
const submitting = ref(false)

/** 编辑时回显现金流详情 */
async function loadDetail(id: number) {
  try {
    const detail: LiquidityCashFlowVO = await getLiquidityCashFlow(id)
    form.id = detail.id
    form.calculationId = detail.calculationId
    form.statMonth = detail.statMonth || ''
    form.targetMonth = detail.targetMonth || ''
    form.startDate = (detail.startDate || '').slice(0, 10)
    form.endDate = (detail.endDate || '').slice(0, 10)
    form.paymentType = detail.paymentType
    form.amount = detail.amount == null ? '' : String(detail.amount)
  } catch {
    toast.show('加载现金流详情失败')
  }
}

onLoad((query) => {
  loadCalculations()
  if (query?.id) {
    loadDetail(Number(query.id))
  }
})

/** 提交：本地校验 → 新增 / 修改 */
async function onSubmit() {
  if (!form.calculationId) {
    toast.show('请选择关联测算')
    return
  }
  if (!form.statMonth) {
    toast.show('请选择统计月份')
    return
  }
  if (!form.targetMonth) {
    toast.show('请选择目标月份')
    return
  }
  if (!form.startDate) {
    toast.show('请选择区间起始日期')
    return
  }
  if (!form.endDate) {
    toast.show('请选择区间结束日期')
    return
  }
  if (form.paymentType == null) {
    toast.show('请选择款项类型')
    return
  }
  const amount = Number(form.amount)
  if (!form.amount || !Number.isFinite(amount)) {
    toast.show('请输入金额')
    return
  }
  submitting.value = true
  try {
    const data = {
      id: form.id,
      calculationId: form.calculationId,
      statMonth: form.statMonth,
      targetMonth: form.targetMonth,
      startDate: form.startDate,
      endDate: form.endDate,
      paymentType: form.paymentType,
      amount,
    }
    if (form.id) {
      await updateLiquidityCashFlow(data)
    } else {
      await createLiquidityCashFlow(data)
    }
    toast.show('已保存')
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误提示由 http 层统一弹出
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #666;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
