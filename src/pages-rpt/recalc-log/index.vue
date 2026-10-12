<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="计算联动日志" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 状态筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in statusChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentStatus === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleStatusChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <!-- 日志列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无联动重算日志"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ RECALC_TRIGGER_LABELS[item.triggerType] || '触发重算' }}
            </view>
            <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              数据版本：{{ item.batchDate || `#${item.batchId}` }}
            </view>
            <view class="line-clamp-1">
              受影响指标：{{ item.affectedIndicatorCount ?? 0 }} 个 · 级联 {{ item.cascadeDepth ?? 0 }} 层
            </view>
            <view class="line-clamp-1">
              成功 <text class="text-[#52c41a]">{{ item.successCount ?? 0 }}</text>
              <template v-if="item.failCount">
                · 失败 <text class="text-[#f5222d]">{{ item.failCount }}</text>
              </template>
            </view>
            <view class="line-clamp-1">
              触发时间：{{ item.createTime ? formatDateTime(item.createTime) : '-' }}
            </view>
            <view v-if="item.triggerDesc" class="line-clamp-2">
              触发源：{{ item.triggerDesc }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 明细弹层 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-75vh overflow-auto p-24rpx">
        <view class="mb-8rpx text-30rpx text-[#333] font-500">
          重算明细
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          {{ activeItem && RECALC_TRIGGER_LABELS[activeItem.triggerType] }} · {{ activeItem?.batchDate || '-' }}
        </view>
        <view v-if="detailLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="!detailItems.length" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无明细
        </view>
        <view v-else class="space-y-12rpx">
          <view
            v-for="item in detailItems"
            :key="item.id"
            class="rounded-12rpx bg-[#f7f8f9] p-20rpx"
          >
            <view class="flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-26rpx text-[#333]">
                {{ item.indicatorName || item.indicatorCode || `指标 #${item.indicatorId}` }}
              </text>
              <wd-tag :type="item.status ? 'error' : 'success'" plain class="ml-12rpx flex-shrink-0">
                {{ item.status ? '失败' : '成功' }}
              </wd-tag>
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              {{ item.depth === 0 ? '种子指标' : `第 ${item.depth} 层级联` }}{{ item.parentIndicatorName ? ` ← ${item.parentIndicatorName}` : '' }} · 耗时 {{ item.costMs ?? 0 }}ms
            </view>
            <view v-if="item.errorMsg" class="mt-4rpx text-22rpx text-[#f5222d]">
              {{ item.errorMsg }}
            </view>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { RecalcLogItemVO, RecalcLogVO } from '@/api/rpt/recalcLog'
import { navigateBackPlus } from '@/utils'
import { getRecalcLog, getRecalcLogPage, RECALC_TRIGGER_LABELS } from '@/api/rpt/recalcLog'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'

defineOptions({
  name: 'RptRecalcLogList',
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

const statusChips = [
  { label: '全部', value: -1 },
  { label: '成功', value: 1 },
  { label: '部分失败', value: 2 },
  { label: '失败', value: 3 },
]
const currentStatus = ref(-1)
const list = ref<RecalcLogVO[]>([])
const pagingRef = ref<any>()

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getRecalcLogPage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status?: number): string {
  return { 0: '进行中', 1: '成功', 2: '部分失败', 3: '失败' }[status ?? 0] ?? '未知'
}

function statusTagType(status?: number): 'primary' | 'success' | 'warning' | 'error' {
  if (status === 1) {
    return 'success'
  }
  if (status === 2) {
    return 'warning'
  }
  if (status === 3) {
    return 'error'
  }
  return 'primary'
}

// ========== 明细弹层 ==========

const showDetail = ref(false)
const activeItem = ref<RecalcLogVO>()
const detailItems = ref<RecalcLogItemVO[]>([])
const detailLoading = ref(false)

function openDetail(item: RecalcLogVO) {
  activeItem.value = item
  detailItems.value = item.items ?? []
  showDetail.value = true
  if (!detailItems.value.length) {
    detailLoading.value = true
    getRecalcLog(item.id).then((log) => {
      detailItems.value = log.items ?? []
    }).finally(() => {
      detailLoading.value = false
    })
  }
}
</script>
