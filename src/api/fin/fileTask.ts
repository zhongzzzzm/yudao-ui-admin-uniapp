import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 财务文件任务：上传文件 → 异步处理 → 生成结果文件 的统一任务模型 */

/** 任务文件条目（input/output 槽位） */
export interface FinFileTaskFileVO {
  /** 槽位编码（与后端 FinFileTaskNodeEnum 约定，如 current_period） */
  slot: string
  /** 文件名 */
  name?: string
  /** 文件访问 URL */
  url: string
}

/** 财务文件任务 */
export interface FinFileTaskVO {
  id: number // 编号
  /** 节点编码，如 financial_report */
  nodeType: string
  /** 节点中文名 */
  nodeLabel?: string
  /** 状态：0 处理中 1 完成 2 失败（null=未触发） */
  status?: number | null
  /** 备注 */
  description?: string
  /** 结果摘要 / 失败原因 */
  resultSummary?: string | null
  /** 输入文件列表（按槽位） */
  inputFiles?: FinFileTaskFileVO[]
  /** 输出文件列表（固定 result 槽位） */
  outputFiles?: FinFileTaskFileVO[]
  /** 节点参数（如 templateVersion） */
  params?: Record<string, any>
  /** 业务期次 yyyy-MM（可空） */
  period?: string
  /** 创建时间 */
  createTime?: string
}

/** 发起文件任务入参 */
export interface FinFileTaskSaveReq {
  id?: number // 编号（更新时必填）
  /** 节点编码（必填，如 financial_report） */
  nodeType: string
  /** 备注 */
  description?: string
  /** 业务期次 yyyy-MM（可空） */
  period?: string
  /** 输入文件列表（slot 与后端节点枚举一一对应） */
  inputFiles: FinFileTaskFileVO[]
  /** 节点参数 */
  params?: Record<string, any>
}

/** 查询文件任务分页（nodeType 必传，按节点路由权限） */
export function getFinFileTaskPage(params: PageParam & { nodeType: string, status?: number, description?: string }) {
  return http.get<PageResult<FinFileTaskVO>>('/fin/file-task/page', params)
}

/** 查询文件任务详情 */
export function getFinFileTask(nodeType: string, id: number) {
  return http.get<FinFileTaskVO>('/fin/file-task/get', { nodeType, id })
}

/** 发起文件任务（上传文件后调用，后端异步处理） */
export function createFinFileTask(data: FinFileTaskSaveReq) {
  return http.post<number>('/fin/file-task/create', data)
}

/** 修改文件任务 */
export function updateFinFileTask(data: FinFileTaskSaveReq) {
  return http.put<boolean>('/fin/file-task/update', data)
}

/** 删除文件任务 */
export function deleteFinFileTask(nodeType: string, id: number) {
  return http.delete<boolean>('/fin/file-task/delete', undefined, { nodeType, id })
}
