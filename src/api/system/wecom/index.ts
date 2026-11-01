/**
 * 系统管理 - 企微机器人推送（Webhook 配置 / 消息模板 / 发送日志）
 *
 * 契约与后端 ganfanren-module-system 的 WeComWebhookController / WeComTemplateController /
 * WeComLogController 对齐（App 企微推送管理页专用）。
 */
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// ==================== Webhook 配置 ====================

/** 企微 Webhook 推送配置 */
export interface WeComWebhook {
  id?: number
  /** 配置名称 */
  name: string
  /** 配置编码 */
  code: string
  /** 机器人 webhook key（编辑时留空表示不修改） */
  webhookKey?: string
  /** 状态：0 开启 1 禁用 */
  status: number
  /** 备注 */
  remark?: string
  createTime?: string
}

/** 企微 Webhook 精简信息（模板表单、日志筛选用） */
export interface WeComWebhookSimple {
  /** 配置编号 */
  id: number
  /** 配置名称 */
  name: string
}

/** 获得企微推送配置分页 */
export function getWeComWebhookPage(params: PageParam & { name?: string, code?: string, status?: number }) {
  return http.get<PageResult<WeComWebhook>>('/system/wecom-webhook/page', params)
}

/** 获得企微推送配置详情 */
export function getWeComWebhook(id: number) {
  return http.get<WeComWebhook>(`/system/wecom-webhook/get?id=${id}`)
}

/** 获得企微推送配置精简列表 */
export function getSimpleWeComWebhookList() {
  return http.get<WeComWebhookSimple[]>('/system/wecom-webhook/simple-list')
}

/** 创建企微推送配置 */
export function createWeComWebhook(data: WeComWebhook) {
  return http.post<number>('/system/wecom-webhook/create', data)
}

/** 修改企微推送配置（webhookKey 留空表示不修改） */
export function updateWeComWebhook(data: WeComWebhook) {
  return http.put<boolean>('/system/wecom-webhook/update', data)
}

/** 删除企微推送配置 */
export function deleteWeComWebhook(id: number) {
  return http.delete<boolean>(`/system/wecom-webhook/delete?id=${id}`)
}

// ==================== 消息模板 ====================

/** 企微消息模板 */
export interface WeComTemplate {
  id?: number
  /** 模板名称 */
  name: string
  /** 模板编码 */
  code: string
  /** 关联 Webhook 配置编号 */
  webhookId: number
  /** 消息类型：text / markdown */
  msgType: string
  /** 模板内容（支持 {param} 占位符） */
  content: string
  /** 模板参数名列表（后端按内容解析，仅查询返回） */
  params?: string[]
  /** @ 的手机号列表（仅 text 类型生效） */
  mentionedMobileList?: string[]
  /** 状态：0 开启 1 禁用 */
  status: number
  /** 备注 */
  remark?: string
  createTime?: string
}

/** 企微消息模板精简信息（发送日志筛选用） */
export interface WeComTemplateSimple {
  /** 模板编号 */
  id: number
  /** 模板名称 */
  name: string
  /** 模板编码 */
  code: string
}

/** 获得企微消息模板分页 */
export function getWeComTemplatePage(params: PageParam & { name?: string, code?: string, webhookId?: number, msgType?: string, status?: number }) {
  return http.get<PageResult<WeComTemplate>>('/system/wecom-template/page', params)
}

/** 获得企微消息模板详情 */
export function getWeComTemplate(id: number) {
  return http.get<WeComTemplate>(`/system/wecom-template/get?id=${id}`)
}

/** 获得企微消息模板精简列表 */
export function getSimpleWeComTemplateList() {
  return http.get<WeComTemplateSimple[]>('/system/wecom-template/simple-list')
}

/** 创建企微消息模板 */
export function createWeComTemplate(data: WeComTemplate) {
  return http.post<number>('/system/wecom-template/create', data)
}

/** 修改企微消息模板 */
export function updateWeComTemplate(data: WeComTemplate) {
  return http.put<boolean>('/system/wecom-template/update', data)
}

/** 删除企微消息模板 */
export function deleteWeComTemplate(id: number) {
  return http.delete<boolean>(`/system/wecom-template/delete?id=${id}`)
}

/** 测试发送企微消息（真实外发到企微群，返回发送日志编号） */
export function sendWeComTemplate(data: { templateCode: string, templateParams: Record<string, any>, webhookId?: number }) {
  return http.post<number>('/system/wecom-template/send', data)
}

// ==================== 发送日志 ====================

/** 企微消息发送日志 */
export interface WeComLog {
  /** 日志编号 */
  id: number
  /** Webhook 配置编号 */
  webhookId: number
  /** Webhook 配置名称 */
  webhookName: string
  /** 模板编号 */
  templateId?: number
  /** 模板编码 */
  templateCode?: string
  /** 消息类型：text / markdown */
  msgType: string
  /** 渲染后的消息内容 */
  content: string
  /** 模板参数 */
  templateParams?: Record<string, any>
  /** @ 的手机号列表 */
  mentionedMobileList?: string[]
  /** 发送状态：0 初始化 1 成功 2 失败 */
  sendStatus: number
  /** 发送时间 */
  sendTime?: string
  /** 发送失败异常信息 */
  sendException?: string
  /** 创建时间 */
  createTime?: string
  /** 创建人 */
  creator?: string
}

/** 获得企微消息发送日志分页 */
export function getWeComLogPage(params: PageParam & {
  webhookId?: number
  templateId?: number
  msgType?: string
  sendStatus?: number
  createTime?: [string, string]
}) {
  return http.get<PageResult<WeComLog>>('/system/wecom-log/page', params)
}

/** 获得企微消息发送日志详情 */
export function getWeComLog(id: number) {
  return http.get<WeComLog>(`/system/wecom-log/get?id=${id}`)
}

/** 重发企微消息（原样重放该条日志内容，新建一条日志承载本次结果，返回新日志编号） */
export function resendWeComLog(id: number) {
  return http.post<number>(`/system/wecom-log/resend?id=${id}`)
}
