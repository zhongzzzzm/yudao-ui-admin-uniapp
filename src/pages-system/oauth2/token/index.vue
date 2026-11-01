<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="在线令牌管理" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索客户端编号"
        hide-cancel
        @search="pagingRef?.reload()"
        @clear="pagingRef?.reload()"
      />
    </view>

    <!-- 令牌列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无在线令牌"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ userTypeLabel(item.userType) }} · {{ item.userId }}
            </view>
            <view class="ml-16rpx flex-shrink-0 rounded-full bg-blue-50 px-16rpx py-4rpx text-22rpx text-blue-500">
              {{ item.clientId }}
            </view>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              访问令牌：{{ item.accessToken }}
            </view>
            <view>
              创建时间：{{ item.createTime ? formatDateTime(item.createTime) : '-' }}
            </view>
            <view>
              过期时间：{{ item.expiresTime ? formatDateTime(item.expiresTime) : '-' }}
            </view>
          </view>
          <!-- 操作：强退（删除令牌，立即下线） -->
          <view class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button size="small" plain type="error" @click.stop="handleKickout(item)">
              强退
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { OAuth2AccessToken } from '@/api/system/oauth2'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteOAuth2Token, getOAuth2TokenPage } from '@/api/system/oauth2'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'SystemOauth2Token',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const list = ref<OAuth2AccessToken[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 客户端编号关键字

/** 用户类型文案 */
function userTypeLabel(userType?: number): string {
  return getDictLabel(DICT_TYPE.USER_TYPE, userType) ?? '未知'
}

/** 查询令牌分页（后端仅返回有效期内的令牌） */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOAuth2TokenPage({ clientId: keyword.value.trim() || undefined, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 强退令牌：删除后该用户会话立即下线 */
function handleKickout(item: OAuth2AccessToken) {
  dialog.confirm({
    title: '确认强退',
    msg: `确认强退该令牌？用户 ${item.userId} 将立即下线，需重新登录。`,
  }).then(async () => {
    try {
      await deleteOAuth2Token(item.accessToken)
      toast.success('已强退')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

function handleBack() {
  navigateBackPlus()
}
</script>
