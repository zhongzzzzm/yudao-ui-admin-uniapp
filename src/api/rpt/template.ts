import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 报表模板（App 只读查看）：模板列表、版本列表、版本差异对比、按数据版本解析钉住版本。
 * 模板的新建/发布/废弃等编辑操作在 PC 端完成。
 */

/** 报表模板版本状态 */
export const TEMPLATE_VERSION_STATUS = {
  0: '草稿',
  1: '已发布',
  2: '已废弃',
} as const

/** 报表模板 */
export interface TaxReportTemplateVO {
  id: number // 编号
  name?: string // 模板名称
  description?: string // 描述
  submitId?: number // 报送信息（关联报送管理）
  templateFile?: string // 模板文件（Excel）路径
  reportCode?: string // 报表编码
  currentVersionNo?: number // 当前生效版本号（最新已生效的发布版本；空 = 无）
  currentVersionId?: number // 当前生效版本ID
}

/** 报表模板版本 */
export interface TaxReportTemplateVersionVO {
  id: number // 编号
  templateId: number // 模板主档ID
  templateName?: string // 模板名称
  versionNo: number // 版本号（主档内从 1 递增）
  status: number // 状态：0草稿 1已发布 2已废弃
  statusName?: string // 状态名称
  templateFile?: string // 版本模板文件路径
  effectiveTime?: number // 生效时间（含，毫秒时间戳）
  expireTime?: number // 失效时间（不含），空 = 长期有效
  publishTime?: number // 发布时间
  publisher?: string // 发布人
  changeDesc?: string // 变更说明
  mappingCount?: number // 该版本单元格映射数量
  createTime?: string // 创建时间
}

/** 版本解析结果（按模板 + 数据版本解析将钉住的版本） */
export interface TemplateResolveVersionVO {
  resolved: boolean // 是否解析到已发布版本
  id?: number // 版本ID
  versionNo?: number // 版本号
  effectiveTime?: number // 生效时间（毫秒时间戳）
  expireTime?: number // 失效时间（毫秒时间戳）
  templateFile?: string // 版本模板文件路径
}

/** 版本对比差异字段条目 */
export interface TemplateVersionFieldDiff {
  field: string // 字段名
  newValue?: string // 新版本值
  oldValue?: string // 旧版本值
}

/** 版本对比差异条目（单元格级） */
export interface TemplateVersionDiffItem {
  cellRef: string // 单元格引用（如 B12）
  diffType: 'ADDED' | 'CHANGED' | 'REMOVED' // 差异类型：新增/变更/删除
  sourceSummary?: string // 旧版本来源摘要
  targetSummary?: string // 新版本来源摘要
  fieldDiffs?: TemplateVersionFieldDiff[] // 字段级差异明细
}

/** 差异类型文案 */
export const TEMPLATE_DIFF_TYPE_LABELS: Record<string, string> = {
  ADDED: '新增',
  CHANGED: '变更',
  REMOVED: '删除',
}

/** 获得报表模板分页 */
export function getTaxReportTemplatePage(params: PageParam & {
  name?: string // 模板名称关键字
  reportCode?: string // 报表编码
}) {
  return http.get<PageResult<TaxReportTemplateVO>>('/rpt/tax-report-template/page', params)
}

/** 获得报表模板详情 */
export function getTaxReportTemplate(id: number) {
  return http.get<TaxReportTemplateVO>('/rpt/tax-report-template/get', { id })
}

/** 获得模板版本列表 */
export function getTaxReportTemplateVersionList(templateId: number) {
  return http.get<TaxReportTemplateVersionVO[]>('/rpt/tax-report-template/version/list', { templateId })
}

/** 版本对比（单元格级差异） */
export function diffTaxReportTemplateVersion(sourceVersionId: number, targetVersionId: number) {
  return http.get<{ items: TemplateVersionDiffItem[] }>('/rpt/tax-report-template/version/diff', { sourceVersionId, targetVersionId })
}

/** 按模板 + 数据版本解析将钉住的版本（任务表单只读展示用） */
export function resolveTaxReportTemplateVersion(templateId: number, batchId: number) {
  return http.get<TemplateResolveVersionVO>('/rpt/tax-report-template/version/resolve', { templateId, batchId })
}
