<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="三方登录用户" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索用户昵称 / openid"
        hide-cancel
        @search="pagingRef?.reload()"
        @clear="pagingRef?.reload()"
      />
    </view>

    <!-- 用户列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无三方登录用户"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex flex-1 items-center gap-16rpx">
              <!-- 头像 -->
              <image
                v-if="item.avatar"
                :src="item.avatar"
                class="h-72rpx w-72rpx flex-shrink-0 rounded-full"
                mode="aspectFill"
              />
              <view
                v-else
                class="h-72rpx w-72rpx flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100"
              >
                <wd-icon name="user" size="36rpx" color="#999" />
              </view>
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.nickname || '未授权昵称' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="item.type" class="ml-16rpx flex-shrink-0" />
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              openid：{{ item.openid }}
            </view>
            <view>
              授权时间：{{ item.createTime ? formatDateTime(item.createTime) : '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SocialUser } from '@/api/system/social/user'
import { ref } from 'vue'
import { getSocialUserPage } from '@/api/system/social/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'SystemSocialUser',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<SocialUser[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 关键字（昵称/openid，同时下发后端模糊匹配）

/** 查询社交用户分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const kw = keyword.value.trim() || undefined
    const data = await getSocialUserPage({ nickname: kw, openid: kw, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function handleBack() {
  navigateBackPlus()
}
</script>
