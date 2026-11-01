<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="分析看板" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="failed" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadData">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 数据版本选择 -->
        <view class="m-24rpx mb-0 flex items-center justify-between rounded-16rpx bg-white px-24rpx py-16rpx shadow-sm">
          <text class="text-28rpx text-[#333]">数据版本</text>
          <picker mode="selector" :range="batchLabels" @change="handleBatchChange">
            <view class="flex items-center gap-8rpx">
              <text class="max-w-400rpx truncate text-28rpx" :class="summary ? 'text-[#333]' : 'text-[#bbb]'">
                {{ batchLabel || '当前启用版本' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 报送任务 -->
        <stat-card title="报送任务" icon="calendar-line" icon-color="#1890ff">
          <view class="grid grid-cols-4 gap-y-20rpx">
            <stat-item label="总任务" :value="filing?.total" />
            <stat-item label="待执行" :value="filing?.pending" color="#fa8c16" />
            <stat-item label="执行中" :value="filing?.running" color="#1890ff" />
            <stat-item label="失败" :value="filing?.fail" color="#f5222d" />
            <stat-item label="可生成" :value="filing?.ready" color="#52c41a" />
            <stat-item label="缺底稿" :value="filing?.notReady" color="#fa8c16" />
            <stat-item label="待复核" :value="filing?.reviewPending" color="#fa8c16" />
            <stat-item label="复核有误" :value="filing?.reviewError" color="#f5222d" />
            <stat-item label="7 日内临期" :value="filing?.dueSoon" color="#fa8c16" />
            <stat-item label="已逾期" :value="filing?.overdue" color="#f5222d" />
          </view>
        </stat-card>

        <!-- 报表校验 -->
        <stat-card title="报表校验" icon="check" icon-color="#52c41a">
          <view class="grid grid-cols-4 gap-y-20rpx">
            <stat-item label="任务总数" :value="validation?.taskTotal" />
            <stat-item label="进行中" :value="validation?.taskRunning" color="#1890ff" />
            <stat-item label="失败任务" :value="validation?.taskFailed" color="#f5222d" />
            <stat-item label="已完成" :value="validation?.taskFinished" color="#52c41a" />
            <stat-item label="规则通过" :value="validation?.rulePassed" color="#52c41a" />
            <stat-item label="规则失败" :value="validation?.ruleFailed" color="#f5222d" />
            <stat-item label="错误记录" :value="validation?.errorRecordCount" color="#f5222d" />
          </view>
        </stat-card>

        <!-- 办税台账 -->
        <stat-card title="办税台账" icon="stamp" icon-color="#fa541c">
          <view class="grid grid-cols-4 gap-y-20rpx">
            <stat-item label="待办" :value="tax?.pending" color="#fa8c16" />
            <stat-item label="已办结" :value="tax?.done" color="#52c41a" />
            <stat-item label="7 日内临期" :value="tax?.dueSoon" color="#fa8c16" />
            <stat-item label="已逾期" :value="tax?.overdue" color="#f5222d" />
          </view>
        </stat-card>

        <!-- 财务处理 -->
        <stat-card title="财务处理" icon="sync" icon-color="#722ed1">
          <view class="grid grid-cols-4 gap-y-20rpx">
            <stat-item label="处理中" :value="fin?.processing" color="#1890ff" />
            <stat-item label="处理失败" :value="fin?.failed" color="#f5222d" />
          </view>
        </stat-card>

        <view class="h-40rpx" />
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { DashboardBatchOption, DashboardSummary } from '@/api/dashboard'
import { navigateBackPlus } from '@/utils'
import { getDashboardBatches, getDashboardSummary } from '@/api/dashboard'
import StatCard from './components/stat-card.vue'
import StatItem from './components/stat-item.vue'
import { computed, ref } from 'vue'

defineOptions({
  name: 'AnalyticsDashboard',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

function handleBack() {
  navigateBackPlus()
}

const loading = ref(false)
const failed = ref(false)
const batches = ref<DashboardBatchOption[]>([])
const selectedBatchId = ref<number>()
const summary = ref<DashboardSummary>()

const filing = computed(() => summary.value?.filing)
const validation = computed(() => summary.value?.validation)
const tax = computed(() => summary.value?.tax)
const fin = computed(() => summary.value?.fin)

const batchLabels = computed(() =>
  batches.value.map(item => `${item.batchDate || ''}${item.description ? ` ${item.description}` : ''}`.trim() || `版本 ${item.id}`),
)

/** 当前选中版本的展示文案（未选则展示「当前启用版本」） */
const batchLabel = computed(() => {
  if (selectedBatchId.value == null) {
    return ''
  }
  const batch = batches.value.find(item => item.id === selectedBatchId.value)
  return batch ? batchLabels.value[batches.value.indexOf(batch)] : ''
})

async function loadData() {
  loading.value = true
  failed.value = false
  try {
    if (batches.value.length === 0) {
      batches.value = await getDashboardBatches()
    }
    summary.value = await getDashboardSummary(selectedBatchId.value)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function handleBatchChange(event: { detail: { value: number } }) {
  const batch = batches.value[event.detail.value]
  if (!batch || batch.id === selectedBatchId.value) {
    return
  }
  selectedBatchId.value = batch.id
  loadData()
}

loadData()
</script>
