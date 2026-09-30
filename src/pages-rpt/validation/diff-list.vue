<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据对比" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view v-if="canCreate" class="flex justify-end bg-white px-24rpx py-16rpx">
      <wd-button size="small" type="primary" @click="openForm()">
        新建对比任务
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
      empty-view-text="暂无对比任务"
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
            <wd-tag :type="item.status === 2 ? 'success' : (item.status === 3 ? 'error' : 'info')" plain class="ml-16rpx flex-shrink-0">
              {{ (['未执行', '执行中', '完成', '失败'] as const)[item.status] ?? '未知' }}
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
              {{ item.hisBatchDate || '未知版本' }} → {{ item.cmpBatchDate || '未知版本' }}
            </view>
            <view class="line-clamp-1">
              对比报表 {{ item.totalReportCount ?? 0 }} 张 · 耗时 {{ item.durationSeconds ?? 0 }}s
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

    <!-- 新建/编辑表单：历史版本 + 当前版本（与 PC 表单字段一致） -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑对比任务' : '新建对比任务' }}
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
              历史数据版本<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="selector" :range="batchLabels" @change="(e: any) => form.hisBatchId = batches[Number(e.detail.value)]?.id">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.hisBatchId ? 'text-[#333]' : 'text-[#bbb]'">
                {{ batchLabelOf(form.hisBatchId) || '请选择历史数据版本' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              当前数据版本<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="selector" :range="batchLabels" @change="(e: any) => form.cmpBatchId = batches[Number(e.detail.value)]?.id">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.cmpBatchId ? 'text-[#333]' : 'text-[#bbb]'">
                {{ batchLabelOf(form.cmpBatchId) || '请选择当前数据版本' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              状态
            </view>
            <radio-group class="flex flex-wrap gap-40rpx" @change="(e: any) => form.status = Number(e.detail.value)">
              <label v-for="opt in statusFormOptions" :key="String(opt.value)" class="flex items-center gap-8rpx text-26rpx">
                <radio :checked="form.status === opt.value" :value="String(opt.value)" color="#018d71" />
                {{ opt.label }}
              </label>
            </radio-group>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              对比报表数
            </view>
            <wd-input v-model="totalReportCountText" type="number" placeholder="选填" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
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
import type { DiffTaskVO, ReportDataBatchVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { createDiffTask, deleteDiffTask, getDiffTaskPage, getReportDataBatchList, updateDiffTask } from '@/api/validation/task'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'DiffTaskList',
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
const canCreate = hasAccessByCodes(['validation:diff-task:create'])
const canUpdate = hasAccessByCodes(['validation:diff-task:update'])
const canDelete = hasAccessByCodes(['validation:diff-task:delete'])

const list = ref<DiffTaskVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDiffTaskPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: DiffTaskVO) {
  uni.navigateTo({ url: `/pages-rpt/validation/diff-detail?id=${item.id}` })
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<DiffTaskVO>()

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

function openActions(item: DiffTaskVO) {
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
      title: '删除对比任务',
      msg: `确认删除【${target.taskCode}】？对比结果将一并失效。`,
    }).then(async () => {
      try {
        await deleteDiffTask(target.id)
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
const form = ref<Partial<DiffTaskVO>>({})
const totalReportCountText = ref('')
const statusFormOptions = [
  { label: '未执行', value: 0 },
  { label: '执行中', value: 1 },
  { label: '完成', value: 2 },
  { label: '失败', value: 3 },
]
const batches = ref<ReportDataBatchVO[]>([])
const batchLabels = computed(() =>
  batches.value.map(b => b.batchDate || `版本${b.id}`),
)

function batchLabelOf(batchId?: number) {
  const b = batches.value.find(item => item.id === batchId)
  return b ? (batchLabels.value[batches.value.indexOf(b)] || `版本${b.id}`) : ''
}

function openForm(item?: DiffTaskVO) {
  form.value = item ? { ...item } : { status: 0 }
  totalReportCountText.value = item?.totalReportCount != null ? String(item.totalReportCount) : ''
  if (!batches.value.length) {
    getReportDataBatchList().then(data => batches.value = data || []).catch(() => batches.value = [])
  }
  showForm.value = true
}

async function submitForm() {
  if (!form.value.taskCode?.trim()) {
    uni.showToast({ title: '请填写任务编号', icon: 'none' })
    return
  }
  if (!form.value.hisBatchId || !form.value.cmpBatchId) {
    uni.showToast({ title: '请选择历史与当前数据版本', icon: 'none' })
    return
  }
  if (form.value.hisBatchId === form.value.cmpBatchId) {
    uni.showToast({ title: '两个版本不能相同', icon: 'none' })
    return
  }
  const count = Number(totalReportCountText.value)
  const payload = { ...form.value, totalReportCount: Number.isInteger(count) && count >= 0 ? count : undefined }
  saving.value = true
  try {
    if (payload.id) {
      await updateDiffTask(payload)
    } else {
      await createDiffTask(payload)
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
