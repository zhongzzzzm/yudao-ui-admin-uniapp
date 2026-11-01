import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 报价测算：方案分页/详情（子表随详情返回）+ 移动端编辑与测算操作。
 * 新建/编辑走整体提交（主表 + 子表），保存即由后端自动测算。
 */

/** 投放计划子表行 */
export interface QuoteLoanPlanVO {
  planDate: string // 计划日期
  cash: number // 金额
  payMethod: number // 支付方式
  sort?: number // 排序
}

/** 租金规则子表行 */
export interface QuoteRentRuleVO {
  startPeriod: number // 起始期数
  paymentFreq: number // 支付频率
  calMethod: number // 计算方式
  rentCash?: number // 租金金额
  sort?: number // 排序
}

/** 手工收支子表行 */
export interface QuoteManualPlanVO {
  kind: number // 收支类型
  planDate: string // 计划日期
  direction: number // 方向：1 收 2 支
  cash: number // 金额
  taxRate?: number // 税率
  memo?: string // 备注
  sort?: number // 排序
}

/** 报价测算方案 */
export interface QuoteCalcVO {
  id?: number // 编号
  quotCode?: string // 方案编号
  quotName?: string // 方案名称
  customerName?: string // 客户名称
  memo?: string // 备注
  planDateLoan: string // 起租投放日
  leaseCommencementDate?: string // 租赁开始日
  delayPeriod?: number // 起租缓冲期
  gracePeriod?: number // 宽限期
  totalAmount: number // 总投放额
  downPayment?: number // 首付款
  tradeDiscount?: number // 贸易折扣
  baseRate?: number // 基准利率
  floatMethod?: number // 浮动方式
  floatValue?: number // 浮动值
  finalRate: number // 最终利率
  interestMethod?: number // 计息方式
  leaseMethod?: number // 租赁方式
  paymentFreq: number // 支付频率
  prepayFlag: number // 是否预付
  planLeaseDay?: number // 计划租赁日
  leaseTimes: number // 租赁期数
  yearDays?: number // 年化天数
  irrDays?: number // IRR 天数
  calDigit?: number // 计算精度
  ratioBase?: number // 比例基数
  depositMethod?: number // 保证金方式
  depositCash?: number // 保证金金额
  depositRate?: number // 保证金利率
  depositInterestFlag?: number // 保证金是否计息
  depositReturnMethod?: number // 保证金返还方式
  depositStartDate?: string // 保证金起始日
  srvInMethod?: number // 收入手续费方式
  srvInBase?: number // 收入手续费基数
  srvInCash?: number // 收入手续费金额
  srvInTaxRate?: number // 收入手续费税率
  srvOutMethod?: number // 支出手续费方式
  srvOutBase?: number // 支出手续费基数
  srvOutCash?: number // 支出手续费金额
  srvOutFirstDate?: string // 支出手续费首期日
  srvOutTaxRate?: number // 支出手续费税率
  nominalPrice?: number // 名义留购价
  assetsMargin?: number // 资产余值
  taxMode?: number // 税务口径
  corpusInvoiceFlag?: number // 本金是否开票
  quoteTaxRate?: number // 报价税率
  status?: number // 方案状态（字典 fl_quote_status）
  latestTraceId?: number // 最近测算记录 ID
  projectIrr?: number // 项目 IRR
  rentIrr?: number // 租金 IRR
  netFinanceCash?: number // 净融资额
  netFinanceRatio?: number // 净融资比例
  leaseCashSum?: number // 租金总额
  totalDebt?: number // 总债务
  createTime?: number // 创建时间
  updateTime?: number // 更新时间
  loanPlans: QuoteLoanPlanVO[] // 投放计划子表
  rentRules: QuoteRentRuleVO[] // 租金规则子表
  manualPlans?: QuoteManualPlanVO[] // 手工收支子表
}

/** 获得报价测算方案分页（不含子表） */
export function getQuoteCalcPage(params: PageParam & {
  customerName?: string // 客户名称
  quotCode?: string // 方案编号
  quotName?: string // 方案名称
  status?: number // 状态
}) {
  return http.get<PageResult<QuoteCalcVO>>('/fl/quote-calc/page', params)
}

/** 获得报价测算方案详情（主表 + 子表） */
export function getQuoteCalc(id: number) {
  return http.get<QuoteCalcVO>('/fl/quote-calc/get', { id })
}

/** 获得报价测算方案精简列表（下拉/比对基准选择用） */
export function getQuoteCalcSimpleList() {
  return http.get<QuoteCalcVO[]>('/fl/quote-calc/simple-list')
}

// ==================== 编辑与测算操作（整体提交，保存即测算） ====================

/** 预览试算（不落业务表，返回含步骤明细与结果快照的测算记录） */
export function previewQuoteCalc(data: QuoteCalcVO) {
  return http.post<QuoteTraceVO>('/fl/quote-calc/preview', data)
}

