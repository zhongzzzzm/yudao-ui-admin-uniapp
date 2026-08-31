<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="发票台账" placeholder safe-area-inset-top fixed @click-left="handleBack"
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
      empty-view-text="暂无发票台账数据"
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
              {{ item.description || '发票比对记录' }}
            </view>
            <wd-tag v-if="item.status != null" plain class="ml-16rpx flex-shrink-0">
              状态 {{ item.status }}
            </wd-tag>
          </view>
          <view class="line-clamp-1 text-26rpx text-[#777]">
            创建时间：{{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 详情弹层（台账数据为长文本，弹层内滚动查看） -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          {{ activeItem?.description || '台账详情' }}
        </view>
        <view v-for="section in detailSections" :key="section.label" class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            {{ section.label }}
          </view>
          <view class="max-h-400rpx overflow-auto whitespace-pre-wrap rounded-12rpx bg-[#f7f8f9] p-20rpx text-24rpx text-[#333]">
            {{ section.value || '-' }}
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { InvoiceLedgerVO } from '@/api/fin/invoiceLedger'
import { navigateBackPlus } from '@/utils'
import { computed, ref } from 'vue'
import { getInvoiceLedgerPage } from '@/api/fin/invoiceLedger'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'InvoiceLedgerList',
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

const list = ref<InvoiceLedgerVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getInvoiceLedgerPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 详情弹层 */
const showDetail = ref(false)
const activeItem = ref<InvoiceLedgerVO | null>(null)
const detailSections = computed(() => [
  { label: '发票台账', value: activeItem.value?.invoice },
  { label: '明细账', value: activeItem.value?.ledger },
  { label: '比对结果', value: activeItem.value?.result },
])

function openDetail(item: InvoiceLedgerVO) {
  activeItem.value = item
  showDetail.value = true
}
</script>
