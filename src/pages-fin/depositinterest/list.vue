<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="存款结息" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 测算批次列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无结息测算数据"
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
              {{ item.accountName || item.accountCode || item.description || `结息测算 #${item.id}` }}
            </view>
            <wd-tag :type="item.calcMode === 2 ? 'primary' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ item.calcMode === 2 ? '期间试算' : '结息核对' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view v-if="item.period" class="line-clamp-1">
              账期：{{ item.period }}
            </view>
            <view class="line-clamp-1">
              计算利息：<text class="text-[#018d71] font-500">{{ formatMoney(item.totalInterest) }}</text>
              · 计息 {{ item.totalDays ?? 0 }} 天
            </view>
            <view v-if="item.fileName" class="line-clamp-1">
              明细账：{{ item.fileName }}
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
import type { DepositInterestVO } from '@/api/fin/depositInterest'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { ref } from 'vue'
import { getDepositInterestPage } from '@/api/fin/depositInterest'

defineOptions({
  name: 'FinDepositInterestList',
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

const list = ref<DepositInterestVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDepositInterestPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: DepositInterestVO) {
  uni.navigateTo({ url: `/pages-fin/depositinterest/detail?id=${item.id}` })
}
</script>
