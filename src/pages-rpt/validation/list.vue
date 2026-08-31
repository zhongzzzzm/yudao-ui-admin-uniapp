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
  </view>
</template>

<script lang="ts" setup>
import type { ReportTaskVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getReportTaskPage } from '@/api/validation/task'
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

const statusChips = [
  { label: '全部', value: -1 },
  { label: '完成', value: 2 },
  { label: '失败', value: 3 },
  { label: '执行中', value: 1 },
  { label: '未执行', value: 0 },
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
</script>
