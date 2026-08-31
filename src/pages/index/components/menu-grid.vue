<template>
  <view class="flex flex-wrap">
    <view
      v-for="menu in items"
      :key="menu.key"
      class="w-1/4 flex flex-col items-center py-20rpx"
      @click="navigateToMenu(menu)"
    >
      <view
        class="h-80rpx w-80rpx flex flex-shrink-0 items-center justify-center rounded-16rpx"
        :style="getIconStyle(menu)"
      >
        <wd-icon :name="menu.icon" size="44rpx" :color="menu.iconColor" />
      </view>
      <text class="line-clamp-2 mt-12rpx w-140rpx text-center text-24rpx text-[#333] leading-32rpx">
        {{ menu.name }}
      </text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MenuItem } from '../index'
import { computed } from 'vue'
import { useMenuNavigate } from '../index'

defineOptions({
  name: 'MenuGrid',
})

const props = defineProps<{
  menus?: MenuItem[] // 菜单列表
}>()

const { navigateToMenu } = useMenuNavigate()

/** 菜单列表（未传时按空数组处理） */
const items = computed(() => props.menus ?? [])

/** 获取图标样式 */
function getIconStyle(menu: MenuItem) {
  return {
    backgroundColor: menu.iconColor ? `${menu.iconColor}20` : '#f5f5f5',
    color: menu.iconColor || '#666',
  }
}
</script>
