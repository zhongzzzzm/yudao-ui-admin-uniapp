<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="规则类型" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view class="bg-white px-24rpx pb-16rpx pt-16rpx">
      <wd-search v-model="name" placeholder="搜索类型名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
      <view v-if="canCreate" class="mt-12rpx flex justify-end">
        <wd-button size="small" type="primary" @click="openForm()">
          新建类型
        </wd-button>
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无规则类型"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openActions(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.name || '-' }}
            </view>
            <wd-tag :type="item.status === 0 ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view v-if="item.description" class="line-clamp-2 text-26rpx text-[#777]">
            {{ item.description }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 卡片操作面板 -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionOptions"
      cancel-text="取消"
      :title="activeItem?.name || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新建/编辑表单 -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑类型' : '新建类型' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              名称<text class="text-[#f5222d]"> *</text>
            </view>
            <wd-input v-model="form.name" placeholder="请输入名称" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
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
              备注
            </view>
            <textarea
              v-model="form.description"
              :maxlength="200"
              placeholder="请输入备注"
              class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
            />
          </view>
        </view>
        <wd-button block class="mt-24rpx" type="primary" :disabled="saving" :loading="saving" @click="submitForm">
          保存
        </wd-button>
      </view>
    </wd-popup>

    <!-- 校验：选择数据版本 -->
    <wd-popup v-model="showValidate" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-500">
          按类型批量校验
        </view>
        <picker mode="selector" :range="batchLabels" @change="handleValidateBatch">
          <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="validateBatchId ? 'text-[#333]' : 'text-[#bbb]'">
            {{ batchLabels[batchIndex(validateBatchId)] || '请选择数据版本' }}
          </view>
        </picker>
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :disabled="!validateBatchId || acting"
          :loading="acting"
          @click="submitValidate"
        >
          开始校验
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportRuleTypeVO } from '@/api/validation/reportRuleType'
import type { ReportDataBatchVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportRuleType,
  deleteReportRuleType,
  getReportRuleTypePage,
  updateReportRuleType,
  validateReportRuleType,
} from '@/api/validation/reportRuleType'
import { getReportDataBatchList } from '@/api/validation/task'

defineOptions({
  name: 'ValidationReportRuleType',
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

const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const canCreate = hasAccessByCodes(['validation:report-rule-type:create'])
const canUpdate = hasAccessByCodes(['validation:report-rule-type:update'])
const canDelete = hasAccessByCodes(['validation:report-rule-type:delete'])
const canValidate = hasAccessByCodes(['validation:report-rule-type:validation'])

const statusOptions = getDictOptions(DICT_TYPE.COMMON_STATUS)

function statusLabel(status?: number) {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.COMMON_STATUS, status) || '未知'
}

// 列表查询
const name = ref('')
const list = ref<ReportRuleTypeVO[]>([])
const pagingRef = ref<any>()

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportRuleTypePage({ pageNo, pageSize, name: name.value.trim() || undefined })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportRuleTypeVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canValidate) {
    actions.push({ name: '校验', key: 'validate' })
  }
  actions.push({ name: '查看规则', key: 'viewRules' })
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportRuleTypeVO) {
  activeItem.value = item
  showActions.value = true
}

function handleAction({ item }: { item: { key: string } }) {
  showActions.value = false
  const target = activeItem.value
  if (!target) {
    return
  }
  switch (item.key) {
    case 'edit': {
      openForm(target)
      break
    }
    case 'validate': {
      openValidate(target)
      break
    }
    case 'viewRules': {
      uni.navigateTo({ url: `/pages-rpt/validation/report-rule?typeId=${target.id}` })
      break
    }
    case 'delete': {
      dialog.confirm({
        title: '删除类型',
        msg: `确认删除【${target.name}】？`,
      }).then(async () => {
        try {
          await deleteReportRuleType(target.id)
          uni.showToast({ title: '已删除', icon: 'none' })
          pagingRef.value?.reload()
        } catch (e: any) {
          uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
        }
      }).catch(() => {})
      break
    }
  }
}

// 表单
const showForm = ref(false)
const saving = ref(false)
const form = ref<Partial<ReportRuleTypeVO>>({})

function openForm(item?: ReportRuleTypeVO) {
  form.value = item ? { ...item } : { status: 0 }
  showForm.value = true
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

async function submitForm() {
  if (!form.value.name?.trim()) {
    uni.showToast({ title: '请填写名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateReportRuleType(form.value)
    } else {
      await createReportRuleType(form.value)
    }
    uni.showToast({ title: '保存成功', icon: 'none' })
    showForm.value = false
    pagingRef.value?.reload()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

// 校验
const acting = ref(false)
const showValidate = ref(false)
const validateBatchId = ref<number>()
const validateTarget = ref<ReportRuleTypeVO>()
const batches = ref<ReportDataBatchVO[]>([])
const batchLabels = computed(() =>
  batches.value.map(b => `${b.batchDate || ''}${b.description ? ` ${b.description}` : ''}` || `版本${b.id}`),
)

function batchIndex(batchId?: number) {
  const idx = batches.value.findIndex(b => b.id === batchId)
  return idx < 0 ? 0 : idx
}

function openValidate(item: ReportRuleTypeVO) {
  validateTarget.value = item
  validateBatchId.value = undefined
  getReportDataBatchList().then((data) => {
    batches.value = data || []
  }).catch(() => {
    batches.value = []
  })
  showValidate.value = true
}

function handleValidateBatch(e: any) {
  validateBatchId.value = batches.value[Number(e.detail.value)]?.id
}

function submitValidate() {
  if (!validateBatchId.value || !validateTarget.value) {
    return
  }
  const target = validateTarget.value
  dialog.confirm({
    title: '确认校验',
    msg: `将按所选数据版本对【${target.name}】类型下的规则批量校验，是否继续？`,
  }).then(async () => {
    acting.value = true
    try {
      await validateReportRuleType([target.id], validateBatchId.value!)
      uni.showToast({ title: '已提交校验', icon: 'none' })
      showValidate.value = false
    } catch (e: any) {
      uni.showToast({ title: e?.message || '校验失败', icon: 'none' })
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}
</script>
