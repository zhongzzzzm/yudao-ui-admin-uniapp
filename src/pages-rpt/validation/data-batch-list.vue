<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据版本" placeholder safe-area-inset-top fixed @click-left="handleBack"
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
      empty-view-text="暂无数据版本"
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
              {{ item.batchDate || '-' }}
            </view>
            <wd-tag v-if="item.status != null" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="line-clamp-2 text-26rpx text-[#777]">
            {{ item.description || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ReportDataBatchVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { ref } from 'vue'
import { getReportDataBatchPage } from '@/api/validation/task'

defineOptions({
  name: 'ValidationDataBatchList',
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

const list = ref<ReportDataBatchVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportDataBatchPage({ pageNo, pageSize })
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
