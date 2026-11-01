<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="指标值查询" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 计算状态筛选条 -->
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

    <!-- 指标值列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无指标值"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goTrace(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.indicatorName || item.indicatorCode || `指标 #${item.indicatorId}` }}
            </view>
            <wd-tag :type="item.status === 1 ? 'error' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ item.status === 1 ? '失败' : '成功' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              指标值：<text class="text-[#018d71] font-500">{{ item.value ?? '-' }}</text>
            </view>
            <view class="line-clamp-1">
              编码：{{ item.indicatorCode || '-' }}{{ item.memberName ? ` · 成员：${item.memberName}` : '' }}
            </view>
            <view class="line-clamp-1">
              版本：{{ item.batchDate || '-' }} · 规则 R{{ item.ruleVersionNo ?? '-' }}{{ item.ruleVersionInferred ? '（现行推断）' : '' }}
            </view>
            <view v-if="item.errorMsg" class="line-clamp-2 text-[#f5222d]">
              {{ item.errorMsg }}
            </view>
            <view class="line-clamp-1">
              计算时间：{{ item.computeTime ? formatDateTime(item.computeTime) : '-' }}
            </view>
          </view>
          <view class="mt-12rpx border-t border-t-[#f7f8f9] pt-12rpx text-right text-24rpx text-[#018d71]">
            溯源 ›
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { DataIndicatorValueVO } from '@/api/rpt/dataIndicatorValue'
import { navigateBackPlus } from '@/utils'
import { getDataIndicatorValuePage } from '@/api/rpt/dataIndicatorValue'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'

defineOptions({
  name: 'RptIndicatorValueList',
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

const statusChips = [
  { label: '全部', value: -1 },
  { label: '成功', value: 0 },
  { label: '失败', value: 1 },
]
const currentStatus = ref(-1)
const list = ref<DataIndicatorValueVO[]>([])
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
    const data = await getDataIndicatorValuePage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// ========== 溯源页跳转 ==========

/** 进入指标值溯源页（取数链路 / 来源明细 / 底稿原文预览 / 单指标重算） */
function goTrace(item: DataIndicatorValueVO) {
  uni.navigateTo({ url: `/pages-rpt/indicator-value/trace?id=${item.id}` })
}
</script>
