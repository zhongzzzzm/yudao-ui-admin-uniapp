<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="预收挂账" placeholder safe-area-inset-top fixed @click-left="handleBack"
    >
      <template #right>
        <view class="flex items-center text-26rpx text-[#018d71]" @click="goRules">
          识别规则
          <wd-icon name="arrow-right" size="24rpx" color="#018d71" />
        </view>
      </template>
    </wd-navbar>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无预收底稿台账"
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
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-500">
              {{ item.name || `预收底稿 #${item.id}` }}
            </view>
            <wd-tag type="primary" plain class="ml-16rpx flex-shrink-0">
              当期 {{ item.currentPeriod || '-' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              基准期：{{ item.basePeriod || '-' }} · 批次 {{ item.batchCount ?? 0 }} 期
            </view>
            <view class="line-clamp-1">
              在稿 {{ item.openItemCount ?? 0 }} 行 · 剩余
              <text class="text-[#018d71] font-500">{{ formatMoney(item.openAmount) }}</text>
            </view>
            <view class="line-clamp-1">
              创建时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
        <!-- 底部按钮占位 -->
        <view v-if="canCreate" class="h-140rpx" />
      </view>
    </z-paging>

    <!-- 初始化台账入口 -->
    <view
      v-if="canCreate"
      class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <wd-button class="flex-1" type="primary" @click="goCreate">
        初始化预收底稿台账
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PrematchBookVO } from '@/api/fin/prematch'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getPrematchBookPage } from '@/api/fin/prematch'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'FinPrematchBookList',
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

const { hasAccessByCodes } = useAccess()
/** 初始化台账权限（fin:prematch:create） */
const canCreate = computed(() => hasAccessByCodes(['fin:prematch:create']))

const list = ref<PrematchBookVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPrematchBookPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 台账列表刷新事件（表单页/详情页操作后发起） */
const BOOK_RELOAD_EVENT = 'fin:prematch:book:reload'
function reload() {
  pagingRef.value?.reload()
}
onMounted(() => uni.$on(BOOK_RELOAD_EVENT, reload))
onUnmounted(() => uni.$off(BOOK_RELOAD_EVENT, reload))

function goDetail(item: PrematchBookVO) {
  uni.navigateTo({ url: `/pages-fin/prematch/detail?id=${item.id}` })
}

function goCreate() {
  uni.navigateTo({ url: '/pages-fin/prematch/book-form' })
}

function goRules() {
  uni.navigateTo({ url: '/pages-fin/prematch/rule' })
}
</script>
