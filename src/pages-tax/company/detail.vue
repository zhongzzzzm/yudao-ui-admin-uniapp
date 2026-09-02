<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="公司定义" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view v-if="loading" class="flex justify-center py-120rpx">
          <wd-loading color="#018d71" />
        </view>

        <view v-else-if="loadFailed" class="py-120rpx text-center">
          <view class="mb-16rpx text-26rpx text-[#999]">
            加载失败
          </view>
          <wd-button size="small" plain @click="load">
            重试
          </wd-button>
        </view>

        <template v-else-if="company">
          <!-- 头部：公司名 + 投放状态 -->
          <view class="mb-20rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-8rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-500">
                {{ company.companyName || '-' }}
              </view>
              <wd-tag
                v-if="company.investStatus != null"
                :type="company.investStatus ? 'success' : 'info'"
                plain
                class="ml-16rpx flex-shrink-0"
              >
                {{ getDictLabel(DICT_TYPE.TAX_LOAN_STATUS, company.investStatus) || '-' }}
              </wd-tag>
            </view>
            <view class="text-24rpx text-[#999]">
              公司代码：{{ company.companyCode || '-' }}
            </view>
          </view>

          <!-- 分组字段 -->
          <view
            v-for="group in groups"
            :key="group.title"
            class="mb-20rpx overflow-hidden rounded-16rpx bg-white shadow-sm"
          >
            <view class="border-b border-[#f2f2f2] px-24rpx py-16rpx text-26rpx text-[#333] font-500">
              {{ group.title }}
            </view>
            <view class="px-24rpx">
              <view
                v-for="field in group.fields"
                :key="field.label"
                class="flex border-b border-[#f7f7f7] py-16rpx last:border-b-0"
              >
                <view class="mr-16rpx w-240rpx flex-shrink-0 text-24rpx text-[#999]">
                  {{ field.label }}
                </view>
                <view class="flex-1 break-all text-right text-24rpx text-[#333]">
                  {{ field.value || '-' }}
                </view>
              </view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TaxCompanyVO } from '@/api/tax/company'
import { navigateBackPlus } from '@/utils'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { computed, ref } from 'vue'
import { getTaxCompany } from '@/api/tax/company'

defineOptions({
  name: 'TaxCompanyDetail',
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

const companyId = ref<number>()
const loading = ref(false)
const loadFailed = ref(false)
const company = ref<TaxCompanyVO>()

function freqLabel(value?: number) {
  return getDictLabel(DICT_TYPE.TAX_FREQ, value) || '-'
}

const groups = computed(() => {
  const c = company.value
  if (!c) {
    return []
  }
  return [
    {
      title: '基本信息',
      fields: [
        { label: '公司名称', value: c.companyName },
        { label: '公司代码', value: c.companyCode },
        { label: '成立日期', value: formatDate(c.establishDate) },
        { label: '注销日期', value: formatDate(c.deregDate) },
        { label: '小型微利企业', value: getDictLabel(DICT_TYPE.YES_NO, c.smallMicroProfitFlag) },
      ],
    },
    {
      title: '税务登记',
      fields: [
        { label: '税务登记时间', value: formatDate(c.taxRegDate) },
        { label: '一般纳税人生效日期', value: formatDate(c.vatGeneralStartDate) },
        { label: '增值税税率', value: getDictLabel(DICT_TYPE.TAX_VAT_RATE, c.vatRate) },
      ],
    },
    {
      title: '办税人员',
      fields: [
        { label: '财务负责人', value: c.financeHead },
        { label: '办税人员', value: c.taxPerson },
        { label: '复核人', value: c.reviewer },
      ],
    },
    {
      title: '各税种申报频率',
      fields: [
        { label: '增值税', value: freqLabel(c.vatFrequency) },
        { label: '个人所得税', value: freqLabel(c.pftFrequency) },
        { label: '企业所得税', value: freqLabel(c.citFrequency) },
        { label: '印花税-营业账簿', value: freqLabel(c.stampBusinessBooks) },
        { label: '印花税-借款合同', value: freqLabel(c.stampLoanContract) },
        { label: '印花税-融资租赁合同', value: freqLabel(c.stampFinanceLeaseContract) },
        { label: '印花税-买卖合同', value: freqLabel(c.stampSaleContract) },
      ],
    },
  ]
})

async function load() {
  loading.value = true
  loadFailed.value = false
  try {
    company.value = await getTaxCompany(companyId.value!)
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  companyId.value = Number(query?.id)
  load()
})
</script>
