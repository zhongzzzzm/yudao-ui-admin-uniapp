/**
 * 系统管理 - 邮件（邮箱账号 / 邮件模板 / 发送日志）
 *
 * 契约与后端 ganfanren-module-system 的 MailAccountController / MailTemplateController /
 * MailLogController 对齐（App 邮件管理页专用）。
 */
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// ==================== 邮箱账号 ====================

/** 邮箱账号 */
export interface MailAccount {
  id?: number
  /** 邮箱地址 */
  mail: string
  /** 登录用户名 */
  username: string
  /** 登录密码 */
  password: string
  /** SMTP 服务器地址 */
  host: string
  /** SMTP 端口 */
  port: number
  /** 是否开启 SSL */
  sslEnable: boolean
  /** 是否开启 STARTTLS */
  starttlsEnable: boolean
  createTime?: string
}

/** 邮箱账号精简信息（下拉选择用） */
export interface MailAccountSimple {
  /** 账号编号 */
  id: number
  /** 邮箱地址 */
  mail: string
}

/** 获得邮箱账号分页 */
export function getMailAccountPage(params: PageParam & { mail?: string, username?: string }) {
  return http.get<PageResult<MailAccount>>('/system/mail-account/page', params)
}

/** 获得邮箱账号详情 */
export function getMailAccount(id: number) {
  return http.get<MailAccount>(`/system/mail-account/get?id=${id}`)
}

/** 获得邮箱账号精简列表（模板表单选择发件账号用） */
export function getSimpleMailAccountList() {
  return http.get<MailAccountSimple[]>('/system/mail-account/simple-list')
}

/** 创建邮箱账号 */
export function createMailAccount(data: MailAccount) {
  return http.post<number>('/system/mail-account/create', data)
}

/** 修改邮箱账号 */
export function updateMailAccount(data: MailAccount) {
  return http.put<boolean>('/system/mail-account/update', data)
}

/** 删除邮箱账号 */
export function deleteMailAccount(id: number) {
  return http.delete<boolean>(`/system/mail-account/delete?id=${id}`)
}

// ==================== 邮件模板 ====================

/** 邮件模板 */
export interface MailTemplate {
  id?: number
  /** 模板名称 */
  name: string
  /** 模板编码 */
  code: string
  /** 发件邮箱账号编号 */
  accountId: number
  /** 发件人名称 */
  nickname: string
  /** 邮件标题（支持 {param} 占位符） */
  title: string
  /** 模板内容（HTML，支持 {param} 占位符） */
  content: string
  /** 模板参数名列表（后端按内容解析，仅查询返回） */
  params?: string[]
  /** 状态：0 开启 1 禁用 */
  status: number
  /** 备注 */
  remark?: string
  createTime?: string
}

/** 邮件模板精简信息（发送日志筛选用） */
export interface MailTemplateSimple {
  /** 模板编号 */
  id: number
  /** 模板名称 */
  name: string
}

/** 获得邮件模板分页 */
export function getMailTemplatePage(params: PageParam & { name?: string, code?: string, accountId?: number, status?: number }) {
  return http.get<PageResult<MailTemplate>>('/system/mail-template/page', params)
}

/** 获得邮件模板详情 */
export function getMailTemplate(id: number) {
  return http.get<MailTemplate>(`/system/mail-template/get?id=${id}`)
}

/** 获得邮件模板精简列表 */
export function getSimpleMailTemplateList() {
  return http.get<MailTemplateSimple[]>('/system/mail-template/simple-list')
}

/** 创建邮件模板 */
export function createMailTemplate(data: MailTemplate) {
  return http.post<number>('/system/mail-template/create', data)
}

/** 修改邮件模板 */
export function updateMailTemplate(data: MailTemplate) {
  return http.put<boolean>('/system/mail-template/update', data)
}

/** 删除邮件模板 */
export function deleteMailTemplate(id: number) {
  return http.delete<boolean>(`/system/mail-template/delete?id=${id}`)
}

/** 测试发送邮件（真实外发，返回发送日志编号） */
export function sendMailTemplate(data: { mail: string, templateCode: string, templateParams: Record<string, any> }) {
  return http.post<number>('/system/mail-template/send-mail', data)
}

// ==================== 发送日志 ====================

/** 邮件发送日志 */
export interface MailLog {
  /** 日志编号 */
  id: number
  /** 关联用户编号 */
  userId?: number
  /** 用户类型 */
  userType?: number
  /** 收件邮箱 */
  toMail: string
  /** 发件邮箱账号编号 */
  accountId: number
  /** 发件邮箱 */
  fromMail: string
  /** 模板编号 */
  templateId: number
  /** 模板编码 */
  templateCode: string
  /** 发件人名称 */
  templateNickname: string
  /** 邮件标题（渲染后） */
  templateTitle: string
  /** 邮件内容（渲染后） */
  templateContent: string
  /** 模板参数 */
  templateParams?: Record<string, any>
  /** 发送状态：0 初始化 1 成功 2 失败 3 不发送 */
  sendStatus: number
  /** 发送时间 */
  sendTime?: string
  /** 发送返回的消息编号 */
  sendMessageId?: string
  /** 发送失败异常信息 */
  sendException?: string
  /** 创建时间 */
  createTime?: string
}

/** 获得邮件发送日志分页 */
export function getMailLogPage(params: PageParam & {
  userId?: number
  userType?: number
  toMail?: string
  accountId?: number
  templateId?: number
  sendStatus?: number
  createTime?: [string, string]
}) {
  return http.get<PageResult<MailLog>>('/system/mail-log/page', params)
}

/** 获得邮件发送日志详情 */
export function getMailLog(id: number) {
  return http.get<MailLog>(`/system/mail-log/get?id=${id}`)
}
