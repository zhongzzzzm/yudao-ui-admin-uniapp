import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 报表对比任务（文件对文件对比） */
export interface ReportComparisonVO {
  id: number // 编号
  beforeReport?: string // 改前报表数据文件
  afterReport?: string // 改后报表数据文件
  comparisonResult?: string // 对比结果文件
  comparisonStatus?: number // 对比状态：0处理中 1完成 2失败
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 获得报表对比任务分页 */
export function getReportComparisonPage(params: PageParam & { comparisonStatus?: number }) {
  return http.get<PageResult<ReportComparisonVO>>('/validation/report-comparison/page', params)
}
