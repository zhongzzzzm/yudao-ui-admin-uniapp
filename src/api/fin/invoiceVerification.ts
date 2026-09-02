import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 进项票抵扣（业务/财务/税局三口径比对） */
export interface InvoiceVerificationVO {
  id: number // 编号
  system?: string // 业务导出文件
  finance?: string // 财务导出文件
  tax?: string // 税局导出文件
  result?: string // 比对结果文件
  status?: number // 状态：0处理中 1完成 2失败
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 获得进项票抵扣分页 */
export function getInvoiceVerificationPage(params: PageParam & { status?: number }) {
  return http.get<PageResult<InvoiceVerificationVO>>('/fin/invoice-verification/page', params)
}
