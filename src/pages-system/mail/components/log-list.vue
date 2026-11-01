<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 关键字搜索（收件邮箱） -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索收件邮箱"
        hide-cancel
        @search="reload"
        @clear="reload"
      />
    </view>

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
      empty-view-text="暂无发送日志"
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
              {{ item.templateTitle }}
            </view>
            <dict-tag :type="DICT_TYPE.SYSTEM_MAIL_SEND_STATUS" :value="item.sendStatus" class="ml-16rpx flex-shrink-0" />
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              收件人：{{ item.toMail }}
            </view>
            <view class="line-clamp-1">
              模板：{{ item.templateNickname }} · {{ item.templateCode }}
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
import type { MailLog } from '@/api/system/mail'
import { onMounted, onUnmounted, ref } from 'vue'
import { getMailLogPage } from '@/api/system/mail'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const list = ref<MailLog[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 收件邮箱关键字

/** 查询发送日志分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getMailLogPage({ pageNo, pageSize, toMail: keyword.value.trim() || undefined })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看日志详情 */
function handleDetail(item: MailLog) {
  uni.navigateTo({ url: `/pages-system/mail/log/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:mail-log:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:mail-log:reload', reload)
})
</script>
