<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="全部待办" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索单据标题"
        hide-cancel
        @search="handleSearch"
        @clear="handleSearch"
      />
    </view>

    <!-- 筛选条：处理人（超管可看所有人的待办） -->
    <view class="flex items-center gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <UserSearchPicker v-model="assigneeUserId" label="处理人" @update:model-value="handleSearch" />
      <view class="flex flex-shrink-0 gap-16rpx">
        <view
          v-for="chip in nodeTypeChips"
          :key="chip.value"
          class="rounded-full px-24rpx py-8rpx text-24rpx"
          :class="nodeType === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
          @click="handleNodeTypeChange(chip.value)"
        >
          {{ chip.label }}
        </view>
      </view>
    </view>

    <!-- 全部待办列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无待办任务"
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
              {{ item.businessTitle || '审批单' }}
            </view>
            <wd-tag plain class="ml-16rpx flex-shrink-0" :type="item.nodeType === 2 ? 'info' : 'primary'">
              {{ item.nodeType === 2 ? '办理' : '审批' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              处理人：{{ userName(item) }}
            </view>
            <view class="line-clamp-1">
              当前节点：{{ item.nodeName ?? '-' }} · 第 {{ item.round ?? 1 }} 轮
            </view>
            <view class="line-clamp-1">
              到达时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { BpmTask } from '@/api/bpm/task'
import { ref } from 'vue'
import { getAllBpmTodoPage } from '@/api/bpm/task'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'BpmAllTodo',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<BpmTask[]>([])
const pagingRef = ref<any>()
const keyword = ref('')
/** 处理人筛选（空 = 全部处理人，仅超管/拥有 bpm:task:query-all 权限可查全部） */
const assigneeUserId = ref<number>()
/** 节点类型筛选：0 全部 1 审批 2 办理 */
const nodeType = ref(0)
const nodeTypeChips = [
  { label: '全部', value: 0 },
  { label: '审批', value: 1 },
  { label: '办理', value: 2 },
]

// 无全部待办权限时的提示（菜单入口已按权限隐藏，这里兜底）
// 权限标识：bpm:task:query-all

/** 查询全部待办分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAllBpmTodoPage({
      assigneeUserId: assigneeUserId.value,
      businessTitle: keyword.value.trim() || undefined,
      nodeType: nodeType.value || undefined,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 切换节点类型筛选 */
function handleNodeTypeChange(value: number) {
  if (nodeType.value === value) {
    return
  }
  nodeType.value = value
  pagingRef.value?.reload()
}

/** 触发搜索（关键字/处理人变化时） */
function handleSearch() {
  pagingRef.value?.reload()
}

/** 处理人昵称（后端直接返回 assigneeNickname） */
function userName(item: BpmTask): string {
  return item.assigneeNickname || (item.assigneeUserId != null ? `用户 ${item.assigneeUserId}` : '-')
}

/** 进入审批详情（仅查看口径，详情页按 canApprove 判定动作） */
function goDetail(item: BpmTask) {
  uni.navigateTo({ url: `/pages-bpm/task-detail/index?taskId=${item.id}` })
}

function handleBack() {
  navigateBackPlus()
}
</script>
