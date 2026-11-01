<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索配置名称 / 编码"
        hide-cancel
        @search="reload"
        @clear="reload"
      />
    </view>

    <!-- 推送配置列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无企微推送配置"
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
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">配置编码：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.code }}</text>
          </view>
          <view v-if="item.remark" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
          <!-- 操作：编辑 / 删除（webhook key 属敏感信息，App 不回显） -->
          <view class="mt-12rpx flex justify-end gap-16rpx">
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
      v-if="hasAccessByCodes(['system:wecom-webhook:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WeComWebhook } from '@/api/system/wecom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { deleteWeComWebhook, getWeComWebhookPage } from '@/api/system/wecom'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<WeComWebhook[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 关键字（名称/编码）

/** 查询推送配置分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const kw = keyword.value.trim() || undefined
    const data = await getWeComWebhookPage({ code: kw, name: kw, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增推送配置 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/wecom/webhook/form/index' })
}

/** 编辑推送配置 */
function handleEdit(item: WeComWebhook) {
  uni.navigateTo({ url: `/pages-system/wecom/webhook/form/index?id=${item.id}` })
}

/** 删除推送配置 */
function handleDelete(item: WeComWebhook) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除企微推送配置【${item.name}】？`,
  }).then(async () => {
    try {
      await deleteWeComWebhook(item.id!)
      toast.success('删除成功')
      reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:wecom-webhook:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:wecom-webhook:reload', reload)
})
</script>
