import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 银行流水（查询 / 编辑 / 软删除 / 导出 / 解析导入 / 导入批次）
 * 解析模板维护见 bankFlowTemplate.ts
 */

// ========== 标准流水 ==========

/** 标准化银行流水 */
export interface BankFlowVO {
  id: number // 编号
  ownAccountNo: string // 己方银行账号
  ownAccountName?: string // 己方账户名称
  counterpartyOrgName?: string // 对方机构名称
  counterpartyBankName?: string // 对方开户银行名称（空=待补录）
  counterpartyAccountName?: string // 对方银行账户名称
  counterpartyAccountNo?: string // 对方银行账号
  transDate: string // 交易日期 yyyy-MM-dd
  transTime?: string // 交易时间
  currency: string // 交易币种
  amount: number // 交易金额（恒为正）
  direction: number // 资金方向：1 收入 2 支出
  directionName?: string // 资金方向名称
  summary?: string // 摘要
  balance?: number // 余额
  serialNo?: string // 流水号
  counterpartyBankFilled?: number // 对方行名是否已补录
  batchId?: number // 导入批次 ID
  sourceFileName?: string // 来源文件名
  sourceRow?: number // 来源文件行号
  createTime?: string // 入库时间
}

/** 收/支/净额汇总 */
export interface BankFlowSummaryVO {
  incomeTotal: number // 收入合计
  expenseTotal: number // 支出合计
  netAmount: number // 净额
}

/** 银行流水分页查询参数（与后端 BankFlowPageReqVO 对应） */
export interface BankFlowPageParams extends PageParam {
  counterpartyBankFilled?: number // 对方行名补录状态（0否 1是）
  counterpartyKeyword?: string // 对方信息关键字（机构名/户名/账号模糊）
  currency?: string // 币种
  direction?: number // 资金方向：1 收入 2 支出
  ownAccountNo?: string // 己方账号
  transDate?: string[] // 交易日期范围 [起, 止]（yyyy-MM-dd）
  amountMin?: number // 金额下限
  amountMax?: number // 金额上限
  batchId?: number // 导入批次 ID
}

/** 获得银行流水分页 */
export function getBankFlowPage(params: BankFlowPageParams) {
  return http.get<PageResult<BankFlowVO>>('/fin/bank-flow/page', params)
}

/** 当前筛选下的收/支/净额汇总（列表页顶部横幅） */
export function getBankFlowSummary(params: Partial<BankFlowPageParams>) {
  return http.get<BankFlowSummaryVO>('/fin/bank-flow/summary', params)
}

/** 库内去重的己方账号（筛选下拉用） */
export function getBankFlowOwnAccounts() {
  return http.get<string[]>('/fin/bank-flow/own-accounts')
}

// ========== 编辑 / 补录 / 删除 ==========

/** 流水编辑参数（与后端 BankFlowUpdateReqVO 对应；编辑后后端重算去重键） */
export interface BankFlowUpdateReqVO {
  id: number // 流水主键
  transDate: string // 交易日期 yyyy-MM-dd
  transTime?: string // 交易时间 HH:mm:ss
  counterpartyOrgName?: string // 对方机构名称
  counterpartyBankName?: string // 对方开户银行名称
  counterpartyAccountName?: string // 对方银行账户名称
  counterpartyAccountNo?: string // 对方银行账号
  currency?: string // 交易币种（空默认 CNY）
  amount: number // 交易金额（恒为正，必须大于 0）
  direction: number // 资金方向（1收入 2支出）
  summary?: string // 摘要
  balance?: number // 交易后余额
  serialNo?: string // 银行流水号
}

/** 编辑流水（己方账号/户名不可改；日期/金额/对方信息/摘要等，编辑后重算去重键） */
export function updateBankFlow(data: BankFlowUpdateReqVO) {
  return http.put<boolean>('/fin/bank-flow/update', data)
}

/** 人工补录对方行名（仅空值可补） */
export function updateCounterpartyBank(data: {
  id: number // 流水主键
  counterpartyBankName: string // 对方开户银行名称
}) {
  return http.put<boolean>('/fin/bank-flow/counterparty-bank', data)
}

/** 删除单条流水（软删除，可重导原文件恢复），返回删除条数 */
export function deleteBankFlow(id: number) {
  return http.delete<number>(`/fin/bank-flow/delete?id=${id}`)
}

/** 删除整个导入批次的流水（批次记录保留并标记作废），返回删除条数 */
export function deleteBankFlowBatch(batchId: number) {
  return http.delete<number>(`/fin/bank-flow/delete-batch?id=${batchId}`)
}

