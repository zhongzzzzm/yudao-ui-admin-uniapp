import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 通用申请单（标题 / 事由 / 金额 / 附件）。
 * 列表服务端固定只看本人发起（审批人经审批详情页内嵌面板取数）；
 * 草稿、已驳回状态可编辑/重新提交/删除。
 */

/** 申请单状态：0 草稿 1 审批中 2 已通过 3 已驳回 4 已作废 */

/** 通用申请单 */
export interface BpmGeneralApplyVO {
  id: number // 编号
  title: string // 申请标题
  reason: string // 申请事由
  amount: number // 申请金额（元）
  attachments?: string // 附件 JSON 数组 [{url, name}]
  status: number // 状态：0 草稿 1 审批中 2 已通过 3 已驳回 4 已作废
  createTime: string // 创建时间
}

/** 保存申请单（新建草稿 / 编辑）参数 */
export interface BpmGeneralApplySaveParams {
  id?: number // 编号（编辑时必传）
  title: string // 申请标题
  reason: string // 申请事由
  amount: number // 申请金额（元，可为 0）
  attachments?: string // 附件 JSON 数组 [{url, name}]
}

/** 提交审批参数（保存单据并发起流程，事务内完成） */
export interface BpmGeneralApplySubmitParams extends BpmGeneralApplySaveParams {
  definitionId: number // 审批流程定义 ID
  selfSelectAssignees?: Record<string, number[]> // 发起人自选审批人：nodeKey → 用户 ID 列表
}

/** 获得我的申请单分页（服务端固定按发起人 = 当前登录人过滤） */
export function getBpmGeneralApplyPage(params: PageParam & {
  status?: number // 状态筛选
  title?: string // 标题关键字
}) {
  return http.get<PageResult<BpmGeneralApplyVO>>('/bpm/general-apply/page', params)
}

/** 获得申请单详情（发起人或流程参与者可见） */
export function getBpmGeneralApply(id: number) {
  return http.get<BpmGeneralApplyVO>('/bpm/general-apply/get', { id })
}

/** 创建申请单（草稿），返回编号 */
export function createBpmGeneralApply(data: BpmGeneralApplySaveParams) {
  return http.post<number>('/bpm/general-apply/create', data)
}

/** 修改申请单（草稿/已驳回可改） */
export function updateBpmGeneralApply(data: BpmGeneralApplySaveParams) {
  return http.put<boolean>('/bpm/general-apply/update', data)
}

/** 删除申请单（草稿/已驳回可删） */
export function deleteBpmGeneralApply(id: number) {
  return http.delete<boolean>(`/bpm/general-apply/delete?id=${id}`)
}

/** 提交审批（保存单据并发起流程），返回流程实例编号 */
export function submitBpmGeneralApply(data: BpmGeneralApplySubmitParams) {
  return http.post<number>('/bpm/general-apply/submit', data)
}
