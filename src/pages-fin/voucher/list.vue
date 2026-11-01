<template>
  <FileTaskList node-type="invoice_voucher" />
</template>

<script lang="ts" setup>
import FileTaskList from '../components/file-task-list.vue'

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
