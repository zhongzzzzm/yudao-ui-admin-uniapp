import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 报价测算（App 只读查看）：方案分页/详情，子表随详情返回。
 * 新建/编辑/测算等强编辑操作在 PC 端完成。
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
