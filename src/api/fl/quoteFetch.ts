import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 报价取数：数据源 / 脚本 / 落表批次的移动端只读查看，
 * 以及立即取数、从落表批次发起校验与差异趋势查询（配置编辑在 PC 管理台）。
 */

/** 校验正整数编号 */
function requirePositiveId(id: number, label: string) {
  const value = Number(id)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}无效`)
  }
}

// ==================== 数据源 ====================

/** 数据源分页查询参数 */
export interface QuoteFetchDatasourcePageParams extends PageParam {
  name?: string // 数据源名称，模糊匹配
  status?: number // 状态：0 启用 1 停用
}

/** 报价取数数据源 */
export interface QuoteFetchDatasourceVO {
  id: number // 编号
  name: string // 数据源名称
  dbType?: number // 数据库类型：1 MySQL 2 Oracle
  url?: string // JDBC 连接串
  username?: string // 连接用户名
  status?: number // 状态：0 启用 1 停用
  lastTestStatus?: number // 最近测试连接结果：1 连通 2 失败
  lastTestTime?: number | string // 最近测试时间
  lastTestError?: string // 最近失败原因摘要
  driverClass?: string // 实际使用的 JDBC 驱动类
  diagInfo?: string // 最近连接诊断信息（失败分类、驱动版本、耗时等）
  remark?: string // 备注
  scriptCount?: number // 引用脚本数
  createTime?: number | string // 创建时间
}

/** 获得取数数据源分页 */
export function getFetchDatasourcePage(params: QuoteFetchDatasourcePageParams) {
  return http.get<PageResult<QuoteFetchDatasourceVO>>('/fl/fetch-datasource/page', params)
}

/** 获得取数数据源详情 */
export function getFetchDatasource(id: number) {
  requirePositiveId(id, '数据源编号')
  return http.get<QuoteFetchDatasourceVO>('/fl/fetch-datasource/get', { id })
}

// ==================== 取数脚本 ====================

/** 脚本分页查询参数 */
export interface QuoteFetchScriptPageParams extends PageParam {
  name?: string // 脚本名称，模糊匹配
  dataType?: number // 数据类型：1 报价表 2 计提表
  datasourceId?: number // 取数数据源编号
  status?: number // 状态：0 启用 1 停用
}

/** HTTP 取数配置（httpConfig 解析后的结构，敏感鉴权值不在移动端展示） */
export interface QuoteFetchHttpConfigVO {
  url?: string // 请求地址
  method?: string // 请求方法
  headers?: Record<string, string> | string // 请求头
  timeout?: number // 超时时间（毫秒）
  jsonPath?: string // 响应数据 JSON 路径
  authType?: string // 鉴权方式
  authValue?: string // 鉴权值（仅后端使用，移动端不展示）
}

/** 报价取数脚本 */
export interface QuoteFetchScriptVO {
  id: number // 编号
  name: string // 脚本名称
  dataType?: number // 数据类型：1 报价表 2 计提表
  datasourceId?: number // 数据源编号（HTTP 通道为空）
  datasourceName?: string // 数据源名称
  fetchSql?: string // 只读 SELECT 取数 SQL
  fieldMapping?: string // 字段映射 JSON（标准字段 → 结果列名）
  periodStrategy?: number // 期间策略：1 上个自然月 2 上月至今 3 固定期间
  periodValue?: string // 固定期间值（yyyy-MM）
  rowLimit?: number // 单次取数行数上限
  jobId?: number // 关联定时任务编号
  jobName?: string // 关联定时任务名称
  status?: number // 状态：0 启用 1 停用
  remark?: string // 备注
  lastBatchId?: number // 最近一次落表批次编号
  lastBatchStatus?: number // 最近一次落表批次状态：1 成功 2 失败
  lastBatchRowCount?: number // 最近一次落表行数
  lastFetchTime?: number | string // 最近一次取数时间
  createTime?: number | string // 创建时间
  fetchType?: number // 取数方式：1 数据源直连 3 HTTP
  httpConfig?: string // HTTP 通道配置 JSON
  version?: number // 当前脚本版本
  sourceScriptId?: number // 复制来源脚本编号
}

/** 获得取数脚本分页 */
export function getFetchScriptPage(params: QuoteFetchScriptPageParams) {
  return http.get<PageResult<QuoteFetchScriptVO>>('/fl/fetch-script/page', params)
}

/** 获得取数脚本详情 */
export function getFetchScript(id: number) {
  requirePositiveId(id, '脚本编号')
  return http.get<QuoteFetchScriptVO>('/fl/fetch-script/get', { id })
}

/** 立即取数（同步执行并落表，返回落表批次编号） */
export function manualFetch(id: number) {
  requirePositiveId(id, '脚本编号')
  return http.post<number>(`/fl/fetch-script/manual-fetch?id=${id}`)
}

// ==================== 落表批次与行数据 ====================

/** 落表批次分页查询参数 */
export interface QuoteFetchBatchPageParams extends PageParam {
  scriptId?: number // 取数脚本编号
  dataType?: number // 数据类型：1 报价表 2 计提表
  period?: string // 取数期间（计提 yyyy-MM）
  triggerSource?: number // 触发来源：1 定时任务 2 手工取数
  status?: number // 状态：1 成功 2 失败
  fetchTime?: [string, string] // 取数时间区间
}

/** 报价取数落表批次 */
export interface QuoteFetchBatchVO {
  id: number // 编号
  scriptId?: number // 取数脚本编号
  scriptName?: string // 脚本名称
  dataType?: number // 数据类型：1 报价表 2 计提表
  period?: string // 取数期间（计提 yyyy-MM；报价表为空表示全量）
  triggerSource?: number // 触发来源：1 定时任务 2 手工取数
  status?: number // 状态：1 成功 2 失败
  rowCount?: number // 落表行数
  parsedCount?: number // 标准化成功行数
  errorCount?: number // 标准化失败行数
  truncated?: boolean | number // 是否超行数上限截断
  errorMsg?: string // 失败原因摘要
  fileUrl?: string // 原始数据留档地址
  fileName?: string // 原始数据留档文件名
  fetchTime?: number | string // 取数时间
  createTime?: number | string // 创建时间
}

/** 落表行分页查询参数 */
export interface QuoteFetchRowPageParams extends PageParam {
  parseStatus?: number // 标准化状态：1 正常 2 异常
}

/** 报价取数落表行 */
export interface QuoteFetchRowVO {
  id: number // 编号
  batchId: number // 落表批次编号
  rowNo?: number // 行号
  parseStatus?: number // 标准化状态：1 正常 2 异常
  parseError?: string // 标准化失败原因
  matchKey?: string // 比对键
  std?: Record<string, unknown> | string | null // 标准化字段（JSON 对象或 JSON 字符串）
  raw?: Record<string, unknown> | string | null // 第三方原始行（JSON 对象或 JSON 字符串）
}

/** 从落表批次发起校验请求参数 */
export interface QuoteFetchBatchCreateVerifyParams {
  batchId: number // 落表批次编号
  configId?: number // 校验配置编号（与临时参数二选一）
  quoteId?: number // 比对方案编号（临时参数模式必填）
  tolerance?: number // 差异容差（默认 0.01）
  toleranceUnit?: number // 容差单位：1 元 2 %
  importTaxMode?: number // 导入金额口径：1 含税 2 去税
  memo?: string // 备注
}

/** 获得落表批次分页 */
export function getFetchBatchPage(params: QuoteFetchBatchPageParams) {
  return http.get<PageResult<QuoteFetchBatchVO>>('/fl/fetch-batch/page', params)
}

/** 获得落表批次详情 */
export function getFetchBatch(id: number) {
  requirePositiveId(id, '落表批次编号')
  return http.get<QuoteFetchBatchVO>('/fl/fetch-batch/get', { id })
}

/** 获得落表行分页（标准化 / 原始行 JSON） */
export function getFetchBatchRowPage(batchId: number, params: QuoteFetchRowPageParams) {
  requirePositiveId(batchId, '落表批次编号')
  return http.get<PageResult<QuoteFetchRowVO>>('/fl/fetch-batch/row-page', { batchId, ...params })
}

/** 从落表批次发起校验（返回复核批次编号） */
export function createFetchVerify(data: QuoteFetchBatchCreateVerifyParams) {
  requirePositiveId(data.batchId, '落表批次编号')
  const hasConfig = !!data.configId
  const hasQuote = !!data.quoteId
  if (hasConfig === hasQuote) {
    throw new Error('请选择校验配置或临时比对方案（二选一）')
  }
  if (data.tolerance != null && (!Number.isFinite(Number(data.tolerance)) || Number(data.tolerance) < 0)) {
    throw new Error('差异容差不能小于 0')
  }
  if (data.toleranceUnit != null && data.toleranceUnit !== 1 && data.toleranceUnit !== 2) {
    throw new Error('容差单位无效')
  }
  if (data.importTaxMode != null && data.importTaxMode !== 1 && data.importTaxMode !== 2) {
    throw new Error('导入金额口径无效')
  }
  return http.post<number>('/fl/fetch-batch/create-verify', { ...data })
}

// ==================== 校验配置 ====================

/** 校验配置分页查询参数 */
export interface QuoteVerifyConfigPageParams extends PageParam {
  name?: string // 配置名称，模糊匹配
  dataType?: number // 数据类型：1 报价表 2 计提表
  scriptId?: number // 绑定取数脚本编号
  status?: number // 状态：0 启用 1 停用
}

/** 报价校验配置 */
export interface QuoteVerifyConfigVO {
  id: number // 编号
  name: string // 配置名称
  dataType?: number // 数据类型：1 报价表 2 计提表
  scriptId?: number // 绑定取数脚本编号
  scriptName?: string // 绑定取数脚本名称
  quoteId?: number // 比对方案编号
  quoteCode?: string // 比对方案编号（业务编号）
  quoteName?: string // 比对方案名称
  tolerance?: number | string // 差异容差
  toleranceUnit?: number // 容差单位：1 元 2 %
  importTaxMode?: number // 导入金额口径：1 含税 2 去税
  diffAlertRatio?: number | string // 差异升级阈值
  webhookCode?: string // 企微推送配置编码
  idempotentMode?: number // 幂等策略：1 跳过 2 强制重新核对
  autoVerify?: boolean | number // 落表成功后自动校验
  weeklyDigest?: boolean | number // 一致消息周汇总
  compareScope?: number // 比对范围：0 仅租金/投放四类 1 含保证金/服务费全事件
  status?: number // 状态：0 启用 1 停用
  remark?: string // 备注
  createTime?: number | string // 创建时间
}

/** 获得校验配置分页（移动端只读取启用配置用于发起校验） */
export function getQuoteVerifyConfigPage(params: QuoteVerifyConfigPageParams) {
  return http.get<PageResult<QuoteVerifyConfigVO>>('/fl/quote-verify-config/page', params)
}

// ==================== 差异趋势 ====================

/** 方案维度差异趋势月度汇总 */
export interface QuoteFetchTrendVO {
  period: string // 统计月份（yyyy-MM）
  batchCount?: number // 当期复核批次数
  avgMatchRate?: number | string // 平均一致率（与 matchRate 一致，0~1 小数）
  totalDiffCount?: number // 当期差异行数合计
  totalDiff?: number | string // 当期发生额合计差额
}

/** 获得方案最近 N 期差异趋势 */
export function getFetchDataTrend(quoteId: number, months = 12) {
  requirePositiveId(quoteId, '报价方案编号')
  if (!Number.isFinite(Number(months)) || Number(months) <= 0) {
    throw new Error('趋势月份必须大于 0')
  }
  return http.get<QuoteFetchTrendVO[]>('/fl/fetch-data/trend', { quoteId, months })
}
