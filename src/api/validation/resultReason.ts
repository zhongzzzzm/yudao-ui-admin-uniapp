import { http } from '@/http/http'

/** 校验错误原因（规则结果的纠正原因） */
export interface ReportResultReasonVO {
  id?: number // 编号（新增时无需传）
  resultId?: number // 规则校验结果ID
  taskId?: number // 校验任务ID
  reason?: string // 原因
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 按校验结果获取纠正原因列表 */
export function getReportResultReasonByResultId(resultId: number) {
  return http.get<ReportResultReasonVO[]>('/validation/report-result-reason/getReason', { resultId })
}

/** 新增纠正原因 */
export function createReportResultReason(data: ReportResultReasonVO) {
  return http.post<number>('/validation/report-result-reason/create', data)
}

/** 修改纠正原因 */
export function updateReportResultReason(data: ReportResultReasonVO) {
  return http.put<boolean>('/validation/report-result-reason/update', data)
}

/** 删除纠正原因 */
export function deleteReportResultReason(id: number) {
  return http.delete<boolean>('/validation/report-result-reason/delete', undefined, { id })
}
