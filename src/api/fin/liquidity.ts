import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 流动性测算 */
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
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 获得流动性测算分页 */
export function getLiquidityCalculationPage(params: PageParam) {
  return http.get<PageResult<LiquidityCalculationVO>>('/fin/liquidity-calculation/page', params)
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
