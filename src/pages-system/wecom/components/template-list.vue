<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索模板名称 / 编码"
        hide-cancel
        @search="reload"
        @clear="reload"
      />
    </view>

    <!-- 消息模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无企微消息模板"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" class="ml-16rpx flex-shrink-0" />
            <view class="ml-12rpx rounded-full bg-green-50 px-16rpx py-4rpx text-22rpx text-green-600">
              {{ item.msgType }}
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">模板编码：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.code }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">推送配置：</text>
            <text class="min-w-0 flex-1 truncate">{{ webhookName(item.webhookId) }}</text>
          </view>
          <view v-if="(item.params?.length ?? 0) > 0" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">模板参数：</text>
            <text class="min-w-0 flex-1 truncate">{{ (item.params ?? []).join('、') }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
          <!-- 操作：测试发送 / 编辑 / 删除 -->
          <view class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['system:wecom-template:send'])"
              size="small" plain type="primary" @click.stop="handleSend(item)"
            >
              测试发送
            </wd-button>
            <wd-button size="small" plain @click.stop="handleEdit(item)">
              编辑
            </wd-button>
            <wd-button size="small" plain type="error" @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:wecom-template:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WeComTemplate, WeComWebhookSimple } from '@/api/system/wecom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  deleteWeComTemplate,
  getSimpleWeComWebhookList,
  getWeComTemplatePage,
} from '@/api/system/wecom'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<WeComTemplate[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 关键字（名称/编码）
const webhooks = ref<WeComWebhookSimple[]>([]) // 推送配置精简列表（名称展示用）

/** 查询消息模板分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const kw = keyword.value.trim() || undefined
    const data = await getWeComTemplatePage({ code: kw, name: kw, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 推送配置名称 */
function webhookName(webhookId?: number): string {
  if (webhookId == null) {
    return '-'
  }
  return webhooks.value.find(item => item.id === webhookId)?.name ?? `配置 ${webhookId}`
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增消息模板 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/wecom/template/form/index' })
}

/** 编辑消息模板 */
function handleEdit(item: WeComTemplate) {
  uni.navigateTo({ url: `/pages-system/wecom/template/form/index?id=${item.id}` })
}

/** 测试发送 */
function handleSend(item: WeComTemplate) {
  uni.navigateTo({ url: `/pages-system/wecom/template/send/index?code=${item.code}` })
}

/** 删除消息模板 */
function handleDelete(item: WeComTemplate) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除企微消息模板【${item.name}】？`,
  }).then(async () => {
    try {
      await deleteWeComTemplate(item.id!)
      toast.success('删除成功')
      reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:wecom-template:reload', reload)
  getSimpleWeComWebhookList().then((data) => {
    webhooks.value = data ?? []
  }).catch(() => {})
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:wecom-template:reload', reload)
})
</script>
