<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="isEdit ? '编辑公司' : '新增公司'" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex justify-center py-120rpx">
        <wd-loading color="#018d71" />
      </view>

      <template v-else>
        <!-- 基本信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            基本信息
          </view>
          <view class="px-24rpx py-8rpx">
            <view class="form-item">
              <view class="form-label required">
                公司代码
              </view>
              <wd-input v-model="form.companyCode" :maxlength="64" clearable no-border placeholder="请输入公司代码（业务唯一键）" />
            </view>
            <view class="form-item">
              <view class="form-label required">
                公司名称
              </view>
              <wd-input v-model="form.companyName" :maxlength="128" clearable no-border placeholder="请输入公司名称" />
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                成立日期
              </view>
              <view class="flex items-center gap-8rpx">
                <picker mode="date" :value="form.establishDate || ''" @change="onDatePick('establishDate', $event)">
                  <view class="flex items-center gap-8rpx">
                    <text class="text-28rpx" :class="form.establishDate ? 'text-[#333]' : 'text-[#bbb]'">
                      {{ form.establishDate || '请选择日期' }}
                    </text>
                    <wd-icon name="arrow-down" size="24rpx" color="#999" />
                  </view>
                </picker>
                <wd-icon v-if="form.establishDate" name="close" size="28rpx" color="#bbb" @click="form.establishDate = undefined" />
              </view>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                注销日期
              </view>
              <view class="flex items-center gap-8rpx">
                <picker mode="date" :value="form.deregDate || ''" @change="onDatePick('deregDate', $event)">
                  <view class="flex items-center gap-8rpx">
                    <text class="text-28rpx" :class="form.deregDate ? 'text-[#333]' : 'text-[#bbb]'">
                      {{ form.deregDate || '请选择日期' }}
                    </text>
                    <wd-icon name="arrow-down" size="24rpx" color="#999" />
                  </view>
                </picker>
                <wd-icon v-if="form.deregDate" name="close" size="28rpx" color="#bbb" @click="form.deregDate = undefined" />
              </view>
            </view>
            <view class="form-item">
              <view class="form-label">
                投放状态
              </view>
              <wd-radio-group v-model="form.investStatus" shape="button">
                <wd-radio v-for="o in investOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </wd-radio>
              </wd-radio-group>
            </view>
            <view class="form-item">
              <view class="form-label">
                小型微利企业
              </view>
              <wd-radio-group v-model="form.smallMicroProfitFlag" shape="button">
                <wd-radio v-for="o in yesNoOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </wd-radio>
              </wd-radio-group>
            </view>
            <view class="form-item">
              <view class="form-label">
                是否生成办税任务
              </view>
              <view class="mb-8rpx text-24rpx text-[#999]">
                选「否」后该公司不参与办税任务初始化，母公司、合并主体等仅报表口径的公司选「否」
              </view>
              <wd-radio-group v-model="form.taxTaskFlag" shape="button">
                <wd-radio v-for="o in yesNoOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </wd-radio>
              </wd-radio-group>
            </view>
          </view>
        </view>

        <!-- 人员 -->
        <view class="mx-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            人员
          </view>
          <view class="px-24rpx py-8rpx">
            <view class="form-item">
              <view class="form-label">
                财务负责人
              </view>
              <wd-input v-model="form.financeHead" :maxlength="64" clearable no-border placeholder="请输入财务负责人名称" />
            </view>
            <view class="form-item">
              <view class="form-label">
                办税人员（办理人）
              </view>
              <view class="mb-8rpx text-24rpx text-[#999]">
                办理流办理人 = 该系统用户，仅维护姓名无法指定到人，办理人将收不到站内待办
              </view>
              <picker mode="selector" :range="userLabels" :value="userIndex(form.taxPersonUserId)" @change="onUserPick">
                <view class="min-h-56rpx flex items-center justify-end gap-8rpx">
                  <text class="text-28rpx" :class="userLabelOf(form.taxPersonUserId) ? 'text-[#333]' : 'text-[#bbb]'">
                    {{ userLabelOf(form.taxPersonUserId) || '请选择系统用户' }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                复核人
              </view>
              <wd-input v-model="form.reviewer" :maxlength="64" clearable no-border placeholder="请输入复核人" />
            </view>
          </view>
        </view>

        <!-- 税务登记 -->
        <view class="mx-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            税务登记
          </view>
          <view class="px-24rpx py-8rpx">
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                税务登记时间
              </view>
              <view class="flex items-center gap-8rpx">
                <picker mode="date" :value="form.taxRegDate || ''" @change="onDatePick('taxRegDate', $event)">
                  <view class="flex items-center gap-8rpx">
                    <text class="text-28rpx" :class="form.taxRegDate ? 'text-[#333]' : 'text-[#bbb]'">
                      {{ form.taxRegDate || '请选择日期' }}
                    </text>
                    <wd-icon name="arrow-down" size="24rpx" color="#999" />
                  </view>
                </picker>
                <wd-icon v-if="form.taxRegDate" name="close" size="28rpx" color="#bbb" @click="form.taxRegDate = undefined" />
              </view>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                一般纳税人生效日期
              </view>
              <view class="flex items-center gap-8rpx">
                <picker mode="date" :value="form.vatGeneralStartDate || ''" @change="onDatePick('vatGeneralStartDate', $event)">
                  <view class="flex items-center gap-8rpx">
                    <text class="text-28rpx" :class="form.vatGeneralStartDate ? 'text-[#333]' : 'text-[#bbb]'">
                      {{ form.vatGeneralStartDate || '请选择日期' }}
                    </text>
                    <wd-icon name="arrow-down" size="24rpx" color="#999" />
                  </view>
                </picker>
                <wd-icon v-if="form.vatGeneralStartDate" name="close" size="28rpx" color="#bbb" @click="form.vatGeneralStartDate = undefined" />
              </view>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                增值税税率
              </view>
              <picker mode="selector" :range="vatRateLabels" :value="pickIndex(vatRateOptions, form.vatRate)" @change="onDictPick(vatRateOptions, 'vatRate', $event)">
                <view class="flex items-center gap-8rpx">
                  <text class="text-28rpx" :class="form.vatRate != null ? 'text-[#333]' : 'text-[#bbb]'">
                    {{ dictLabelOf(vatRateOptions, form.vatRate) }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
          </view>
        </view>

        <!-- 办税频率 -->
        <view class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            各税种申报频率
          </view>
          <view class="px-24rpx py-8rpx">
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                增值税申报频率
              </view>
              <picker mode="selector" :range="freqLabels" :value="pickIndex(freqOptions, form.vatFrequency)" @change="onDictPick(freqOptions, 'vatFrequency', $event)">
                <view class="flex items-center gap-8rpx">
                  <text class="text-28rpx" :class="form.vatFrequency != null ? 'text-[#333]' : 'text-[#bbb]'">
                    {{ dictLabelOf(freqOptions, form.vatFrequency) }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view v-for="f in freqFields" :key="f.key" class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                {{ f.label }}
              </view>
              <picker mode="selector" :range="freqLabels" :value="pickIndex(freqOptions, form[f.key])" @change="onDictPick(freqOptions, f.key, $event)">
                <view class="flex items-center gap-8rpx">
                  <text class="text-28rpx" :class="form[f.key] != null ? 'text-[#333]' : 'text-[#bbb]'">
                    {{ dictLabelOf(freqOptions, form[f.key]) }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
          </view>
        </view>
      </template>
      <!-- 底部操作栏占位 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存 -->
    <view class="fixed inset-x-0 bottom-0 z-10 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button block type="primary" :loading="saving" :disabled="saving || loading" @click="handleSave">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { NumberDictDataType } from '@/hooks/useDict'
import type { TaxCompanyVO } from '@/api/tax/company'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref } from 'vue'
import { createTaxCompany, getTaxCompany, updateTaxCompany } from '@/api/tax/company'
import { getSimpleUserList } from '@/api/system/user'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

defineOptions({
  name: 'TaxCompanyForm',
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

const isEdit = ref(false)
const loading = ref(false)
const saving = ref(false)
let companyId = 0

const form = reactive<TaxCompanyVO>({
  id: 0, // 新增时无编号，编辑时以 companyId 为准回填
  companyCode: '',
  companyName: '',
  taxTaskFlag: 0,
})

// ========== 字典与下拉数据 ==========

const investOptions = getIntDictOptions(DICT_TYPE.TAX_LOAN_STATUS)
const yesNoOptions = getIntDictOptions(DICT_TYPE.YES_NO)
const freqOptions = getIntDictOptions(DICT_TYPE.TAX_FREQ)
const vatRateOptions = getIntDictOptions(DICT_TYPE.TAX_VAT_RATE)

/** 增值税申报频率之后的其余办税频率字段（配置同构，集中声明避免逐个重复） */
const freqFields = [
  { key: 'pftFrequency', label: '个人所得税频率' },
  { key: 'citFrequency', label: '企业所得税频率' },
  { key: 'stampBusinessBooks', label: '印花税-营业账簿' },
  { key: 'stampLoanContract', label: '印花税-借款合同' },
  { key: 'stampFinanceLeaseContract', label: '印花税-融资租赁合同' },
  { key: 'stampSaleContract', label: '印花税-买卖合同' },
] as const

/** 原生 selector 选项：首项「请选择」用于清空取值 */
const freqLabels = ['请选择', ...freqOptions.map(o => o.label)]
const vatRateLabels = ['请选择', ...vatRateOptions.map(o => o.label)]

function pickIndex(options: NumberDictDataType[], value?: number) {
  return value == null ? 0 : options.findIndex(o => o.value === value) + 1
}

function dictLabelOf(options: NumberDictDataType[], value?: number) {
  if (value == null) {
    return '请选择'
  }
  return options.find(o => o.value === value)?.label || `未知(${value})`
}

function onDictPick(options: NumberDictDataType[], key: keyof TaxCompanyVO, e: any) {
  const idx = Number(e.detail.value)
  ;(form as any)[key] = idx <= 0 ? undefined : options[idx - 1]?.value
}

function onDatePick(key: 'establishDate' | 'deregDate' | 'taxRegDate' | 'vatGeneralStartDate', e: any) {
  form[key] = e.detail.value || undefined
}

// ========== 办税人员系统用户（办理人） ==========

const users = ref<{ id: number, nickname: string }[]>([])
const userLabels = ref<string[]>([])

async function loadUsers() {
  try {
    const list = await getSimpleUserList()
    users.value = (list || []).filter(u => u.id != null).map(u => ({ id: u.id as number, nickname: u.nickname }))
    userLabels.value = users.value.map(u => u.nickname)
  } catch {
    // 用户列表加载失败不阻塞表单，仅办税人员下拉为空
  }
}

function userIndex(userId?: number) {
  return users.value.findIndex(u => u.id === userId)
}

function userLabelOf(userId?: number) {
  if (userId == null) {
    return ''
  }
  return users.value.find(u => u.id === userId)?.nickname || `用户#${userId}`
}

function onUserPick(e: any) {
  const idx = Number(e.detail.value)
  form.taxPersonUserId = !users.value[idx] ? undefined : users.value[idx].id
}

// ========== 数据加载与保存 ==========

async function load() {
  loading.value = true
  try {
    const data = await getTaxCompany(companyId)
    Object.assign(form, data)
  } catch {
    // 业务错误 toast 已由 http 层提示，保留空表单可继续编辑
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (saving.value) {
    return
  }
  if (!form.companyCode?.trim()) {
    toast.show('请输入公司代码')
    return
  }
  if (!form.companyName?.trim()) {
    toast.show('请输入公司名称')
    return
  }
  saving.value = true
  try {
    // 与 PC 端同口径：只传表单字段，办税人员姓名由后端按所选系统用户同步
    if (isEdit.value) {
      await updateTaxCompany({ ...form, id: companyId })
    } else {
      await createTaxCompany({ ...form })
    }
    toast.show('保存成功')
    uni.$emit('taxCompanyChanged')
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  if (query?.id) {
    companyId = Number(query.id)
    isEdit.value = true
  }
  loadUsers()
  if (isEdit.value) {
    load()
  }
})
</script>

<style lang="scss" scoped>
.form-item {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 8rpx;
  }
}

.form-label {
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #333;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
