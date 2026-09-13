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
