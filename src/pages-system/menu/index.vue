<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="菜单管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索菜单名称"
        hide-cancel
        @search="getList"
        @clear="getList"
      />
    </view>

    <!-- 菜单树列表（缩进 + 展开/收起） -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view
          v-for="row in rows"
          :key="row.menu.id"
          class="mb-16rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="flex items-center p-24rpx" @click="toggleExpand(row.menu)">
            <!-- 缩进 -->
            <view :style="{ width: `${row.depth * 32}rpx` }" class="flex-shrink-0" />
            <!-- 展开箭头（有子菜单才显示） -->
            <wd-icon
              v-if="row.menu.children && row.menu.children.length > 0"
              :name="expanded.has(row.menu.id!) ? 'arrow-down' : 'arrow-right'"
              size="28rpx"
              color="#999"
              custom-class="mr-12rpx"
            />
            <view v-else class="mr-12rpx h-28rpx w-28rpx flex-shrink-0" />
            <!-- 名称与类型 -->
            <view class="min-w-0 flex-1">
              <view class="flex items-center gap-12rpx">
                <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-500">
                  {{ row.menu.name }}
                </text>
                <view class="flex-shrink-0 rounded-full bg-gray-100 px-16rpx py-4rpx text-22rpx text-gray-500">
                  {{ typeLabel(row.menu.type) }}
                </view>
              </view>
              <view v-if="row.menu.path || row.menu.permission" class="line-clamp-1 mt-4rpx text-24rpx text-[#999]">
                {{ row.menu.permission || row.menu.path }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.menu.status" class="ml-12rpx flex-shrink-0" />
          </view>
          <!-- 操作：新增子菜单 / 编辑 / 删除 -->
          <view class="flex justify-end gap-16rpx border-t border-gray-50 px-24rpx py-16rpx">
            <wd-button
              v-if="row.menu.type !== 3 && hasAccessByCodes(['system:menu:create'])"
              size="small" plain @click.stop="handleAdd(row.menu.id!)"
            >
              子菜单
            </wd-button>
            <wd-button size="small" plain @click.stop="handleEdit(row.menu)">
              编辑
            </wd-button>
            <wd-button size="small" plain type="error" @click.stop="handleDelete(row.menu)">
              删除
            </wd-button>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && rows.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无菜单数据" />
        </view>
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:menu:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd(0)"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Menu } from '@/api/system/menu'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteMenu, getMenuList } from '@/api/system/menu'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'

defineOptions({
  name: 'SystemMenu',
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
const loading = ref(false) // 加载状态
const tree = ref<Menu[]>([]) // 树形菜单
const keyword = ref('') // 菜单名称关键字
const expanded = ref(new Set<number>()) // 已展开节点编号

/** 菜单类型文案：1 目录 2 菜单 3 按钮 */
function typeLabel(type?: number): string {
  return getDictLabel(DICT_TYPE.SYSTEM_MENU_TYPE, type) ?? '未知'
}

/** 树列表扁平化为展示行（仅展开的子级可见），根级默认展开 */
interface MenuRow {
  menu: Menu
  depth: number
}

const rows = computed<MenuRow[]>(() => {
  const result: MenuRow[] = []
  const walk = (menus: Menu[], depth: number) => {
    for (const menu of menus) {
      result.push({ depth, menu })
      if (menu.children && menu.children.length > 0 && expanded.value.has(menu.id!)) {
        walk(menu.children, depth + 1)
      }
    }
  }
  walk(tree.value, 0)
  return result
})

/** 展开/收起（无子级时切换到详情侧不做，仅展开） */
function toggleExpand(menu: Menu) {
  if (!menu.children || menu.children.length === 0) {
    return
  }
  const next = new Set(expanded.value)
  if (next.has(menu.id!)) {
    next.delete(menu.id!)
  } else {
    next.add(menu.id!)
  }
  expanded.value = next
}

/** 查询菜单列表（树形） */
async function getList() {
  loading.value = true
  try {
    const data = await getMenuList({ name: keyword.value.trim() || undefined })
    tree.value = handleTree(data ?? [])
    // 默认展开根级目录
    expanded.value = new Set(tree.value.map(item => item.id!).filter(Boolean))
  } finally {
    loading.value = false
  }
}

/** 新增菜单（可带父级） */
function handleAdd(parentId: number) {
  uni.navigateTo({ url: `/pages-system/menu/form/index?parentId=${parentId}` })
}

/** 编辑菜单 */
function handleEdit(menu: Menu) {
  uni.navigateTo({ url: `/pages-system/menu/form/index?id=${menu.id}` })
}

/** 删除菜单（有子菜单时后端会拒绝，提示见错误 toast） */
function handleDelete(menu: Menu) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除菜单【${menu.name}】？存在子菜单时需先删除子菜单。`,
  }).then(async () => {
    try {
      await deleteMenu(menu.id!)
      toast.success('删除成功')
      getList()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化 */
onMounted(() => {
  getList()
})

function handleBack() {
  navigateBackPlus()
}
</script>
