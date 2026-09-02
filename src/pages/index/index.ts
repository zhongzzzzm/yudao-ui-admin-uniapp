import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useAccess } from '@/hooks/useAccess'
import { isTabBarPage } from '@/tabbar/config'
import { parseUrl, setTabParams } from '@/utils/url'
import menuConfig from './menu.json'

/**
 * 工作台菜单数据
 *
 * 菜单结构为三层：分组(group) ▸ 二级分组(subGroup) ▸ 菜单项(menu)。
 * 工作台、常用功能、搜索页共用同一份 menu.json 数据。
 */

/** 菜单项类型 */
export interface MenuItem {
  key: string // 菜单唯一标识
  name: string // 菜单名称
  icon: string // 菜单图标（支持 @wot-ui/ui 图标名或图片路径）
  url?: string // 跳转路径
  iconColor?: string // 图标颜色（可选）
  permission?: string // 权限标识（可选）
  permissions?: string[] // 权限标识列表（任一匹配即展示）
}

/** 二级分组类型 */
export interface MenuSubGroup {
  key: string // 二级分组唯一标识
  name: string // 二级分组名称（空字符串表示不展示小标题，直接平铺菜单）
  menus: MenuItem[] // 二级分组下的菜单列表
}

/** 菜单分组类型 */
export interface MenuGroup {
  key: string // 分组唯一标识
  name: string // 分组名称
  subGroups: MenuSubGroup[] // 二级分组列表
  menus: MenuItem[] // 分组下的全部菜单（由二级分组拍平得到，便于搜索/常用等场景）
}

/** menu.json 的原始结构（未做权限过滤） */
interface RawSubGroup {
  key: string
  name: string
  menus: MenuItem[]
}
interface RawGroup {
  key: string
  name: string
  subGroups: RawSubGroup[]
}

const groupsData = (menuConfig as { groups: RawGroup[] }).groups

/** 判断菜单是否有访问权限 */
function hasMenuAccess(item: MenuItem, hasAccessByCodes: (codes: string[]) => boolean) {
  const permissions = [
    item.permission,
    ...(item.permissions || []),
  ].filter(Boolean) as string[]
  return permissions.length === 0 || hasAccessByCodes(permissions)
}

/**
 * 获取所有菜单分组数据（带权限过滤）
 *
 * 逐二级分组过滤掉没有权限的菜单项；二级分组为空则丢弃；整个分组无菜单则不展示。
 * 分组、二级分组、菜单的展示顺序均以 menu.json 中的排列顺序为准。
 */
export function getMenuGroups(): MenuGroup[] {
  const { hasAccessByCodes } = useAccess()
  const result: MenuGroup[] = []
  for (const group of groupsData) {
    const subGroups: MenuSubGroup[] = []
    for (const sub of group.subGroups) {
      // 没有配置权限的菜单项默认展示
      const menus = sub.menus.filter(menu => hasMenuAccess(menu, hasAccessByCodes))
      if (menus.length > 0) {
        subGroups.push({ key: sub.key, name: sub.name, menus })
      }
    }
    if (subGroups.length === 0) {
      continue
    }
    result.push({
      key: group.key,
      name: group.name,
      subGroups,
      menus: subGroups.flatMap(sub => sub.menus),
    })
  }
  return result
}

/** 获取所有菜单项（扁平化） */
export function getAllMenuItems(): MenuItem[] {
  return getMenuGroups().flatMap(group => group.menus)
}

/** 根据 key 获取菜单项 */
export function getMenuItemByKey(key: string): MenuItem | undefined {
  return getAllMenuItems().find(item => item.key === key)
}

/** 可搜索菜单项（带分组上下文，便于搜索结果展示「所属模块」） */
export interface SearchableMenuItem extends MenuItem {
  groupName: string // 所属分组名
  subName: string // 所属二级分组名
}

/** 获取所有可搜索菜单（带分组上下文，已做权限过滤） */
export function getSearchableMenus(): SearchableMenuItem[] {
  const result: SearchableMenuItem[] = []
  for (const group of getMenuGroups()) {
    for (const sub of group.subGroups) {
      for (const menu of sub.menus) {
        result.push({ ...menu, groupName: group.name, subName: sub.name })
      }
    }
  }
  return result
}

/**
 * 菜单跳转逻辑（菜单网格、搜索页共用）
 *
 * 处理：开发中提示、tabBar 页 switchTab、普通页 navigateTo、失败兜底。
 */
export function useMenuNavigate() {
  const toast = useToast()

  function navigateToMenu(menu: MenuItem) {
    if (!menu.url) {
      toast.show('功能开发中')
      return
    }

    const { path, query } = parseUrl(menu.url)

    if (isTabBarPage(path)) {
      // switchTab 不接受 query 参数，改用 globalData 传递
      if (Object.keys(query).length > 0) {
        setTabParams(query)
      }
      uni.switchTab({
        url: path,
        fail: () => {
          toast.show('页面不存在')
        },
      })
    } else {
      uni.navigateTo({
        url: menu.url,
        fail: () => {
          toast.show('页面不存在')
        },
      })
    }
  }

  return { navigateToMenu }
}
