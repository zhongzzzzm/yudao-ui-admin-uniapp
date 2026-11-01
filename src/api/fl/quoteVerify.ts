import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

/**
 * 报价复核：复核批次列表/详情、差异明细、全量对照（只读查看），
 * 以及移动端导入复核向导（上传解析、创建并核对、重新核对）。
 */

/** 报价复核批次 */
export interface QuoteVerifyBatchVO {
  id: number // 编号
  verifyType: number // 复核类型：1 报价表 2 计提表
  basisType: number // 比对基准：1 关联方案 2 临时参数
  quoteId?: number // 关联方案 ID
  quoteCode?: string // 方案编号
  quoteName?: string // 方案名称
  traceId?: number // 比对基准的测算记录 ID
  fileName?: string // 导入文件名
  fileUrl?: string // 导入文件 URL
  tolerance: number // 容差值
  toleranceUnit: number // 容差单位：1 元 2 %
  importTaxMode: number // 导入口径：1 含税 2 去税
  status: number // 核对状态：0 核对中 1 完成 2 失败
  conclusion?: number // 核对结论：1 全部一致 2 存在差异
  matchRate?: number // 一致率（%）
  diffCount: number // 差异行数
  totalDiff: number // 差异合计
  errorMsg?: string // 失败原因
  source?: number // 来源：1 人工导入 2 落表校验 3 自动校验
  fetchBatchId?: number // 取数批次 ID（自动校验时）
  fetchBatchName?: string // 取数批次名称
  verifyConfigId?: number // 校验配置 ID
  verifyConfigName?: string // 校验配置名称
  dataPeriod?: string // 数据期间
  notifyStatus?: number // 企微通知状态：0 未推 1 已推 2 推送失败 3 跳过未推
  memo?: string // 备注
  createTime?: number // 创建时间
  diffs?: QuoteVerifyDiffVO[] // 差异明细（详情返回）
}

/** 差异明细行 */
export interface QuoteVerifyDiffVO {
  id: number // 编号
  matchKey: string // 匹配键（期次/项目）
  fieldName: string // 字段：CASH/CORPUS/INTEREST/BALANCE/TAX
  importValue?: number // 导入值
  systemValue?: number // 系统计算值
  diffValue?: number // 差额
  diffRatio?: number // 差异率
  conclusion: number // 结论：1 一致 2 差异 3 导入多余 4 系统多余
  memo?: string // 备注
}

/** 全量对照行（第三方原值 vs 干饭人计算值，含一致行） */
export interface QuoteVerifyCompareRowVO {
  matchKey: string // 匹配键
  label?: string // 展示标签
  importCash?: number // 导入租金
  importCorpus?: number // 导入本金
  importInterest?: number // 导入利息
  importBalance?: number // 导入余额
  importTax?: number // 导入税额
  systemCash?: number // 系统租金
  systemCorpus?: number // 系统本金
  systemInterest?: number // 系统利息
  systemBalance?: number // 系统余额
  systemTax?: number // 系统税额
  diff?: number // 差额
  conclusion: number // 结论：1 一致 2 差异 3 导入多余 4 系统多余
  memo?: string // 备注
}

/** 全量对照响应 */
export interface QuoteVerifyCompareVO {
  verifyType: number // 复核类型：1 报价表 2 计提表
  rows: QuoteVerifyCompareRowVO[] // 对照行
  importTotal?: number // 导入合计
  systemTotal?: number // 系统合计
  totalDiff?: number // 差异合计
}

/** 字段名 → 中文标签 */
export const VERIFY_FIELD_LABELS: Record<string, string> = {
  CASH: '租金',
  CORPUS: '本金',
  INTEREST: '利息',
  BALANCE: '余额',
  TAX: '税额',
}

/** 获得复核批次分页 */
export function getQuoteVerifyPage(params: PageParam & {
  basisType?: number // 比对基准
  conclusion?: number // 核对结论
  quoteId?: number // 关联方案
  source?: number // 来源
  verifyType?: number // 复核类型
}) {
  return http.get<PageResult<QuoteVerifyBatchVO>>('/fl/quote-verify/page', params)
}

