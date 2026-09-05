<template>
  <CompareList
    title="发票凭证关联"
    :fetch-page="getInvoiceVoucherPage"
    :source-labels="[
      { key: 'invoice', label: '发票台账' },
      { key: 'voucher', label: '凭证' },
    ]"
    download-permission="fin:invoice-voucher:downloadResult"
  />
</template>

<script lang="ts" setup>
import CompareList from '../components/compare-list.vue'
import { getInvoiceVoucherPage } from '@/api/fin/invoiceVoucher'

defineOptions({
  name: 'FinInvoiceVoucherList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
