<template>
  <CompareList
    title="进项票抵扣"
    :fetch-page="getInvoiceVerificationPage"
    :source-labels="[
      { key: 'system', label: '业务导出' },
      { key: 'finance', label: '财务导出' },
      { key: 'tax', label: '税局导出' },
    ]"
    download-permission="fin:invoice-verification:downloadResult"
  />
</template>

<script lang="ts" setup>
import CompareList from '../components/compare-list.vue'
import { getInvoiceVerificationPage } from '@/api/fin/invoiceVerification'

defineOptions({
  name: 'FinInvoiceVerificationList',
})
</script>
