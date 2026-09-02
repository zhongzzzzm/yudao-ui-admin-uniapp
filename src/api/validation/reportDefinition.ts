import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 报表表样（报表列定义） */
export interface ReportDefinitionVO {
  id: number // 编号
  reportId?: number // 报表编号
  reportName?: string // 报表名称
  name?: string // 列名
  description?: string // 描述
  columnIndex?: number // 列序号
  isKeyColumn?: number // 是否主键列：0否 1是
  status?: number // 状态（common_status）
  createTime?: string // 创建时间
}

/** 获得报表表样分页 */
export function getReportDefinitionPage(params: PageParam & { reportId?: number, name?: string, columnIndex?: number, isKeyColumn?: number, status?: number }) {
  return http.get<PageResult<ReportDefinitionVO>>('/validation/report-definition/page', params)
}

/** 获得报表表样详情 */
export function getReportDefinition(id: number) {
  return http.get<ReportDefinitionVO>('/validation/report-definition/get', { id })
}

/** 新增报表表样 */
export function createReportDefinition(data: Partial<ReportDefinitionVO>) {
  return http.post<number>('/validation/report-definition/create', data)
}

/** 修改报表表样 */
export function updateReportDefinition(data: Partial<ReportDefinitionVO>) {
  return http.put<boolean>('/validation/report-definition/update', data)
}

/** 删除报表表样 */
export function deleteReportDefinition(id: number) {
  return http.delete<boolean>('/validation/report-definition/delete', undefined, { id })
}
