import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 银行流水明细（App 只读查询；导入/模板维护在 PC 端完成） */

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

/** 获得银行流水分页 */
export function getBankFlowPage(params: PageParam & {
  counterpartyBankFilled?: number // 对方行名补录状态
  counterpartyKeyword?: string // 对方信息关键字
  currency?: string // 币种
  direction?: number // 资金方向：1 收入 2 支出
  ownAccountNo?: string // 己方账号
  transDate?: string[] // 交易日期范围 [起, 止]（yyyy-MM-dd）
}) {
  return http.get<PageResult<BankFlowVO>>('/fin/bank-flow/page', params)
}

/** 当前筛选下的收/支/净额汇总（列表页顶部横幅） */
export function getBankFlowSummary(params: Partial<PageParam> & {
  counterpartyKeyword?: string
  direction?: number
  ownAccountNo?: string
  transDate?: string[]
}) {
  return http.get<BankFlowSummaryVO>('/fin/bank-flow/summary', params)
}

/** 库内去重的己方账号（筛选下拉用） */
export function getBankFlowOwnAccounts() {
  return http.get<string[]>('/fin/bank-flow/own-accounts')
}
