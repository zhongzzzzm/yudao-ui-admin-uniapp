/**
 * 轻量审批引擎 - 审批详情（查看流程共用）
 *
 * 后端各业务模块提供「按业务单据取审批实例 + 任务时间线」的包装接口
 * （如 /tax/ledger/review-flow、/rpt/tax-report-filing-review/flow-by-filing），
 * 返回本文件定义的实例详情结构；App 侧用 <fg-bpm-flow> 组件渲染时间线。
 */

/** 审批实例详情（待办/已办/申请共用，App 侧只做只读展示） */
export interface BpmInstanceDetailVO {
  id: number // 实例编号
  definitionId: number // 流程定义编号
  definitionKey: string // 流程标识
  definitionVersion: number // 流程定义版本
  businessModule: string // 业务功能节点标识（如 tax_ledger_review / rpt_filing_review）
  businessId: string // 业务单据 id
  businessTitle: string // 实例标题（如：海生贸易 增值税 2026-09）
  initiatorUserId: number // 发起人用户编号
  currentNodeKey?: string // 当前节点标识
  currentNodeName?: string // 当前节点名称
  currentNodeType?: number // 当前节点类型：1 审批 2 办理
  lastPassNodeName?: string // 最后办结节点名称
  lastPassUserId?: number // 最后办结人用户编号
  round: number // 轮次（驳回重提 +1）
  status: number // 实例状态：1 审批中 / 2 已办结 / 3 已驳回 / 4 已作废
  voidReason?: string // 作废原因
  createTime: string // 发起时间
  /** 审批记录（含各轮次与失效任务） */
  tasks?: BpmInstanceTaskVO[]
  /** 操作日志（提交/通过/驳回/撤回/作废/办结撤销/字段修改/重新提交等） */
  opLogs?: BpmInstanceOpLogVO[]
}

/** 审批任务记录（时间线每一行） */
export interface BpmInstanceTaskVO {
  id: number // 任务编号
  nodeKey: string // 节点标识
  nodeName: string // 节点名称（审批环节）
  round: number // 轮次
  assigneeUserId?: number // 审批人用户编号
  status: number // 任务状态：0 待审批 / 1 已通过 / 2 已驳回 / 3 已失效
  comment?: string // 审批意见
  handleTime?: string // 审批时间
  createTime?: string // 任务生成时间
}

/** 实例操作日志 */
export interface BpmInstanceOpLogVO {
  id: number // 日志编号
  round: number // 轮次
  opType: number // 操作类型（bpm_op_type 字典）
  operatorUserId?: number // 操作人用户编号
  detail?: string // 操作说明
  createTime: string // 操作时间
}
