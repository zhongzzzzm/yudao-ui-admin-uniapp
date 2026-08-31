<template>
  <view class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx bg-white">
    <view class="flex items-center justify-between px-24rpx pt-20rpx">
      <text class="text-28rpx text-[#333] font-500">常用功能</text>
      <text class="text-24rpx text-[#018d71]" @click="toggleEdit">{{ editing ? '完成' : '编辑 ›' }}</text>
    </view>

    <!-- 常用宫格（自绘 flex 布局，间距行高完全可控） -->
    <view class="flex flex-wrap pb-12rpx">
      <view
        v-for="item in editingItems"
        :key="item.key"
        class="w-1/4 flex flex-col items-center py-20rpx"
        @click="handleTileClick(item)"
      >
        <view
          class="relative h-80rpx w-80rpx flex flex-shrink-0 items-center justify-center rounded-16rpx"
          :style="getTileStyle(item)"
        >
          <wd-icon :name="item.icon" size="44rpx" :color="item.iconColor" />
          <!-- 编辑态：删除角标 -->
          <view
            v-if="editing && item.key !== ADD_KEY"
            class="absolute h-36rpx w-36rpx flex items-center justify-center rounded-full bg-[#f5222d] -right-10rpx -top-10rpx"
            @click.stop="removeItem(item.key)"
          >
            <wd-icon name="close" size="24rpx" color="#fff" />
          </view>
        </view>
        <text class="line-clamp-2 mt-12rpx w-140rpx text-center text-24rpx text-[#333] leading-32rpx">
          {{ item.name }}
        </text>
      </view>
    </view>

    <!-- 添加功能弹层 -->
    <wd-popup v-model="showPicker" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-60vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          添加常用功能
        </view>
        <view
          v-for="menu in candidates"
          :key="menu.key"
          class="flex items-center justify-between border-b border-b-[#f7f8f9] py-20rpx last:border-b-0"
          @click="addItem(menu)"
        >
          <view class="flex items-center">
            <view class="mr-16rpx h-64rpx w-64rpx flex items-center justify-center rounded-12rpx" :style="getTileStyle(menu)">
              <wd-icon :name="menu.icon" size="40rpx" :color="menu.iconColor" />
            </view>
            <text class="text-28rpx text-[#333]">{{ menu.name }}</text>
          </view>
          <wd-icon name="plus" size="36rpx" color="#018d71" />
        </view>
        <view v-if="candidates.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          全部功能都已添加
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { MenuItem } from '../index'
import { computed, onMounted, ref } from 'vue'
import { getWorkbenchItemList, updateWorkbenchItemList } from '@/api/system/workbench'
import { useUserStore } from '@/store/user'
import { getMenuGroups, getMenuItemByKey, useMenuNavigate } from '../index'

defineOptions({
  name: 'FavoriteGrid',
})

const MAX_FAVORITES = 12
const MIN_FAVORITES = 4
const ADD_KEY = '__add__'

/** 默认常用项 key（无任何配置时的兜底） */
const DEFAULT_KEYS = ['rpt-filing', 'rpt-review', 'rpt-source-file', 'tax-ledger', 'validation-report-task', 'contact', 'fin-invoice-ledger', 'user']

const { navigateToMenu } = useMenuNavigate()
const userStore = useUserStore()

const showPicker = ref(false)
const editing = ref(false)
const favoriteItems = ref<MenuItem[]>([])

/** 可添加的候选：全部菜单中不在常用里的项 */
const candidates = computed(() => {
  const selected = new Set(favoriteItems.value.map(item => item.key))
  return getMenuGroups().flatMap(group => group.menus.filter(menu => !selected.has(menu.key)))
})

/** 编辑态渲染：常用项 + 「添加」占位 */
const editingItems = computed(() => {
  if (!editing.value) {
    return favoriteItems.value
  }
  return favoriteItems.value.length < MAX_FAVORITES
    ? [...favoriteItems.value, { key: ADD_KEY, name: '添加', icon: 'plus', iconColor: '#018d71' } as MenuItem]
    : favoriteItems.value
})

function getTileStyle(item: MenuItem) {
  return {
    backgroundColor: item.iconColor ? `${item.iconColor}20` : '#f5f5f5',
    color: item.iconColor || '#666',
  }
}

/**
 * 初始化常用项：后端工作台配置 → 本地收藏 → 默认配置
 * 后端同步失败时静默回退，不阻塞首屏
 */
async function initFavorites() {
  const fallback = () => {
    const keys = userStore.favoriteMenus?.length ? userStore.favoriteMenus : DEFAULT_KEYS
    favoriteItems.value = keys
      .map(key => getMenuItemByKey(key))
      .filter(Boolean) as MenuItem[]
  }
  try {
    const items = await getWorkbenchItemList()
    const navItems = (items || [])
      .filter(item => item.type === 2 && item.status !== 1)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    const allMenus = getMenuGroups().flatMap(group => group.menus)
    const resolved = navItems
      .map(item => allMenus.find(menu => menu.url === item.url))
      .filter(Boolean) as MenuItem[]
    if (resolved.length) {
      favoriteItems.value = resolved
      userStore.favoriteMenus = resolved.map(item => item.key)
    } else {
      fallback()
    }
  } catch {
    fallback()
  }
}

function toggleEdit() {
  if (editing.value) {
    persistFavorites()
  }
  editing.value = !editing.value
}

/** 编辑态点击：添加占位打开选择弹层；普通态点击走跳转 */
function handleTileClick(item: MenuItem) {
  if (editing.value) {
    if (item.key === ADD_KEY) {
      showPicker.value = true
    }
    return
  }
  navigateToMenu(item)
}

function removeItem(key: string) {
  if (favoriteItems.value.length <= MIN_FAVORITES) {
    uni.showToast({ title: `至少保留 ${MIN_FAVORITES} 个`, icon: 'none' })
    return
  }
  favoriteItems.value = favoriteItems.value.filter(item => item.key !== key)
}

function addItem(item: MenuItem) {
  if (favoriteItems.value.length >= MAX_FAVORITES) {
    uni.showToast({ title: `最多添加 ${MAX_FAVORITES} 个`, icon: 'none' })
    return
  }
  favoriteItems.value = [...favoriteItems.value, item]
  if (candidates.value.length === 0) {
    showPicker.value = false
  }
}

/** 持久化：本地 userStore + 后端工作台配置（失败静默） */
function persistFavorites() {
  const keys = favoriteItems.value.map(item => item.key)
  userStore.favoriteMenus = keys
  syncWorkbench(keys)
}

async function syncWorkbench(keys: string[]) {
  try {
    const existing = await getWorkbenchItemList()
    const keyToMenu = new Map(getMenuGroups().flatMap(g => g.menus).map(m => [m.key, m]))
    const items = keys
      .map(key => keyToMenu.get(key))
      .filter(Boolean)
      .map((menu, idx) => {
        const prev = existing.find(item => item.type === 2 && item.url === menu!.url)
        return {
          id: prev?.id,
          type: 2,
          title: menu!.name,
          url: menu!.url!,
          icon: menu!.icon,
          color: menu!.iconColor,
          sort: idx + 1,
        }
      })
    await updateWorkbenchItemList(items)
  } catch {
    // 后端同步失败不影响本地配置
  }
}

onMounted(() => {
  initFavorites()
})
</script>
