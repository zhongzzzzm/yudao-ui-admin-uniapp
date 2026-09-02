<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="校验规则" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1 p-24rpx" scroll-y>
      <view v-if="loading" class="flex justify-center py-120rpx">
        <wd-loading color="#018d71" />
      </view>

      <template v-else>
        <!-- 基本信息 -->
        <view class="mb-20rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            基本信息
          </view>
          <view class="space-y-20rpx">
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                规则编号<text class="text-[#f5222d]"> *</text>
              </view>
              <wd-input v-model="form.ruleCode" placeholder="请输入校验规则编号" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                版本<text class="text-[#f5222d]"> *</text>
              </view>
              <wd-input v-model="form.version" placeholder="请输入版本" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                规则类型<text class="text-[#f5222d]"> *</text>
              </view>
              <picker mode="selector" :range="typeLabels" @change="handlePickType">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.typeId ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ typeLabels[typeIndex(form.typeId)] || '请选择规则类型' }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                报文名称<text class="text-[#f5222d]"> *</text>
              </view>
              <picker mode="selector" :range="reportLabels" @change="handlePickReport">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.reportId ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ reportLabels[reportIndex(form.reportId)] || '请选择报表' }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                字段名称<text class="text-[#f5222d]"> *</text>
              </view>
              <textarea
                v-model="form.fieldId"
                :maxlength="500"
                placeholder="请输入字段"
                class="min-h-100rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
              />
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                状态
              </view>
              <radio-group class="flex gap-40rpx" @change="handleFormStatus">
                <label v-for="opt in statusOptions" :key="String(opt.value)" class="flex items-center gap-8rpx text-26rpx">
                  <radio :checked="form.status === opt.value" :value="String(opt.value)" color="#018d71" />
                  {{ opt.label }}
                </label>
              </radio-group>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                规则说明
              </view>
              <textarea
                v-model="form.ruleDescription"
                :maxlength="500"
                placeholder="请输入规则说明"
                class="min-h-100rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
              />
            </view>
          </view>
        </view>

        <!-- 分类标识 -->
        <view class="mb-20rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            分类标识
          </view>
          <view class="space-y-20rpx">
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                规则大类<text class="text-[#f5222d]"> *</text>
              </view>
              <picker mode="selector" :range="categoryLabels" @change="handlePickCategory">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.ruleCategory != null ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ dictPickLabel(categoryOptions, form.ruleCategory, '请选择规则大类') }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                规则细类<text class="text-[#f5222d]"> *</text>
              </view>
              <picker mode="selector" :range="ruleTypeDictLabels" @change="handlePickRuleTypeDict">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.ruleType != null ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ dictPickLabel(ruleTypeDictOptions, form.ruleType, '请选择规则细类') }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                校验标识<text class="text-[#f5222d]"> *</text>
              </view>
              <picker mode="selector" :range="flagLabels" @change="handlePickFlag">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.validationFlag != null ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ dictPickLabel(flagOptions, form.validationFlag, '请选择校验标识') }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                涉及的表
              </view>
              <checkbox-group @change="handlePickInvolvedTables">
                <label v-for="report in reports" :key="report.id" class="mb-12rpx flex items-center gap-8rpx text-26rpx">
                  <checkbox :value="String(report.id)" :checked="involvedTableIds.includes(report.id)" color="#018d71" style="transform: scale(0.8)" />
                  {{ report.name || `报表${report.id}` }}
                </label>
              </checkbox-group>
              <view v-if="!reports.length" class="text-24rpx text-[#bbb]">
                暂无可选报表
              </view>
            </view>
          </view>
        </view>

        <!-- 表达式 -->
        <view class="mb-20rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            表达式
          </view>
          <view class="space-y-20rpx">
            <view v-for="field in expressionFields" :key="field.key">
              <view class="mb-8rpx text-26rpx text-[#666]">
                {{ field.label }}
              </view>
              <textarea
                :value="String(form[field.key] ?? '')"
                :maxlength="2000"
                :placeholder="field.placeholder"
                class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
                @input="(e: any) => setExpression(field.key, e.detail.value)"
              />
            </view>
          </view>
        </view>

        <!-- 日期 -->
        <view class="mb-20rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-500">
            生效期限
          </view>
          <view class="space-y-20rpx">
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                启用日期
              </view>
              <picker mode="date" :value="form.startDate" @change="e => form.startDate = e.detail.value">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.startDate ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ form.startDate || '请选择启用日期' }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                失效日期
              </view>
              <picker mode="date" :value="form.endDate" @change="e => form.endDate = e.detail.value">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.endDate ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ form.endDate || '请选择失效日期' }}
                </view>
              </picker>
            </view>
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                备注
              </view>
              <textarea
                v-model="form.description"
                :maxlength="200"
                placeholder="请输入备注"
                class="min-h-100rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
              />
            </view>
          </view>
        </view>

        <wd-button block class="mb-40rpx" type="primary" :disabled="saving" :loading="saving" @click="submit">
          保存
        </wd-button>
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ReportRuleVO } from '@/api/validation/reportRule'
import type { ReportVO } from '@/api/validation/report'
import type { ReportRuleTypeVO } from '@/api/validation/reportRuleType'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { computed, ref } from 'vue'
import {
  createReportRule,
  getReportRule,
  updateReportRule,
} from '@/api/validation/reportRule'
import { getReportList } from '@/api/validation/report'
import { getReportRuleTypeList } from '@/api/validation/reportRuleType'

