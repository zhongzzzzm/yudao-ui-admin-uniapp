/**
 * 系统管理 - 节假日日历
 *
 * 契约与后端 ganfanren-module-system 的 HolidayController 对齐
 * （App 节假日管理页专用）。
 */
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 节假日记录 */
export interface Holiday {
  id?: number
  /** 节假日日期（yyyy-MM-dd） */
  holidayDate: string
  /** 节假日类型：1 春节、2 元旦、3 清明、4 劳动节、5 端午、6 中秋、7 国庆、8 其他 */
  type: number
  /** 是否工作日（调休补班）：true 是 / false 否 */
  workdayFlag: boolean
  /** 归属年份 */
  year: number
  /** 描述（如：元旦） */
  description?: string
  /** 星期（1-7，仅查询返回） */
  weekDay?: number
  createTime?: string
}

/** 获得节假日分页 */
export function getHolidayPage(params: PageParam & {
  holidayDate?: [string, string]
  type?: number
  workdayFlag?: boolean
  year?: number
}) {
  return http.get<PageResult<Holiday>>('/system/holiday/page', params)
}

/** 获得节假日详情 */
export function getHoliday(id: number) {
  return http.get<Holiday>(`/system/holiday/get?id=${id}`)
}

/** 创建节假日 */
export function createHoliday(data: Holiday) {
  return http.post<boolean>('/system/holiday/create', data)
}

/** 修改节假日 */
export function updateHoliday(data: Holiday) {
  return http.put<boolean>('/system/holiday/update', data)
}

/** 删除节假日 */
export function deleteHoliday(id: number) {
  return http.delete<boolean>(`/system/holiday/delete?id=${id}`)
}

/** 批量删除节假日 */
export function deleteHolidayList(ids: number[]) {
  return http.delete<boolean>(`/system/holiday/delete-list?ids=${ids.join(',')}`)
}

/** 同步节假日数据（拉取外部节假日数据源） */
export function syncHoliday(year: number) {
  return http.post<boolean>(`/system/holiday/sync?year=${year}`)
}
