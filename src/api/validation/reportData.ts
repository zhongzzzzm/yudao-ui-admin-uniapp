import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 报表数据行（值为一行 JSON） */
export interface ReportDataVO {
  id: number // 编号
  reportId?: number // 报表ID
  reportName?: string // 报表名称
  batchId?: number // 数据版本ID
  batchDate?: string // 数据日期
  rowIndex?: number // 行序号
  value?: string // 行数据（JSON 字符串）
  createTime?: string // 创建时间
}

/** 获得报表数据分页（原始数据行查询） */
export function getReportDataPage(params: PageParam & { reportId?: number, batchId?: number, rowIndex?: number }) {
  return http.get<PageResult<ReportDataVO>>('/validation/report-data/page', params)
}

/** 新增报表数据行 */
/** 获得单条报表数据（按 id） */
export function getReportData(id: number) {
  return http.get<ReportDataVO>('/validation/report-data/get', { id })
}

export function createReportData(data: Partial<ReportDataVO>) {
  return http.post<number>('/validation/report-data/create', data)
}

/** 修改报表数据行 */
export function updateReportData(data: Partial<ReportDataVO>) {
  return http.put<boolean>('/validation/report-data/update', data)
}

/** 删除报表数据行 */
export function deleteReportData(id: number) {
  return http.delete<boolean>('/validation/report-data/delete', undefined, { id })
}

/** 校验结果文件（每任务每报表的 dat/log 产物） */
export interface ReportResultFileVO {
  id: number // 编号
  taskId?: number // 任务ID
  taskCode?: string // 任务编码
  reportId?: number // 报表ID
  reportName?: string // 报表名称
  datFile?: string // dat文件地址
  logFile?: string // log文件地址
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 获得校验结果文件分页 */
export function getReportResultFilePage(params: PageParam & { taskId?: number }) {
  return http.get<PageResult<ReportResultFileVO>>('/validation/report-result-file/page', params)
}

/** 数据重报登记 */
export interface ReportResubmitVO {
  id: number // 编号
  reportDate?: string // 数据日期
  batchNumber?: string // 重报批次号
  description?: string // 描述
  status?: number // 状态
  createTime?: string // 创建时间
}

/** 创建重报登记 */
export function createReportResubmit(data: Partial<ReportResubmitVO>) {
  return http.post<number>('/validation/report-resubmit/create', data)
}

/** 更新重报登记 */
export function updateReportResubmit(data: Partial<ReportResubmitVO>) {
  return http.put<boolean>('/validation/report-resubmit/update', data)
}

/** 删除重报登记 */
export function deleteReportResubmit(id: number) {
  return http.delete<boolean>('/validation/report-resubmit/delete', undefined, { id })
}

/** 获得数据重报分页 */
export function getReportResubmitPage(params: PageParam & { reportDate?: string }) {
  return http.get<PageResult<ReportResubmitVO>>('/validation/report-resubmit/page', params)
}
