<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="批量审批" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 提示条 -->
    <view class="bg-white px-24rpx py-16rpx text-24rpx text-[#999]">
      勾选审批节点的待办任务，批量通过或驳回（单批最多 50 条，逐条独立处理互不影响）
    </view>

    <!-- 待办列表（多选） -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="50"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无可批量处理的审批待办"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx flex items-center rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="toggleSelect(item.id)"
        >
          <!-- 勾选框 -->
          <view
            class="mr-20rpx h-40rpx w-40rpx flex flex-shrink-0 items-center justify-center rounded-full"
            :class="selected.includes(item.id) ? 'bg-[#018d71]' : 'border border-gray-300 bg-white'"
          >
            <wd-icon v-if="selected.includes(item.id)" name="check" color="#fff" size="24rpx" />
          </view>
          <!-- 任务摘要 -->
          <view class="min-w-0 flex-1">
            <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
              {{ item.businessTitle || '审批单' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#777] space-y-4rpx">
              <view class="line-clamp-1">
                当前节点：{{ item.nodeName ?? '-' }} · 第 {{ item.round ?? 1 }} 轮
              </view>
              <view class="line-clamp-1">
                到达时间：{{ formatDateTime(item.createTime) }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 底部操作栏：全选 + 批量通过 / 批量驳回 -->
    <view class="border-t border-gray-100 bg-white px-24rpx py-16rpx pb-[env(safe-area-inset-bottom)]">
      <view class="mb-12rpx flex items-center justify-between">
        <view class="flex items-center gap-8rpx" @click="toggleSelectAll">
          <view
            class="h-36rpx w-36rpx flex items-center justify-center rounded-full"
            :class="allSelected ? 'bg-[#018d71]' : 'border border-gray-300 bg-white'"
          >
            <wd-icon v-if="allSelected" name="check" color="#fff" size="22rpx" />
          </view>
          <text class="text-26rpx text-[#333]">全选</text>
        </view>
        <text class="text-24rpx text-[#999]">已选 {{ selected.length }}/50</text>
      </view>
      <view class="flex gap-16rpx">
        <wd-button :disabled="selected.length === 0" plain block type="error" @click="openReject">
          批量驳回
        </wd-button>
        <wd-button :disabled="selected.length === 0" block type="primary" @click="openApprove">
          批量通过
        </wd-button>
      </view>
    </view>

    <!-- 意见 + 确认弹层（通过/驳回共用） -->
    <wd-popup v-model="actionOpen" closable custom-class="rounded-t-24rpx" position="bottom" safe-area-inset-bottom>
      <view class="p-24rpx pb-48rpx">
        <view class="mb-16rpx text-30rpx font-500">
          {{ batchMode === 'approve' ? '批量通过' : '批量驳回' }} · 共 {{ selected.length }} 条
        </view>
        <wd-textarea
          v-model="batchComment"
          :maxlength="500"
          clearable
          :placeholder="batchMode === 'approve'
            ? '统一通过意见（选填；个别节点要求必填意见时，未填意见的任务会记为失败）'
            : '统一驳回意见（必填）'"
          custom-class="bg-gray-50 rounded-xl"
        />
        <!-- 驳回退回方式：原生 picker 下拉 -->
        <view v-if="batchMode === 'reject'" class="mt-16rpx flex items-center justify-between rounded-xl bg-gray-50 px-20rpx py-16rpx">
          <text class="text-26rpx text-[#333]">退回方式</text>
          <picker mode="selector" :range="returnModeLabels" :value="returnModeIndex" @change="handleReturnModeChange">
            <view class="flex items-center gap-8rpx">
              <text class="text-26rpx text-[#333]">{{ returnModeLabels[returnModeIndex] }}</text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <wd-button
          block class="mt-24rpx" type="primary" :loading="acting"
          @click="onConfirm"
        >
          确认{{ batchMode === 'approve' ? '通过' : '驳回' }}
        </wd-button>
      </view>
    </wd-popup>

    <!-- 结果汇总弹层 -->
    <wd-popup v-model="resultOpen" closable custom-class="rounded-t-24rpx" position="bottom" safe-area-inset-bottom>
      <view class="p-24rpx pb-48rpx">
        <view class="mb-16rpx text-30rpx font-500">
          处理结果 · 成功 {{ resultSuccessCount }} 条 / 失败 {{ resultList.length - resultSuccessCount }} 条
        </view>
        <scroll-view class="max-h-600rpx" scroll-y>
          <view
            v-for="item in resultList"
            :key="item.taskId"
            class="mb-12rpx flex items-start gap-12rpx rounded-xl bg-gray-50 px-20rpx py-16rpx"
          >
            <wd-icon
              :name="item.success ? 'check-circle' : 'close-circle'"
              :color="item.success ? '#018d71' : '#f5222d'" size="32rpx"
            />
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-26rpx text-[#333]">
                {{ item.businessTitle || `任务 ${item.taskId}` }}
              </view>
              <view v-if="!item.success" class="mt-4rpx text-22rpx text-[#f5222d]">
                {{ item.errorMsg || '处理失败' }}
              </view>
            </view>
          </view>
        </scroll-view>
        <wd-button block class="mt-24rpx" type="primary" @click="resultOpen = false">
          知道了
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { BpmTask, BpmTaskBatchItem } from '@/api/bpm/task'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  batchApproveBpmTask,
  batchRejectBpmTask,
  getBpmTodoPage,
} from '@/api/bpm/task'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'BpmBatchApprove',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const BATCH_MAX = 50 // 与 PC 端一致：单批最多 50 条
const toast = useToast()
const dialog = useDialog()

const list = ref<BpmTask[]>([])
const selected = ref<number[]>([])
const pagingRef = ref<any>()

/** 查询审批节点的待办（批量通过/驳回仅审批节点可用，办理任务到业务页提交） */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getBpmTodoPage({ nodeType: 1, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
    // 翻页保留已勾选项
    selected.value = selected.value.filter(id => data.list.some(item => item.id === id))
  } catch {
    pagingRef.value?.complete(false)
  }
}

const allSelected = computed(() =>
  list.value.length > 0 && list.value.every(item => selected.value.includes(item.id)),
)

/** 勾选/取消一条（上限 50） */
function toggleSelect(id: number) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else if (selected.value.length >= BATCH_MAX) {
    toast.show(`单批最多 ${BATCH_MAX} 条`)
  } else {
    selected.value.push(id)
  }
}

/** 全选/清空当前页（受上限约束） */
function toggleSelectAll() {
  if (allSelected.value) {
    selected.value = selected.value.filter(id => !list.value.some(item => item.id === id))
  } else {
    for (const item of list.value) {
      if (selected.value.length >= BATCH_MAX) {
        toast.show(`单批最多 ${BATCH_MAX} 条`)
        break
      }
      if (!selected.value.includes(item.id)) {
        selected.value.push(item.id)
      }
    }
  }
}

// ========== 批量动作 ==========

const acting = ref(false)
const batchMode = ref<'approve' | 'reject'>('approve')
const actionOpen = ref(false)
const batchComment = ref('')
/** 结果汇总弹层状态 */
const resultOpen = ref(false)
const resultList = ref<BpmTaskBatchItem[]>([])
const resultSuccessCount = ref(0)
/** 驳回退回方式：restart 重走流程 / resume 退回发起人不重走 */
const returnMode = ref<'restart' | 'resume'>('restart')
const returnModeLabels = ['驳回给制单人 · 重走流程', '退回制单人 · 不重走流程']
const returnModeIndex = computed({
  get: () => returnMode.value === 'restart' ? 0 : 1,
  set: (idx: number) => {
    returnMode.value = idx === 0 ? 'restart' : 'resume'
  },
})

function handleReturnModeChange(e: any) {
  returnModeIndex.value = Number(e.detail.value)
}

function openApprove() {
  batchMode.value = 'approve'
  batchComment.value = ''
  actionOpen.value = true
}

function openReject() {
  batchMode.value = 'reject'
  batchComment.value = ''
  returnMode.value = 'restart'
  actionOpen.value = true
}

/** 提交批量动作，展示逐条结果 */
async function onConfirm() {
  if (batchMode.value === 'reject' && !batchComment.value.trim()) {
    toast.show('驳回意见必填')
    return
  }
  dialog.confirm({
    title: `确认批量${batchMode.value === 'approve' ? '通过' : '驳回'}`,
    msg: `将${batchMode.value === 'approve' ? '通过' : '驳回'}选中的 ${selected.value.length} 条任务，逐条独立处理，确定继续？`,
  }).then(async () => {
    acting.value = true
    try {
      const result = batchMode.value === 'approve'
        ? await batchApproveBpmTask(selected.value, batchComment.value.trim() || undefined)
        : await batchRejectBpmTask(selected.value, batchComment.value.trim(), returnMode.value)
      actionOpen.value = false
      resultList.value = result ?? []
      resultSuccessCount.value = resultList.value.filter(item => item.success).length
      resultOpen.value = true
      selected.value = []
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

function handleBack() {
  navigateBackPlus()
}
</script>
