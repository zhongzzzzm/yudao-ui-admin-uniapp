<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="复核详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!review" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDetail">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 复核已接入审批引擎提示：动作入口在 PC 端我的待办，本页仅回看 -->
        <view class="mx-24rpx mt-24rpx flex items-start gap-12rpx rounded-12rpx bg-[#fff7e6] px-20rpx py-16rpx">
          <wd-icon name="info-circle" size="32rpx" color="#fa8c16" class="mt-2rpx" />
          <text class="flex-1 text-24rpx text-[#ad6800]">
            复核已接入审批引擎，请在电脑端「流程管理-我的待办」处理；本页仅供回看复核结论与审批进度
          </text>
        </view>

        <!-- 复核信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="flex-1 text-32rpx text-[#333] font-semibold">
              {{ review.templateName || '底稿复核' }}
            </text>
            <wd-tag
              :type="review.reviewStatus === 1 ? (review.reviewResult === 2 ? 'danger' : 'success') : 'warning'"
              plain
              class="ml-16rpx flex-shrink-0"
            >
              {{ review.reviewStatus === 1 ? (review.reviewResult === 2 ? '复核有误' : '复核无误') : '待复核' }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">负责部门</text>
              <text class="flex-1 text-[#333]">{{ review.deptName || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-160rpx flex-shrink-0 text-[#999]">关联底稿</text>
              <text class="flex-1 text-[#333]">{{ (review.draftNames || []).join('、') || '-' }}</text>
            </view>
            <template v-if="review.reviewStatus === 1">
              <view class="flex">
                <text class="w-160rpx flex-shrink-0 text-[#999]">复核人</text>
                <text class="flex-1 text-[#333]">{{ review.reviewerName || '-' }} · {{ formatDateTime(review.reviewTime) }}</text>
              </view>
              <view v-if="review.reviewOpinion" class="flex">
                <text class="w-160rpx flex-shrink-0 text-[#999]">复核意见</text>
                <text class="flex-1 text-[#333]">{{ review.reviewOpinion }}</text>
              </view>
            </template>
          </view>
        </view>

        <!-- 底稿文件入口 -->
        <view
          class="mx-24rpx flex items-center justify-between rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goSourceFiles"
        >
          <view>
            <view class="text-28rpx text-[#333]">
              底稿文件
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              查看本批次已上传的底稿并在线预览
            </view>
          </view>
          <wd-icon name="arrow-right" size="40rpx" color="#bbb" />
        </view>

        <!-- 查看审批流程入口 -->
        <view
          class="mx-24rpx mt-24rpx flex items-center justify-between rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openFlow"
        >
          <view>
            <view class="text-28rpx text-[#333]">
              查看流程
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              查看本部门复核的审批环节与结论
            </view>
          </view>
          <wd-icon name="arrow-right" size="40rpx" color="#bbb" />
        </view>
        <view class="h-200rpx" />
      </template>
    </scroll-view>

    <!-- 查看流程弹层 -->
    <wd-popup
      v-model="showFlow"
      position="bottom"
      custom-class="rounded-t-24rpx"
      closable
      safe-area-inset-bottom
      @close="showFlow = false"
    >
      <view class="p-24rpx pb-40rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-500">
          查看流程
        </view>
        <scroll-view class="max-h-60vh" scroll-y>
          <fg-bpm-flow :items="flowItems" :loading="flowLoading" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FilingReviewVO } from '@/api/rpt/review'
import type { FgBpmFlowItem } from '@/components/fg-bpm-flow/fg-bpm-flow.vue'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { getFilingReviewFlowByFiling, getFilingReviewListByFiling } from '@/api/rpt/review'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'ReviewDetail',
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

const toast = useToast()
const loading = ref(true)
const review = ref<FilingReviewVO | null>(null)
const reviewId = ref<number>()
const filingId = ref<number>()
const deptId = ref<number>()
const batchId = ref<number>()

async function loadDetail() {
  if (!filingId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const list = await getFilingReviewListByFiling(filingId.value)
    review.value = list.find(item => item.id === reviewId.value)
      || list.find(item => item.deptId === deptId.value)
      || null
    if (review.value) {
      batchId.value = review.value.batchId
    }
  } catch (e) {
    console.error('加载复核详情失败：', e)
    review.value = null
  } finally {
    loading.value = false
  }
}

/** 查看流程弹层（按当前复核记录定位到对应部门的实例） */
const showFlow = ref(false)
const flowLoading = ref(false)
const flowItems = ref<FgBpmFlowItem[]>([])

async function openFlow() {
  if (!filingId.value || !review.value) {
    return
  }
  showFlow.value = true
  flowLoading.value = true
  try {
    const flows = await getFilingReviewFlowByFiling(filingId.value)
    const current = flows.find(item => item.reviewId === review.value!.id)
      || flows.find(item => item.deptId === review.value!.deptId)
    flowItems.value = current
      ? [{ label: current.deptName || undefined, detail: current.flow ?? null }]
      : []
  } catch (e: any) {
    flowItems.value = []
  } finally {
    flowLoading.value = false
  }
}

/** 查看本批次底稿文件 */
function goSourceFiles() {
  if (!batchId.value) {
    toast.show('该任务未关联数据版本')
    return
  }
  uni.navigateTo({ url: `/pages-rpt/source/list?batchId=${batchId.value}` })
}

onLoad((query) => {
  reviewId.value = Number(query?.id)
  filingId.value = Number(query?.filingId)
  deptId.value = Number(query?.deptId)
  loadDetail()
})
</script>