defineOptions({
  name: 'ValidationReportRuleForm',
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

const { hasAccessByCodes } = useAccess()
const canUpdate = hasAccessByCodes(['validation:report-rule:update'])

const loading = ref(false)
const saving = ref(false)
const ruleId = ref<number>()
const form = ref<Partial<ReportRuleVO>>({ status: 0 })
const involvedTableIds = ref<number[]>([])

const statusOptions = getDictOptions(DICT_TYPE.COMMON_STATUS)
const categoryOptions = getDictOptions(DICT_TYPE.VALIDATION_RULE_CATEGORY)
const ruleTypeDictOptions = getDictOptions(DICT_TYPE.VALIDATION_RULE_TYPE)
const flagOptions = getDictOptions(DICT_TYPE.VALIDATION_FLAG)

const categoryLabels = computed(() => categoryOptions.map(o => o.label))
const ruleTypeDictLabels = computed(() => ruleTypeDictOptions.map(o => o.label))
const flagLabels = computed(() => flagOptions.map(o => o.label))

/** 字典 picker 的回显文案 */
function dictPickLabel(options: { label: string, value: any }[], value?: number, placeholder = '-') {
  if (value == null) {
    return placeholder
  }
  return options.find(o => o.value === value)?.label || String(value)
}

const expressionFields = [
  { key: 'relationExpression', label: '关联关系', placeholder: '请输入关联关系' },
  { key: 'conditionExpressionText', label: '限定条件', placeholder: '请输入限定条件' },
  { key: 'conditionExpression', label: '条件表达式', placeholder: '请输入条件表达式' },
  { key: 'ruleLogicText', label: '规则实现逻辑', placeholder: '请输入规则实现逻辑' },
  { key: 'ruleLogic', label: '规则表达式', placeholder: '请输入规则表达式' },
] as const

// 下拉数据源
const ruleTypes = ref<ReportRuleTypeVO[]>([])
const reports = ref<ReportVO[]>([])
const typeLabels = computed(() => ruleTypes.value.map(item => item.name || `类型${item.id}`))
const reportLabels = computed(() => reports.value.map(item => item.name || `报表${item.id}`))

function typeIndex(typeId?: number) {
  const idx = ruleTypes.value.findIndex(item => item.id === typeId)
  return idx < 0 ? 0 : idx
}

function reportIndex(reportId?: number) {
  const idx = reports.value.findIndex(item => item.id === reportId)
  return idx < 0 ? 0 : idx
}

function handlePickType(e: any) {
  form.value.typeId = ruleTypes.value[Number(e.detail.value)]?.id
}

function handlePickReport(e: any) {
  form.value.reportId = reports.value[Number(e.detail.value)]?.id
}

function handlePickCategory(e: any) {
  form.value.ruleCategory = Number(categoryOptions[Number(e.detail.value)]?.value)
}

function handlePickRuleTypeDict(e: any) {
  form.value.ruleType = Number(ruleTypeDictOptions[Number(e.detail.value)]?.value)
}

function handlePickFlag(e: any) {
  form.value.validationFlag = Number(flagOptions[Number(e.detail.value)]?.value)
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

function setExpression(key: 'relationExpression' | 'conditionExpressionText' | 'conditionExpression' | 'ruleLogicText' | 'ruleLogic', value: string) {
  form.value[key] = value
}

function handlePickInvolvedTables(e: any) {
  involvedTableIds.value = (e.detail.value || []).map((v: string) => Number(v))
}

async function load() {
  loading.value = true
  const loads: Promise<void>[] = [
    getReportRuleTypeList().then((data) => {
      ruleTypes.value = data || []
    }).catch(() => {
      ruleTypes.value = []
    }),
    getReportList().then((data) => {
      reports.value = data || []
    }).catch(() => {
      reports.value = []
    }),
  ]
  if (ruleId.value) {
    loads.push(getReportRule(ruleId.value).then((data) => {
      form.value = data
      involvedTableIds.value = data.involvedTables || []
    }).catch((e) => {
      uni.showToast({ title: e?.message || '加载规则失败', icon: 'none' })
    }))
  }
  await Promise.allSettled(loads)
  loading.value = false
}

async function submit() {
  const data = form.value
  if (!data.ruleCode?.trim() || !data.version?.trim()) {
    uni.showToast({ title: '请填写规则编号和版本', icon: 'none' })
    return
  }
  if (!data.typeId || !data.reportId) {
    uni.showToast({ title: '请选择规则类型和报文名称', icon: 'none' })
    return
  }
  if (!data.fieldId?.trim()) {
    uni.showToast({ title: '请填写字段名称', icon: 'none' })
    return
  }
  if (data.ruleCategory == null || data.ruleType == null || data.validationFlag == null) {
    uni.showToast({ title: '请选择规则大类、细类和校验标识', icon: 'none' })
    return
  }
  if (!canUpdate && data.id) {
    uni.showToast({ title: '无编辑权限', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const payload = { ...data, involvedTables: involvedTableIds.value }
    if (data.id) {
      await updateReportRule(payload)
    } else {
      await createReportRule(payload)
    }
    uni.showToast({ title: '保存成功', icon: 'none' })
    setTimeout(() => navigateBackPlus(), 600)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  ruleId.value = query?.id ? Number(query.id) : undefined
  load()
})
</script>
