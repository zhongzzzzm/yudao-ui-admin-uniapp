<template>
  <CompareList
    title="住宿单拆分"
    :fetch-page="getBxHotelPage"
    :source-labels="[
      { key: 'hotel', label: '住宿单' },
      { key: 'ledger', label: '出差台账' },
    ]"
    download-permission="fin:bx-hotel:downloadResult"
  />
</template>

<script lang="ts" setup>
import CompareList from '../components/compare-list.vue'
import { getBxHotelPage } from '@/api/fin/bxHotel'

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
