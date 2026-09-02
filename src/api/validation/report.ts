import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 报表定义（报表管理） */
export interface ReportVO {
  id: number // 编号
  category?: number // 分类（规则类型ID）
  categoryName?: string // 分类名称
  name?: string // 名字
  code?: string // 编码
  file?: string // 数据文件
  reportDate?: string // 数据日期
  description?: string // 描述
  status?: number // 状态（common_status）
  dataStatus?: number // 数据状态（validation_data_status）
  updated?: boolean // 更新数据
  createTime?: string // 创建时间
}

/** 获得报表定义分页 */
export function getReportPage(params: PageParam & { category?: number, name?: string, code?: string, status?: number, dataStatus?: number }) {
  return http.get<PageResult<ReportVO>>('/validation/report/page', params)
}

/** 获得报表定义列表（下拉数据源） */
export function getReportList() {
  return http.get<ReportVO[]>('/validation/report/list')
}

/** 获得报表定义详情 */
export function getReport(id: number) {
  return http.get<ReportVO>('/validation/report/get', { id })
}

/** 新增报表定义 */
export function createReport(data: Partial<ReportVO>) {
  return http.post<number>('/validation/report/create', data)
}

/** 修改报表定义 */
export function updateReport(data: Partial<ReportVO>) {
  return http.put<boolean>('/validation/report/update', data)
}

/** 删除报表定义 */
export function deleteReport(id: number) {
  return http.delete<boolean>('/validation/report/delete', undefined, { id })
}

/** 按报表执行校验（选数据版本） */
export function validateReport(ids: number[], batchId: number) {
  return http.get<boolean>('/validation/report/validate', { ids: ids.join(','), batchId })
}

/** 按报表执行对比（选历史/当前数据版本） */
export function compareReport(ids: number[], hisBatchId: number, cmpBatchId: number) {
  return http.get<boolean>('/validation/report/compare', { ids: ids.join(','), hisBatchId, cmpBatchId })
}

/** 清除所选报表下的数据 */
export function deleteReportData(ids: number[]) {
  return http.delete<boolean>('/validation/report/deleteData', undefined, { ids: ids.join(',') })
}
