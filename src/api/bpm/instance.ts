import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 审批实例（App 只读查看 + 发起人撤回/催办）。
 * `/bpm/instance/page` 服务端强制按发起人=当前登录人过滤，即「我的申请」。
 */

/** 审批实例（我的申请） */
export interface BpmInstanceVO {
  id: number // 编号
  definitionId: number // 流程定义 ID
  definitionKey: string // 流程定义 key
  definitionVersion: number // 流程定义版本
  businessModule: string // 业务模块
  businessId: string // 业务单据 ID
  businessTitle: string // 单据标题
  initiatorUserId: number // 发起人 ID
  currentNodeKey?: string // 当前节点 key
  currentNodeName?: string // 当前节点名称
  lastPassNodeKey?: string // 最近通过节点 key
  lastPassNodeName?: string // 最近通过节点名称
  lastPassUserId?: number // 最近通过的处理人
  round: number // 当前轮次
  status: number // 实例状态：1 进行中 2 已办结 3 已驳回 4 已作废
  withdrawn?: boolean // 已驳回时区分：true 发起人主动撤回 / false 被驳回
  voidReason?: string // 作废原因
  createTime: string // 发起时间
}

/** 获得我的申请分页（服务端强制发起人=当前登录人） */
export function getBpmInstancePage(params: PageParam & {
  businessModule?: string // 业务模块筛选
  status?: number // 实例状态筛选
  title?: string // 标题关键字
}) {
  return http.get<PageResult<BpmInstanceVO>>('/bpm/instance/page', params)
}

/** 发起人撤回（进行中 → 已驳回，撤回后可在 PC 端重新提交） */
export function cancelBpmInstance(id: number) {
  return http.put<boolean>('/bpm/instance/cancel', { id })
}
