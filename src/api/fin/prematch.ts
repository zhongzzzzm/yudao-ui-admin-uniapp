import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 预收挂账闭环（滚动台账制）：初始化底稿 → 逐月上传明细账 → 同月闭环/勾销/兜底 */

/** 三栏式明细账/底稿文件 */
export interface PrematchLedgerFileVO {
  /** 文件访问 URL */
  fileUrl: string
  /** 文件名 */
  fileName?: string
}

/** 预收底稿台账 */
export interface PrematchBookVO {
  id: number // 编号
  /** 台账名称 */
  name?: string
  /** 备注 */
  remark?: string
  /** 科目编码集合 */
  accountCodes?: string[]
  /** 基准期（如 202412，自动取底稿内最大日期所在月） */
  basePeriod?: string
  /** 当前期（最新批次期次） */
  currentPeriod?: string
  /** 批次数（含初始化） */
  batchCount?: number
  /** 当前底稿行数（OPEN） */
  openItemCount?: number
  /** 当前底稿剩余金额合计 */
  openAmount?: number
  /** 创建时间 */
  createTime?: string
}

/** 台账初始化入参（name 缺省后端自动生成：预收底稿_基准期） */
export interface PrematchBookSaveReq {
  /** 台账名称（可空，缺省自动生成） */
  name?: string
  /** 备注 */
  remark?: string
  /** 预收底稿文件列表（一个文件可含多个科目 sheet） */
  files: PrematchLedgerFileVO[]
}

/** 批次各科目月度统计（月度余额视图数据源） */
export interface PrematchAccountStatVO {
  /** 科目编码 */
  accountCode?: string
  /** 科目名称 */
  accountName?: string
  /** 本期新增笔数 */
  newCount?: number
  /** 本期新增金额（含贷方调平） */
  newAmount?: number
  /** 本期消化金额（含借方调平） */
  consumedAmount?: number
  /** 本期借方调平金额（已计入 consumedAmount） */
  adjustedDebit?: number
  /** 本期贷方调平金额（已计入 newAmount） */
  adjustedCredit?: number
  /** 累计调平净额（借方累计 − 贷方累计） */
  cumAdjustedNet?: number
  /** 算后底稿剩余行数 */
  openCount?: number
  /** 算后底稿剩余金额（期末口径） */
  openAmount?: number
  /** 账面期初余额 */
  openingBalance?: number
  /** 账面期末余额（实际数，统一按此对账） */
  closingBalance?: number
}

/** 月度批次上传入参（支持一次多个月；period 限定只算该期，重算重放用） */
export interface PrematchBatchUploadReq {
  /** 台账编号 */
  bookId: number
  /** 明细账文件列表 */
  files: PrematchLedgerFileVO[]
  /** 限定只计算该期次（可选；重算重放时传该期） */
  period?: string
}

/** 批次（期0=初始化底稿，期N=月度明细账） */
export interface PrematchBatchVO {
  id: number // 编号
  /** 台账编号 */
  bookId?: number
  /** 期次（如 202501） */
  period?: string
  /** 批次类型：1=初始化底稿、2=月度明细账 */
  batchType?: number
  /** 该批次留存的原上传文件（重算重放用） */
  files?: PrematchLedgerFileVO[]
  /** 本期参与行数 */
  txnCount?: number
  /** 新增预收/挂账行数 */
  newIncomeCount?: number
  /** 同月闭环组数 */
  sameMonthGroupCount?: number
  /** 闭环出稿行数 */
  draftClosedCount?: number
  /** 串科目闭环笔数 */
  crossClosedCount?: number
  /** 算后底稿行数 */
  openAfterCount?: number
  /** 算后底稿剩余合计 */
  openAfterAmount?: number
  /** 无来源残额笔数 */
  noSourceCount?: number
  /** 无来源残额合计 */
  noSourceAmount?: number
  /** 无法识别行数 */
  unrecognizedCount?: number
  /** 各科目月度统计 */
  accountStats?: PrematchAccountStatVO[]
  /** 勾稽提示 */
  reconcileNotes?: string[]
  /** 创建时间 */
  createTime?: string
}

/** 底稿行（OPEN 行 = 账上剩余可用） */
export interface PrematchItemVO {
  id: number // 编号
  /** 科目编码 */
  accountCode?: string
  /** 科目名称 */
  accountName?: string
  /** 对方主体名 */
  entityName?: string
  /** 合同号（可为空） */
  contractNo?: string
  /** 匹配键 */
  matchKey?: string
  /** 收入动作：1=预收、2=挂账 */
  incomeAction?: number
  /** 入稿期次 */
  originPeriod?: string
  /** 原发生日期 */
  originDate?: string
  /** 原发生凭证号 */
  originVoucher?: string
  /** 原发生摘要原文 */
  originSummary?: string
  /** 原始金额 */
  originAmount?: number
  /** 累计已消化金额（实时值） */
  consumedAmount?: number
  /** 剩余金额（实时值） */
  remainingAmount?: number
  /** 截至所选期次的剩余金额（快照复算值） */
  asOfRemaining?: number
  /** 状态：1=OPEN、2=CLOSED */
  status?: number
  /** 创建时间 */
  createTime?: string
}

