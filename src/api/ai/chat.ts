import { http } from '@/http/http'

/**
 * AI 助手（问进度 / 问数 / 审批辅助）。
 * 流式对话走 sendSsePost（src/http/sse.ts，已带 Bearer 与 tenant-id 头），
 * 会话管理走普通 http 封装。
 */

export interface AiConversation {
  id: number
  lastMessageTime: string
  title: string
}

export interface AiMessage {
  cardsJson?: string
  content: string
  id: number
  replyTime?: string
  role: 'assistant' | 'user'
  status: number
}

export interface AiCard {
  [key: string]: any
  items?: AiProgressItem[]
  moreLink?: { path: string }
  risks?: string[]
  rows?: any[]
  columns?: { key: string, label: string }[]
  summaryMd?: string
  title: string
  totalRows?: number
  truncated?: boolean
  type: 'approval_summary' | 'chart' | 'prefill' | 'progress' | 'table'
}

export interface AiProgressItem {
  assignee?: null | string
  deadline?: string
  deadlineTip?: string
  link?: { path: string, query?: Record<string, any> }
  note?: null | string
  overdue?: boolean
  stage?: null | string
  title: string
}

export interface AiEmployee {
  avatar?: string
  builtin?: boolean
  description?: string
  greeting?: string
  id: number
  jobTitle?: string
  name: string
  quickAsks?: string[]
}

/** 头像展示兜底：非 emoji 的图标名统一回落 🤖 */
export function displayAvatar(avatar?: null | string): string {
  return avatar && avatar.length <= 4 ? avatar : '🤖'
}

/** 我的智能员工（可见 + 启用，按最近使用排序） */
export function getMyAiEmployees() {
  return http.get<AiEmployee[]>('/ai/employee/my-list')
}

export function getAiConversationPage(pageNo = 1, pageSize = 20) {
  return http.get<{ list: AiConversation[], total: number }>('/ai/conversation/page', { pageNo, pageSize })
}

export function getAiConversationMessages(id: number) {
  return http.get<AiMessage[]>(`/ai/conversation/${id}/messages`)
}

export function deleteAiConversation(id: number) {
  return http.delete<boolean>(`/ai/conversation/${id}`)
}

export function feedbackAiMessage(messageId: number, rating: 1 | -1, comment?: string) {
  return http.post<boolean>('/ai/message/feedback', { comment, rating, messageId })
}

/** 深链：卡片点击跳转（PC 路由路径 → 移动端页面映射，未映射的提示到 PC 端查看） */
export function goCardLink(link?: { path: string, query?: Record<string, any> }) {
  if (!link?.path)
    return
  const routeMap: Record<string, string> = {
    '/bpm/task/todo': '/pages/todo/index',
    '/bs/tax-report-filing': '/pages-rpt/filing/list',
    '/tax/ledger': '/pages-tax/ledger/list',
  }
  const target = routeMap[link.path]
  if (target) {
    uni.navigateTo({ url: target })
  } else {
    uni.showToast({ icon: 'none', title: '请在 PC 端查看该明细' })
  }
}

/** 重命名会话（App 历史会话列表） */
export function renameAiConversation(id: number, title: string) {
  return http.put<boolean>(`/ai/conversation/${id}`, {}, { title })
}
