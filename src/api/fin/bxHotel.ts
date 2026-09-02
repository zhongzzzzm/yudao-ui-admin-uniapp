import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 住宿单拆分（通讯录/住宿单按部门拆分） */
export interface BxHotelVO {
  id: number // 编号
  contacts?: string // 通讯录文件
  hotel?: string // 住宿单文件
  result?: string // 拆分结果文件
  status?: number // 状态：0处理中 1完成 2失败
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 获得住宿单拆分分页 */
export function getBxHotelPage(params: PageParam & { status?: number }) {
  return http.get<PageResult<BxHotelVO>>('/fin/bx-hotel/page', params)
}
