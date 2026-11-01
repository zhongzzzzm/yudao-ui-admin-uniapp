<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="三方登录客户端" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索客户端名称"
        hide-cancel
        @search="pagingRef?.reload()"
        @clear="pagingRef?.reload()"
      />
    </view>

    <!-- 客户端列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无社交客户端"
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
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              社交平台：<dict-tag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="item.socialType" />
            </view>
            <view class="line-clamp-1">
              用户类型：{{ userTypeLabel(item.userType) }}
            </view>
            <view class="line-clamp-1">
              客户端编号：{{ item.clientId }}
            </view>
            <view v-if="item.agentId" class="line-clamp-1">
              代理 ID：{{ item.agentId }}
            </view>
          </view>
          <!-- 操作：编辑 / 删除 -->
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
      v-if="hasAccessByCodes(['system:social-client:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SocialClient } from '@/api/system/social/client'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { deleteSocialClient, getSocialClientPage } from '@/api/system/social/client'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

defineOptions({
  name: 'SystemSocialClient',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<SocialClient[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 客户端名称关键字

/** 用户类型文案 */
function userTypeLabel(userType?: number): string {
  return getDictLabel(DICT_TYPE.USER_TYPE, userType) ?? '未知'
}

/** 查询客户端分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSocialClientPage({ name: keyword.value.trim() || undefined, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 新增客户端 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/social/client/form/index' })
}

/** 编辑客户端 */
function handleEdit(item: SocialClient) {
  uni.navigateTo({ url: `/pages-system/social/client/form/index?id=${item.id}` })
}

/** 删除客户端 */
function handleDelete(item: SocialClient) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除社交客户端【${item.name}】？删除后对应平台的登录配置失效。`,
  }).then(async () => {
    try {
      await deleteSocialClient(item.id!)
      toast.success('删除成功')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:social-client:reload', () => pagingRef.value?.reload())
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:social-client:reload')
})

function handleBack() {
  navigateBackPlus()
}
</script>
