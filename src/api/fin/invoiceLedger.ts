import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 发票台账分页请求参数 */
export interface InvoiceLedgerPageReqVO extends PageParam {
  status?: number // 状态
  createTime?: string[] // 创建时间区间
}

/** 发票台账 */
export interface InvoiceLedgerVO {
  id: number // 编号
  description?: string // 备注
  invoice?: string // 发票台账
  ledger?: string // 明细账
  result?: string // 结果
  status?: number // 状态
  createTime?: string // 创建时间
}

/** 获得发票台账分页 */
export function getInvoiceLedgerPage(params: InvoiceLedgerPageReqVO) {
  return http.get<PageResult<InvoiceLedgerVO>>('/fin/invoice-ledger/page', params)
}

/** 获得发票台账详情 */
export function getInvoiceLedger(id: number) {
  return http.get<InvoiceLedgerVO>('/fin/invoice-ledger/get', { id })
}
