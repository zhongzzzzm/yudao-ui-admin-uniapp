<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="重报登记" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无重报登记"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="text-28rpx text-[#333] font-500">
              数据日期 {{ item.reportDate || '-' }}
            </view>
            <wd-tag v-if="item.status != null" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              重报批次号：{{ item.batchNumber || '-' }}
            </view>
            <view class="line-clamp-2">
              {{ item.description || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ReportResubmitVO } from '@/api/validation/reportData'
import { navigateBackPlus } from '@/utils'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { ref } from 'vue'
import { getReportResubmitPage } from '@/api/validation/reportData'

defineOptions({
  name: 'ValidationResubmitList',
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

const list = ref<ReportResubmitVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportResubmitPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status?: number): string {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.VALIDATION_DATA_STATUS, status) || '未知'
}
</script>
