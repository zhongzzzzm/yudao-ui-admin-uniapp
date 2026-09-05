<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="重报登记" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view v-if="canCreate" class="flex justify-end bg-white px-24rpx py-16rpx">
      <wd-button size="small" type="primary" @click="openForm()">
        新增登记
      </wd-button>
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
      empty-view-text="暂无重报登记"
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
            <view class="text-28rpx text-[#333] font-500">
              数据日期 {{ item.reportDate || '-' }}
            </view>
            <wd-tag v-if="item.status != null" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              重报批次号：{{ item.batchNumber || '-' }}
            </view>
            <view class="line-clamp-2">
              {{ item.description || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 卡片操作面板（对齐 PC 端数据重报管理：编辑/删除） -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionOptions"
      cancel-text="取消"
      :title="activeItem?.batchNumber || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新建/编辑表单：数据日期 + 批次号 + 描述 + 状态（与 PC 表单字段一致） -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑重报登记' : '新增重报登记' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              数据日期<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="date" :value="form.reportDate || ''" @change="handleFormDate">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.reportDate ? 'text-[#333]' : 'text-[#bbb]'">
                {{ form.reportDate || '请选择数据日期' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              重报批次号
            </view>
            <wd-input v-model="form.batchNumber" placeholder="请输入重报批次号" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              描述
            </view>
            <textarea
              v-model="form.description"
              :maxlength="200"
              placeholder="请输入描述"
              class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
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
        </view>
        <wd-button block class="mt-24rpx" type="primary" :disabled="saving" :loading="saving" @click="submitForm">
          保存
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportResubmitVO } from '@/api/validation/reportData'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportResubmit,
  deleteReportResubmit,
  getReportResubmitPage,
  updateReportResubmit,
} from '@/api/validation/reportData'

defineOptions({
  name: 'ValidationResubmitList',
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
const canCreate = hasAccessByCodes(['validation:report-resubmit:create'])
const canUpdate = hasAccessByCodes(['validation:report-resubmit:update'])
const canDelete = hasAccessByCodes(['validation:report-resubmit:delete'])

const statusOptions = getDictOptions(DICT_TYPE.VALIDATION_DATA_STATUS)

function statusLabel(status?: number): string {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.VALIDATION_DATA_STATUS, status) || '未知'
}

const list = ref<ReportResubmitVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportResubmitPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportResubmitVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportResubmitVO) {
  if (actionOptions.value.length === 0) {
    return
  }
  activeItem.value = item
  showActions.value = true
}

function handleAction({ item }: { item: { key: string } }) {
  showActions.value = false
  const target = activeItem.value
  if (!target) {
    return
  }
  if (item.key === 'edit') {
    openForm(target)
  } else if (item.key === 'delete') {
    dialog.confirm({
      title: '删除重报登记',
      msg: `确认删除【${target.reportDate || '-'} ${target.batchNumber || ''}】？`,
    }).then(async () => {
      try {
        await deleteReportResubmit(target.id)
        uni.showToast({ title: '已删除', icon: 'none' })
        pagingRef.value?.reload()
      } catch (e: any) {
        uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
      }
    }).catch(() => {})
  }
}

// 表单
const showForm = ref(false)
const saving = ref(false)
const form = ref<Partial<ReportResubmitVO>>({})

function openForm(item?: ReportResubmitVO) {
  form.value = item ? { ...item } : { status: 0 }
  showForm.value = true
}

function handleFormDate(e: any) {
  form.value.reportDate = e.detail.value
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

async function submitForm() {
  if (!form.value.reportDate) {
    uni.showToast({ title: '请选择数据日期', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateReportResubmit(form.value)
    } else {
      await createReportResubmit(form.value)
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
</script>
