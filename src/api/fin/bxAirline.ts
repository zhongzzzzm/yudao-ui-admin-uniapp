import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 行程单拆分（通讯录/行程表/出差台账按部门拆分） */
export interface BxAirlineVO {
  id: number // 编号
  contacts?: string // 通讯录文件
  airline?: string // 行程表文件
  ledger?: string // 出差台账文件
  result?: string // 拆分结果文件
  status?: number // 状态：0处理中 1完成 2失败
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 获得行程单拆分分页 */
export function getBxAirlinePage(params: PageParam & { status?: number }) {
  return http.get<PageResult<BxAirlineVO>>('/fin/bx-airline/page', params)
}
