<template>
  <view>
    <view v-if="loading" class="flex justify-center py-60rpx">
      <wd-loading color="#018d71" />
    </view>

    <view v-else-if="items.length === 0" class="py-60rpx text-center text-26rpx text-[#999]">
      尚未发起复核流程
    </view>

    <view v-else>
      <view
        v-for="(item, index) in items"
        :key="index"
        class="mb-24rpx last:mb-0"
      >
        <!-- 分组头：单据名 + 实例状态 -->
        <view class="mb-12rpx flex flex-wrap items-center gap-12rpx">
          <text class="text-28rpx text-[#333] font-500">{{ item.label || '审批流程' }}</text>
          <template v-if="item.detail">
            <wd-tag :type="instanceTagType(item.detail.status)" plain size="small">
              {{ getDictLabel(DICT_TYPE.BPM_INSTANCE_STATUS, item.detail.status) || '未知' }}
            </wd-tag>
            <text class="text-22rpx text-[#999]">
              当前节点：{{ item.detail.currentNodeName || '-' }}
            </text>
          </template>
          <text v-else class="text-22rpx text-[#bbb]">未产生审批实例</text>
        </view>

        <!-- 任务时间线 -->
        <view v-if="item.detail && sortedTasks(item.detail).length > 0">
          <view
            v-for="task in sortedTasks(item.detail)"
            :key="task.id"
            class="mb-16rpx rounded-12rpx bg-[#f7f8f9] p-20rpx last:mb-0"
          >
            <view class="flex items-center justify-between">
              <text class="text-26rpx text-[#333]">
                第{{ task.round }}轮 · {{ task.nodeName || '-' }}
              </text>
              <wd-tag :type="taskTagType(task.status)" plain size="small">
                {{ getDictLabel(DICT_TYPE.BPM_TASK_STATUS, task.status) || '未知' }}
              </wd-tag>
            </view>
            <view class="mt-8rpx text-24rpx text-[#777]">
              审批人：{{ nameOf(task.assigneeUserId) }}
              <text v-if="task.handleTime"> · {{ formatDateTime(task.handleTime) }}</text>
            </view>
            <view v-if="task.comment" class="mt-8rpx text-24rpx text-[#777]">
              意见：{{ task.comment }}
            </view>
          </view>
        </view>
        <view
          v-else-if="item.detail"
          class="border border-[#e5e6eb] rounded-12rpx border-dashed py-24rpx text-center text-24rpx text-[#bbb]"
        >
          暂无审批任务（流程尚未到达任何审批节点）
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { BpmInstanceDetailVO } from '@/api/bpm/flow'
import { onMounted, ref } from 'vue'
import { getSimpleUserList } from '@/api/system/user'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

defineOptions({ name: 'FgBpmFlow' })

const props = defineProps<{
  items: FgBpmFlowItem[]
  loading?: boolean
}>()

/** 一条流程展示项：label 为单据分组名（如部门），detail 为空表示尚未发起 */
export interface FgBpmFlowItem {
  label?: string
  detail?: BpmInstanceDetailVO | null
}

/** 审批人昵称映射（一次拉取全量用户，与 PC 端查看流程弹框同法） */
const userNameMap = ref<Record<number, string>>({})
const userLoaded = ref(false)

onMounted(async () => {
  if (userLoaded.value) {
    return
  }
  userLoaded.value = true
  try {
    const users = await getSimpleUserList()
    users.forEach((u) => {
      if (u.id != null) {
        userNameMap.value[u.id as number] = u.nickname ?? String(u.id)
      }
    })
  } catch {
    // 拉不到用户列表时展示用户ID兜底，不阻塞流程展示
  }
})

/** 任务按轮次、生成时间、id 排序（与 PC 端一致） */
function sortedTasks(detail: BpmInstanceDetailVO) {
  return (detail.tasks ?? [])
    .slice()
    .sort((a, b) =>
      a.round - b.round
      || (a.createTime ?? '').localeCompare(b.createTime ?? '')
      || a.id - b.id)
}

function nameOf(userId?: number) {
  return userId == null ? '-' : (userNameMap.value[userId] ?? String(userId))
}

/** 实例状态标签色：1审批中在途 2已办结完结 3已驳回/4已作废异常 */
function instanceTagType(status?: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'warning'
  }
  if (status === 4) {
    return 'danger'
  }
  return 'primary'
}

/** 任务状态标签色：0待审批在途 1已通过完结 2已驳回/3已失效异常 */
function taskTagType(status?: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 1) {
    return 'success'
  }
  if (status === 2) {
    return 'warning'
  }
  if (status === 3) {
    return 'danger'
  }
  return 'primary'
}
</script>
