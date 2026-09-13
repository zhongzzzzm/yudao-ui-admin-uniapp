import type { BpmInstanceDetailVO } from '@/api/bpm/flow'
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

/** 获得底稿复核分页 */
export function getFilingReviewPage(params: FilingReviewPageReqVO) {
  return http.get<PageResult<FilingReviewVO>>('/rpt/tax-report-filing-review/page', params)
}

/** 按报送任务获得全部复核记录 */
export function getFilingReviewListByFiling(filingId: number) {
  return http.get<FilingReviewVO[]>('/rpt/tax-report-filing-review/by-filing', { filingId })
}

/**
 * 按报表任务获得各部门复核审批流（分派记录 + 引擎任务时间线）
 *
 * 复核动作已全部接入审批引擎，App 侧只做只读回看；
 * 旧的手写提交接口后端已停用，这里不再提供提交方法。
 */
export interface FilingReviewFlowVO extends FilingReviewVO {
  reviewId: number // 复核记录ID（= id）
  flow?: BpmInstanceDetailVO | null // 关联审批实例详情（null 表示尚未发起）
}

/** 按报送任务获得各部门复核审批流 */
export function getFilingReviewFlowByFiling(filingId: number) {
  return http.get<FilingReviewFlowVO[]>('/rpt/tax-report-filing-review/flow-by-filing', { filingId })
}
