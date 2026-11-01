import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 银行流水解析模板
 *
 * App 端为简化版维护：基本字段（模板名/银行名/识别关键词/方向规则等）走表单，
 * 解析配置（表头定位 / 列映射）以后端 JSON 结构直接文本框编辑保存；
 * 完整可视化表头定位 / 列映射编辑器留 PC 端。
 */

/** 表头区单元格取值规则（表级来源） */
export interface CellRule {
  mode?: string // 取值模式：cell 固定坐标 / label 标签定位
  cell?: string // 固定坐标，如 B3
  label?: string // 标签词（如 账号）
  offset?: string // 标签取值位置：right 右格 / below 下格 / afterColon 本格冒号后
  scope?: string // 标签扫描作用区域，如 A1:F10（默认 A1:F10）
  regex?: string // 正则清洗（取 group(1)，无分组则取整体匹配）
  zhToCode?: boolean // 币种中文转 ISO 码（人民币→CNY 等）
}

/** 字段取值规则 */
export interface FieldRule {
  source?: string // 来源：column 按列 / fixed 固定值 / header_cell 表头区取值 / rule 引擎计算 / regex 列内正则提取
  index?: number // 列索引（0 基）
  value?: string // 固定值
  pattern?: string // regex 来源的提取正则（取 group(1)，无分组取整体）
  subRow?: number // 跨行记录时取组内第几物理行（0 基，默认 0=首行）
}

/** 资金方向规则（金额与方向联动） */
export interface DirectionRule {
  strategy?: string // S1 单列带符号 / S2 借贷双列 / S3 标志列+取值字典
  signColumn?: number // S1：带符号金额列
  outColumn?: number // S2：支出列（借方金额）
  inColumn?: number // S2：收入列（贷方金额）
  flagColumn?: number // S3：方向标志列
  dict?: Record<string, string> // S3：字典（原文 → IN/OUT）
  subRow?: number // 跨行记录时方向列所在物理行（0 基）
}

/** 行过滤规则 */
export interface RowFilterRule {
  skipKeywords?: string[] // 跳过含关键词行
  skipEmptyAmount?: boolean // 跳过金额为空行（默认 true）
}

/** 数据结束判定 */
export interface DataEndRule {
  emptyRows?: number // 连续空行数达到即结束（默认 3）
  endKeywords?: string[] // 命中结束关键词即结束
}

/** 对方行名推导规则 */
export interface CounterpartyBankRule {
  type?: string // column 直取列 / regex 正则提取
  index?: number // 列索引（0 基）
  pattern?: string // 提取正则
}

/** 解析模板配置（与后端 BankFlowTemplateConfig JSON 列对应） */
export interface BankFlowTemplateConfig {
  recognizeKeywords?: string[] // 识别签名：表头区需全部命中的关键词
  fileNameKeywords?: string[] // 文件名信号：银行名/别名关键词
  sheetIndex?: number // Sheet 序号（0 基，空 = 自动探测）
  sheetName?: string // Sheet 名（非空时优先按名定位）
  headerRowIndex?: number // 表头所在行（0 基；空 = 按关键词自动探测）
  headerRowSpan?: number // 表头行数（二级合并表头为 2）
  dataStartOffset?: number // 数据起始行相对表头末行的偏移（默认 1）
  dataRowSpan?: number // 一条记录占用的物理行数（默认 1）
  dataEndRule?: DataEndRule // 数据结束判定
  headerCellRules?: Record<string, CellRule> // 表头区取值规则（表级来源）
  columnMapping?: Record<string, FieldRule> // 列映射：标准字段名 → 规则
  directionRule?: DirectionRule // 方向规则（金额与方向联动）
  rowFilter?: RowFilterRule // 行过滤
  dateFormat?: string // 日期格式（空 = 自动尝试内置格式池/Excel 序列数）
  counterpartyBankRule?: CounterpartyBankRule // 对方行名推导
}

/** 解析模板（与后端 BankFlowTemplateRespVO 对应） */
export interface BankFlowTemplateVO {
  id: number // 主键
  name: string // 模板名
  bankName: string // 银行/渠道名
  status: number // 状态（0启用 1停用）
  recognizeKeywords?: string[] // 识别签名关键词
  fileNameKeywords?: string[] // 文件名信号关键词
  config?: BankFlowTemplateConfig // 解析配置
  matchedCount?: number // 累计自动识别次数
  lastMatchedTime?: string // 最近自动识别时间
  sampleFileName?: string // 样本文件名
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 解析模板保存参数（与后端 BankFlowTemplateSaveReqVO 对应） */
export interface BankFlowTemplateSaveReqVO {
  id?: number // 主键（更新时必填）
  name: string // 模板名
  bankName: string // 银行/渠道名
  status?: number // 状态（0启用 1停用）
  recognizeKeywords: string[] // 识别签名关键词（表头区需全部命中）
  fileNameKeywords?: string[] // 文件名信号关键词
  config: BankFlowTemplateConfig // 解析配置（表头定位 / 列映射 / 方向规则等）
  sampleFileName?: string // 样本文件名
  remark?: string // 备注
}

/** 获得解析模板分页 */
export function getBankFlowTemplatePage(params: PageParam & {
  name?: string // 模板名（模糊）
  bankName?: string // 银行名（模糊）
  status?: number // 状态（0启用 1停用）
}) {
  return http.get<PageResult<BankFlowTemplateVO>>('/fin/bank-flow-template/page', params)
}

/** 获得解析模板详情 */
export function getBankFlowTemplate(id: number) {
  return http.get<BankFlowTemplateVO>(`/fin/bank-flow-template/get?id=${id}`)
}

/** 创建解析模板，返回模板 id */
export function createBankFlowTemplate(data: BankFlowTemplateSaveReqVO) {
  return http.post<number>('/fin/bank-flow-template/create', data)
}

/** 更新解析模板 */
export function updateBankFlowTemplate(data: BankFlowTemplateSaveReqVO) {
  return http.put<boolean>('/fin/bank-flow-template/update', data)
}

/** 启停用解析模板（0启用 1停用） */
export function updateBankFlowTemplateStatus(id: number, status: number) {
  return http.put<boolean>(`/fin/bank-flow-template/update-status?id=${id}&status=${status}`)
}

/** 删除解析模板 */
export function deleteBankFlowTemplate(id: number) {
  return http.delete<boolean>(`/fin/bank-flow-template/delete?id=${id}`)
}
