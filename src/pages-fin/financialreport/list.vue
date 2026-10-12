<template>
  <CompareList
    title="财务快报"
    :fetch-page="getFinancialReportPage"
    :source-labels="[
      { key: 'currentPeriodFile', label: '当期报表包' },
      { key: 'lastYearPeriodFile', label: '上年同期包' },
    ]"
    download-permission="fin:financial-report:query"
  />
</template>

<script lang="ts" setup>
import CompareList from '../components/compare-list.vue'
import { getFinancialReportPage } from '@/api/fin/financialReport'

defineOptions({
  name: 'FinFinancialReportList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
