<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="抄送我的" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 已读状态筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in readChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentRead === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleReadChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <!-- 抄送列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无抄送记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx flex items-start overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goDetail(item)"
        >
          <view class="min-w-0 flex-1">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-30rpx font-semibold" :class="item.readFlag ? 'text-[#999]' : 'text-[#333]'">
                {{ item.title || '抄送单' }}
              </view>
              <wd-tag v-if="!item.readFlag" type="danger" plain class="ml-16rpx flex-shrink-0">
                未读
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#777] space-y-6rpx">
              <view class="line-clamp-1">
                节点：{{ item.nodeName || '-' }} · 第 {{ item.round ?? 1 }} 轮
              </view>
              <view class="line-clamp-1">
                抄送时间：{{ formatDateTime(item.createTime) }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { BpmCcVO } from '@/api/bpm/cc'
import { navigateBackPlus } from '@/utils'
import { getBpmCcPage, markBpmCcRead } from '@/api/bpm/cc'
import { formatDateTime } from '@/utils/date'
import { ref } from 'vue'

defineOptions({
  name: 'BpmCcList',
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

/** 已读状态筛选：-1 全部 */
const readChips = [
  { label: '全部', value: -1 },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 },
]
const currentRead = ref(-1)
const list = ref<BpmCcVO[]>([])
const pagingRef = ref<any>()

function handleReadChange(value: number) {
  if (currentRead.value === value) {
    return
  }
  currentRead.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getBpmCcPage({
      pageNo,
      pageSize,
      readFlag: currentRead.value === -1 ? undefined : currentRead.value === 1,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查看抄送单详情（进入即标记已读，失败不打断浏览） */
function goDetail(item: BpmCcVO) {
  if (!item.readFlag) {
    markBpmCcRead(item.id).catch(() => {})
  }
  uni.navigateTo({ url: `/pages-bpm/task-detail/index?instanceId=${item.instanceId}` })
}
</script>
