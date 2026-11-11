<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="取数脚本详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />
    <view class="bg-[#fffbe6] px-24rpx py-12rpx text-24rpx text-[#fa8c16]">
      {{ FETCH_READONLY_TIP }}
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <view v-else-if="!script" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDetail">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 脚本基本信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">
              {{ script.name || `脚本 #${script.id}` }}
            </text>
            <wd-tag :type="enabledTagType(script.status)" plain class="ml-16rpx flex-shrink-0">
              {{ enabledLabel(script.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">脚本编号</text>
              <text class="flex-1 text-[#333]">{{ displayValue(script.id) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">数据类型</text>
              <text class="flex-1 text-[#333]">{{ dataTypeLabel(script.dataType) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">取数方式</text>
              <text class="flex-1 text-[#333]">{{ fetchTypeLabel(script.fetchType) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">期间策略</text>
              <text class="flex-1 text-[#333]">{{ periodText }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">当前版本</text>
              <text class="flex-1 text-[#333]">v{{ displayValue(script.version ?? 1) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">复制来源</text>
              <text class="flex-1 text-[#333]">{{ displayValue(script.sourceScriptId) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">关联定时任务</text>
              <text class="flex-1 text-[#333]">{{ jobText }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">数据源</text>
              <text class="flex-1 text-[#333]">{{ script.fetchType === 3 ? 'HTTP 通道无需数据源' : displayValue(script.datasourceName) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">行数上限</text>
              <text class="flex-1 text-[#333]">{{ displayValue(script.rowLimit) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">最近落表</text>
              <text class="flex-1 text-[#333]">
                {{ script.lastBatchId ? `批次 #${script.lastBatchId} · ${batchStatusLabel(script.lastBatchStatus)}` : '暂无' }}
                · {{ script.lastBatchRowCount ?? 0 }} 行 · {{ formatDateTime(script.lastFetchTime) || '-' }}
              </text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">创建时间</text>
              <text class="flex-1 text-[#333]">{{ formatDateTime(script.createTime) || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">备注</text>
              <text class="flex-1 text-[#333]">{{ displayValue(script.remark) }}</text>
            </view>
          </view>
        </view>

        <!-- HTTP 取数配置（不展示鉴权值） -->
        <view v-if="script.fetchType === 3" class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx border-b border-b-[#f0f0f0] pb-12rpx text-28rpx text-[#333] font-500">
            HTTP 取数配置
          </view>
          <view v-if="httpInfo.error" class="text-26rpx text-[#f5222d]">
            配置解析失败：{{ httpInfo.error }}；配置原文可能包含鉴权值，移动端不展示
          </view>
          <view v-else-if="httpInfo.config" class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">请求地址</text>
              <text class="flex-1 break-all text-[#333]">{{ displayValue(httpInfo.config.url) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">请求方法</text>
              <text class="flex-1 text-[#333]">{{ displayValue(httpInfo.config.method) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">超时（毫秒）</text>
              <text class="flex-1 text-[#333]">{{ displayValue(httpInfo.config.timeout) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">响应数据路径</text>
              <text class="flex-1 break-all text-[#333]">{{ displayValue(httpInfo.config.jsonPath) }}</text>
            </view>
            <view class="flex">
              <text class="w-200rpx flex-shrink-0 text-[#999]">鉴权方式</text>
              <text class="flex-1 text-[#333]">{{ displayValue(httpInfo.config.authType) }}</text>
            </view>
            <view>
              <view class="mb-8rpx text-[#999]">
                请求头
              </view>
              <view class="whitespace-pre-wrap rounded-12rpx bg-[#f7f8f9] p-16rpx text-24rpx text-[#555] font-mono">
                {{ headersText }}
              </view>
              <view class="mt-8rpx text-22rpx text-[#bbb]">
                鉴权值由后端保存，移动端不展示；修改配置请在 PC 管理台操作
              </view>
            </view>
          </view>
          <view v-else class="text-26rpx text-[#999]">
            暂无 HTTP 配置
          </view>
        </view>

        <!-- SQL 与字段映射（只读） -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx border-b border-b-[#f0f0f0] pb-12rpx text-28rpx text-[#333] font-500">
            取数 SQL 与字段映射
          </view>
          <view class="mb-8rpx text-26rpx text-[#999]">
            取数 SQL
          </view>
          <view class="mb-16rpx whitespace-pre-wrap break-all rounded-12rpx bg-[#f7f8f9] p-16rpx text-24rpx text-[#555] font-mono">
            {{ displayValue(script.fetchSql) }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#999]">
            字段映射 JSON
          </view>
          <view class="whitespace-pre-wrap break-all rounded-12rpx bg-[#f7f8f9] p-16rpx text-24rpx text-[#555] font-mono">
            {{ formatJson(script.fieldMapping) }}
          </view>
        </view>
        <view class="h-180rpx" />
      </template>
    </scroll-view>

    <!-- 立即取数：同步执行并跳转新落表批次 -->
    <view v-if="script" class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <view v-if="!canManualFetch" class="mb-8rpx text-22rpx text-[#fa8c16]">
        无立即取数权限，或脚本已停用；启用与配置请到 PC 管理台操作
      </view>
      <wd-button
        type="primary"
        block
        :loading="fetching"
        :disabled="!canManualFetch || fetching"
        @click="handleManualFetch"
      >
        立即取数
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteFetchScriptVO } from '@/api/fl/quoteFetch'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import { computed, ref } from 'vue'
import { getFetchScript, manualFetch } from '@/api/fl/quoteFetch'
import {
  batchStatusLabel,
  dataTypeLabel,
  displayValue,
  enabledLabel,
  enabledTagType,
  FETCH_READONLY_TIP,
  fetchTypeLabel,
  formatJson,
  parseHttpConfig,
  periodStrategyLabel,
} from '../utils'

defineOptions({
  name: 'FlQuoteFetchScriptDetail',
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

const dialog = useDialog()
const toast = useToast()
const { hasAccessByCodes } = useAccess()

const loading = ref(false)
const fetching = ref(false)
const script = ref<QuoteFetchScriptVO>()
const scriptId = ref<number>()

const canManualFetch = computed(() =>
  hasAccessByCodes(['fl:fetch-script:manual-fetch']) && script.value?.status === 0,
)
const httpInfo = computed(() => parseHttpConfig(script.value?.httpConfig))
const headersText = computed(() => formatJson(httpInfo.value.config?.headers))
const periodText = computed(() => {
  const label = periodStrategyLabel(script.value?.periodStrategy)
  return script.value?.periodValue ? `${label}（${script.value.periodValue}）` : label
})
const jobText = computed(() => script.value?.jobName
  || (script.value?.jobId ? `任务 #${script.value.jobId}` : '-'))

onLoad((query) => {
  scriptId.value = Number(query?.id)
  loadDetail()
})

async function loadDetail() {
  if (!scriptId.value) {
    return
  }
  loading.value = true
  try {
    script.value = await getFetchScript(scriptId.value)
  } catch {
    script.value = undefined
  } finally {
    loading.value = false
  }
}

/** 立即取数：二次确认后同步执行，成功跳转落表批次详情 */
function handleManualFetch() {
  if (!scriptId.value || !canManualFetch.value || fetching.value) {
    return
  }
  dialog.confirm({
    title: '立即取数',
    msg: '将按当前脚本同步执行一次取数并生成落表批次，确认继续？',
  }).then(async () => {
    fetching.value = true
    uni.showLoading({ title: '取数中...', mask: true })
    try {
      const batchId = await manualFetch(scriptId.value!)
      toast.show('取数完成，正在打开落表数据')
      setTimeout(() => {
        uni.redirectTo({ url: `/pages-fl/quotefetch/data/detail?id=${batchId}` })
      }, 500)
    } catch (error: any) {
      toast.show(error?.message || '立即取数失败')
    } finally {
      uni.hideLoading()
      fetching.value = false
    }
  }).catch(() => {})
}
</script>