/** 闭环流水（一笔借方消化某底稿行的金额） */
export interface PrematchClosureVO {
  id: number // 编号
  /** 批次编号 */
  batchId?: number
  /** 底稿行编号 */
  itemId?: number
  /** 发生侧科目 */
  itemAccountCode?: string
  /** 对方主体名 */
  entityName?: string
  /** 合同号 */
  contractNo?: string
  /** 收入动作：1=预收、2=挂账 */
  incomeAction?: number
  /** 原发生日期 */
  originDate?: string
  /** 原发生凭证号 */
  originVoucher?: string
  /** 原发生摘要 */
  originSummary?: string
  /** 原始金额 */
  originAmount?: number
  /** 底稿行当前剩余（实时值） */
  itemRemaining?: number
  /** 闭环侧科目（串科目时与发生侧不同） */
  consumeAccountCode?: string
  /** 闭环动作：1=转出、2=冲抵、3=退还 */
  consumeAction?: number
  /** 闭环日期 */
  consumeDate?: string
  /** 闭环凭证号 */
  consumeVoucher?: string
  /** 闭环摘要 */
  consumeSummary?: string
  /** 闭环整笔金额 */
  consumeAmount?: number
  /** 作用于该底稿行的金额 */
  appliedAmount?: number
  /** 闭环范围：1=同月闭环、2=同科目勾销、3=串科目勾销 */
  scope?: number
  /** 匹配级别：1=匹配键精确、2=同客户兜底 */
  matchLevel?: number
  /** 同月闭环组号 */
  groupNo?: number
}

/** 异常行（无来源残额 / 无法识别 / 调平忽略） */
export interface PrematchExceptionVO {
  id: number // 编号
  /** 批次编号 */
  batchId?: number
  /** 科目编码 */
  accountCode?: string
  /** 异常类型：1=无来源残额、2=无法识别、3=调平忽略 */
  exceptionType?: number
  /** 方向：1=贷、2=借 */
  side?: number
  /** 动作 */
  action?: number
  /** 交易日期 */
  txnDate?: string
  /** 凭证号 */
  voucher?: string
  /** 摘要 */
  summary?: string
  /** 金额 */
  amount?: number
  /** 原因说明 */
  reason?: string
  /** 该行摘要是否已有识别记忆（已补录过） */
  memoryMatched?: boolean
}

/** 补录摘要识别入参（归一化摘要全文为键，相同写法全租户自动识别） */
export interface PrematchMemorySaveReq {
  /** 异常行编号（从异常清单补录时传） */
  exceptionId?: number
  /** 方向：1=贷、2=借 */
  side: number
  /** 摘要原文（系统归一化后存记忆键） */
  summary: string
  /** 主体名 */
  entityName: string
  /** 合同号（可空） */
  contractNo?: string
  /** 动作：1=预收、2=租金挂账、3=转出、4=冲抵、5=退还 */
  action: number
}

/** 摘要识别规则 */
export interface PrematchRuleVO {
  id: number // 编号
  /** 规则名 */
  name: string
  /** 方向：0=两侧通用、1=贷（收入侧）、2=借（消化侧） */
  direction?: number
  /** 动作：0=忽略、1=预收、2=租金挂账、3=转出、4=冲抵、5=退还 */
  action?: number
  /** 忽略类：摘要包含即命中 */
  keyword?: string
  /** 动作类：摘要前缀 */
  prefix?: string
  /** 动作类：尾缀集合 */
  suffixes?: string[]
  /** 匹配优先级（小的先匹配） */
  priority?: number
  /** 状态：0=启用、1=停用 */
  status?: number
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createTime?: string
}

/** 摘要识别规则保存入参 */
export interface PrematchRuleSaveReq {
  id?: number // 编号（更新时必填）
  /** 规则名 */
  name: string
  /** 方向：0=两侧通用、1=贷（收入侧）、2=借（消化侧） */
  direction: number
  /** 动作：0=忽略、1=预收、2=租金挂账、3=转出、4=冲抵、5=退还 */
  action: number
  /** 忽略类：摘要包含即命中 */
  keyword?: string
  /** 动作类：摘要前缀 */
  prefix?: string
  /** 动作类：尾缀集合 */
  suffixes?: string[]
  /** 匹配优先级（小的先匹配） */
  priority: number
  /** 状态：0=启用、1=停用 */
  status?: number
  /** 备注 */
  remark?: string
}

/** 摘要试解析入参 */
export interface PrematchRuleTestParseReq {
  /** 摘要原文 */
  summary: string
  /** 方向：1=贷、2=借 */
  side: number
}

