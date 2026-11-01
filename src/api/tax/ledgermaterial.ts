import type { PageParam, PageResult } from '@/http/types'
import type { TaxLedgerMaterialVO } from '@/api/tax/ledger'
import { http } from '@/http/http'

/** 获得台账附件分页（运维视角：凭证明细原始数据） */
export function getTaxLedgerMaterialPage(params: PageParam & { ledgerId?: number, materType?: number }) {
  return http.get<PageResult<TaxLedgerMaterialVO>>('/tax/ledger-material/page', params)
}
