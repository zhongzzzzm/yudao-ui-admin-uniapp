<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="校验结果" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 结果筛选 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in resultChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentPassed === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleFilterChange(chip.value)"
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
      empty-view-text="暂无校验结果"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.ruleCode || '校验规则' }}
            </view>
            <wd-tag :type="item.passed ? 'success' : 'error'" plain class="ml-16rpx flex-shrink-0">
              {{ item.passed ? '通过' : '未通过' }}
            </wd-tag>
          </view>
          <view class="line-clamp-2 text-26rpx text-[#777]">
            {{ item.ruleDescription || '-' }}
          </view>
          <view v-if="!item.passed" class="mt-8rpx text-24rpx text-[#f5222d]">
            错误 {{ item.errorCount ?? 0 }} 条 · 点击查看明细
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 结果明细弹层 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          错误明细
        </view>
        <view v-if="detailLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="details.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无错误明细
        </view>
        <view v-else class="space-y-16rpx">
          <view v-for="detail in details" :key="detail.id" class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="text-26rpx text-[#333]">
              {{ detail.description || '数据异常' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ detail.reportName || '-' }} · 行号 {{ detail.rowIndex ?? '-' }}
            </view>
          </view>
        </view>
        <view v-if="detailHasMore" class="py-16rpx text-center text-24rpx text-[#999]" @click="loadMoreDetails">
          加载更多
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportResultDetailVO, ReportResultVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getReportResultDetailPage, getReportResultPage } from '@/api/validation/task'

defineOptions({
  name: 'ValidationTaskDetail',
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

const taskId = ref<number>()
const resultChips = [
  { label: '未通过', value: 0 },
  { label: '已通过', value: 1 },
  { label: '全部', value: -1 },
]
const currentPassed = ref(0)
const list = ref<ReportResultVO[]>([])
const pagingRef = ref<any>()

function handleFilterChange(value: number) {
  if (currentPassed.value === value) {
    return
  }
  currentPassed.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportResultPage({
      pageNo,
      pageSize,
      taskId: taskId.value,
      passed: currentPassed.value === -1 ? undefined : currentPassed.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 明细弹层（分页加载） */
const showDetail = ref(false)
const detailLoading = ref(false)
const details = ref<ReportResultDetailVO[]>([])
const detailHasMore = ref(false)
const detailPageNo = ref(1)
const activeResultId = ref<number>()

function openDetail(item: ReportResultVO) {
  if (item.passed) {
    return
  }
  activeResultId.value = item.id
  showDetail.value = true
  details.value = []
  detailPageNo.value = 1
  loadDetails()
}

async function loadDetails() {
  if (!activeResultId.value) {
    return
  }
  detailLoading.value = details.value.length === 0
  try {
    const data = await getReportResultDetailPage({
      pageNo: detailPageNo.value,
      pageSize: 20,
      resultId: activeResultId.value,
    })
    details.value = [...details.value, ...data.list]
    detailHasMore.value = details.value.length < (data.total ?? 0)
    detailPageNo.value += 1
  } catch {
    details.value = []
    detailHasMore.value = false
  } finally {
    detailLoading.value = false
  }
}

function loadMoreDetails() {
  loadDetails()
}

onLoad((query) => {
  taskId.value = Number(query?.id)
})
</script>
