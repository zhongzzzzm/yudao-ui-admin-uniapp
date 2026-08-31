import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 报送任务综合阶段 */
export const FILING_COMBINED_STAGE = {
  waitGenerate: '待生成',
  canGenerate: '可生成',
  generating: '生成中',
  generateFail: '生成失败',
  generated: '已生成',
  waitReview: '待复核',
  reviewDone: '复核完成',
  reviewError: '复核有误',
} as const

/** 报送任务综合阶段 → 状态标签类型（列表页配色用） */
export const FILING_STAGE_TAG_TYPE: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  waitGenerate: 'info',
  canGenerate: 'primary',
  generating: 'primary',
  generateFail: 'error',
  generated: 'success',
  waitReview: 'warning',
  reviewDone: 'success',
  reviewError: 'error',
}

/** 报送任务台账分页请求参数 */
export interface TaxReportFilingPageReqVO extends PageParam {
  keyword?: string // 关键字（模糊匹配模板名称/报送名称）
  templateId?: number // 关联模板ID
  submitId?: number // 报送ID
  batchId?: number // 数据版本
  submitDeadline?: string // 报送截止日期（yyyy-MM-dd）
  status?: number // 状态
  availability?: string // ready=可生成，notReady=缺底稿
  createTime?: string[] // 创建时间区间
  myReviewPending?: boolean // 只查「待我复核」
  combinedStatus?: string // 综合任务阶段（waitGenerate/canGenerate/...）
}

/** 报送任务台账 */
export interface TaxReportFilingVO {
  id: number // 编号
  templateId: number // 关联模板ID
  batchId?: number // 数据版本
  submitDeadline?: string // 报送截止日期（yyyy-MM-dd）
  templateName?: string // 关联模板名称
  submitId?: number // 报送ID
  submitName?: string // 报送名称
  status: number // 状态（字典 TAX_REPORT_FILING_STATUS）
  sourceFiles?: string // 来源文件映射JSON
  resultFile?: string // 结果文件路径
  errorMsg?: string // 失败原因
  available?: boolean // 当前数据版本下能否生成
  missingDraftNames?: string[] // 缺失底稿名称
  missingReportNames?: string[] // 缺失前置报表名称
  missingConfigNames?: string[] // 缺失配置项
  reviewTotalCount?: number // 需复核部门总数
  reviewDoneCount?: number // 已复核部门数
  reviewPendingCount?: number // 待复核部门数
  reviewHasError?: boolean // 是否复核有误
  reviewPendingForMe?: boolean // 本部门是否有待复核记录
  combinedStage?: string // 综合任务阶段
  createTime: string // 创建时间
}

/** 报送任务台账统计 */
export interface TaxReportFilingStatsVO {
  batchId?: number // 数据版本ID（空为全部）
  total: number // 总任务数
  pending: number // 待执行
  running: number // 执行中
  success: number // 执行成功
  fail: number // 执行失败
  ready: number // 当前可生成
  notReady: number // 缺底稿不可生成
}

/** 单元格填充日志 */
export interface FilingCellLogVO {
  id: number // 编号
  filingId: number // 报表任务ID
  mappingId?: number // 单元格映射ID
  cellRef?: string // 目标单元格（如 B12）
  sourceType?: number // 1=来源Excel单元格 2=公式计算 3=固定值 5=数据指标
  fillValue?: string // 实际填充值
  hitStatus?: number // 0命中 1未命中/跳过 2失败
  sourceDesc?: string // 来源描述
  errorMsg?: string // 未命中/失败原因
  indicatorName?: string // 指标名称
  memberName?: string // 维度成员名称
}

/** 结果文件解析网格 */
export interface ResultGridVO {
  sheets: {
    name: string // Sheet 名
    rows: string[][] // 行数据（下标0=A列）
  }[]
}

/** 获得报送任务台账分页 */
export function getTaxReportFilingPage(params: TaxReportFilingPageReqVO) {
  return http.get<PageResult<TaxReportFilingVO>>('/rpt/tax-report-filing/page', params)
}

/** 获得报送任务台账详情 */
export function getTaxReportFiling(id: number) {
  return http.get<TaxReportFilingVO>('/rpt/tax-report-filing/get', { id })
}

/** 获得报送任务台账统计 */
export function getTaxReportFilingStats(batchId?: number) {
  return http.get<TaxReportFilingStatsVO>('/rpt/tax-report-filing/stats', { batchId })
}

/** 异步执行报表生成（立即返回，后台生成） */
export function executeTaxReportFilingAsync(filingId: number, sourceFiles?: string) {
  return http.post<boolean>('/rpt/tax-report-filing/execute-async', undefined, { filingId, sourceFiles })
}

/** 获得报送任务的结果文件网格 */
export function getTaxReportFilingResultGrid(id: number) {
  return http.get<ResultGridVO>(`/rpt/tax-report-filing/${id}/result-grid`)
}

/** 获得报送任务的单元格填充日志 */
export function getTaxReportFilingCellLogs(id: number, cellRef?: string, hitStatus?: number) {
  return http.get<FilingCellLogVO[]>(`/rpt/tax-report-filing/${id}/cell-logs`, { cellRef, hitStatus })
}
