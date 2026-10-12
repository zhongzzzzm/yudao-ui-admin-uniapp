import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 金融企业财务快报（App 只读查看；上传合并、导出在 PC 端完成） */

/** 财务快报合并批次 */
export interface FinancialReportMergeVO {
  id: number // 编号
  description?: string // 备注
  currentPeriodFile?: string // 当期报表压缩包（资产负债表+利润表）
  lastYearPeriodFile?: string // 上年同期利润表压缩包
  result?: string // 生成的财务快报（JSON 指标数据）
  status?: number // 状态：0 处理中 1 处理完成 2 处理失败
  createTime?: number // 创建时间
}

/** 获得财务快报合并分页 */
export function getFinancialReportPage(params: PageParam) {
  return http.get<PageResult<FinancialReportMergeVO>>('/fin/financial-report/page', params)
}

/** 获得财务快报合并详情 */
export function getFinancialReport(id: number) {
  return http.get<FinancialReportMergeVO>('/fin/financial-report/get', { id })
}
