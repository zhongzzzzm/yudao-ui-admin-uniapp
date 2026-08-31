<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="复核工作台" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 状态切换 -->
    <wd-tabs v-model="reviewStatus" sticky @change="handleStatusChange">
      <wd-tab title="待复核" :name="0" />
      <wd-tab title="已复核" :name="1" />
    </wd-tabs>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无复核任务"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm"
          @click="goDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
                {{ item.templateName || '底稿复核' }}
              </view>
              <wd-tag
                :type="item.reviewStatus === 1 ? (item.reviewResult === 2 ? 'error' : 'success') : 'warning'"
                plain
                class="ml-16rpx flex-shrink-0"
              >
                {{ item.reviewStatus === 1 ? (item.reviewResult === 2 ? '复核有误' : '复核无误') : '待复核' }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#777] space-y-6rpx">
              <view class="line-clamp-1">
                负责部门：{{ item.deptName || '-' }}
              </view>
              <view class="line-clamp-1">
                底稿：{{ (item.draftNames || []).join('、') || '-' }}
              </view>
              <view v-if="item.reviewStatus === 1" class="line-clamp-1">
                复核人：{{ item.reviewerName || '-' }} · {{ formatDateTime(item.reviewTime) }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { FilingReviewVO } from '@/api/rpt/review'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getFilingReviewPage } from '@/api/rpt/review'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'ReviewList',
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

const reviewStatus = ref(0)
const list = ref<FilingReviewVO[]>([])
const pagingRef = ref<any>()

function handleStatusChange() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getFilingReviewPage({ pageNo, pageSize, reviewStatus: reviewStatus.value })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: FilingReviewVO) {
  uni.navigateTo({
    url: `/pages-rpt/review/detail?id=${item.id}&filingId=${item.filingId}&deptId=${item.deptId}`,
  })
}

/** 供复核详情页提交后返回时刷新列表 */
function refresh() {
  pagingRef.value?.reload()
}

defineExpose({ refresh })
</script>
