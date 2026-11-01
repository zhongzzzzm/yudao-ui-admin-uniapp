<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="报表模板" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无报表模板"
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
              {{ item.name || `模板 #${item.id}` }}
            </view>
            <wd-tag :type="item.currentVersionNo ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ item.currentVersionNo ? `生效 V${item.currentVersionNo}` : '未发布' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              编码：{{ item.reportCode || '-' }}
            </view>
            <view v-if="item.description" class="line-clamp-2">
              {{ item.description }}
            </view>
          </view>
          <view class="mt-12rpx border-t border-t-[#f7f8f9] pt-12rpx text-right text-24rpx text-[#018d71]">
            版本管理 ›
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TaxReportTemplateVO } from '@/api/rpt/template'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { getTaxReportTemplatePage } from '@/api/rpt/template'

defineOptions({
  name: 'RptTemplateList',
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

const list = ref<TaxReportTemplateVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTaxReportTemplatePage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 进入模板版本列表（版本查看与差异对比） */
function goVersion(item: TaxReportTemplateVO) {
  uni.navigateTo({ url: `/pages-rpt/template/version?templateId=${item.id}&templateName=${encodeURIComponent(item.name || '')}` })
}
</script>
