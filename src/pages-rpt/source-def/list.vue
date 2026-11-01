<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="底稿定义" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 定义列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无底稿定义"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goVersion(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.name || `定义 #${item.id}` }}
            </view>
            <wd-tag :type="item.currentDefVersionNo ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ item.currentDefVersionNo ? `布局 V${item.currentDefVersionNo}` : '未发布' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              编码：{{ item.code || '-' }}
            </view>
            <view v-if="item.remark" class="line-clamp-2">
              {{ item.remark }}
            </view>
          </view>
          <view class="mt-12rpx border-t border-t-[#f7f8f9] pt-12rpx text-right text-24rpx text-[#018d71]">
            布局版本 ›
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SourceFileDefVO } from '@/api/rpt/sourceFileDef'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getSourceFileDefPage } from '@/api/rpt/sourceFileDef'

defineOptions({
  name: 'RptSourceDefList',
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

const list = ref<SourceFileDefVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSourceFileDefPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 进入底稿布局版本列表（版本查看与表样对比） */
function goVersion(item: SourceFileDefVO) {
  uni.navigateTo({ url: `/pages-rpt/source-def/version?defId=${item.id}&defName=${encodeURIComponent(item.name || '')}` })
}
</script>
