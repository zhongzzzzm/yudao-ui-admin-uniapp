<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 发送日志列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无企微发送日志"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.webhookName || `配置 ${item.webhookId}` }}
            </view>
            <view
              class="ml-16rpx flex-shrink-0 rounded-full px-16rpx py-4rpx text-22rpx"
              :class="item.sendStatus === 1 ? 'bg-green-50 text-green-600' : item.sendStatus === 2 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'"
            >
              {{ sendStatusLabel(item.sendStatus) }}
            </view>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              内容：{{ item.content || '-' }}
            </view>
            <view class="line-clamp-1">
              类型：{{ item.msgType }}<template v-if="item.templateCode">
                · 模板 {{ item.templateCode }}
              </template>
            </view>
            <view class="line-clamp-1">
              发送时间：{{ item.sendTime ? formatDateTime(item.sendTime) : formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WeComLog } from '@/api/system/wecom'
import { onMounted, onUnmounted, ref } from 'vue'
import { getWeComLogPage } from '@/api/system/wecom'
import { formatDateTime } from '@/utils/date'

const list = ref<WeComLog[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 发送状态文案：0 初始化 1 成功 2 失败 */
function sendStatusLabel(status?: number): string {
  return { 0: '待发送', 1: '成功', 2: '失败' }[status ?? 0] ?? '未知'
}

/** 查询发送日志分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWeComLogPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看日志详情（失败可在详情页重发） */
function handleDetail(item: WeComLog) {
  uni.navigateTo({ url: `/pages-system/wecom/log/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:wecom-log:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:wecom-log:reload', reload)
})
</script>