/** 创建报价测算（后端自动测算，成功才落库，返回新方案 id） */
export function createQuoteCalc(data: QuoteCalcVO) {
  return http.post<number>('/fl/quote-calc/create', data)
}

/** 更新报价测算（重新测算后落库） */
export function updateQuoteCalc(data: QuoteCalcVO) {
  return http.put<boolean>('/fl/quote-calc/update', data)
}

/** 重新测算（用已保存参数重算，不修改参数） */
export function recalculateQuoteCalc(id: number) {
  return http.put<boolean>(`/fl/quote-calc/recalculate?id=${id}`)
}

/** 确认方案（锁定参数与最新测算结果） */
export function confirmQuoteCalc(id: number) {
  return http.put<boolean>(`/fl/quote-calc/confirm?id=${id}`)
}

/** 取消确认（回到草稿态，参数可再次修改） */
export function cancelConfirmQuoteCalc(id: number) {
  return http.put<boolean>(`/fl/quote-calc/cancel-confirm?id=${id}`)
}

/** 复制方案（生成新编号、状态为草稿，返回新方案 id） */
export function copyQuoteCalc(id: number) {
  return http.post<number>(`/fl/quote-calc/copy?id=${id}`)
}

/** 删除报价测算方案 */
export function deleteQuoteCalc(id: number) {
  return http.delete<boolean>(`/fl/quote-calc/delete?id=${id}`)
}

// ==================== 测算记录（历史版本，可观测） ====================

/** 获得测算记录分页（历史版本列表） */
export function getQuoteCalcTracePage(params: PageParam & {
  quoteId?: number // 报价测算主表 id
  traceType?: number // 测算类型：0 预览，1 保存生效，2 重算
  status?: number // 状态：0 成功，1 失败
}) {
  return http.get<PageResult<QuoteTraceVO>>('/fl/quote-calc/trace/page', params)
}

/** 获得测算记录详情（含步骤明细、输入/输出快照） */
export function getQuoteCalcTrace(traceId: number) {
  return http.get<QuoteTraceVO>(`/fl/quote-calc/trace/get?traceId=${traceId}`)
}

/** 测算记录（含步骤明细） */
export interface QuoteTraceVO {
  id?: number // 测算记录 id
  quoteId?: number // 报价测算主表 id
  traceType?: number // 测算类型：0 预览，1 保存生效，2 重算
  engineVersion?: string // 引擎版本号
  inputSnapshot?: string // 测算入参快照 JSON
  outputSnapshot?: string // 结果快照 JSON（解析后为 QuoteOutputSnapshotVO）
  status?: number // 状态：0 成功，1 失败
  errorMsg?: string // 失败原因
  stepCount?: number // 步骤数
  totalCostMs?: number // 总耗时（毫秒）
  createTime?: number | string // 创建时间
  steps?: QuoteTraceStepVO[] // 步骤明细
}

/** 测算步骤明细 */
export interface QuoteTraceStepVO {
  stepNo?: number // 步骤序号
  stepCode?: string // 步骤编码
  stepName?: string // 步骤名称
  status?: number // 状态：0 成功，1 跳过，2 失败
  inputJson?: string // 输入增量 JSON
  outputJson?: string // 输出 JSON
  formulaJson?: string // 公式代入列表 JSON
  skipReason?: string // 跳过原因
  errorMsg?: string // 失败原因
  costMs?: number // 耗时（毫秒）
}

/** 结果快照（outputSnapshot 解析后） */
export interface QuoteOutputSnapshotVO {
  indicators?: Record<string, number | string | null> // 汇总指标（键见指标展示映射）
  rows?: QuoteInoutRowVO[] // 收支计划行
  accruals?: QuoteAccrualRowVO[] // 计提表行
}

/** 收支计划行 */
export interface QuoteInoutRowVO {
  period?: number // 期次（0 表示非租金期事件）
  calDate?: string // 计算日期
  planDate?: string // 计划日期
  eventCode?: string // 事件编码
  eventName?: string // 事件名称
  direction?: number // 方向：1 流入，-1 流出
  cash?: number // 发生额（含税）
  corpus?: number // 本金（去税）
  interest?: number // 利息（去税）
  corpusBalance?: number // 剩余本金（去税）
  taxCash?: number // 增值税额
  makeMethod?: number // 生成方式：0 系统，1 手工
  memo?: string // 备注
}

/** 计提表行（中粤算法） */
export interface QuoteAccrualRowVO {
  accrualType?: number // 计提类型：1 租金利息计提，2 手续费计提
  month?: string // 计提月份
  calDate?: string // 计算日期
  cash?: number // 本月计提金额
  memo?: string // 备注
}
