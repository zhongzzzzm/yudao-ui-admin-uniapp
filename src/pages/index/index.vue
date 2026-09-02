<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工作台" placeholder safe-area-inset-top fixed>
      <template #right>
        <view class="pr-10rpx" @click="gotoSearch">
          <wd-icon name="search-line" size="40rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>

    <!-- 用户信息头部 -->
    <UserHeader />

    <!-- 今日概览卡 -->
    <OverviewCard ref="overviewCardRef" />

    <!-- 常用功能（可编辑） -->
    <FavoriteGrid />

    <!-- 全部功能：分组标题 + 宫格 -->
    <view
      v-for="group in menuGroups"
      :key="group.key"
      class="mx-20rpx mb-20rpx overflow-hidden rounded-16rpx bg-white"
    >
      <view class="sticky top-0 z-10 flex items-center bg-white px-24rpx py-20rpx">
        <view class="mr-12rpx h-28rpx w-6rpx rounded-4rpx bg-[#018d71]" />
        <text class="text-30rpx text-[#333] font-500">{{ group.name }}</text>
      </view>
      <view
        v-for="sub in group.subGroups"
        :key="sub.key"
      >
        <view v-if="sub.name" class="flex items-center px-24rpx pb-8rpx pt-12rpx">
          <text class="text-24rpx text-[#999]">{{ sub.name }}</text>
        </view>
        <MenuGrid :menus="sub.menus" />
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="h-40rpx" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import FavoriteGrid from './components/favorite-grid.vue'
import MenuGrid from './components/menu-grid.vue'
import OverviewCard from './components/overview-card.vue'
import UserHeader from './components/user-header.vue'
import { getMenuGroups } from './index'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
  },
})

const overviewCardRef = ref<InstanceType<typeof OverviewCard>>()

/** 菜单分组（带权限过滤，onShow 时重新计算） */
const menuGroups = computed(() => getMenuGroups())

/** 跳转到菜单搜索页 */
function gotoSearch() {
  uni.navigateTo({
    url: '/pages/index/search/index',
  })
}

onShow(() => {
  // 从其他页面返回时刷新概览数据（待办数可能变化）
  overviewCardRef.value?.loadStats()
})
</script>
