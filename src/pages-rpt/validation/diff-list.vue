<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据对比" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

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
  </view>
</template>

<script lang="ts" setup>
import type { DiffTaskVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getDiffTaskPage } from '@/api/validation/task'
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
</script>
