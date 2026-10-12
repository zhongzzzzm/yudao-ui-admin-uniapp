<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="我的已办" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 已办列表（接口无状态筛选参数，App 侧按时间倒序全量回看） -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无已办任务"
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
            <wd-tag :type="taskTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ taskLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              节点：{{ item.nodeName || '-' }} · 第 {{ item.round ?? 1 }} 轮
            </view>
            <view class="line-clamp-1">
              处理时间：{{ item.handleTime ? formatDateTime(item.handleTime) : '-' }}
            </view>
            <view v-if="item.comment" class="line-clamp-2">
              意见：{{ item.comment }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { BpmTask } from '@/api/bpm/task'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'
import { getBpmDonePage } from '@/api/bpm/task'

defineOptions({
  name: 'BpmDoneList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

function handleBack() {
  navigateBackPlus()
}

const list = ref<BpmTask[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getBpmDonePage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function taskLabel(status?: number): string {
  return { 1: '已通过', 2: '已驳回', 3: '已失效' }[status ?? 0] ?? '已处理'
}

function taskTagType(status?: number): 'success' | 'error' | 'info' {
  if (status === 1) {
    return 'success'
  }
  return status === 2 ? 'error' : 'info'
}

/** 回看审批详情（按实例回看，无审批动作） */
function goDetail(item: BpmTask) {
  uni.navigateTo({ url: `/pages-bpm/task-detail/index?instanceId=${item.instanceId}` })
}
</script>
