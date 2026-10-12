import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 存款结息测算（App 只读查看；新建测算、导出在 PC 端完成） */

/** 利率段 */
export interface DepositRateSegmentVO {
  startDate: string // 起始日（含）
  endDate: string // 截止日（不含）
  annualRate: number // 年利率（%）
}

/** 存款结息测算批次 */
export interface DepositInterestVO {
  id: number // 编号
  description?: string // 备注
  accountCode?: string // 科目编码
  accountName?: string // 科目全路径
  period?: string // 账期
  fileUrl?: string // 三栏式明细账文件 URL
  fileName?: string // 原文件名
  calcMode?: number // 计算方式：1 按结息点核对 2 任意期间试算
  rateSegments?: DepositRateSegmentVO[] // 利率段录入（试算模式为单段）
  periodStart?: string // 试算起始日（含，仅试算模式）
  periodEnd?: string // 试算截止日（不含，仅试算模式）
  annualRate?: number // 试算年利率（%，仅试算模式）
  totalInterest?: number // 合计计算利息
  totalDays?: number // 合计计息天数
  createTime?: number // 创建时间
}

/** 结息区间汇总 */
export interface DepositSettlementVO {
  id: number // 编号
  calculationId: number // 测算批次 ID
  periodStart: string // 区间起始日
  periodEnd: string // 区间截止日
  days: number // 计息天数
  totalInterest: number // 区间计算利息
  bookedInterest?: number // 账内入账利息（试算模式为空）
  interestDiff?: number // 差额（试算模式为空）
  segments: DepositSegmentVO[] // 利率段汇总
}

/** 利率段汇总 */
export interface DepositSegmentVO {
  id: number // 编号
  settlementId: number // 结息区间 ID
  segIndex: number // 段序号
  segStart: string // 段起始日
  segEnd: string // 段截止日
  annualRate: number // 年利率（%）
  days: number // 天数
  avgBalance: number // 日均余额
  interest: number // 段内利息
}

/** 逐日计息明细 */
export interface DepositInterestDetailVO {
  id: number // 编号
  settlementId: number // 结息区间 ID
  segIndex: number // 段序号
  balanceDate: string // 余额日
  balance: number // 当日余额
  sourceDesc: string // 余额来源描述
  annualRate: number // 年利率（%）
  dailyRate: number // 日利率
  dailyInterest: number // 当日利息
}

/** 获得存款结息测算分页 */
export function getDepositInterestPage(params: PageParam) {
  return http.get<PageResult<DepositInterestVO>>('/fin/deposit-interest/page', params)
}

/** 获得存款结息测算详情 */
export function getDepositInterest(id: number) {
  return http.get<DepositInterestVO>('/fin/deposit-interest/get', { id })
}

/** 获得结息区间列表（含利率段汇总） */
export function getDepositInterestSettlements(calculationId: number) {
  return http.get<DepositSettlementVO[]>('/fin/deposit-interest/settlement-list', { calculationId })
}

/** 获得逐日计息明细分页（按结息区间过滤） */
export function getDepositInterestDetailPage(params: PageParam & { settlementId?: number }) {
  return http.get<PageResult<DepositInterestDetailVO>>('/fin/deposit-interest/detail-page', params)
}
