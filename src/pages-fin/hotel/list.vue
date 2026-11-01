<template>
  <FileTaskList node-type="bx_hotel" />
</template>

<script lang="ts" setup>
import FileTaskList from '../components/file-task-list.vue'

defineOptions({
  name: 'FinBxHotelList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
