/**
 * 系统管理 - OAuth2（客户端 / 访问令牌）
 *
 * 契约与后端 ganfanren-module-system 的 OAuth2ClientController / OAuth2TokenController
 * 对齐（App OAuth2 管理页专用）。
 */
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// ==================== OAuth2 客户端 ====================

/** OAuth2 客户端 */
export interface OAuth2Client {
  id?: number
  /** 客户端编号（认证用） */
  clientId: string
  /** 客户端密钥 */
  secret: string
  /** 客户端名称 */
  name: string
  /** 应用图标 */
  logo?: string
  /** 应用描述 */
  description?: string
  /** 状态：0 开启 1 禁用 */
  status: number
  /** 访问令牌有效期（秒） */
  accessTokenValiditySeconds: number
  /** 刷新令牌有效期（秒） */
  refreshTokenValiditySeconds: number
  /** 重定向 URI 列表 */
  redirectUris: string[]
  /** 授权类型列表（authorization_code / password / implicit / client_credentials / refresh_token） */
  authorizedGrantTypes: string[]
  /** 授权范围列表 */
  scopes: string[]
  /** 自动授权范围列表 */
  autoApproveScopes?: string[]
  /** 权限列表 */
  authorities?: string[]
  /** 资源编号列表 */
  resourceIds?: string[]
  /** 附加信息（JSON 字符串） */
  additionalInformation?: string
  createTime?: string
}

/** 获得OAuth2客户端分页 */
export function getOAuth2ClientPage(params: PageParam & { name?: string, status?: number }) {
  return http.get<PageResult<OAuth2Client>>('/system/oauth2-client/page', params)
}

/** 获得OAuth2客户端详情 */
export function getOAuth2Client(id: number) {
  return http.get<OAuth2Client>(`/system/oauth2-client/get?id=${id}`)
}

/** 创建OAuth2客户端 */
export function createOAuth2Client(data: OAuth2Client) {
  return http.post<number>('/system/oauth2-client/create', data)
}

/** 修改OAuth2客户端 */
export function updateOAuth2Client(data: OAuth2Client) {
  return http.put<boolean>('/system/oauth2-client/update', data)
}

/** 删除OAuth2客户端 */
export function deleteOAuth2Client(id: number) {
  return http.delete<boolean>(`/system/oauth2-client/delete?id=${id}`)
}

// ==================== 访问令牌 ====================

/** OAuth2 访问令牌 */
export interface OAuth2AccessToken {
  /** 编号 */
  id: number
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken: string
  /** 用户编号 */
  userId: number
  /** 用户类型 */
  userType: number
  /** 客户端编号 */
  clientId: string
  /** 创建时间 */
  createTime?: string
  /** 过期时间 */
  expiresTime?: string
}

/** 获得访问令牌分页（只返回有效期内的） */
export function getOAuth2TokenPage(params: PageParam & { userId?: number, userType?: number, clientId?: string }) {
  return http.get<PageResult<OAuth2AccessToken>>('/system/oauth2-token/page', params)
}

/** 删除访问令牌（强制下线） */
export function deleteOAuth2Token(accessToken: string) {
  return http.delete<boolean>(`/system/oauth2-token/delete?accessToken=${accessToken}`)
}
