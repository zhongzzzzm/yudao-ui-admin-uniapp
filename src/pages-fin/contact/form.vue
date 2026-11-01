<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="pageTitle" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="form-item">
          <view class="form-label required">
            姓名
          </view>
          <wd-input
            v-model="form.name"
            :maxlength="64"
            clearable
            no-border
            placeholder="请输入姓名"
          />
        </view>
        <view class="form-item">
          <view class="form-label">
            分组
          </view>
          <wd-input
            v-model="form.groupName"
            :maxlength="64"
            clearable
            no-border
            placeholder="请输入分组（如部门，用于行程单/住宿单拆分匹配）"
          />
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label mb-0">
            序号
          </view>
          <wd-input
            v-model="sortNoText"
            class="w-240rpx text-right"
            type="number"
            no-border
            placeholder="请输入序号"
          />
        </view>
      </view>

      <!-- 编辑态：删除入口 -->
      <view v-if="contactId && canDelete" class="mx-24rpx">
        <wd-button plain block type="error" @click="onDelete">
          删除该人员
        </wd-button>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存 -->
    <view class="fixed inset-x-0 bottom-0 z-10 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button block type="primary" :loading="submitting" @click="onSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { computed, reactive, ref } from 'vue'
import {
  createCompanyContact,
  deleteCompanyContact,
  getCompanyContact,
  updateCompanyContact,
} from '@/api/fin/companyContact'

defineOptions({
  name: 'FinCompanyContactForm',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const canDelete = hasAccessByCodes(['fin:company-contact:delete'])

function handleBack() {
  navigateBackPlus()
}

/** 编辑人员编号（新建时为空） */
const contactId = ref<number>()

const pageTitle = computed(() => (contactId.value ? '编辑人员' : '新增人员'))

/** 表单数据（字段以后端 CompanyContactSaveReqVO 为准：分组 / 序号 / 姓名） */
const form = reactive({
  groupName: '',
  name: '',
})
const sortNoText = ref('')
const submitting = ref(false)

/** 通讯录列表刷新事件名（与列表页约定一致） */
const CONTACT_RELOAD_EVENT = 'fin:company-contact:reload'

/** 序号文本 → 数值（空/非法输入按空处理） */
const sortNoValue = computed(() => {
  const trimmed = sortNoText.value.trim()
  if (!trimmed) {
    return undefined
  }
  const num = Number(trimmed)
  return Number.isInteger(num) && num >= 0 ? num : undefined
})

onLoad(async (query) => {
  if (!query?.id) {
    return
  }
  contactId.value = Number(query.id)
  try {
    const detail = await getCompanyContact(contactId.value)
    form.groupName = detail.groupName || ''
    form.name = detail.name || ''
    sortNoText.value = detail.sortNo != null ? String(detail.sortNo) : ''
  } catch {
    // 业务错误 toast 已由 http 层提示
  }
})

function validate(): boolean {
  if (!form.name.trim()) {
    toast.show('请填写姓名')
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) {
    return
  }
  submitting.value = true
  try {
    const data = {
      id: contactId.value,
      name: form.name.trim(),
      groupName: form.groupName.trim() || undefined,
      sortNo: sortNoValue.value,
    }
    if (contactId.value) {
      await updateCompanyContact(data)
      toast.success('已保存')
    } else {
      await createCompanyContact(data)
      toast.success('已新增')
    }
    uni.$emit(CONTACT_RELOAD_EVENT)
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    submitting.value = false
  }
}

/** 删除人员（二次确认） */
async function onDelete() {
  if (!contactId.value) {
    return
  }
  await dialog.confirm({
    title: '删除确认',
    msg: `确定删除人员「${form.name}」吗？`,
  })
  try {
    await deleteCompanyContact(contactId.value)
    toast.success('删除成功')
    uni.$emit(CONTACT_RELOAD_EVENT)
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误 toast 已由 http 层提示
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
  font-size: 28rpx;
  color: #333;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
