<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="校验任务" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 状态筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in statusChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentStatus === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleStatusChange(chip.value)"
      >
        {{ chip.label }}
      </view>
      <view class="flex-1" />
      <wd-button v-if="canCreate" size="small" type="primary" @click="openForm()">
        新建
      </wd-button>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无校验任务"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.taskCode }}
            </view>
            <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
            <view
              v-if="canUpdate || canDelete"
              class="ml-8rpx flex-shrink-0 px-12rpx py-4rpx text-[#999]"
              @click.stop="openActions(item)"
            >
              <wd-icon name="more" size="36rpx" />
            </view>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              数据日期：{{ item.batchDate || '-' }}
            </view>
            <view class="line-clamp-1">
              规则：{{ item.totalRuleCount ?? 0 }} 条，失败
              <text :class="item.errorRuleCount ? 'text-[#f5222d]' : ''">{{ item.errorRuleCount ?? 0 }}</text>
              条 · 耗时 {{ item.durationSeconds ?? 0 }}s
            </view>
            <view class="line-clamp-1">
              创建时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 卡片操作面板（对齐 PC 端：编辑/删除） -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionOptions"
      cancel-text="取消"
      :title="activeItem?.taskCode || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新建/编辑表单：任务编号 + 状态（与 PC 表单字段一致） -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑校验任务' : '新建校验任务' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              任务编号<text class="text-[#f5222d]"> *</text>
            </view>
            <wd-input v-model="form.taskCode" placeholder="请输入任务编号" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              状态
            </view>
            <radio-group class="flex flex-wrap gap-40rpx" @change="handleFormStatus">
              <label v-for="opt in statusFormOptions" :key="String(opt.value)" class="flex items-center gap-8rpx text-26rpx">
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
import type { ReportTaskVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { createReportTask, deleteReportTask, getReportTaskPage, updateReportTask } from '@/api/validation/task'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'ValidationTaskList',
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
const canCreate = hasAccessByCodes(['validation:report-task:create'])
const canUpdate = hasAccessByCodes(['validation:report-task:update'])
const canDelete = hasAccessByCodes(['validation:report-task:delete'])

const statusChips = [
  { label: '全部', value: -1 },
  { label: '完成', value: 2 },
  { label: '失败', value: 3 },
  { label: '执行中', value: 1 },
  { label: '未执行', value: 0 },
]
const statusFormOptions = [
  { label: '未执行', value: 0 },
  { label: '执行中', value: 1 },
  { label: '完成', value: 2 },
  { label: '失败', value: 3 },
]
const currentStatus = ref(2)
const list = ref<ReportTaskVO[]>([])
const pagingRef = ref<any>()

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportTaskPage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status: number): string {
  return (['未执行', '执行中', '完成', '失败'] as const)[status] ?? '未知'
}

function statusTagType(status: number): 'primary' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'error'
  }
  if (status === 1) {
    return 'primary'
  }
  return 'info'
}

function goDetail(item: ReportTaskVO) {
  uni.navigateTo({ url: `/pages-rpt/validation/detail?id=${item.id}` })
}

// 卡片操作（长按/点更多场景与 PC 一致：编辑/删除）
const showActions = ref(false)
const activeItem = ref<ReportTaskVO>()

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

function openActions(item: ReportTaskVO) {
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
      title: '删除校验任务',
      msg: `确认删除【${target.taskCode}】？任务下的校验结果将一并失效。`,
    }).then(async () => {
      try {
        await deleteReportTask(target.id)
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
const form = ref<Partial<ReportTaskVO>>({})

function openForm(item?: ReportTaskVO) {
  form.value = item ? { ...item } : { status: 0 }
  showForm.value = true
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

async function submitForm() {
  if (!form.value.taskCode?.trim()) {
    uni.showToast({ title: '请填写任务编号', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateReportTask(form.value)
    } else {
      await createReportTask(form.value)
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
