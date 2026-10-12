import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 指标级联重算日志（App 只读观测；触发与重算在 PC 端完成） */

/** 联动重算日志明细 */
export interface RecalcLogItemVO {
  id: number // 编号
  indicatorId: number // 指标 ID
  indicatorCode?: string // 指标编码
  indicatorName?: string // 指标名称
  depth: number // 级联层级（0=种子）
  parentIndicatorId?: number // 上游指标 ID
  parentIndicatorName?: string // 上游指标名称
  status: number // 状态：0 成功 1 失败
  errorMsg?: string // 失败原因
  costMs?: number // 耗时（毫秒）
}

/** 联动重算日志 */
export interface RecalcLogVO {
  id: number // 编号
  batchId: number // 数据版本 ID
  batchDate?: string // 数据版本日期
  triggerType: number // 触发方式：1 底稿上传 2 报表生成 3 手动计算 4 指标配置变更
  triggerSourceId?: number // 触发源 ID
  triggerDesc?: string // 触发源描述
  seedIndicatorIds?: string // 种子指标 ID 集合
  affectedIndicatorCount?: number // 受影响指标数
  cascadeDepth?: number // 级联深度
  status: number // 状态：0 进行中 1 成功 2 部分失败 3 失败
  successCount?: number // 成功数
  failCount?: number // 失败数
  createTime?: string // 创建时间
  items?: RecalcLogItemVO[] // 明细（详情返回）
}

/** 触发方式文案 */
export const RECALC_TRIGGER_LABELS: Record<number, string> = {
  1: '底稿上传',
  2: '报表生成',
  3: '手动计算',
  4: '指标配置变更',
}

/** 获得联动重算日志分页 */
export function getRecalcLogPage(params: PageParam & { status?: number }) {
  return http.get<PageResult<RecalcLogVO>>('/rpt/data-indicator-recalc-log/page', params)
}

/** 获得联动重算日志详情（含明细） */
export function getRecalcLog(id: number) {
  return http.get<RecalcLogVO>('/rpt/data-indicator-recalc-log/get', { id })
}
