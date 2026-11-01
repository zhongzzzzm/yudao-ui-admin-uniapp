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
          <!-- 头部：推送配置 + 发送状态 -->
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-32rpx font-500">
              {{ log?.webhookName || `配置 ${log?.webhookId ?? '-'}` }}
            </view>
            <view
              class="ml-16rpx flex-shrink-0 rounded-full px-16rpx py-4rpx text-22rpx"
              :class="log?.sendStatus === 1 ? 'bg-green-50 text-green-600' : log?.sendStatus === 2 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'"
            >
              {{ sendStatusLabel(log?.sendStatus) }}
            </view>
          </view>
          <!-- 字段明细 -->
          <view class="text-26rpx text-[#666] space-y-12rpx">
            <view>
              消息类型：{{ log?.msgType ?? '-' }}
            </view>
            <view v-if="log?.templateCode">
              模板：{{ log.templateCode }}
            </view>
            <view>
              发送时间：{{ log?.sendTime ? formatDateTime(log.sendTime) : '-' }}
            </view>
            <view>
              创建时间：{{ log?.createTime ? formatDateTime(log.createTime) : '-' }}
            </view>
            <view v-if="log?.creator">
              创建人：{{ log.creator }}
            </view>
            <view v-if="mentionedLines.length > 0">
              @手机号：{{ mentionedLines.join('、') }}
            </view>
          </view>
        </view>

        <!-- 消息内容（渲染后） -->
        <view class="mt-24rpx rounded-2xl bg-white p-24rpx">
          <view class="mb-16rpx text-28rpx font-500">
            消息内容
          </view>
          <view class="whitespace-pre-wrap break-all text-24rpx text-[#666]">
            {{ log?.content ?? '-' }}
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

    <!-- 失败重发 -->
    <view
      v-if="log?.sendStatus === 2 && hasAccessByCodes(['system:wecom-log:resend'])"
      class="border-t border-gray-100 bg-white px-24rpx py-16rpx pb-[env(safe-area-inset-bottom)]"
    >
      <wd-button :disabled="acting" block type="primary" @click="onResend">
        重发
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WeComLog } from '@/api/system/wecom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getWeComLog, resendWeComLog } from '@/api/system/wecom'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
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

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const log = ref<WeComLog>() // 日志详情
const acting = ref(false) // 重发中状态

/** 发送状态文案：0 初始化 1 成功 2 失败 */
function sendStatusLabel(status?: number): string {
  return { 0: '待发送', 1: '成功', 2: '失败' }[status ?? 0] ?? '未知'
}

/** 模板参数键值对展示行 */
const paramLines = computed(() =>
  Object.entries(log.value?.templateParams ?? {}).map(([key, value]) => `${key}：${String(value)}`),
)

/** @ 手机号列表 */
const mentionedLines = computed(() => log.value?.mentionedMobileList ?? [])

/** 失败重发：原样重放该条日志内容，新建一条日志承载本次结果 */
function onResend() {
  if (!log.value) {
    return
  }
  dialog.confirm({
    title: '确认重发',
    msg: '将按原日志内容重新推送到企微群，并新建一条日志记录本次结果，确定重发？',
  }).then(async () => {
    acting.value = true
    try {
      await resendWeComLog(log.value!.id)
      toast.success('已重发')
      uni.$emit('system:wecom-log:reload')
      handleBack()
    } catch {
      // 业务错误 toast 已由 http 层提示
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/wecom/index')
}

/** 初始化：加载日志详情 */
async function loadDetail() {
  if (!props.id) {
    return
  }
  log.value = await getWeComLog(Number(props.id))
}

loadDetail()
</script>
