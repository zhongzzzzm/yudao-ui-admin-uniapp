import { http } from '@/http/http'

/** 工作台自定义项 */
export interface WorkbenchItemVO {
  id?: number // 编号
  userId?: number // 用户ID
  type: number // 1=外部链接 2=站内导航
  title: string // 标题
  url: string // 跳转地址
  icon?: string // iconify 图标名
  color?: string // 颜色
  groupName?: string // 分组名（外部链接）
  content?: string // 描述（外部链接）
  sort?: number // 排序
  status?: number // 0开启 1禁用
  createTime?: string // 创建时间
}

/** 工作台自定义项保存请求 */
export interface WorkbenchItemSaveReqVO {
  id?: number // 编号
  type: number // 1=外部链接 2=站内导航（必填）
  title: string // 标题，≤50 字（必填）
  url: string // 跳转地址，≤512 字符（必填）
  icon?: string // iconify 图标名，≤100 字符
  color?: string // 颜色，≤20 字符
  groupName?: string // 分组名，≤100 字符
  content?: string // 描述，≤255 字符
  sort?: number // 排序
}

/** 获得当前登录用户的工作台项列表 */
export function getWorkbenchItemList() {
  return http.get<WorkbenchItemVO[]>('/system/workbench/get')
}

/** 保存当前登录用户的工作台项列表 */
export function updateWorkbenchItemList(items: WorkbenchItemSaveReqVO[]) {
  return http.put<boolean>('/system/workbench/update', { items })
}
