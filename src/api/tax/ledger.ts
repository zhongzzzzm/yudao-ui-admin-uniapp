import type { PageParam, PageResult } from '@/http/types'
import type { BpmInstanceDetailVO } from '@/api/bpm/flow'
import { http } from '@/http/http'

/** 办税台账分页请求参数 */
export interface TaxLedgerPageReqVO extends PageParam {
  keyword?: string // 关键字（模糊匹配公司名称/办税人员/所属期）
  companyId?: number // 公司ID
  taxPerson?: string // 办税人员（模糊匹配）
  taxType?: number // 税种
  period?: string // 所属期
  status?: number // 状态：0待办理（办理流在途） 1已办理（提交办结）
  statusList?: number[] // 状态集合（任一命中）：两态下通常单值，保留集合能力兼容
}

/** 办税台账 */
export interface TaxLedgerVO {
  id: number // 编号
  companyId?: number // 公司ID
  companyName?: string // 公司名称
  taxPerson?: string // 办税人员
  taxType: number // 税种（字典 tax_type）
  period?: string // 所属期
  freq?: number // 办税频率（只读，字典 tax_freq）
  deadline?: string // 实际申报截止日（yyyy-MM-dd）
  status: number // 状态（字典 tax_ledger_status）
  declareRequired?: boolean // 是否需要上传纳税申报表（个税为 false）
  batchUploadGroup?: string // 批量上传分组标识，null 不支持批量上传
  declareUploaded?: boolean // 申报表是否已上传
  paymentProofUploaded?: boolean // 完税证明是否已上传
  declareFileUrl?: string // 申报表附件地址
  paymentProofFileUrl?: string // 完税证明附件地址
  submitDate?: string // 申报日期（yyyy-MM-dd）
  taxAmount?: number // 税额
  paidAmount?: number // 已缴金额
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 办税台账初始化请求 */
export interface TaxLedgerInitReqVO {
  taxMonth: string // 办税月（申报月），如 2026-07（必填）
  companyId?: number // 公司ID（为空则全部公司）
  taxType?: number // 税种（为空则全部税种）
  contractFileUrl?: string // 《合同余额表》文件地址，为空则只做频率驱动初始化
  deadline?: string // 申报截止日（yyyy-MM-dd），为空按税种规则计算
}

/** 办税台账附件类型：1申报表 2完税证明 */
export type TaxLedgerMaterialType = 1 | 2

/** 办税台账附件 */
export interface TaxLedgerMaterialVO {
  id: number // 编号
  ledgerId: number // 台账ID
  materType?: number // 附件类型（字典 tax_mater_type）
  fileName?: string // 文件名
  fileUrl?: string // 文件地址
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 批量归档附件请求 */
export interface TaxLedgerMaterialBatchSaveReqVO {
  ledgerIds: number[] // 台账ID列表（必填）
  materType: number // 附件类型：1申报表 2完税证明（必填）
  fileName: string // 文件名（必填）
  fileUrl: string // 文件地址（必填）
  remark?: string // 备注
}

/** 获得办税台账分页 */
export function getTaxLedgerPage(params: TaxLedgerPageReqVO) {
  return http.get<PageResult<TaxLedgerVO>>('/tax/ledger/page', params)
}

/** 获得办税台账详情 */
export function getTaxLedger(id: number) {
  return http.get<TaxLedgerVO>('/tax/ledger/get', { id })
}

/** 按办税月初始化台账，返回新增条数 */
export function initTaxLedger(data: TaxLedgerInitReqVO) {
  return http.post<number>('/tax/ledger/init', data)
}

/** 更新办税台账（备注等），状态由附件自动驱动不可手改 */
export function updateTaxLedger(data: TaxLedgerVO) {
  return http.put<boolean>('/tax/ledger/update', data)
}

/** 上传办税台账附件（先调 /infra/file/upload 得到 url，再归档） */
export function createTaxLedgerMaterialBatch(data: TaxLedgerMaterialBatchSaveReqVO) {
  return http.post<number>('/tax/ledger-material/create-batch', data)
}

/** 获得台账附件列表 */
export function getTaxLedgerMaterialListByLedger(ledgerId: number) {
  return http.get<TaxLedgerMaterialVO[]>('/tax/ledger-material/list-by-ledger', { ledgerId })
}

/** 删除台账附件 */
export function deleteTaxLedgerMaterial(id: number) {
  return http.delete<boolean>('/tax/ledger-material/delete', undefined, { id })
}

/** 公司精简列表（下拉用） */
export interface CompanySimpleVO {
  id: number // 公司ID
  companyCode?: string // 公司代码
  companyName?: string // 公司名称
}

/** 获得公司精简列表 */
export function getCompanySimpleList() {
  return http.get<CompanySimpleVO[]>('/tax/company/simple-list')
}

/** 发起办理（待办理且无进行中实例时发起/重提；撤回遗留实例则重新提交） */
export function submitTaxLedgerReview(id: number) {
  return http.post<boolean>('/tax/ledger/submit-review', undefined, { id })
}

/** 查看办理流程（审批实例 + 任务时间线；未发起时为空列表） */
export function getTaxLedgerReviewFlow(id: number) {
  return http.get<BpmInstanceDetailVO[]>('/tax/ledger/review-flow', { id })
}
