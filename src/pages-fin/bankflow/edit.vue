<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="编辑流水" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view v-if="loaded">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="交易日期" title-width="200rpx" prop="transDate">
            <picker mode="date" :value="formData.transDate" @change="handleDateChange">
              <view class="h-full w-full flex items-center pr-24rpx text-right" :class="formData.transDate ? 'text-[#333]' : 'text-[#999]'">
                {{ formData.transDate || '请选择交易日期' }}
              </view>
            </picker>
          </wd-form-item>
          <wd-form-item title="交易时间" title-width="200rpx" prop="transTime">
            <wd-input
              v-model="formData.transTime"
              clearable
              placeholder="HH:mm:ss（选填）"
            />
          </wd-form-item>
          <wd-form-item title="资金方向" title-width="200rpx" prop="direction" center>
            <picker mode="selector" :range="directionLabels" :value="directionIndex" @change="handleDirectionChange">
              <view class="h-full w-full flex items-center pr-24rpx text-right text-[#333]">
                {{ directionLabels[directionIndex] }}
              </view>
            </picker>
          </wd-form-item>
          <wd-form-item title="交易金额" title-width="200rpx" prop="amount" center>
            <input
              class="h-full flex-1 text-right"
              type="digit"
              placeholder="请输入交易金额（恒为正）"
              :value="String(formData.amount ?? '')"
              @input="handleAmountInput"
            >
          </wd-form-item>
          <wd-form-item title="币种" title-width="200rpx" prop="currency">
            <wd-input
              v-model="formData.currency"
              clearable
              placeholder="默认 CNY"
            />
          </wd-form-item>
          <wd-form-item title="对方机构" title-width="200rpx" prop="counterpartyOrgName">
            <wd-input
              v-model="formData.counterpartyOrgName"
              clearable
              placeholder="对方机构名称（选填）"
            />
          </wd-form-item>
          <wd-form-item title="对方行名" title-width="200rpx" prop="counterpartyBankName">
            <wd-input
              v-model="formData.counterpartyBankName"
              clearable
              placeholder="对方开户银行名称（补录后不再提示待补录）"
            />
          </wd-form-item>
          <wd-form-item title="对方户名" title-width="200rpx" prop="counterpartyAccountName">
            <wd-input
              v-model="formData.counterpartyAccountName"
              clearable
              placeholder="对方银行账户名称（选填）"
            />
          </wd-form-item>
          <wd-form-item title="对方账号" title-width="200rpx" prop="counterpartyAccountNo">
            <wd-input
              v-model="formData.counterpartyAccountNo"
              clearable
              placeholder="对方银行账号（选填）"
            />
          </wd-form-item>
          <wd-form-item title="交易后余额" title-width="200rpx" prop="balance" center>
            <input
              class="h-full flex-1 text-right"
              type="digit"
              placeholder="选填"
              :value="String(formData.balance ?? '')"
              @input="handleBalanceInput"
            >
          </wd-form-item>
          <wd-form-item title="银行流水号" title-width="200rpx" prop="serialNo">
            <wd-input
              v-model="formData.serialNo"
              clearable
              placeholder="选填"
            />
          </wd-form-item>
          <wd-form-item title="摘要" title-width="200rpx" prop="summary">
            <wd-textarea
              v-model="formData.summary"
              clearable
              placeholder="选填"
              :rows="3"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="px-24rpx py-16rpx text-22rpx text-[#999]">
        己方账号 / 户名为账户归属口径，不可修改；编辑保存后系统会重算去重键，与原文件行区分。
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view v-if="loaded" class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="saving"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { BankFlowUpdateReqVO, BankFlowVO } from '@/api/fin/bankFlow'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { updateBankFlow } from '@/api/fin/bankFlow'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

defineOptions({
  name: 'FinBankFlowEdit',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()

/** 资金方向选项：1 收入 2 支出 */
const directionLabels = ['收入', '支出']
const DIRECTION_IN = 1
const DIRECTION_OUT = 2

/** 列表页经 URL 传入的整条流水数据 */
const loaded = ref(false)
const saving = ref(false)

/** 编辑表单数据（金额类字段以输入态字符串承载，提交时转数字） */
type FlowEditForm = Omit<BankFlowUpdateReqVO, 'amount' | 'balance'> & {
  amount: number | string // 交易金额（恒为正）
  balance?: number | string // 交易后余额
}

const formData = ref<FlowEditForm>({
  id: 0,
  transDate: '',
  transTime: '',
  counterpartyOrgName: '',
  counterpartyBankName: '',
  counterpartyAccountName: '',
  counterpartyAccountNo: '',
  currency: 'CNY',
  amount: '',
  direction: DIRECTION_IN,
  summary: '',
  balance: '',
  serialNo: '',
})

const formSchema = createFormSchema({
  transDate: [{ required: true, message: '交易日期不能为空' }],
  amount: [{ required: true, message: '交易金额不能为空' }],
  direction: [{ required: true, message: '资金方向不能为空' }],
})
const formRef = ref<FormInstance>()

const directionIndex = computed(() => (formData.value.direction === DIRECTION_OUT ? 1 : 0))

function handleBack() {
  navigateBackPlus()
}

function handleDateChange(e: any) {
  formData.value.transDate = String(e.detail.value || '')
}

function handleDirectionChange(e: any) {
  formData.value.direction = Number(e.detail.value) === 1 ? DIRECTION_OUT : DIRECTION_IN
}

function handleAmountInput(e: any) {
  formData.value.amount = e.detail.value
}

function handleBalanceInput(e: any) {
  formData.value.balance = e.detail.value
}

/** 用列表页数据初始化表单（交易日期截掉可能带的时间部分） */
function initWithFlow(flow: BankFlowVO) {
  formData.value = {
    id: flow.id,
    transDate: (flow.transDate || '').slice(0, 10),
    transTime: flow.transTime || '',
    counterpartyOrgName: flow.counterpartyOrgName || '',
    counterpartyBankName: flow.counterpartyBankName || '',
    counterpartyAccountName: flow.counterpartyAccountName || '',
    counterpartyAccountNo: flow.counterpartyAccountNo || '',
    currency: flow.currency || 'CNY',
    amount: flow.amount == null ? '' : String(flow.amount),
    direction: flow.direction,
    summary: flow.summary || '',
    balance: flow.balance == null ? '' : String(flow.balance),
    serialNo: flow.serialNo || '',
  }
  loaded.value = true
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const amount = Number(formData.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    toast.show('交易金额必须大于 0')
    return
  }
  const balanceRaw = formData.value.balance
  const balance = balanceRaw === '' || balanceRaw == null ? undefined : Number(balanceRaw)
  if (balance != null && !Number.isFinite(balance)) {
    toast.show('交易后余额格式不正确')
    return
  }
  saving.value = true
  try {
    await updateBankFlow({
      ...formData.value,
      amount,
      balance,
      currency: formData.value.currency?.trim() || undefined,
      transTime: formData.value.transTime?.trim() || undefined,
      summary: formData.value.summary?.trim() || undefined,
    })
    toast.success('保存成功')
    // 通知列表页刷新
    uni.$emit('fin:bankflow:reload')
    delay(handleBack)
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  // 整条流水数据由列表页经 URL（encodeURIComponent JSON）传入
  if (query?.data) {
    try {
      initWithFlow(JSON.parse(decodeURIComponent(query.data as string)) as BankFlowVO)
    } catch {
      toast.show('流水数据加载失败')
      delay(handleBack)
    }
  } else {
    toast.show('缺少流水数据')
    delay(handleBack)
  }
})
</script>
