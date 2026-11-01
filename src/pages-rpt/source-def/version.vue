<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="布局版本" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 表样对比选择条 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="flex items-center gap-16rpx">
        <picker class="flex-1" mode="selector" :range="versionLabels" :value="sourceIndex" @change="e => sourceIndex = Number(e.detail.value)">
          <view class="min-h-64rpx rounded-12rpx bg-[#f7f8f9] px-16rpx py-12rpx text-24rpx" :class="sourceVersionId ? 'text-[#333]' : 'text-[#bbb]'">
            基准：{{ sourceVersionLabel }}
          </view>
        </picker>
        <picker class="flex-1" mode="selector" :range="versionLabels" :value="targetIndex" @change="e => targetIndex = Number(e.detail.value)">
          <view class="min-h-64rpx rounded-12rpx bg-[#f7f8f9] px-16rpx py-12rpx text-24rpx" :class="targetVersionId ? 'text-[#333]' : 'text-[#bbb]'">
            对比：{{ targetVersionLabel }}
          </view>
        </picker>
        <wd-button size="small" type="primary" :disabled="!canDiff || diffing" :loading="diffing" @click="goDiff">
          对比
        </wd-button>
      </view>
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!versions.length" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadVersions">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 版本列表 -->
        <view class="mx-24rpx my-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view
            v-for="version in versions"
            :key="version.id"
            class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx last:border-b-0"
          >
            <view class="mb-8rpx flex items-center justify-between">
              <text class="text-28rpx text-[#333] font-500">
                V{{ version.versionNo }}
              </text>
              <wd-tag :type="statusTagType(version.status)" plain>
                {{ statusLabel(version.status) }}
              </wd-tag>
            </view>
            <view class="text-24rpx text-[#777] space-y-4rpx">
              <view>
                生效窗口：{{ windowText(version) }}
              </view>
              <view v-if="version.publisher">
                发布人：{{ version.publisher }}{{ version.publishTime ? ` · ${formatDateTime(version.publishTime)}` : '' }}
              </view>
              <view v-if="version.changeDesc" class="line-clamp-2">
                变更说明：{{ version.changeDesc }}
              </view>
            </view>
            <!-- 快捷选为基准/对比 -->
            <view class="mt-12rpx flex justify-end gap-16rpx">
              <wd-button size="small" plain @click.stop="quickPick('source', version.id)">
                设为基准
              </wd-button>
              <wd-button size="small" plain @click.stop="quickPick('target', version.id)">
                设为对比
              </wd-button>
            </view>
          </view>
        </view>
        <view class="h-40rpx" />
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SourceFileDefVersionVO } from '@/api/rpt/sourceFileDef'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getSourceFileDefVersionList } from '@/api/rpt/sourceFileDef'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'RptSourceDefVersion',
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

const defId = ref<number>()
const loading = ref(true)
const versions = ref<SourceFileDefVersionVO[]>([])

// ========== 表样对比选择 ==========

const sourceIndex = ref(-1)
const targetIndex = ref(-1)
const diffing = ref(false)

const versionLabels = computed(() => versions.value.map(v => `V${v.versionNo}（${statusLabel(v.status)}）`))
const sourceVersionId = computed(() => (sourceIndex.value >= 0 ? versions.value[sourceIndex.value]?.id : undefined))
const targetVersionId = computed(() => (targetIndex.value >= 0 ? versions.value[targetIndex.value]?.id : undefined))
const sourceVersionLabel = computed(() => (sourceVersionId.value ? versionLabels.value[sourceIndex.value] : '请选择'))
const targetVersionLabel = computed(() => (targetVersionId.value ? versionLabels.value[targetIndex.value] : '请选择'))
const canDiff = computed(() => sourceVersionId.value != null && targetVersionId.value != null)

/** 快捷把某版本设为基准/对比 */
function quickPick(slot: 'source' | 'target', versionId: number) {
  const index = versions.value.findIndex(v => v.id === versionId)
  if (index < 0) {
    return
  }
  if (slot === 'source') {
    sourceIndex.value = index
  } else {
    targetIndex.value = index
  }
}

function statusLabel(status: number): string {
  return { 0: '草稿', 1: '已发布', 2: '已废弃' }[status] ?? '未知'
}

function statusTagType(status: number): 'success' | 'warning' | 'info' {
  if (status === 1) {
    return 'success'
  }
  return status === 0 ? 'warning' : 'info'
}

/** 生效窗口文案 */
function windowText(version: SourceFileDefVersionVO): string {
  const start = version.effectiveTime ? formatDateTime(version.effectiveTime) : '-'
  const end = version.expireTime ? formatDateTime(version.expireTime) : '长期'
  return `${start} ~ ${end}`
}

async function loadVersions() {
  if (!defId.value) {
    return
  }
  loading.value = true
  try {
    versions.value = await getSourceFileDefVersionList(defId.value) ?? []
  } catch (e) {
    console.error('加载布局版本失败：', e)
    versions.value = []
  } finally {
    loading.value = false
  }
}

/** 跳转表样对比页（行级差异） */
function goDiff() {
  if (!canDiff.value) {
    toast.show('请先选择基准与对比版本')
    return
  }
  if (sourceVersionId.value === targetVersionId.value) {
    toast.show('基准与对比版本不能相同')
    return
  }
  uni.navigateTo({
    url: `/pages-rpt/source-def/version-diff?sourceVersionId=${sourceVersionId.value}&targetVersionId=${targetVersionId.value}`
      + `&sourceLabel=${encodeURIComponent(`V${versions.value[sourceIndex.value].versionNo}`)}`
      + `&targetLabel=${encodeURIComponent(`V${versions.value[targetIndex.value].versionNo}`)}`,
  })
}

onLoad((query) => {
  defId.value = Number(query?.defId)
  loadVersions()
})
</script>
