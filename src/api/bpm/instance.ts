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

/** 审批链预览节点（发起前按当前用户解析） */
export interface BpmPreviewNode {
  nodeKey: string // 节点标识
  nodeName: string // 节点名称
  nodeTypeName: string // 节点类型名称（审批/办理）
  approveModeName?: string // 审批方式名称（会签/或签等）
  assigneeNames?: string[] // 解析出的审批人姓名
  fallbackNames?: string[] // 兜底审批人姓名（原审批人解析为空时启用）
  selfSelect: boolean // 是否发起人自选（提交时选择）
  businessResolved: boolean // 是否由业务单据解析（发起时确定）
  assigneeEmpty: boolean // 规则解析为空（配了兜底则走兜底，否则发起会被拦截）
  conditionsText?: string // 流转条件说明
  timeoutHours?: number // 超时小时数（催办）
  timeoutAction?: number // 超时动作：2 自动通过 3 自动退回发起人
}

/** 审批链预览（发起前按当前用户解析：节点顺序 + 审批人 + 流转条件） */
export interface BpmPreview {
  definitionId: number // 流程定义编号
  definitionKey: string // 流程标识
  definitionName: string // 流程名称
  businessModule: string // 业务模块
  canStart: boolean // 当前用户是否在发起范围内
  nodes: BpmPreviewNode[] // 节点列表（按流转顺序）
}

/** 审批链预览（提交前选流程后调用） */
export function getBpmInstancePreview(definitionId: number) {
  return http.get<BpmPreview>('/bpm/instance/preview', { definitionId })
}
