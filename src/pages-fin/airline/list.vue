<template>
  <CompareList
    title="行程单拆分"
    :fetch-page="getBxAirlinePage"
    :source-labels="[
      { key: 'airline', label: '行程表' },
      { key: 'ledger', label: '出差台账' },
    ]"
    download-permission="fin:bx-airline:downloadResult"
  />
</template>

<script lang="ts" setup>
import CompareList from '../components/compare-list.vue'
import { getBxAirlinePage } from '@/api/fin/bxAirline'

defineOptions({
  name: 'FinBxAirlineList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
</script>
