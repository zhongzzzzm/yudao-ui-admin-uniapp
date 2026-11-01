import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { uploadMultipart } from '@/http/multipart'

/** 公司通讯录人员信息 */
export interface CompanyContactVO {
  id: number // 编号
  groupName?: string // 分组（如部门，用于行程单/住宿单拆分匹配）
  sortNo?: number // 序号
  name: string // 姓名
  createTime?: string // 创建时间
}

/** 导入行级错误明细 */
export interface CompanyContactImportRowError {
  row: number // Excel 行号（1 基）
  reason: string // 失败原因
}

/** 通讯录导入结果 */
export interface CompanyContactImportRespVO {
  mode: number // 导入模式（1 清空覆盖 2 追加）
  totalRows: number // 解析到的数据行总数
  successRows: number // 成功导入行数
  errorRows: number // 失败行数
  errors: CompanyContactImportRowError[] // 行级错误明细
}

/** 获得公司通讯录人员分页 */
export function getCompanyContactPage(params: PageParam & {
  groupName?: string // 分组，模糊匹配（可空）
  name?: string // 姓名，模糊匹配（可空）
}) {
  return http.get<PageResult<CompanyContactVO>>('/fin/company-contact/page', params)
}

/** 获得公司通讯录人员详情 */
export function getCompanyContact(id: number) {
  return http.get<CompanyContactVO>('/fin/company-contact/get', { id })
}

/** 新增公司通讯录人员 */
export function createCompanyContact(data: Partial<CompanyContactVO>) {
  return http.post<number>('/fin/company-contact/create', data)
}

/** 修改公司通讯录人员 */
export function updateCompanyContact(data: Partial<CompanyContactVO>) {
  return http.put<boolean>('/fin/company-contact/update', data)
}

/** 删除公司通讯录人员 */
export function deleteCompanyContact(id: number) {
  return http.delete<boolean>('/fin/company-contact/delete', undefined, { id })
}

/**
 * 导入公司通讯录（Excel，multipart/form-data）
 * @param filePath 本地文件路径（chooseImportFile 选出）
 * @param mode 导入模式：1 清空覆盖 2 追加
 */
export function importCompanyContact(filePath: string, mode: number) {
  return uploadMultipart<CompanyContactImportRespVO>(
    '/fin/company-contact/import',
    filePath,
    { mode: String(mode) },
  )
}
