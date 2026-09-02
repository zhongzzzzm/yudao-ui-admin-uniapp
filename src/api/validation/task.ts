import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 校验任务分页请求参数 */
export interface ReportTaskPageReqVO extends PageParam {
  taskCode?: string // 任务编码
  status?: number // 状态：0未执行 1执行中 2完成 3失败
  createTime?: string[] // 创建时间区间
}

/** 校验任务 */
export interface ReportTaskVO {
  id: number // 编号
  batchId?: number // 数据版本
  batchDate?: string // 数据日期（yyyy-MM-dd）
  taskCode: string // 任务编码
  status: number // 状态：0未执行 1执行中 2完成 3失败
  totalRuleCount?: number // 执行规则数
  errorRuleCount?: number // 失败规则数
  durationSeconds?: number // 耗时(秒)
  createTime?: string // 创建时间
}

/** 规则校验结果 */
export interface ReportResultVO {
  id: number // 编号
  taskId: number // 校验任务ID
  taskCode?: string // 任务编码
  ruleId: number // 规则ID
  ruleCode?: string // 规则编码
  ruleDescription?: string // 规则说明
  validationFlag?: number // 校验标识
  passed?: number // 是否通过
  status?: number // 是否维护原因：0否 1是（字典 yes_no）
  errorCount?: number // 错误数
  passCount?: number // 通过数
  ignoreCount?: number // 忽略数
  durationSeconds?: number // 耗时(秒)
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 规则校验结果明细 */
export interface ReportResultDetailVO {
  id: number // 编号
  taskId: number // 校验任务ID
  resultId: number // 规则校验结果ID
  ruleCode?: string // 规则编码
  ruleDescription?: string // 规则说明
  rowIndex?: number // 数据行号
  reportId?: string // 报表ID
  reportName?: string // 报表名称
  description?: string // 错误描述
  createTime?: string // 创建时间
}

/** 数据对比任务 */
export interface DiffTaskVO {
  id: number // 编号
  hisBatchId?: number // 历史数据版本
  hisBatchDate?: string // 历史数据日期
  cmpBatchId?: number // 当前数据版本
  cmpBatchDate?: string // 当前数据日期
  taskCode: string // 任务编码
  status: number // 状态：0未执行 1执行中 2完成 3失败
  totalReportCount?: number // 对比报表数
  durationSeconds?: number // 耗时(秒)
  createTime?: string // 创建时间
}

/** 报表对比结果 */
export interface DiffResultVO {
  id: number // 编号
  taskId: number // 对比任务ID
  taskCode?: string // 任务编码
  reportId?: number // 报表ID
  reportName?: string // 报表名称
  totalRows?: number // 报表总行数
  diffRows?: number // 差异行数
  createTime?: string // 创建时间
}

/** 字段级对比明细 */
export interface DiffFieldDetailVO {
  id: number // 编号
  resultId: number // 对比结果ID
  reportName?: string // 报表名称
  rowKey?: string // 行标识
  fieldId?: number // 字段ID
  fieldName?: string // 字段名称
  hisValue?: string // 历史值
  cmpValue?: string // 当前值
  hisRowIndex?: number // 历史报表行号
  cmpRowIndex?: number // 对比报表行号
}

/** 获得校验任务分页 */
export function getReportTaskPage(params: ReportTaskPageReqVO) {
  return http.get<PageResult<ReportTaskVO>>('/validation/report-task/page', params)
}

/** 获得校验任务详情 */
export function getReportTask(id: number) {
  return http.get<ReportTaskVO>('/validation/report-task/get', { id })
}

/** 获得规则校验结果分页 */
export function getReportResultPage(params: PageParam & { taskId?: number, passed?: number }) {
  return http.get<PageResult<ReportResultVO>>('/validation/report-result/page', params)
}

/** 获得规则校验结果明细分页 */
export function getReportResultDetailPage(params: PageParam & { resultId?: number }) {
  return http.get<PageResult<ReportResultDetailVO>>('/validation/report-result-detail/page', params)
}

/** 获得数据对比任务分页 */
export function getDiffTaskPage(params: PageParam & { taskCode?: string, status?: number }) {
  return http.get<PageResult<DiffTaskVO>>('/validation/diff-task/page', params)
}

/** 获得报表对比结果分页 */
export function getDiffResultPage(params: PageParam & { taskId?: number }) {
  return http.get<PageResult<DiffResultVO>>('/validation/diff-result/page', params)
}

/** 获得字段级对比明细分页 */
export function getDiffFieldDetailPage(params: PageParam & { resultId?: number }) {
  return http.get<PageResult<DiffFieldDetailVO>>('/validation/diff-field-detail/page', params)
}

/** 数据版本 */
export interface ReportDataBatchVO {
  id: number // 编号
  batchDate?: string // 数据日期（yyyy-MM-dd）
  description?: string // 描述
  status?: number // 状态
  createTime?: string // 创建时间
}

/** 获得数据版本列表（底稿上传、结果筛选等场景的下拉数据源） */
export function getReportDataBatchList() {
  return http.get<ReportDataBatchVO[]>('/validation/report-data-batch/list')
}

/** 获得数据版本分页（数据版本列表页） */
export function getReportDataBatchPage(params: PageParam & { batchDate?: string }) {
  return http.get<PageResult<ReportDataBatchVO>>('/validation/report-data-batch/page', params)
}

/** 复制上次错误原因的结果 */
export interface CopyReasonsResultVO {
  total: number // 上一任务原因总数
  copied: number // 成功复制条数
  skipped: number // 跳过条数（已维护原因的结果不覆盖）
}

/** 任务错误原因项 */
export interface TaskErrorReasonVO {
  id: number // 编号
  ruleId: number // 规则ID
  ruleCode: string // 规则编码
  ruleDescription?: string // 规则说明
  passed?: number // 是否通过
  reason?: string // 纠正原因
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 生成校验结果文件（type：0 新生成 1 重新生成覆盖） */
export function generateValidationResult(id: number, type: number) {
  return http.get<boolean>('/validation/report-task/generate', { id, type })
}

/** 生成前预检：未通过的规则是否都已维护原因 */
export function readyForGenerate(id: number) {
  return http.get<boolean>('/validation/report-task/readyForGenerate', { id })
}

/** 导出前预检：校验文件是否已生成完毕 */
export function readyForDownload(id: number) {
  return http.get<boolean>('/validation/report-task/readyForDownload', { id })
}

/** 复制上一任务维护的错误原因到本任务 */
export function copyLastReasons(taskId: number) {
  return http.post<CopyReasonsResultVO>('/validation/report-task/copy-last-reasons', undefined, { taskId })
}

/** 获取任务下所有错误原因 */
export function getTaskErrorReasons(taskId: number) {
  return http.get<TaskErrorReasonVO[]>('/validation/report-task/error-reasons', { taskId })
}

/** 行级对比明细 */
export interface DiffDetailVO {
  id: number // 编号
  taskId: number // 对比任务ID
  resultId: number // 表级结果ID
  hisBatchId?: number // 历史数据版本
  cmpBatchId?: number // 当前数据版本
  reportId?: number // 报表ID
  reportName?: string // 报表名称
  hisRowIndex?: number // 历史报表行号
  cmpRowIndex?: number // 当前报表行号
  logicalKey?: string // 组合主键
  diffType?: string // 差异类型
  createTime?: string // 创建时间
}

/** 获得行级对比明细分页 */
export function getDiffDetailPage(params: PageParam & { resultId?: number }) {
  return http.get<PageResult<DiffDetailVO>>('/validation/diff-detail/page', params)
}