// ========== 解析预览 / 导入 ==========

/** 行级错误（解析预览 / 导入结果 / 导入批次通用） */
export interface BankFlowRowErrorVO {
  rowNo: number // Excel 行号（1 基）
  reason: string // 原因
}

/** 解析预览响应（与后端 BankFlowParsePreviewRespVO 对应，移动端只展示汇总与错误） */
export interface BankFlowParsePreviewRespVO {
  matched: boolean // 是否匹配到模板/配置
  matchType?: number // 匹配方式（1自动识别 2手动映射 3手动指定模板）
  matchBasis?: string // 匹配依据描述
  templateId?: number // 匹配到的模板
  templateName?: string // 匹配到的模板名
  sheetName?: string // 使用的 Sheet 名
  headerRow?: number // 表头行（1 基）
  totalRows?: number // 总数据行
  successRows?: number // 可导入行
  duplicateRows?: number // 重复跳过行（含库内与批内）
  errorRows?: number // 异常行
  errors?: BankFlowRowErrorVO[] // 行级错误
  importedBefore?: boolean // 该文件此前是否已成功导入过
  importedTime?: string | number // 此前导入时间
  importedBatchId?: number // 此前导入批次
  importedSuccessRows?: number // 此前导入成功行数
}

/** 解析预览参数（不落库） */
export interface BankFlowParsePreviewReqVO {
  fileUrl: string // 文件地址（infra 存储）
  fileName?: string // 文件名（文件名信号匹配用）
  templateId?: number // 指定模板（优先级高于自动匹配）
}

/** 解析预览（不落库；未匹配时 PC 端可手动映射，App 端仅展示） */
export function parseBankFlowPreview(data: BankFlowParsePreviewReqVO) {
  return http.post<BankFlowParsePreviewRespVO>('/fin/bank-flow/parse-preview', data)
}

/** 导入响应（与后端 BankFlowImportRespVO 对应） */
export interface BankFlowImportRespVO {
  batchId: number // 批次
  templateId?: number // 使用的模板（自动匹配时回填）
  templateName?: string // 模板名
  matchType?: number // 匹配方式（1自动识别 2手动映射 3手动指定模板）
  totalRows?: number // 总数据行
  successRows?: number // 成功入库行
  duplicateRows?: number // 重复跳过行
  errorRows?: number // 异常行
  directionReversalSuspect?: boolean // 方向规则疑似配反
  errors?: BankFlowRowErrorVO[] // 行级错误（最多 500 条）
}

/** 确认导入参数（重复行自动跳过并报告） */
export interface BankFlowImportReqVO {
  fileUrl: string // 文件地址（infra 存储）
  fileName?: string // 文件名（展示与审计用）
  templateId?: number // 使用模板（空则自动匹配）
}

/** 确认导入（重复行自动跳过并报告） */
export function importBankFlows(data: BankFlowImportReqVO) {
  return http.post<BankFlowImportRespVO>('/fin/bank-flow/import', data)
}

// ========== 导入批次 ==========

/** 导入批次（与后端 BankFlowImportBatchRespVO 对应） */
export interface BankFlowImportBatchVO {
  id: number // 批次编号
  fileName: string // 文件名
  templateName?: string // 模板名
  matchType?: number // 匹配方式（1自动识别 2手动映射 3手动指定模板）
  totalRows?: number // 总数据行
  successRows?: number // 成功入库行
  duplicateRows?: number // 重复跳过行
  errorRows?: number // 异常行
  status?: number // 状态（0进行中 1完成 2失败）
  operator?: string // 操作人
  createTime?: string // 导入时间
  errors?: BankFlowRowErrorVO[] // 行级错误
}

/** 获得导入批次分页 */
export function getBankFlowBatchPage(params: PageParam & {
  fileName?: string // 文件名（模糊）
  templateId?: number // 模板
  status?: number // 状态（0进行中 1完成 2失败）
}) {
  return http.get<PageResult<BankFlowImportBatchVO>>('/fin/bank-flow/import-batch/page', params)
}

/** 匹配方式文案 */
export function matchTypeLabel(matchType?: number): string {
  return { 1: '自动识别', 2: '手动映射', 3: '手动指定模板' }[matchType ?? 0] ?? '自动识别'
}

/** 批次状态文案 */
export function batchStatusLabel(status?: number): string {
  return { 0: '进行中', 1: '完成', 2: '失败' }[status ?? -1] ?? '未知'
}
