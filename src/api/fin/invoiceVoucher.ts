import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 发票凭证关联（发票台账与凭证比对） */
export interface InvoiceVoucherVO {
  id: number // 编号
  invoice?: string // 发票台账文件
  voucher?: string // 凭证文件
  result?: string // 比对结果文件
  status?: number // 状态：0处理中 1完成 2失败
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 获得发票凭证关联分页 */
export function getInvoiceVoucherPage(params: PageParam & { status?: number }) {
  return http.get<PageResult<InvoiceVoucherVO>>('/fin/invoice-voucher/page', params)
}