/** 摘要试解析结果（走生产解析管道，不落库） */
export interface PrematchRuleTestParseResp {
  /** 命中结果：memory=识别记忆、rule=规则、none=未命中 */
  outcome: 'memory' | 'none' | 'rule'
  /** 命中的规则名 */
  ruleName?: string
  /** 命中的规则编号 */
  ruleId?: number
  /** 解析动作 */
  action?: number
  /** 解析出的主体名 */
  entityName?: string
  /** 解析出的合同号 */
  contractNo?: string
  /** 归一化后的摘要 */
  normalizedSummary?: string
  /** 未命中原因 */
  reason?: string
  /** 忽略原因 */
  ignoreReason?: string
  /** 尝试过的解析路径 */
  attempts?: string[]
}

// ========== 台账 ==========

/** 台账分页 */
export function getPrematchBookPage(params: PageParam & { name?: string }) {
  return http.get<PageResult<PrematchBookVO>>('/fin/prematch/book/page', params)
}

/** 台账详情 */
export function getPrematchBook(id: number) {
  return http.get<PrematchBookVO>('/fin/prematch/book/get', { id })
}

/** 初始化预收底稿台账（上传底稿即同步计算） */
export function createPrematchBook(data: PrematchBookSaveReq) {
  return http.post<number>('/fin/prematch/book/create', data)
}

/** 删除台账（级联删除批次/底稿行/闭环流水/异常行） */
export function deletePrematchBook(id: number) {
  return http.delete<boolean>('/fin/prematch/book/delete', undefined, { id })
}

// ========== 批次 ==========

/** 上传月度明细账并同步计算（同月精确闭环 → 勾销底稿 → 串科目兜底） */
export function uploadPrematchBatch(data: PrematchBatchUploadReq) {
  return http.post<number>('/fin/prematch/book/upload-batch', data)
}

/** 回滚最新一期月度批次（线下核对发现问题时的补救路径） */
export function deleteLatestPrematchBatch(bookId: number) {
  return http.delete<boolean>('/fin/prematch/book/delete-latest-batch', undefined, { bookId })
}

/** 回滚至指定期次（该期及其后所有月度批次依次回滚），返回回滚期数 */
export function deletePrematchBatchFrom(bookId: number, batchId: number) {
  return http.delete<number>('/fin/prematch/book/delete-batch-from', undefined, { bookId, batchId })
}

/** 批次分页（新→旧） */
export function getPrematchBatchPage(params: PageParam & { bookId: number }) {
  return http.get<PageResult<PrematchBatchVO>>('/fin/prematch/batch/page', params)
}

/** 闭环明细分页（含被消化底稿行信息） */
export function getPrematchClosurePage(params: PageParam & { batchId: number }) {
  return http.get<PageResult<PrematchClosureVO>>('/fin/prematch/batch/closure-page', params)
}

/** 异常行分页（exceptionType 空=无来源残额+无法识别；3=调平忽略） */
export function getPrematchExceptionPage(params: PageParam & { batchId: number, exceptionType?: number }) {
  return http.get<PageResult<PrematchExceptionVO>>('/fin/prematch/batch/exception-page', params)
}

// ========== 识别记忆 / 底稿行 ==========

/** 补录摘要识别（无法识别摘要人工解析一次，相同写法全租户自动识别） */
export function createPrematchMemory(data: PrematchMemorySaveReq) {
  return http.post<boolean>('/fin/prematch/memory/create', data)
}

/** 底稿行分页（当前底稿视图；status 缺省 OPEN） */
export function getPrematchItemPage(params: PageParam & { bookId: number, accountCode?: string, status?: number, keyword?: string }) {
  return http.get<PageResult<PrematchItemVO>>('/fin/prematch/book/item-page', params)
}

// ========== 摘要识别规则 ==========

/** 摘要识别规则分页（规则名/方向/动作/状态筛选） */
export function getPrematchRulePage(params: PageParam & { name?: string, direction?: number, action?: number, status?: number }) {
  return http.get<PageResult<PrematchRuleVO>>('/fin/prematch/rule/page', params)
}

/** 新增摘要识别规则（保存后下次计算即生效） */
export function createPrematchRule(data: PrematchRuleSaveReq) {
  return http.post<number>('/fin/prematch/rule/create', data)
}

/** 修改摘要识别规则（保存后下次计算即生效） */
export function updatePrematchRule(data: PrematchRuleSaveReq) {
  return http.put<boolean>('/fin/prematch/rule/update', data)
}

/** 启停用摘要识别规则（status：0=启用 1=停用） */
export function updatePrematchRuleStatus(id: number, status: number) {
  return http.put<boolean>('/fin/prematch/rule/update-status', undefined, { id, status })
}

/** 删除摘要识别规则 */
export function deletePrematchRule(id: number) {
  return http.delete<boolean>('/fin/prematch/rule/delete', undefined, { id })
}

/** 摘要试解析（走生产解析管道，不落库） */
export function testParsePrematchRule(data: PrematchRuleTestParseReq) {
  return http.post<PrematchRuleTestParseResp>('/fin/prematch/rule/test-parse', data)
}
