import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 公司定义 */
export interface TaxCompanyVO {
  id: number // 编号
  companyCode?: string // 公司代码（业务唯一键）
  companyName?: string // 公司名称
  establishDate?: string // 成立日期
  deregDate?: string // 注销日期
  investStatus?: number // 投放状态（字典 tax_loan_status）
  financeHead?: string // 财务负责人
  taxPerson?: string // 办税人员
  taxPersonUserId?: number // 办税人员系统用户编号（办理流办理人）
  reviewer?: string // 复核人
  taxRegDate?: string // 税务登记时间
  vatGeneralStartDate?: string // 增值税一般纳税人资格生效日期
  vatFrequency?: number // 增值税申报频率（字典 tax_freq）
  vatRate?: number // 增值税税率（字典 tax_vat_rate）
  pftFrequency?: number // 个人所得税频率（字典 tax_freq）
  citFrequency?: number // 企业所得税频率（字典 tax_freq）
  stampBusinessBooks?: number // 印花税-营业账簿（字典 tax_freq）
  stampLoanContract?: number // 印花税-借款合同（字典 tax_freq）
  stampFinanceLeaseContract?: number // 印花税-融资租赁合同（字典 tax_freq）
  stampSaleContract?: number // 印花税-买卖合同（字典 tax_freq）
  smallMicroProfitFlag?: number // 小型微利企业（字典 yes_no：0是 1否）
  taxTaskFlag?: number // 是否生成办税任务（字典 yes_no：0是 1否，母公司/合并主体等仅报表口径的公司置否）
  createTime?: string // 创建时间
}

/** 办税人员未自动绑定明细 */
export interface TaxCompanyUnboundVO {
  companyCode?: string // 公司代码
  companyName?: string // 公司名称
  taxPerson?: string // 办税人员姓名（Excel 或库中的文本）
  reason?: number // 未自动绑定原因：1 未找到同名系统用户 / 2 存在多个同名系统用户
}

/** 公司 Excel 导入结果（硬校验失败整批回滚，由 http 层统一抛错） */
export interface TaxCompanyImportRespVO {
  total: number // 导入成功条数（新增 + 更新）
  boundCount: number // 按姓名精确匹配自动绑定办税系统用户成功数
  unboundList: TaxCompanyUnboundVO[] // 未自动绑定的公司明细，需在公司定义里手动选择
}

/** 办税人员系统用户一键回填结果 */
export interface TaxCompanyBindTaxPersonRespVO {
  boundCount: number // 本次自动绑定办税系统用户成功数
  unboundList: TaxCompanyUnboundVO[] // 未自动绑定的公司明细
}

/** 获得公司定义分页 */
export function getTaxCompanyPage(params: PageParam & { companyCode?: string, companyName?: string, taxPerson?: string }) {
  return http.get<PageResult<TaxCompanyVO>>('/tax/company/page', params)
}

/** 获得公司定义详情 */
export function getTaxCompany(id: number) {
  return http.get<TaxCompanyVO>('/tax/company/get', { id })
}

/** 新增公司定义 */
export function createTaxCompany(data: TaxCompanyVO) {
  return http.post<boolean>('/tax/company/create', data)
}

/** 修改公司定义 */
export function updateTaxCompany(data: TaxCompanyVO) {
  return http.put<boolean>('/tax/company/update', data)
}

/** 导入公司 Excel：url 为文件上传后的地址；硬校验失败整批回滚，成功时返回条数与办税人员自动绑定结果 */
export function importTaxCompanyExcel(url: string) {
  return http.post<TaxCompanyImportRespVO>('/tax/company/import-excel', undefined, { url })
}

/** 自动绑定办税人员系统用户：为已填姓名但未绑定的存量公司按姓名精确匹配一键回填 */
export function bindTaxPersonUser() {
  return http.post<TaxCompanyBindTaxPersonRespVO>('/tax/company/bind-tax-person-user')
}
