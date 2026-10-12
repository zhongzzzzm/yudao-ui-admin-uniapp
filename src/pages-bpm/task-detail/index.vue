<script lang="ts" setup>
import type { BpmDetail, BpmDetailOpLog } from '@/api/bpm/task'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'

import {
  approveBpmTask,
  getBpmTaskDetail,
  rejectBpmTask,
  remindBpmInstance,
  returnBpmTask,
} from '@/api/bpm/task'
import { formatDateTime } from '@/utils/date'

defineOptions({ name: 'BpmTaskDetail' })

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const loading = ref(false)
const detail = ref<BpmDetail>()
/** 入参 taskId：审批动作需要；instanceId：已办/我的申请/抄送回看入口 */
const taskId = ref<number>()
const instanceId = ref<number>()

const STATUS_LABEL: Record<number, string> = {
  1: '审批中',
  2: '已办结',
  3: '已驳回',
  4: '已作废',
}

/** 操作类型文案（与 PC 详情页口径一致） */
const OP_LABEL: Record<number, string> = {
  1: '提交',
  2: '通过',
  3: '驳回',
  4: '撤回',
  5: '作废',
  6: '办结撤销',
  7: '字段修改',
  8: '重新提交',
  9: '催办',
  10: '转办',
  11: '加签',
  12: '办理提交',
  14: '退回',
  15: '兜底转交',
}

const timeline = computed(() => {
  const logs: BpmDetailOpLog[] = detail.value?.opLogs ?? []
  return [...logs].reverse()
})

/** 步骤条高亮：进行中=当前节点下标；驳回标最后节点红 */
const currentStepIndex = computed(() => {
  const nodes = detail.value?.nodes ?? []
  const key = detail.value?.currentNodeKey
  if (!key)
    return nodes.length
  return nodes.findIndex(node => node.nodeKey === key)
})

// ========== 审批动作 ==========

const comment = ref('')
const acting = ref(false)

/** 驳回/退回弹窗：restart 重走 / resume 不重走 / node 退回已通过节点 */
const rejectOpen = ref(false)
const rejectMode = ref<'node' | 'restart' | 'resume'>('restart')
const rejectTarget = ref<string>()

/** 本轮已通过的节点（退回目标候选，去重） */
const passedNodes = computed(() => {
  const list = (detail.value?.tasks ?? [])
    .filter(t => t.status === 1 && t.round === detail.value?.round && t.nodeKey !== detail.value?.currentNodeKey)
    .map(t => ({ label: t.nodeName, value: t.nodeKey }))
  const seen = new Set<string>()
  return list.filter(item => !seen.has(item.value) && seen.add(item.value))
})

function openReject() {
  if (!comment.value.trim()) {
    toast.show('驳回意见必填')
    return
  }
  rejectMode.value = 'restart'
  rejectTarget.value = passedNodes.value.at(-1)?.value
  rejectOpen.value = true
}

async function load() {
  if (!taskId.value && !instanceId.value)
    return
  loading.value = true
  try {
    detail.value = await getBpmTaskDetail({
      instanceId: instanceId.value || undefined,
      taskId: taskId.value || undefined,
    })
  } finally {
    loading.value = false
  }
}

async function onApprove() {
  if (!taskId.value)
    return
  acting.value = true
  try {
    await approveBpmTask(taskId.value, comment.value.trim() || undefined)
    toast.success('已通过')
    comment.value = ''
    await load()
  } catch {
    toast.show('操作失败，请刷新重试')
  } finally {
    acting.value = false
  }
}

