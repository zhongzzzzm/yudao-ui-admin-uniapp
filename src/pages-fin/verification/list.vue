<template>
  <FileTaskList node-type="invoice_verification" />
</template>

<script lang="ts" setup>
import FileTaskList from '../components/file-task-list.vue'

defineOptions({
  name: 'FinInvoiceVerificationList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
