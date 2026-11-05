<template>
  <FileTaskList node-type="invoice_entry" />
</template>

<script lang="ts" setup>
import FileTaskList from '../components/file-task-list.vue'

defineOptions({
  name: 'FinInvoiceEntryList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
