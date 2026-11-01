<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="数据指标" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search v-model="keyword" placeholder="搜索指标编码 / 名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
    </view>

    <!-- 指标列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无数据指标"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goLineage(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.indicatorName || item.indicatorCode }}
            </view>
            <wd-tag :type="item.enabled ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ item.enabled ? '启用' : '停用' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              编码：{{ item.indicatorCode || '-' }}
            </view>
            <view class="line-clamp-1">
              取值方式：{{ VALUE_TYPE_LABELS[item.valueType ?? 0] || '-' }}{{ item.currentRuleVersionNo ? ` · 规则 V${item.currentRuleVersionNo}` : '' }}
            </view>
            <view v-if="valueSourceText(item)" class="line-clamp-1">
              取值来源：{{ valueSourceText(item) }}
            </view>
          </view>
          <view class="mt-12rpx border-t border-t-[#f7f8f9] pt-12rpx text-right text-24rpx text-[#018d71]">
            查看血缘 ›
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { DataIndicatorVO } from '@/api/rpt/dataIndicator'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { DATA_INDICATOR_VALUE_TYPE_LABELS, getDataIndicatorPage } from '@/api/rpt/dataIndicator'

defineOptions({
  name: 'RptIndicatorList',
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

/** 取值方式文案（含兜底） */
const VALUE_TYPE_LABELS: Record<number, string> = DATA_INDICATOR_VALUE_TYPE_LABELS

const keyword = ref('')
const list = ref<DataIndicatorVO[]>([])
const pagingRef = ref<any>()

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDataIndicatorPage({
      pageNo,
      pageSize,
      keyword: keyword.value.trim() || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 取值来源展示文本（单元格坐标 / 处理器 / 报表模板） */
function valueSourceText(item: DataIndicatorVO): string {
  if (item.sourceCell) {
    return `Sheet${(item.sourceSheet ?? 0) + 1}!${item.sourceCell}`
  }
  if (item.handlerCode) {
    return item.handlerCode
  }
  return ''
}

/** 进入指标血缘页（上下游链路查看） */
function goLineage(item: DataIndicatorVO) {
  uni.navigateTo({ url: `/pages-rpt/indicator/lineage?id=${item.id}&name=${encodeURIComponent(item.indicatorName || item.indicatorCode || '')}` })
}
</script>
