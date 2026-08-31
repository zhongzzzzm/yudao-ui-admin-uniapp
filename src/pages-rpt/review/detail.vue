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
        <!-- 复核信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="flex-1 text-32rpx text-[#333] font-semibold">
              {{ review.templateName || '底稿复核' }}
            </text>
            <wd-tag
              :type="review.reviewStatus === 1 ? (review.reviewResult === 2 ? 'error' : 'success') : 'warning'"
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
        <view class="h-200rpx" />
      </template>
    </scroll-view>

    <!-- 底部复核操作栏（有复核权限且待复核时展示） -->
    <view
      v-if="review && review.reviewStatus === 0 && canReview"
      class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <view class="flex gap-20rpx">
        <wd-button class="flex-1" type="error" plain :disabled="acting" @click="openSubmit(2)">
          驳回
        </wd-button>
        <wd-button class="flex-1" type="success" :loading="acting && submittingResult === 1" :disabled="acting" @click="openSubmit(1)">
          通过
        </wd-button>
      </view>
    </view>

    <!-- 复核意见弹层 -->
    <wd-popup v-model="showSubmit" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-500">
          {{ submittingResult === 1 ? '确认复核无误' : '填写驳回意见' }}
        </view>
        <wd-textarea
          v-model="submitOpinion"
          :placeholder="submittingResult === 1 ? '补充说明（选填）' : '请填写驳回意见（必填）'"
          :maxlength="200"
          show-word-limit
          custom-class="bg-[#f7f8f9]"
        />
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :loading="acting"
          :disabled="!canConfirmSubmit"
          @click="handleSubmit"
        >
          确认提交
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FilingReviewVO } from '@/api/rpt/review'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getFilingReviewListByFiling, submitFilingReview } from '@/api/rpt/review'
import { useAccess } from '@/hooks/useAccess'
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
const { hasAccessByCodes } = useAccess()

const loading = ref(true)
const acting = ref(false)
const review = ref<FilingReviewVO | null>(null)
const reviewId = ref<number>()
const filingId = ref<number>()
const deptId = ref<number>()
const batchId = ref<number>()

/** 复核权限（rpt:filing-review:submit） */
const canReview = computed(() => hasAccessByCodes(['rpt:filing-review:submit']))

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

/** 打开复核弹层（1=通过 2=驳回） */
const showSubmit = ref(false)
const submittingResult = ref<1 | 2>(1)
const submitOpinion = ref('')

function openSubmit(result: 1 | 2) {
  submittingResult.value = result
  submitOpinion.value = ''
  showSubmit.value = true
}

/** 驳回必须填写意见；通过可不填 */
const canConfirmSubmit = computed(() => {
  if (submittingResult.value === 2) {
    return submitOpinion.value.trim().length > 0
  }
  return true
})

/** 提交复核：成功后返回列表并通知刷新 */
async function handleSubmit() {
  acting.value = true
  try {
    await submitFilingReview({
      filingId: filingId.value!,
      deptId: review.value!.deptId,
      reviewResult: submittingResult.value,
      reviewOpinion: submitOpinion.value.trim() || undefined,
    })
    showSubmit.value = false
    toast.show(submittingResult.value === 1 ? '复核完成' : '已驳回')
    setTimeout(() => {
      const pages = getCurrentPages()
      const prev = pages[pages.length - 2]
      prev?.$vm && (prev.$vm as any).exposed?.refresh?.()
      uni.navigateBack()
    }, 600)
  } catch (e: any) {
    toast.show(e?.message || '提交失败，请重试')
  } finally {
    acting.value = false
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
