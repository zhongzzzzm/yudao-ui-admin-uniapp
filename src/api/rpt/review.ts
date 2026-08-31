import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 底稿复核分页请求参数 */
export interface FilingReviewPageReqVO extends PageParam {
  keyword?: string // 关键字（模糊匹配模板名称）
  filingId?: number // 报表任务ID
  batchId?: number // 数据版本ID
  deptId?: number // 负责/复核部门ID
  reviewStatus?: number // 复核状态：0待复核 1已复核
}

/** 底稿复核记录 */
export interface FilingReviewVO {
  id: number // 编号
  filingId: number // 报表任务ID
  batchId?: number // 数据版本ID
  deptId: number // 负责/复核部门ID
  deptName?: string // 负责部门名称
  draftNames?: string[] // 该部门关联底稿名称列表
  draftCount?: number // 底稿个数
  reviewStatus: number // 0待复核 1已复核
  reviewResult?: number // 1=复核无误 2=复核有误
  reviewOpinion?: string // 复核意见
  reviewUserId?: number // 复核人ID
  reviewerName?: string // 复核人姓名
  reviewTime?: string // 复核时间
  templateName?: string // 模板名称
  hasError?: boolean // 任一部门有误高亮用
}

/** 底稿复核提交请求 */
export interface FilingReviewSubmitReqVO {
  filingId: number // 报表任务ID（必填）
  deptId: number // 负责/复核部门ID（必填）
  reviewResult: number // 1=复核无误 2=复核有误（必填）
  reviewOpinion?: string // 复核意见（复核有误时必填）
}

/** 获得底稿复核分页 */
export function getFilingReviewPage(params: FilingReviewPageReqVO) {
  return http.get<PageResult<FilingReviewVO>>('/rpt/tax-report-filing-review/page', params)
}

/** 按报送任务获得全部复核记录 */
export function getFilingReviewListByFiling(filingId: number) {
  return http.get<FilingReviewVO[]>('/rpt/tax-report-filing-review/by-filing', { filingId })
}

/** 提交底稿复核意见 */
export function submitFilingReview(data: FilingReviewSubmitReqVO) {
  return http.post<boolean>('/rpt/tax-report-filing-review/submit', data)
}
