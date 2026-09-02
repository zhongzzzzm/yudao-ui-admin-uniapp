import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 报送字典 */
export interface ReportDictVO {
  id?: number // 编号
  code?: string // 编码
  name?: string // 名称
  description?: string // 备注
  createTime?: string // 创建时间
}

/** 报送字典数据（码值） */
export interface ReportDictDataVO {
  id?: number // 编号
  dictId?: number // 字典ID
  name?: string // 字典名称
  value?: string // 字典值
  status?: number // 是否填报（字典 yes_no）
  description?: string // 备注
  parentValue?: string // 上级码值
  startDate?: string // 生效日期
  endDate?: string // 失效日期
  createTime?: string // 创建时间
}

/** 获得报送字典分页 */
export function getReportDictPage(params: PageParam & { code?: string, name?: string }) {
  return http.get<PageResult<ReportDictVO>>('/validation/report-dict/page', params)
}

/** 获得报送字典详情 */
export function getReportDict(id: number) {
  return http.get<ReportDictVO>('/validation/report-dict/get', { id })
}

/** 新增报送字典 */
export function createReportDict(data: ReportDictVO) {
  return http.post<number>('/validation/report-dict/create', data)
}

/** 修改报送字典 */
export function updateReportDict(data: ReportDictVO) {
  return http.put<boolean>('/validation/report-dict/update', data)
}

/** 删除报送字典 */
export function deleteReportDict(id: number) {
  return http.delete<boolean>('/validation/report-dict/delete', undefined, { id })
}

/** 按字典获取码值列表 */
export function getReportDictDataListByDictId(dictId: number) {
  return http.get<ReportDictDataVO[]>('/validation/report-dict/report-dict-data/list-by-dict-id', { dictId })
}

/** 新增字典码值 */
export function createReportDictData(data: ReportDictDataVO) {
  return http.post<number>('/validation/report-dict/report-dict-data/create', data)
}

/** 修改字典码值 */
export function updateReportDictData(data: ReportDictDataVO) {
  return http.put<boolean>('/validation/report-dict/report-dict-data/update', data)
}

/** 删除字典码值 */
export function deleteReportDictData(id: number) {
  return http.delete<boolean>('/validation/report-dict/report-dict-data/delete', undefined, { id })
}
