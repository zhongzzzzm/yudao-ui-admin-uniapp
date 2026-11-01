<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="isEdit ? '编辑识别规则' : '新增识别规则'" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="m-24rpx mb-0 rounded-12rpx bg-[#e6f7f4] px-24rpx py-20rpx text-24rpx text-[#018d71]">
        忽略类规则按「关键词包含即命中」；动作类规则按「前缀 + 尾缀」解析主体名与合同号，保存后下次计算即生效。
      </view>

      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <!-- 规则名 -->
        <view class="form-item">
          <view class="form-label required">
            规则名
          </view>
          <wd-input v-model="form.name" :maxlength="64" clearable no-border placeholder="如：预收-预收X款项" />
        </view>

        <!-- 方向 -->
        <view class="form-item">
          <view class="form-label required">
            方向
          </view>
          <picker mode="selector" :range="directionLabels" :value="directionIndex" @change="handleDirectionChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ directionLabels[directionIndex] || '请选择方向' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 动作 -->
        <view class="form-item">
          <view class="form-label required">
            动作
          </view>
          <picker mode="selector" :range="actionLabels" :value="actionIndex" @change="handleActionChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ actionLabels[actionIndex] || '请选择动作' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 忽略类：关键词 -->
        <view v-if="form.action === 0" class="form-item">
          <view class="form-label">
            关键词
          </view>
          <wd-input v-model="form.keyword" :maxlength="128" clearable no-border placeholder="摘要包含即命中，如「予以调平」" />
        </view>

        <!-- 动作类：前缀 / 尾缀 -->
        <template v-else>
          <view class="form-item">
            <view class="form-label">
              摘要前缀
            </view>
            <wd-input v-model="form.prefix" :maxlength="64" clearable no-border placeholder="可空 = 无前缀通配，仅尾缀限定" />
          </view>
          <view class="form-item">
            <view class="form-label">
              尾缀集合
            </view>
            <wd-input v-model="suffixesText" :maxlength="256" clearable no-border placeholder="多个用顿号或逗号分隔，如：款项、租金" />
            <view class="mt-8rpx text-22rpx text-[#999]">
              可空 = 前缀后整段作为主体名
            </view>
          </view>
        </template>

        <!-- 优先级 -->
        <view class="form-item">
          <view class="form-label required">
            匹配优先级
          </view>
          <wd-input v-model="form.priority" type="number" no-border placeholder="小的先匹配，如 10" />
        </view>

        <!-- 状态 -->
        <view class="form-item">
          <view class="form-label">
            状态
          </view>
          <picker mode="selector" :range="statusLabels" :value="statusIndex" @change="handleStatusChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ statusLabels[statusIndex] || '请选择状态' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <view class="form-label">
            备注
          </view>
          <wd-textarea v-model="form.remark" :maxlength="500" show-word-limit clearable no-border placeholder="备注（500 字以内）" />
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { computed, reactive, ref } from 'vue'
import { createPrematchRule, getPrematchRulePage, updatePrematchRule } from '@/api/fin/prematch'

defineOptions({
  name: 'FinPrematchRuleForm',
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

// ========== 选项 ==========

/** 方向：0=两侧通用、1=贷（收入侧）、2=借（消化侧） */
const directionOptions = [
  { label: '两侧通用', value: 0 },
  { label: '贷（收入侧）', value: 1 },
  { label: '借（消化侧）', value: 2 },
]
const directionLabels = directionOptions.map(o => o.label)

/** 动作：0=忽略、1=预收、2=租金挂账、3=转出、4=冲抵、5=退还 */
const actionOptions = [
  { label: '忽略', value: 0 },
  { label: '预收', value: 1 },
  { label: '租金挂账', value: 2 },
  { label: '转出', value: 3 },
  { label: '冲抵', value: 4 },
  { label: '退还', value: 5 },
]
const actionLabels = actionOptions.map(o => o.label)

/** 状态：0=启用、1=停用 */
const statusOptions = [
  { label: '启用', value: 0 },
  { label: '停用', value: 1 },
]
const statusLabels = statusOptions.map(o => o.label)

// ========== 表单 ==========

const form = reactive({
  id: undefined as number | undefined,
  name: '',
  direction: 0,
  action: 1,
  keyword: '',
  prefix: '',
  priority: '10',
  status: 0,
  remark: '',
})

/** 尾缀集合文本（顿号/逗号分隔） */
const suffixesText = ref('')

const directionIndex = computed(() =>
  directionOptions.findIndex(o => o.value === form.direction))
const actionIndex = computed(() =>
  actionOptions.findIndex(o => o.value === form.action))
const statusIndex = computed(() =>
  statusOptions.findIndex(o => o.value === form.status))

function handleDirectionChange(e: any) {
  form.direction = directionOptions[Number(e.detail.value)]?.value ?? 0
}
function handleActionChange(e: any) {
  form.action = actionOptions[Number(e.detail.value)]?.value ?? 1
}
function handleStatusChange(e: any) {
  form.status = statusOptions[Number(e.detail.value)]?.value ?? 0
}

const isEdit = computed(() => form.id != null)
const submitting = ref(false)

/** 编辑时回显规则（规则分页接口按 name 查，直接拉第一页定位） */
async function loadDetail(id: number) {
  try {
    const data = await getPrematchRulePage({ pageNo: 1, pageSize: 100 })
    const rule = data.list?.find(item => item.id === id)
    if (!rule) {
      toast.show('未找到该规则')
      return
    }
    form.id = rule.id
    form.name = rule.name || ''
    form.direction = rule.direction ?? 0
    form.action = rule.action ?? 1
    form.keyword = rule.keyword || ''
    form.prefix = rule.prefix || ''
    form.priority = rule.priority == null ? '10' : String(rule.priority)
    form.status = rule.status ?? 0
    form.remark = rule.remark || ''
    suffixesText.value = (rule.suffixes ?? []).join('、')
  } catch {
    toast.show('加载规则详情失败')
  }
}

onLoad((query) => {
  if (query?.id) {
    loadDetail(Number(query.id))
  }
})

/** 拆分尾缀文本（支持顿号/中英文逗号/空格分隔） */
function parseSuffixes(): string[] {
  return suffixesText.value
    .split(/[、,，;；\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** 保存：本地校验 → 新增 / 修改 */
async function onSubmit() {
  if (!form.name) {
    toast.show('请填写规则名')
    return
  }
  const priority = Number(form.priority)
  if (!form.priority || !Number.isInteger(priority) || priority < 0) {
    toast.show('优先级须为非负整数')
    return
  }
  submitting.value = true
  try {
    const data = {
      id: form.id,
      name: form.name,
      direction: form.direction,
      action: form.action,
      keyword: form.action === 0 ? (form.keyword || undefined) : undefined,
      prefix: form.action === 0 ? undefined : (form.prefix || undefined),
      suffixes: form.action === 0 ? undefined : parseSuffixes(),
      priority,
      status: form.status,
      remark: form.remark || undefined,
    }
    if (form.id) {
      await updatePrematchRule(data)
    } else {
      await createPrematchRule(data)
    }
    toast.show('已保存，下次计算即生效')
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
