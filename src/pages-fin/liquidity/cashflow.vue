<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="流动性现金流" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无流动性现金流数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openActions(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="text-28rpx text-[#333] font-500">
              {{ paymentTypeLabel(item.paymentType) }}
            </view>
            <view class="ml-16rpx flex-shrink-0 text-28rpx text-[#333] font-500">
              {{ item.amount == null ? '-' : item.amount.toLocaleString('zh-CN') }}
            </view>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              统计月份：{{ item.statMonth || '-' }} · 目标月份：{{ item.targetMonth || '-' }}
            </view>
            <view class="line-clamp-1">
              区间：{{ item.startDate || '-' }} ~ {{ item.endDate || '-' }}
            </view>
          </view>
        </view>
        <!-- 底部按钮占位 -->
        <view v-if="canCreate" class="h-140rpx" />
      </view>
    </z-paging>

    <!-- 手工维护入口 -->
    <view
      v-if="canCreate"
      class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <wd-button class="flex-1" type="primary" @click="goCreate()">
        手工新增现金流
      </wd-button>
    </view>

    <!-- 行操作：编辑 / 删除 -->
    <wd-action-sheet
      v-model="showActions"
      :actions="rowActions"
      cancel-text="取消"
      title="现金流操作"
      @select="handleRowAction"
      @close="showActions = false"
    />
  </view>
</template>

<script lang="ts" setup>
import type { LiquidityCashFlowVO } from '@/api/fin/liquidity'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { navigateBackPlus } from '@/utils'
import { computed, ref } from 'vue'
import { deleteLiquidityCashFlow, getLiquidityCashFlowPage, LIQUIDITY_PAYMENT_TYPE_MAP } from '@/api/fin/liquidity'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'FinLiquidityCashFlowList',
})

function handleBack() {
  navigateBackPlus()
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
/** 手工维护权限（fin:liquidity-cash-flow:create / delete） */
const canCreate = computed(() => hasAccessByCodes(['fin:liquidity-cash-flow:create']))
const canDelete = computed(() => hasAccessByCodes(['fin:liquidity-cash-flow:delete']))

function paymentTypeLabel(value?: number) {
  if (value == null) {
    return '-'
  }
  return LIQUIDITY_PAYMENT_TYPE_MAP[value] || `类型${value}`
}

const list = ref<LiquidityCashFlowVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getLiquidityCashFlowPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// ========== 行操作（编辑 / 删除） ==========

const showActions = ref(false)
const activeItem = ref<LiquidityCashFlowVO>()
/** 按权限动态生成的行操作 */
const rowActions = computed<{ name: string, type: string, color?: string }[]>(() => {
  const actions: { name: string, type: string, color?: string }[] = [{ name: '编辑', type: 'edit' }]
  if (canDelete.value) {
    actions.push({ name: '删除', type: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: LiquidityCashFlowVO) {
  if (!canCreate.value && !canDelete.value) {
    return
  }
  activeItem.value = item
  showActions.value = true
}

function goCreate(item?: LiquidityCashFlowVO) {
  const query = item?.id ? `?id=${item.id}` : ''
  uni.navigateTo({ url: `/pages-fin/liquidity/cashflow-form${query}` })
}

function handleRowAction({ item }: { item: { type: string } }) {
  showActions.value = false
  const target = activeItem.value
  if (!target) {
    return
  }
  if (item.type === 'edit') {
    goCreate(target)
    return
  }
  if (item.type === 'delete') {
    dialog.confirm({
      title: '确认删除',
      msg: `确认删除该笔现金流（${paymentTypeLabel(target.paymentType)} · ${target.amount ?? '-'}）？`,
    }).then(async () => {
      await deleteLiquidityCashFlow(target.id)
      uni.showToast({ title: '已删除', icon: 'none' })
      pagingRef.value?.reload()
    }).catch(() => {})
  }
}
</script>
