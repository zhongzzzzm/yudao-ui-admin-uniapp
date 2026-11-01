/**
 * 系统管理 - 数据权限规则
 *
 * 契约与后端 ganfanren-module-system 的 DataPermissionRuleController 对齐
 * （App 数据权限规则管理页专用）。
 */
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 数据权限条件（规则由若干条件按 logic 拼接） */
export interface DataPermissionCondition {
  /** 表别名（如 dept） */
  column: string
  /** 运算符（= / != / > / < / >= / <= / LIKE / IN / NOT IN 等） */
  operator: string
  /** 值类型：value 静态值 / sql 原生表达式 */
  valueType: string
  /** 条件值 */
  value: string
  /** 与前一条件的连接逻辑：AND / OR */
  logic: string
}

/** 数据权限规则 */
export interface DataPermissionRule {
  id?: number
  /** 规则名称 */
  name: string
  /** 目标表名 */
  tableName: string
  /** 过滤条件列表 */
  conditions: DataPermissionCondition[]
  /** 状态：0 开启 1 禁用 */
  status: number
  /** 备注 */
  remark?: string
  createTime?: string
}

/** 获得数据权限规则分页 */
export function getDataPermissionRulePage(params: PageParam & { name?: string, tableName?: string, status?: number }) {
  return http.get<PageResult<DataPermissionRule>>('/system/data-permission-rule/page', params)
}

/** 获得数据权限规则详情 */
export function getDataPermissionRule(id: number) {
  return http.get<DataPermissionRule>(`/system/data-permission-rule/get?id=${id}`)
}

/** 获得全部启用状态的规则精简列表（角色数据权限弹窗用） */
export function getSimpleDataPermissionRuleList() {
  return http.get<DataPermissionRule[]>('/system/data-permission-rule/simple-list')
}

/** 创建数据权限规则 */
export function createDataPermissionRule(data: DataPermissionRule) {
  return http.post<number>('/system/data-permission-rule/create', data)
}

/** 修改数据权限规则 */
export function updateDataPermissionRule(data: DataPermissionRule) {
  return http.put<boolean>('/system/data-permission-rule/update', data)
}

/** 删除数据权限规则 */
export function deleteDataPermissionRule(id: number) {
  return http.delete<boolean>(`/system/data-permission-rule/delete?id=${id}`)
}

/** 获得引用指定规则的角色编号集合（删除前二次确认用） */
export function listDataPermissionRuleRoles(id: number) {
  return http.get<number[]>(`/system/data-permission-rule/list-roles?id=${id}`)
}

/** 预览规则效果（按当前登录用户视角生成 SQL 并执行 EXPLAIN 预检） */
export function previewDataPermissionRule(data: DataPermissionRule) {
  return http.post<string>('/system/data-permission-rule/preview', data)
}