/** 发起人催办（24 小时限频，后端校验） */
function onRemind() {
  if (!instanceId.value && !taskId.value)
    return
  const target = instanceId.value ?? detail.value?.id
  if (!target)
    return
  dialog.confirm({
    title: '确认催办',
    msg: '将给当前节点处理人发送催办提醒，确定催办？',
  }).then(async () => {
    acting.value = true
    try {
      await remindBpmInstance(target)
      toast.success('已催办')
    } catch {
      toast.show('催办失败，请稍后重试')
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

async function onRejectConfirm() {
  if (!taskId.value)
    return
  if (rejectMode.value === 'node' && !rejectTarget.value) {
    toast.show('请选择退回目标节点')
    return
  }
  acting.value = true
  try {
    if (rejectMode.value === 'node') {
      await returnBpmTask(taskId.value, comment.value.trim(), rejectTarget.value!)
      toast.show('已退回目标节点')
    } else {
      await rejectBpmTask(taskId.value, comment.value.trim(), rejectMode.value)
      toast.success('已驳回')
    }
    comment.value = ''
    rejectOpen.value = false
    await load()
  } catch {
    toast.show('操作失败，请刷新重试')
  } finally {
    acting.value = false
  }
}

onLoad((query) => {
  if (query?.taskId) {
    taskId.value = Number(query.taskId)
  }
  if (query?.instanceId) {
    instanceId.value = Number(query.instanceId)
  }
  if (taskId.value || instanceId.value) {
    load()
  }
})

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="yd-page-container yd-page-container-paging flex flex-col">
    <wd-navbar

      title="审批详情"
      placeholder safe-area-inset-top left-arrow fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx" :class="{ 'opacity-60 pointer-events-none': loading }">
        <!-- 头部：标题 + 状态 + 元信息 -->
        <view class="rounded-2xl bg-white p-24rpx">
          <view class="flex items-center gap-16rpx">
            <text class="min-w-0 flex-1 text-32rpx font-500">{{ detail?.businessTitle ?? '加载中…' }}</text>
            <text
              class="flex-shrink-0 rounded-full px-16rpx py-4rpx text-22rpx"
              :class="detail?.status === 2 ? 'bg-green-50 text-green-600' : detail?.status === 3 ? 'bg-orange-50 text-orange-600' : detail?.status === 4 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'"
            >
              {{ STATUS_LABEL[detail?.status as number] ?? '-' }}<template v-if="detail?.withdrawn">·主动撤回</template>
            </text>
          </view>
          <view class="mt-12rpx text-24rpx text-gray-400">
            第 {{ detail?.round ?? '-' }} 轮 · 当前节点：{{ detail?.currentNodeName ?? '已结束' }}
          </view>
          <view class="mt-4rpx text-24rpx text-gray-400">
            发起时间：{{ detail?.createTime ? formatDateTime(detail.createTime) : '-' }}
          </view>
          <!-- 节点步骤条 -->
          <view v-if="(detail?.nodes?.length ?? 0) > 0" class="mt-20rpx flex items-center">
            <template v-for="(node, idx) in detail?.nodes" :key="node.nodeKey">
              <view v-if="idx > 0" class="mx-8rpx h-2rpx flex-1 bg-gray-200" />
              <view class="flex items-center gap-8rpx">
                <view
                  class="h-36rpx w-36rpx flex items-center justify-center rounded-full text-20rpx"
                  :class="idx < currentStepIndex ? 'bg-[#018d71] text-white' : idx === currentStepIndex && detail?.status === 1 ? 'bg-[#018d71] text-white' : 'bg-gray-100 text-gray-400'"
                >
                  {{ idx + 1 }}
                </view>
                <text class="text-22rpx" :class="idx <= currentStepIndex ? 'text-gray-700' : 'text-gray-400'">
                  {{ node.nodeName }}
                </text>
              </view>
            </template>
          </view>
          <!-- 办理任务引导：办理动作在各业务页提交 -->
          <view
            v-if="detail?.canHandle"
            class="mt-16rpx rounded-xl bg-orange-50 px-20rpx py-16rpx text-24rpx text-orange-600"
          >
            该任务为办理任务，请前往对应业务页完成执行后提交办理
          </view>
          <!-- 恢复点提示 -->
          <view
            v-if="detail?.status === 3 && detail?.resumeNodeKey"
            class="mt-16rpx rounded-xl bg-amber-50 px-20rpx py-16rpx text-22rpx text-amber-700"
          >
            修改后重新提交，将直接回到【{{ detail.resumeNodeKey }}】继续，已通过节点不重走
          </view>
        </view>

        <!-- 审批记录时间线 -->
        <view class="mt-24rpx rounded-2xl bg-white p-24rpx">
          <view class="mb-16rpx text-28rpx font-500">
            审批记录
          </view>
          <view v-if="timeline.length > 0">
            <view
              v-for="log in timeline"
              :key="log.id"
              class="relative border-l-2rpx border-gray-100 pb-24rpx pl-24rpx last:pb-0"
            >
              <view class="absolute left--6rpx top-8rpx h-12rpx w-12rpx rounded-full bg-gray-300" />
              <view class="flex items-center gap-12rpx">
                <text class="rounded bg-gray-100 px-8rpx text-20rpx text-gray-500">
                  {{ OP_LABEL[log.opType] ?? '操作' }}
                </text>
                <text class="text-24rpx text-gray-600">第 {{ log.round }} 轮 · 用户 {{ log.operatorUserId }}</text>
              </view>
              <view v-if="log.detail" class="mt-4rpx text-22rpx text-gray-500">
                {{ log.detail }}
              </view>
              <view class="mt-4rpx text-20rpx text-gray-300">
                {{ log.createTime ? formatDateTime(log.createTime) : '' }}
              </view>
            </view>
          </view>
          <view v-else class="py-24rpx text-center text-24rpx text-gray-400">
            暂无审批记录
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 发起人催办（回看自己发起的进行中实例时可见，24 小时限频） -->
    <view
      v-if="detail?.canRemind"
      class="border-t border-gray-100 bg-white px-24rpx py-16rpx pb-[env(safe-area-inset-bottom)]"
    >
      <wd-button :disabled="acting" plain block type="primary" @click="onRemind">
        催办
      </wd-button>
    </view>

    <!-- 审批操作区（仅审批节点待办处理人可见） -->
    <view
      v-if="detail?.canApprove"
      class="border-t border-gray-100 bg-white px-24rpx py-16rpx pb-[env(safe-area-inset-bottom)]"
    >
      <wd-textarea
        v-model="comment"
        :maxlength="500"
        clearable
        no-border
        placeholder="审批意见（通过选填、驳回必填）"
        custom-class="bg-gray-50 rounded-xl"
      />
      <view class="mt-12rpx flex gap-16rpx">
        <wd-button :disabled="acting" plain block type="error" @click="openReject">
          驳回 / 退回
        </wd-button>
        <wd-button :disabled="acting" block type="primary" @click="onApprove">
          通过
        </wd-button>
      </view>
    </view>

    <!-- 驳回 / 退回方式选择弹层 -->
    <wd-popup v-model="rejectOpen" closable custom-class="rounded-t-24rpx" position="bottom" safe-area-inset-bottom>
      <view class="p-24rpx pb-48rpx">
        <view class="mb-16rpx text-30rpx font-500">
          选择驳回方式
        </view>
        <view class="flex flex-col gap-16rpx">
          <view
            class="rounded-xl px-20rpx py-16rpx"
            :class="rejectMode === 'restart' ? 'bg-[#018d71]/10' : 'bg-gray-50'"
            @click="rejectMode = 'restart'"
          >
            <view class="text-26rpx font-500">
              驳回给制单人 · 重走流程
            </view>
            <view class="mt-4rpx text-22rpx text-gray-400">
              制单人修改后重新提交，全部节点重新审批
            </view>
          </view>
          <view
            class="rounded-xl px-20rpx py-16rpx"
            :class="rejectMode === 'resume' ? 'bg-[#018d71]/10' : 'bg-gray-50'"
            @click="rejectMode = 'resume'"
          >
            <view class="text-26rpx font-500">
              退回给制单人 · 不重走流程
            </view>
            <view class="mt-4rpx text-22rpx text-gray-400">
              修改后重新提交，直接回到本节点继续
            </view>
          </view>
          <view
            v-if="passedNodes.length > 0"
            class="rounded-xl px-20rpx py-16rpx"
            :class="rejectMode === 'node' ? 'bg-[#018d71]/10' : 'bg-gray-50'"
            @click="rejectMode = 'node'"
          >
            <view class="text-26rpx font-500">
              退回给已通过的节点
            </view>
            <view class="mt-4rpx text-22rpx text-gray-400">
              目标节点重新处理后，自其后续节点继续流转
            </view>
            <view v-if="rejectMode === 'node'" class="mt-8rpx">
              <wd-picker
                v-model="rejectTarget"
                :columns="passedNodes.map(n => ({ label: n.label, value: n.value }))"
                label="目标节点"
              />
            </view>
          </view>
        </view>
        <wd-button
          :disabled="acting"
          block
          class="mt-24rpx"
          type="primary"
          @click="onRejectConfirm"
        >
          确认驳回
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>
