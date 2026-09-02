import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 规则类型定义 */
export interface ReportRuleTypeVO {
  id: number // 编号
  name?: string // 名称
  description?: string // 备注
  status?: number // 状态（common_status）
  createTime?: string // 创建时间
}

/** 获得规则类型分页 */
export function getReportRuleTypePage(params: PageParam & { name?: string }) {
  return http.get<PageResult<ReportRuleTypeVO>>('/validation/report-rule-type/page', params)
}

/** 获得规则类型列表（下拉数据源） */
export function getReportRuleTypeList() {
  return http.get<ReportRuleTypeVO[]>('/validation/report-rule-type/list')
}

/** 获得规则类型详情 */
export function getReportRuleType(id: number) {
  return http.get<ReportRuleTypeVO>('/validation/report-rule-type/get', { id })
}

/** 新增规则类型 */
export function createReportRuleType(data: Partial<ReportRuleTypeVO>) {
  return http.post<number>('/validation/report-rule-type/create', data)
}

/** 修改规则类型 */
export function updateReportRuleType(data: Partial<ReportRuleTypeVO>) {
  return http.put<boolean>('/validation/report-rule-type/update', data)
}

/** 删除规则类型 */
export function deleteReportRuleType(id: number) {
  return http.delete<boolean>('/validation/report-rule-type/delete', undefined, { id })
}

/** 按规则类型批量执行校验（选数据版本） */
export function validateReportRuleType(ids: number[], batchId: number) {
  return http.post<boolean>('/validation/report-rule-type/validate', undefined, { ids: ids.join(','), batchId })
}
