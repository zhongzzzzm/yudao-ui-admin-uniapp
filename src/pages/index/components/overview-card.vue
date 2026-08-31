<template>
  <view class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx">
    <view class="flex items-center justify-around from-[#018d71] to-[#02b58c] bg-gradient-to-r px-16rpx py-32rpx">
      <template v-for="(metric, idx) in visibleMetrics" :key="metric.key">
        <!-- 加载中：骨架 -->
        <view v-if="metric.loading" class="flex flex-1 flex-col items-center">
          <view class="h-44rpx w-72rpx rounded-8rpx bg-white/30" />
          <view class="mt-12rpx h-24rpx w-96rpx rounded-8rpx bg-white/20" />
        </view>
        <!-- 正常：数字可点 -->
        <view v-else class="flex flex-1 flex-col items-center" @click="metric.onTap()">
          <view class="text-40rpx text-white font-600">
            {{ metric.value ?? '—' }}
          </view>
          <view class="mt-8rpx text-24rpx text-white/80">
            {{ metric.label }}
          </view>
        </view>
        <!-- 分隔线 -->
        <view v-if="idx < visibleMetrics.length - 1" class="h-56rpx w-2rpx bg-white/25" />
      </template>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { getTaxReportFilingStats } from '@/api/rpt/filing'
import { getFilingReviewPage } from '@/api/rpt/review'
import { getReportTaskPage } from '@/api/validation/task'
import { getTaxLedgerPage } from '@/api/tax/ledger'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'OverviewCard',
})

const { hasAccessByCodes } = useAccess()

/** 加载状态与数值 */
const loading = ref(true)
const todoCount = ref<number>()
const filingCount = ref<number>()
const validationCount = ref<number>()

/** 有权限的指标才展示（无权限项自动隐藏，剩余均分宽度） */
const visibleMetrics = computed(() => {
  const metrics: {
    key: string
    label: string
    value?: number
    loading: boolean
    onTap: () => void
  }[] = []
  if (hasAccessByCodes(['tax:ledger:query', 'rpt:filing-review:submit'])) {
    metrics.push({
      key: 'todo',
      label: '今日待办',
      value: todoCount.value,
      loading: loading.value,
      onTap: () => uni.switchTab({ url: '/pages/todo/index' }),
    })
  }
  if (hasAccessByCodes(['rpt:tax-report-filing:query'])) {
    metrics.push({
      key: 'filing',
      label: '报送任务',
      value: filingCount.value,
      loading: loading.value,
      onTap: () => uni.navigateTo({ url: '/pages-rpt/filing/list' }),
    })
  }
  if (hasAccessByCodes(['validation:report-task:query'])) {
    metrics.push({
      key: 'validation',
      label: '校验异常',
      value: validationCount.value,
      loading: loading.value,
      onTap: () => uni.navigateTo({ url: '/pages-rpt/validation/list' }),
    })
  }
  return metrics
})

/** 拉取概览数据（任一失败该格显示「—」，不阻塞其他格） */
async function loadStats() {
  loading.value = true
  const jobs: Promise<void>[] = []
  if (hasAccessByCodes(['tax:ledger:query'])) {
    jobs.push(getTaxLedgerPage({ pageNo: 1, pageSize: 1, status: 0 }).then((res) => {
      todoCount.value = (todoCount.value ?? 0) + (res.total ?? 0)
    }).catch(() => {}))
  }
  if (hasAccessByCodes(['rpt:filing-review:submit'])) {
    jobs.push(getFilingReviewPage({ pageNo: 1, pageSize: 1, reviewStatus: 0 }).then((res) => {
      todoCount.value = (todoCount.value ?? 0) + (res.total ?? 0)
    }).catch(() => {}))
  }
  if (hasAccessByCodes(['rpt:tax-report-filing:query'])) {
    jobs.push(getTaxReportFilingStats().then((stats) => {
      filingCount.value = stats.total
    }).catch(() => {}))
  }
  if (hasAccessByCodes(['validation:report-task:query'])) {
    jobs.push(getReportTaskPage({ pageNo: 1, pageSize: 1, status: 3 }).then((res) => {
      validationCount.value = res.total ?? 0
    }).catch(() => {}))
  }
  await Promise.allSettled(jobs)
  loading.value = false
}

onMounted(() => {
  loadStats()
})

defineExpose({ loadStats })
</script>
