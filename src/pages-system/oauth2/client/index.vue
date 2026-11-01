<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="OAuth2 客户端" placeholder safe-area-inset-top fixed @click-left="handleBack"
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
      empty-view-text="暂无 OAuth2 客户端"
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
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">客户端编号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.clientId }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">令牌有效期：</text>
            <text>访问 {{ item.accessTokenValiditySeconds }}s · 刷新 {{ item.refreshTokenValiditySeconds }}s</text>
          </view>
          <view v-if="(item.authorizedGrantTypes?.length ?? 0) > 0" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">授权类型：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.authorizedGrantTypes.join('、') }}</text>
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
      v-if="hasAccessByCodes(['system:oauth2-client:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { OAuth2Client } from '@/api/system/oauth2'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteOAuth2Client, getOAuth2ClientPage } from '@/api/system/oauth2'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

defineOptions({
  name: 'SystemOauth2Client',
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
const list = ref<OAuth2Client[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 客户端名称关键字

/** 查询客户端分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOAuth2ClientPage({ name: keyword.value.trim() || undefined, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 新增客户端 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/oauth2/client/form/index' })
}

/** 编辑客户端 */
function handleEdit(item: OAuth2Client) {
  uni.navigateTo({ url: `/pages-system/oauth2/client/form/index?id=${item.id}` })
}

/** 删除客户端 */
function handleDelete(item: OAuth2Client) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除 OAuth2 客户端【${item.name}】？删除后使用该客户端接入的应用将无法认证。`,
  }).then(async () => {
    try {
      await deleteOAuth2Client(item.id!)
      toast.success('删除成功')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化（从表单页返回后刷新） */
onMounted(() => {
  uni.$on('system:oauth2-client:reload', () => pagingRef.value?.reload())
})

onUnload(() => {
  uni.$off('system:oauth2-client:reload')
})

function handleBack() {
  navigateBackPlus()
}
</script>
