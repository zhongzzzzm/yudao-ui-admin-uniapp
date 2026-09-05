<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据版本" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view v-if="canCreate" class="flex justify-end bg-white px-24rpx py-16rpx">
      <wd-button size="small" type="primary" @click="openForm()">
        新建版本
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
      empty-view-text="暂无数据版本"
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
              {{ item.batchDate || '-' }}
            </view>
            <wd-tag v-if="item.status != null" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="line-clamp-2 text-26rpx text-[#777]">
            {{ item.description || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 卡片操作面板（对齐 PC 端数据版本管理：编辑/删除） -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionOptions"
      cancel-text="取消"
      :title="activeItem?.batchDate || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新建/编辑表单：数据日期 + 描述 + 状态（与 PC 表单字段一致） -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑数据版本' : '新建数据版本' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              数据日期<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="date" :value="form.batchDate || ''" @change="handleFormDate">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.batchDate ? 'text-[#333]' : 'text-[#bbb]'">
                {{ form.batchDate || '请选择数据日期' }}
              </view>
            </picker>
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
import type { ReportDataBatchVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportDataBatch,
  deleteReportDataBatch,
  getReportDataBatchPage,
  updateReportDataBatch,
} from '@/api/validation/task'

defineOptions({
  name: 'ValidationDataBatchList',
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
const canCreate = hasAccessByCodes(['validation:report-data-batch:create'])
const canUpdate = hasAccessByCodes(['validation:report-data-batch:update'])
const canDelete = hasAccessByCodes(['validation:report-data-batch:delete'])

const statusOptions = getDictOptions(DICT_TYPE.VALIDATION_DATA_STATUS)

function statusLabel(status?: number): string {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.VALIDATION_DATA_STATUS, status) || '未知'
}

const list = ref<ReportDataBatchVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportDataBatchPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportDataBatchVO>()

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

function openActions(item: ReportDataBatchVO) {
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
      title: '删除数据版本',
      msg: `确认删除【${target.batchDate || target.id}】？删除后关联底稿/数据的版本关联将失效。`,
    }).then(async () => {
      try {
        await deleteReportDataBatch(target.id)
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
const form = ref<Partial<ReportDataBatchVO>>({})

function openForm(item?: ReportDataBatchVO) {
  form.value = item ? { ...item } : { status: 0 }
  showForm.value = true
}

function handleFormDate(e: any) {
  form.value.batchDate = e.detail.value
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

async function submitForm() {
  if (!form.value.batchDate) {
    uni.showToast({ title: '请选择数据日期', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateReportDataBatch(form.value)
    } else {
      await createReportDataBatch(form.value)
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
