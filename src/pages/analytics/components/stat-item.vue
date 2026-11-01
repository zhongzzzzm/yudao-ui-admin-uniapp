<template>
  <view class="flex flex-col items-center">
    <text class="text-36rpx font-600" :style="{ color: color || '#333' }">
      {{ value ?? 0 }}
    </text>
    <text class="mt-4rpx text-22rpx text-[#999]">
      {{ label }}
    </text>
  </view>
</template>

<script lang="ts" setup>
/** 分析看板统计项（数值 + 标签，异常项可着色） */
withDefaults(defineProps<{
  label: string // 统计项名称
  value?: number // 数值
  color?: string // 数值颜色（异常项标红/橙，缺省深灰）
}>(), {
  value: 0,
})
</script>
