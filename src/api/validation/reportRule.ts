import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 校验规则 */
export interface ReportRuleVO {
  id: number // 编号
  typeId?: number // 规则类型ID
  typeName?: string // 规则类型名称
  ruleCode?: string // 校验规则编号
  version?: string // 版本
  reportId?: number // 报表ID
  reportName?: string // 报文名称
  fieldId?: string // 字段名称
  ruleCategory?: number // 规则大类（字典 validation_rule_category）
  ruleType?: number // 规则细类（字典 validation_rule_type）
  validationFlag?: number // 校验标识（字典 validation_flag）
  ruleDescription?: string // 规则说明
  involvedTables?: number[] // 涉及的表（报表ID列表）
  involvedTableNames?: string // 涉及的表名称
  ruleLogic?: string // 规则表达式
  ruleLogicText?: string // 规则实现逻辑
  conditionExpression?: string // 条件表达式
  conditionExpressionText?: string // 限定条件
  relationExpression?: string // 关联关系
  description?: string // 备注
  status?: number // 状态（common_status）
  startDate?: string // 启用日期
  endDate?: string // 失效日期
  createTime?: string // 创建时间
}

/** 规则测试结果 */
export interface RuleTestResultVO {
  passed: boolean // 是否通过
  message?: string // 错误信息
}

/** 获得校验规则分页 */
export function getReportRulePage(params: PageParam & { typeId?: number, ruleCode?: string, reportId?: number }) {
  return http.get<PageResult<ReportRuleVO>>('/validation/report-rule/page', params)
}

/** 获得校验规则详情 */
export function getReportRule(id: number) {
  return http.get<ReportRuleVO>('/validation/report-rule/get', { id })
}

/** 新增校验规则 */
export function createReportRule(data: Partial<ReportRuleVO>) {
  return http.post<number>('/validation/report-rule/create', data)
}

/** 修改校验规则 */
export function updateReportRule(data: Partial<ReportRuleVO>) {
  return http.put<boolean>('/validation/report-rule/update', data)
}

/** 删除校验规则 */
export function deleteReportRule(id: number) {
  return http.delete<boolean>('/validation/report-rule/delete', undefined, { id })
}

/** 规则测试 */
export function testReportRule(id: number) {
  return http.get<RuleTestResultVO>('/validation/report-rule/test', { id })
}

/** 按规则执行校验（选数据版本） */
export function validateReportRule(ids: number[], batchId: number) {
  return http.get<boolean>('/validation/report-rule/validation', { ids: ids.join(','), batchId })
}
