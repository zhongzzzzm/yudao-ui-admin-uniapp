<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="发送日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view class="overflow-hidden rounded-2xl bg-white p-24rpx">
          <!-- 头部：标题 + 发送状态 -->
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-32rpx font-500">
              {{ log?.templateTitle ?? '-' }}
            </view>
            <dict-tag :type="DICT_TYPE.SYSTEM_MAIL_SEND_STATUS" :value="log?.sendStatus" class="ml-16rpx flex-shrink-0" />
          </view>
          <!-- 字段明细 -->
          <view class="text-26rpx text-[#666] space-y-12rpx">
            <view>
              收件人：{{ log?.toMail ?? '-' }}
            </view>
            <view>
              发件人：{{ log?.fromMail ?? '-' }}（{{ log?.templateNickname ?? '-' }}）
            </view>
            <view>
              模板：{{ log?.templateCode ?? '-' }}
            </view>
            <view>
              发送时间：{{ log?.sendTime ? formatDateTime(log.sendTime) : '-' }}
            </view>
            <view>
              创建时间：{{ log?.createTime ? formatDateTime(log.createTime) : '-' }}
            </view>
            <view v-if="log?.sendMessageId">
              消息编号：{{ log.sendMessageId }}
            </view>
          </view>
        </view>

        <!-- 模板参数 -->
        <view v-if="paramLines.length > 0" class="mt-24rpx rounded-2xl bg-white p-24rpx">
          <view class="mb-16rpx text-28rpx font-500">
            模板参数
          </view>
          <view class="text-24rpx text-[#666] space-y-8rpx">
            <view v-for="line in paramLines" :key="line" class="break-all">
              {{ line }}
            </view>
          </view>
        </view>

        <!-- 邮件内容（渲染后） -->
        <view class="mt-24rpx rounded-2xl bg-white p-24rpx">
          <view class="mb-16rpx text-28rpx font-500">
            邮件内容
          </view>
          <view class="whitespace-pre-wrap break-all text-24rpx text-[#666]">
            {{ log?.templateContent ?? '-' }}
          </view>
        </view>

        <!-- 失败异常 -->
        <view v-if="log?.sendException" class="mt-24rpx rounded-2xl bg-red-50 p-24rpx">
          <view class="mb-16rpx text-28rpx text-[#f5222d] font-500">
            失败原因
          </view>
          <view class="whitespace-pre-wrap break-all text-22rpx text-[#f5222d]">
            {{ log.sendException }}
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MailLog } from '@/api/system/mail'
import { computed, ref } from 'vue'
import { getMailLog } from '@/api/system/mail'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  /** 日志编号 */
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const log = ref<MailLog>() // 日志详情

/** 模板参数键值对展示行 */
const paramLines = computed(() =>
  Object.entries(log.value?.templateParams ?? {}).map(([key, value]) => `${key}：${String(value)}`),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 初始化：加载日志详情 */
async function loadDetail() {
  if (!props.id) {
    return
  }
  log.value = await getMailLog(Number(props.id))
}

loadDetail()
</script>
