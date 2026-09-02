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
  smallMicroProfitFlag?: number // 小型微利企业（字典 yes_no）
  createTime?: string // 创建时间
}

/** 获得公司定义分页 */
export function getTaxCompanyPage(params: PageParam & { companyCode?: string, companyName?: string, taxPerson?: string }) {
  return http.get<PageResult<TaxCompanyVO>>('/tax/company/page', params)
}

/** 获得公司定义详情 */
export function getTaxCompany(id: number) {
  return http.get<TaxCompanyVO>('/tax/company/get', { id })
}
