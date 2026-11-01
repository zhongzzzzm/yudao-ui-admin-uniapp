import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 流动性测算（App 支持发起测算与只读查看） */
export interface LiquidityCalculationVO {
  id: number // 编号
  point?: string // 时点（yyyy-MM）
  lastMonthCash?: number // 上月末账面现金资产（合并口径）
  currentMonthFinancingTotal?: number // 本月刚兑总额（本+息）
  currentMonthRentTotal?: number // 本月收租总额
  newInvestment?: number // 本月新增投放总额
  currentMonthNetOutflow?: number // 本月资金净流出额
  future30dFinancingTotal?: number // 未来30天刚兑总额
  future30dRentTotal?: number // 未来30天租金回收总额
  expectedFinancing?: number // 本月预计融入资金
  reserveRatio?: number // 备付金比例（固定 0.30）
  requiredCashReserve?: number // 本月末应保有现金资产总额
  minFinancingRequired?: number // 本月应融入资金最低额
  receivableRent?: string // 应收租金表文件 URL（上传后由后端解析）
  rigidRedemption?: string // 刚兑表文件 URL（上传后由后端解析）
  firstMonthLoanCash?: number // 第一个月投放金额
  secondMonthLoanCash?: number // 第二个月投放金额
  thirdMonthLoanCash?: number // 第三个月投放金额
  firstMonthMinimumCash?: number // 第一个月至少保有现金资产
  secondMonthMinimumCash?: number // 第二个月至少保有现金资产
  thirdMonthMinimumCash?: number // 第三个月至少保有现金资产
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 发起流动性测算入参（上传租金表 + 刚兑表 + 参数填写，提交后后端自动测算三个月） */
export interface LiquidityCalculationSaveReq {
  /** 时点（yyyy-MM 或 yyyy-MM-dd，必填） */
  point: string
  /** 上月末账面现金资产（合并口径，必填） */
  lastMonthCash: number
  /** 应收租金表文件 URL（必填） */
  receivableRent: string
  /** 刚兑表文件 URL（必填） */
  rigidRedemption: string
  /** 第一个月投放金额 */
  firstMonthLoanCash?: number
  /** 第二个月投放金额 */
  secondMonthLoanCash?: number
  /** 第三个月投放金额 */
  thirdMonthLoanCash?: number
  /** 第一个月至少保有现金资产 */
  firstMonthMinimumCash?: number
  /** 第二个月至少保有现金资产 */
  secondMonthMinimumCash?: number
  /** 第三个月至少保有现金资产 */
  thirdMonthMinimumCash?: number
  /** 备注 */
  remark?: string
}

/** 获得流动性测算分页 */
export function getLiquidityCalculationPage(params: PageParam) {
  return http.get<PageResult<LiquidityCalculationVO>>('/fin/liquidity-calculation/page', params)
}

/** 获得流动性测算详情 */
export function getLiquidityCalculation(id: number) {
  return http.get<LiquidityCalculationVO>('/fin/liquidity-calculation/get', { id })
}

/** 发起流动性测算（同步解析文件并生成三个月测算记录） */
export function createLiquidityCalculation(data: LiquidityCalculationSaveReq) {
  return http.post<number>('/fin/liquidity-calculation/create', data)
}

/** 删除流动性测算 */
export function deleteLiquidityCalculation(id: number) {
  return http.delete<boolean>('/fin/liquidity-calculation/delete', undefined, { id })
}

/** 流动性现金流款项类型：1租金、2租赁保证金抵扣、3租赁保证金退还、4厂商租赁保证金退还、5融资还款-本金、6融资还款-利息、7节假日提前到账-租金、8已提前到账-租金 */
export const LIQUIDITY_PAYMENT_TYPE_MAP: Record<number, string> = {
  1: '租金',
  2: '租赁保证金抵扣',
  3: '租赁保证金退还',
  4: '厂商租赁保证金退还',
  5: '融资还款-本金',
  6: '融资还款-利息',
  7: '节假日提前到账-租金',
  8: '已提前到账-租金',
}

/** 流动性现金流 */
export interface LiquidityCashFlowVO {
  id: number // 编号
  calculationId?: number // 关联测算表ID
  statMonth?: string // 统计月份（yyyy-MM）
  targetMonth?: string // 目标月份（yyyy-MM，归属哪个月）
  startDate?: string // 区间起始日期
  endDate?: string // 区间结束日期
  paymentType?: number // 款项类型
  amount?: number // 金额
  createTime?: string // 创建时间
}

/** 获得流动性现金流分页 */
export function getLiquidityCashFlowPage(params: PageParam & { calculationId?: number, statMonth?: string }) {
  return http.get<PageResult<LiquidityCashFlowVO>>('/fin/liquidity-cash-flow/page', params)
}

/** 获得流动性现金流详情 */
export function getLiquidityCashFlow(id: number) {
  return http.get<LiquidityCashFlowVO>('/fin/liquidity-cash-flow/get', { id })
}

/** 手工新增流动性现金流 */
export interface LiquidityCashFlowSaveReq {
  id?: number // 编号（更新时必填）
  /** 关联测算表 ID（必填） */
  calculationId: number
  /** 统计月份（yyyy-MM，必填） */
  statMonth: string
  /** 目标月份（yyyy-MM，指这笔钱归属哪个月，必填） */
  targetMonth: string
  /** 区间起始日期（yyyy-MM-dd，必填） */
  startDate: string
  /** 区间结束日期（yyyy-MM-dd，必填） */
  endDate: string
  /** 款项类型：1租金、2租赁保证金抵扣、3租赁保证金退还、4厂商租赁保证金退还、5融资还款-本金、6融资还款-利息、7节假日提前到账-租金、8已提前到账-租金 */
  paymentType: number
  /** 金额（必填） */
  amount: number
}

/** 手工新增流动性现金流 */
export function createLiquidityCashFlow(data: LiquidityCashFlowSaveReq) {
  return http.post<number>('/fin/liquidity-cash-flow/create', data)
}

/** 手工修改流动性现金流 */
export function updateLiquidityCashFlow(data: LiquidityCashFlowSaveReq) {
  return http.put<boolean>('/fin/liquidity-cash-flow/update', data)
}

/** 删除流动性现金流 */
export function deleteLiquidityCashFlow(id: number) {
  return http.delete<boolean>('/fin/liquidity-cash-flow/delete', undefined, { id })
}
