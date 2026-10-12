<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="我的申请" placeholder safe-area-inset-top fixed @click-left="handleBack"
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

    <!-- 申请列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无申请记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.businessTitle || '申请单' }}
            </view>
            <wd-tag :type="statusTagType(item)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              当前节点：{{ item.currentNodeName || '已结束' }} · 第 {{ item.round ?? 1 }} 轮
            </view>
            <view class="line-clamp-1">
              发起时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
          <!-- 进行中：撤回；审批中停留较久：催办 -->
          <view v-if="item.status === 1" class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button size="small" plain type="error" @click.stop="onCancel(item)">
              撤回
            </wd-button>
            <wd-button size="small" plain @click.stop="onRemind(item)">
              催办
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { BpmInstanceVO } from '@/api/bpm/instance'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { navigateBackPlus } from '@/utils'
import { cancelBpmInstance, getBpmInstancePage } from '@/api/bpm/instance'
import { remindBpmInstance } from '@/api/bpm/task'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'

defineOptions({
  name: 'BpmMyInstance',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()

function handleBack() {
  navigateBackPlus()
}

/** 实例状态：1 进行中 2 已办结 3 已驳回 4 已作废 */
const statusChips = [
  { label: '全部', value: -1 },
  { label: '进行中', value: 1 },
  { label: '已办结', value: 2 },
  { label: '已驳回', value: 3 },
  { label: '已作废', value: 4 },
]
const currentStatus = ref(-1)
const list = ref<BpmInstanceVO[]>([])
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
    const data = await getBpmInstancePage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(item: BpmInstanceVO): string {
  if (item.status === 3) {
    return item.withdrawn ? '已撤回' : '已驳回'
  }
  return { 1: '进行中', 2: '已办结', 4: '已作废' }[item.status ?? 0] ?? '未知'
}

function statusTagType(item: BpmInstanceVO): 'primary' | 'success' | 'error' | 'info' {
  if (item.status === 1) {
    return 'primary'
  }
  if (item.status === 2) {
    return 'success'
  }
  if (item.status === 3) {
    return 'error'
  }
  return 'info'
}

/** 回看审批详情 */
function goDetail(item: BpmInstanceVO) {
  uni.navigateTo({ url: `/pages-bpm/task-detail/index?instanceId=${item.id}` })
}

/** 撤回：进行中 → 已驳回，撤回后可在 PC 端修改重提 */
function onCancel(item: BpmInstanceVO) {
  dialog.confirm({
    title: '确认撤回',
    msg: `确认撤回【${item.businessTitle || '该申请'}】？撤回后流程终止，可修改后重新提交。`,
  }).then(async () => {
    try {
      await cancelBpmInstance(item.id)
      uni.showToast({ title: '已撤回', icon: 'none' })
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 催办当前节点处理人（24 小时限频，后端校验） */
function onRemind(item: BpmInstanceVO) {
  dialog.confirm({
    title: '确认催办',
    msg: '将给当前节点处理人发送催办提醒，确定催办？',
  }).then(async () => {
    try {
      await remindBpmInstance(item.id)
      uni.showToast({ title: '已催办', icon: 'none' })
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}
</script>
