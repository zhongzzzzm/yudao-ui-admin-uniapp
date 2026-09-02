<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="公司定义" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 搜索：按公司名称 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search v-model="companyName" placeholder="搜索公司名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无公司定义"
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
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.companyName || '-' }}
            </view>
            <wd-tag
              v-if="item.investStatus != null"
              :type="item.investStatus ? 'success' : 'info'"
              plain
              class="ml-16rpx flex-shrink-0"
            >
              {{ getDictLabel(DICT_TYPE.TAX_LOAN_STATUS, item.investStatus) || '-' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              公司代码：{{ item.companyCode || '-' }}
            </view>
            <view class="line-clamp-1">
              增值税频率：{{ getDictLabel(DICT_TYPE.TAX_FREQ, item.vatFrequency) || '-' }} · 办税人员：{{ item.taxPerson || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TaxCompanyVO } from '@/api/tax/company'
import { navigateBackPlus } from '@/utils'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { ref } from 'vue'
import { getTaxCompanyPage } from '@/api/tax/company'

defineOptions({
  name: 'TaxCompanyList',
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

const companyName = ref('')
const list = ref<TaxCompanyVO[]>([])
const pagingRef = ref<any>()

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTaxCompanyPage({
      pageNo,
      pageSize,
      companyName: companyName.value.trim() || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goDetail(item: TaxCompanyVO) {
  uni.navigateTo({ url: `/pages-tax/company/detail?id=${item.id}` })
}
</script>
