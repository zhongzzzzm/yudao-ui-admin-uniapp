<template>
  <view class="m-24rpx mt-0 rounded-16rpx bg-white p-24rpx shadow-sm first:mt-24rpx">
    <view class="mb-20rpx flex items-center gap-12rpx">
      <view class="h-44rpx w-44rpx flex items-center justify-center rounded-10rpx" :style="{ backgroundColor: `${iconColor}1a` }">
        <wd-icon :name="icon" size="32rpx" :color="iconColor" />
      </view>
      <text class="text-30rpx text-[#333] font-500">
        {{ title }}
      </text>
    </view>
    <slot />
  </view>
</template>

<script lang="ts" setup>
/** 分析看板域统计卡片容器（图标 + 标题 + 统计项网格） */
defineProps<{
  title: string // 卡片标题
  icon: string // 图标名（wot-ui 图标）
  iconColor: string // 图标主题色
}>()
</script>
