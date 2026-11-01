<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="通用申请单" placeholder safe-area-inset-top fixed @click-left="handleBack"
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

    <!-- 申请单列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无申请单，点击下方按钮发起"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goForm(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.title || '未命名申请' }}
            </view>
            <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view>金额：¥ {{ formatAmount(item.amount) }}</view>
            <view>创建时间：{{ formatDateTime(item.createTime) }}</view>
          </view>
          <!-- 草稿/已驳回：可编辑、重新提交、删除 -->
          <view v-if="canEdit(item.status)" class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button size="small" plain type="primary" @click.stop="goForm(item)">
              {{ item.status === 0 ? '编辑' : '修改重提' }}
            </wd-button>
            <wd-button size="small" plain type="error" @click.stop="onDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 底部新建入口 -->
    <view class="fixed inset-x-0 bottom-0 z-10 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button type="primary" block @click="goForm()">
        新建申请单
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { BpmGeneralApplyVO } from '@/api/bpm/general'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { navigateBackPlus } from '@/utils'
import { deleteBpmGeneralApply, getBpmGeneralApplyPage } from '@/api/bpm/general'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'

defineOptions({
  name: 'BpmGeneralApply',
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

/** 申请单状态：0 草稿 1 审批中 2 已通过 3 已驳回 4 已作废 */
const statusChips = [
  { label: '全部', value: -1 },
  { label: '草稿', value: 0 },
  { label: '审批中', value: 1 },
  { label: '已通过', value: 2 },
  { label: '已驳回', value: 3 },
  { label: '已作废', value: 4 },
]
const currentStatus = ref(-1)
const list = ref<BpmGeneralApplyVO[]>([])
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
    const data = await getBpmGeneralApplyPage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function statusLabel(status: number): string {
  return { 0: '草稿', 1: '审批中', 2: '已通过', 3: '已驳回', 4: '已作废' }[status] ?? '未知'
}

function statusTagType(status: number): 'primary' | 'success' | 'error' | 'info' {
  if (status === 1) {
    return 'primary'
  }
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'error'
  }
  return 'info'
}

function canEdit(status: number): boolean {
  return status === 0 || status === 3
}

function formatAmount(amount: number): string {
  return Number(amount ?? 0).toFixed(2)
}

/** 新建 / 编辑（草稿与已驳回可改） */
function goForm(item?: BpmGeneralApplyVO) {
  const url = item ? `/pages-bpm/general/form?id=${item.id}` : '/pages-bpm/general/form'
  uni.navigateTo({ url })
}

function onDelete(item: BpmGeneralApplyVO) {
  dialog.confirm({
    title: '删除申请单',
    msg: `确定删除申请单「${item.title || '未命名申请'}」吗？`,
  }).then(async () => {
    try {
      await deleteBpmGeneralApply(item.id)
      uni.showToast({ title: '已删除', icon: 'none' })
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}
</script>
