import { http } from '@/http/http'

/**
 * 分析看板（报送 / 校验 / 办税 / 财务四域经营统计汇总）。
 * 仅需登录即可访问，不要求版本管理权限。
 */

/** 报表填报与报送统计 */
export interface FilingDashboard {
  batchId?: number // 数据版本编号
  total: number // 总任务数
  pending: number // 待执行
  running: number // 执行中
  success: number // 执行成功
  fail: number // 执行失败
  ready: number // 底稿齐备可生成
  notReady: number // 缺底稿不可生成
  /** 综合阶段分布，key：waitGenerate/canGenerate/generating/generateFail/generated/waitReview/reviewDone/reviewError */
  stageDist: Record<string, number>
  reviewTotal: number // 复核记录总数
  reviewPending: number // 待复核
  reviewOk: number // 复核无误
  reviewError: number // 复核有误
  dueSoon: number // 报送截止日 7 日内临期
  overdue: number // 报送截止日已逾期
}

/** 报表校验统计 */
export interface ValidationStats {
  taskTotal: number // 校验任务总数
  taskRunning: number // 进行中
  taskFinished: number // 完成
  taskFailed: number // 失败
  ruleTotal: number // 校验结果总数（规则数）
  rulePassed: number // 校验通过规则数
  ruleFailed: number // 校验失败规则数
  errorRecordCount: number // 错误记录数合计
}

/** 办税台账统计 */
export interface TaxStats {
  pending: number // 待办
  done: number // 已办结
  dueSoon: number // 申报截止日 7 日内临期
  overdue: number // 申报截止日已逾期
}

/** 财务处理统计 */
export interface FinStats {
  processing: number // 异步数据处理中
  failed: number // 异步数据处理失败
}

/** 分析页汇总 */
export interface DashboardSummary {
  batchId?: number // 数据版本编号
  filing: FilingDashboard // 报表填报与报送
  validation: ValidationStats // 报表校验
  tax: TaxStats // 办税台账
  fin: FinStats // 财务处理
}

/** 查询分析页汇总统计（不传 batchId 则取当前启用数据版本） */
export function getDashboardSummary(batchId?: number) {
  return http.get<DashboardSummary>('/dashboard/summary', batchId === undefined ? {} : { batchId })
}

/** 数据版本下拉选项（分析页专用，登录即可访问） */
export interface DashboardBatchOption {
  id: number // 主键
  batchDate?: string // 数据日期
  description?: string // 描述
}

/** 查询分析页数据版本下拉选项 */
export function getDashboardBatches() {
  return http.get<DashboardBatchOption[]>('/dashboard/batches')
}
