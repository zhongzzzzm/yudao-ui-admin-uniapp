<template>
  <FileTaskList node-type="invoice_ledger" />
</template>

<script lang="ts" setup>
import FileTaskList from '../components/file-task-list.vue'

defineOptions({
  name: 'FinInvoiceLedgerList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