/** 获得复核批次详情（含差异明细） */
export function getQuoteVerify(id: number) {
  return http.get<QuoteVerifyBatchVO>('/fl/quote-verify/get', { id })
}

/** 获得差异明细分页 */
export function getQuoteVerifyDiffPage(batchId: number, params: PageParam & { conclusion?: number }) {
  return http.get<PageResult<QuoteVerifyDiffVO>>('/fl/quote-verify/diff/page', { batchId, ...params })
}

/** 获得全量对照（第三方原值 vs 干饭人计算值，含一致行） */
export function getQuoteVerifyCompareRows(batchId: number) {
  return http.get<QuoteVerifyCompareVO>('/fl/quote-verify/compare-rows', { batchId })
}

// ==================== 导入复核向导（移动端兜底通道） ====================

/** 上传解析预览响应（不落库） */
export interface QuoteVerifyParseRespVO {
  headerMapping: Record<string, string> // 表头映射说明（Excel 列名 → 标准字段）
  totalRows: number // 数据行总数（含错误行）
  comparableRows: number // 可参与比对行数
  errorCount: number // 行级错误数
  sampleRows: Record<string, unknown>[] // 样例行（前 10 行，字段名 → 值）
  errors: { rowNo?: number, reason: string }[] // 行级错误列表
}

/** 创建并核对请求参数 */
export interface QuoteVerifyCreateParams {
  verifyType: number // 复核类型：1 报价表 2 计提表
  basisType: number // 比对基准：1 关联方案 2 临时参数
  quoteId?: number // 关联方案 ID（basisType=1 必填）
  paramJson?: string // 临时参数 JSON（basisType=2 时使用）
  tolerance?: number // 容差值（默认 0.01）
  toleranceUnit?: number // 容差单位：1 元 2 %
  importTaxMode?: number // 导入口径：1 含税 2 去税
  memo?: string // 备注
}

/** 上传解析预览（multipart/form-data，不落库） */
export function parseQuoteVerify(verifyType: number, filePath: string) {
  return uploadMultipart<QuoteVerifyParseRespVO>('/fl/quote-verify/parse', {}, filePath)
}

/** 创建批次并立即核对（multipart/form-data，返回批次 ID） */
export function createQuoteVerify(params: QuoteVerifyCreateParams, filePath: string) {
  const formData: Record<string, string> = {
    verifyType: String(params.verifyType),
    basisType: String(params.basisType),
  }
  if (params.quoteId != null) {
    formData.quoteId = String(params.quoteId)
  }
  if (params.paramJson) {
    formData.paramJson = params.paramJson
  }
  if (params.tolerance != null) {
    formData.tolerance = String(params.tolerance)
  }
  if (params.toleranceUnit != null) {
    formData.toleranceUnit = String(params.toleranceUnit)
  }
  if (params.importTaxMode != null) {
    formData.importTaxMode = String(params.importTaxMode)
  }
  if (params.memo) {
    formData.memo = params.memo
  }
  return uploadMultipart<number>('/fl/quote-verify/create', formData, filePath)
}

/** 重新核对（用批次留存的导入数据重算比对） */
export function runQuoteVerify(id: number) {
  return http.put<boolean>(`/fl/quote-verify/run?id=${id}`)
}

/** 通用 multipart 上传（uni.uploadFile，携带租户与认证头），解析 CommonResult 包装 */
function uploadMultipart<T>(url: string, formData: Record<string, string>, filePath: string, fileField = 'file') {
  const userStore = useUserStore()
  return useTokenStore().tryGetValidToken().then(token => new Promise<T>((resolve, reject) => {
    uni.uploadFile({
      url: `${getEnvBaseUrl()}${url}`,
      filePath,
      name: fileField,
      formData,
      header: {
        'tenant-id': userStore.tenantId,
        'Authorization': `Bearer ${token}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(res.data)
            if (result.code === 0) {
              resolve(result.data as T)
            } else {
              reject(new Error(result.msg || result.message || '请求失败'))
            }
          } catch {
            reject(new Error('响应解析失败'))
          }
        } else {
          reject(new Error(`请求失败（${res.statusCode}）`))
        }
      },
      fail: (err) => {
        console.error('上传请求失败：', url, err)
        reject(err)
      },
    })
  }))
}
