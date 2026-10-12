/**
 * 轻量审批引擎 - 任务处理（App 办理页专用）
 *
 * 任务动作按"个人待办处理人"在服务端校验；办理节点仅可提交办理（不允许驳回/退回），
 * 审批节点才可审批通过/驳回——两类节点的动作集互斥。
 */
import { http } from '@/http/http'

/** 保存当前节点"可编辑"字段的修改（引擎按字段权限校验并留痕 old→new） */
export function saveBpmTaskFields(taskId: number, changes: Record<string, string>) {
  return http.put<boolean>('/bpm/task/save-fields', { changes, taskId })
}

/** 提交办理（仅办理节点，抢占式：任一办理人提交即节点完成） */
export function submitBpmTaskHandle(taskId: number, comment?: string) {
  return http.put<boolean>('/bpm/task/handle', { comment, taskId })
}

// ========== App 审批待办（2026-09-13 批次：移动端补齐审批能力） ==========

/** 待办/已办任务（含实例摘要） */
export interface BpmTask {
  id: number
  instanceId: number
  nodeKey: string
  nodeName: string
  round: number
  status: number // 0 待审批 1 已通过 2 已驳回 3 已失效
  comment?: string
  handleTime?: string
  createTime: string
  nodeType: number // 1 审批 2 办理
  businessTitle?: string
  instanceStatus?: number
  businessModule?: string
}

/** 审批详情（与 PC 端 BpmInstanceDetailRespVO 同构，移动端只读渲染 + 通过/驳回） */
export interface BpmDetailNode {
  nodeKey: string
  nodeName: string
  nodeType?: number
}

export interface BpmDetailTask {
  id: number
  nodeKey: string
  nodeName: string
  round: number
  assigneeUserId: number
  status: number
  comment?: string
  handleTime?: string
  taskType: number
  nodeType?: number
  createTime: string
}

export interface BpmDetailOpLog {
  id: number
  round: number
  opType: number
  operatorUserId: number
  detail?: string
  createTime: string
}

export interface BpmDetail {
  id: number
  businessModule: string
  businessId: string
  businessTitle: string
  initiatorUserId: number
  currentNodeKey?: string
  currentNodeName?: string
  currentNodeType?: number
  round: number
  status: number
  withdrawn?: boolean
  voidReason?: string
  createTime: string
  nodes: BpmDetailNode[]
  tasks: BpmDetailTask[]
  opLogs: BpmDetailOpLog[]
  canApprove: boolean
  canHandle: boolean
  canRemind?: boolean
  resumeNodeKey?: string
}

/** 我的待办分页（nodeType 筛选：1 审批 2 办理，空查全部） */
export function getBpmTodoPage(params: { businessTitle?: string, nodeType?: number, pageNo: number, pageSize: number }) {
  return http.get<{ list: BpmTask[], total: number }>('/bpm/task/todo-page', params)
}

/** 我的待办数量（顶栏角标用） */
export function getBpmTodoCount() {
  return http.get<{ count: number }>('/bpm/task/todo-count')
}

/** 审批详情（taskId 待办入口 / instanceId 回看入口） */
export function getBpmTaskDetail(params: { instanceId?: number, taskId?: number }) {
  return http.get<BpmDetail>('/bpm/task/detail', params)
}

/** 审批通过（仅审批节点；意见按节点配置强校验） */
export function approveBpmTask(taskId: number, comment?: string) {
  return http.put<boolean>('/bpm/task/approve', { comment, taskId })
}

/** 驳回（意见必填；returnMode：restart 重走流程（默认）/ resume 退回发起人不重走） */
export function rejectBpmTask(taskId: number, comment: string, returnMode?: 'restart' | 'resume') {
  return http.put<boolean>('/bpm/task/reject', { comment, returnMode, taskId })
}

/** 退回已通过节点（实例保持进行中，目标节点重新处理） */
export function returnBpmTask(taskId: number, comment: string, targetNodeKey: string) {
  return http.put<boolean>('/bpm/task/return', { comment, targetNodeKey, taskId })
}

/** 手动催办（发起人，24 小时限频） */
export function remindBpmInstance(instanceId: number) {
  return http.put<boolean>('/bpm/task/remind', { instanceId })
}

/** 我的已办分页（已处理的审批/办理任务回看，含实例摘要） */
export function getBpmDonePage(params: { pageNo: number, pageSize: number }) {
  return http.get<{ list: BpmTask[], total: number }>('/bpm/task/done-page', params)
}
