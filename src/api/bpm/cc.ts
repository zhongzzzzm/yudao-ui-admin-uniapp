import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 抄送我的（App 只读查看 + 标记已读） */

/** 抄送记录 */
export interface BpmCcVO {
  id: number // 编号
  instanceId: number // 审批实例 ID
  round: number // 抄送时的轮次
  nodeKey: string // 节点 key
  nodeName: string // 节点名称
  userId: number // 抄送目标用户 ID
  title: string // 单据标题
  readFlag: boolean // 是否已读
  createTime: string // 抄送时间
}

/** 获得抄送我的分页 */
export function getBpmCcPage(params: PageParam & {
  readFlag?: boolean // 已读状态筛选
  title?: string // 标题关键字
}) {
  return http.get<PageResult<BpmCcVO>>('/bpm/cc/page', params)
}

/** 标记单条抄送已读 */
export function markBpmCcRead(id: number) {
  return http.put<boolean>('/bpm/cc/read', { id })
}
