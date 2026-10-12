<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="报送配置总览" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 总览列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无报送配置"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.submitId"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.submitName || `报送事项 #${item.submitId}` }}
            </view>
            <wd-tag :type="readinessTagType(item.readiness)" plain class="ml-16rpx flex-shrink-0">
              {{ READINESS_LABELS[item.readiness] ?? item.readiness }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              编号：{{ item.submitCode || '-' }} · 频率：{{ freqLabel(item.frequency) }}
            </view>
            <view class="line-clamp-1">
              模板：{{ item.templateReadyCount ?? 0 }}/{{ item.templateCount ?? 0 }}
              · 底稿：{{ item.draftDefUploaded ?? 0 }}/{{ item.draftDefRequired ?? 0 }}
              · 指标：{{ item.indicatorOk ?? 0 }}/{{ item.indicatorRequired ?? 0 }}
            </view>
            <view class="line-clamp-1">
              任务：{{ item.filingTotal ?? 0 }} 个{{ stageSummary(item) }}
            </view>
            <view v-if="item.nextAction" class="line-clamp-2 text-[#018d71]">
              下一步：{{ item.nextAction }}
            </view>
          </view>

          <!-- 缺失项：处理入口为 PC 配置页 -->
          <view v-if="item.missingItems?.length" class="mt-12rpx rounded-12rpx bg-[#fff7e8] p-16rpx">
            <view class="mb-8rpx text-24rpx text-[#fa8c16] font-500">
              待处理 {{ item.missingItems.length }} 项（请在 PC 端处理）
            </view>
            <view
              v-for="(missing, index) in item.missingItems"
              :key="index"
              class="line-clamp-1 text-24rpx text-[#8c6a1d]"
            >
              · {{ missing.label }}{{ missing.targetName ? `：${missing.targetName}` : '' }}
            </view>
          </view>

          <!-- App 可直达：底稿上传 / 报送任务（按权限显示） -->
          <view v-if="hasFilingAccess || hasSourceAccess" class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button v-if="hasFilingAccess" size="small" plain type="primary" @click="goFiling(item)">
              报送任务
            </wd-button>
            <wd-button v-if="hasSourceAccess" size="small" plain @click="goSource(item)">
              数据底稿
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { OverviewStageKey, SubmitOverviewVO } from '@/api/rpt/configOverview'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { ref } from 'vue'
import { getReportOverviewPage } from '@/api/rpt/configOverview'

defineOptions({
  name: 'RptConfigOverview',
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

const { hasAccessByCodes } = useAccess()

const READINESS_LABELS: Record<string, string> = {
  ready: '可初始化',
  repairable: '可修复',
  incomplete: '配置不全',
}

const hasFilingAccess = hasAccessByCodes(['rpt:tax-report-filing:query'])
const hasSourceAccess = hasAccessByCodes(['rpt:source-file:query'])

const list = ref<SubmitOverviewVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportOverviewPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function readinessTagType(readiness?: string): 'primary' | 'success' | 'warning' | 'info' {
  if (readiness === 'ready') {
    return 'success'
  }
  if (readiness === 'repairable') {
    return 'warning'
  }
  return 'info'
}

function freqLabel(frequency?: number): string {
  return { 1: '按月', 2: '按季', 3: '按半年', 4: '按年' }[frequency ?? 0] ?? '-'
}

/** 任务阶段摘要（只列非零的关键阶段） */
function stageSummary(item: SubmitOverviewVO): string {
  const counts = (item.stageCounts ?? {}) as Partial<Record<OverviewStageKey, number>>
  const parts: string[] = []
  if (counts.pending) {
    parts.push(`待执行 ${counts.pending}`)
  }
  if (counts.generating) {
    parts.push(`生成中 ${counts.generating}`)
  }
  if (counts.generateFail) {
    parts.push(`生成失败 ${counts.generateFail}`)
  }
  if (counts.generated) {
    parts.push(`已生成 ${counts.generated}`)
  }
  if (counts.waitReview) {
    parts.push(`待复核 ${counts.waitReview}`)
  }
  if (counts.reviewDone) {
    parts.push(`复核完成 ${counts.reviewDone}`)
  }
  return parts.length ? `（${parts.join(' / ')}）` : ''
}

/** App 内直达已有页面（明细配置在 PC 端维护） */
function goFiling(_item: SubmitOverviewVO) {
  uni.navigateTo({ url: '/pages-rpt/filing/list' })
}

function goSource(_item: SubmitOverviewVO) {
  uni.navigateTo({ url: '/pages-rpt/source/list' })
}
</script>
