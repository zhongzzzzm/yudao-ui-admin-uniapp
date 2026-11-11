import type { QuoteFetchHttpConfigVO } from '@/api/fl/quoteFetch'
import { toFiniteNumber } from '@/utils/format'

/** 取数域移动端统一提示（D8：配置编辑仅 PC 管理台） */
export const FETCH_READONLY_TIP = '配置请在 PC 管理台操作'

/** 取数域三个只读列表 tab */
export const FETCH_TABS = [
  { label: '数据源', path: '/pages-fl/quotefetch/datasource/list' },
  { label: '取数脚本', path: '/pages-fl/quotefetch/script/list' },
  { label: '落表数据', path: '/pages-fl/quotefetch/data/list' },
] as const

/** 切换取数 tab（同页不重复跳转，redirectTo 避免深层返回栈） */
export function goFetchTab(path: string, currentPath: string) {
  if (path === currentPath) {
    return
  }
  uni.redirectTo({ url: path })
}

/** 普通值展示：空值显示「-」 */
export function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return String(value)
}

/** 布尔 / bit 值展示 */
export function displayBoolean(value: unknown): string {
  if (value === true || value === 1 || value === '1') {
    return '是'
  }
  if (value === false || value === 0 || value === '0') {
    return '否'
  }
  return '-'
}

/** 启用状态：0 启用 1 停用 */
export function enabledLabel(status?: number): string {
  return status === 1 ? '停用' : '启用'
}

/** 启用状态标签颜色 */
export function enabledTagType(status?: number): 'success' | 'info' {
  return status === 1 ? 'info' : 'success'
}

/** 数据库类型：1 MySQL 2 Oracle */
export function dbTypeLabel(dbType?: number): string {
  return { 1: 'MySQL', 2: 'Oracle' }[dbType ?? 0] ?? '未知'
}

/** 数据类型：1 报价表 2 计提表 */
export function dataTypeLabel(dataType?: number): string {
  return { 1: '报价表', 2: '计提表' }[dataType ?? 0] ?? '未知'
}

/** 取数方式：1 数据源直连 3 HTTP */
export function fetchTypeLabel(fetchType?: number): string {
  return { 1: '数据源直连', 3: 'HTTP 接口' }[fetchType ?? 0] ?? '数据源直连'
}

/** 期间策略：1 上个自然月 2 上月至今 3 固定期间 */
export function periodStrategyLabel(strategy?: number): string {
  return { 1: '上个自然月', 2: '上月至今', 3: '固定期间' }[strategy ?? 0] ?? '-'
}

/** 落表批次状态：1 成功 2 失败 */
export function batchStatusLabel(status?: number): string {
  return status === 2 ? '失败' : '成功'
}

/** 落表批次状态标签颜色 */
export function batchStatusTagType(status?: number): 'success' | 'error' {
  return status === 2 ? 'error' : 'success'
}

/** 触发来源：1 定时任务 2 手工取数 */
export function triggerSourceLabel(source?: number): string {
  return { 1: '定时任务', 2: '手工取数' }[source ?? 0] ?? '-'
}

/** 最近测试连接结果：1 连通 2 失败 */
export function testStatusLabel(status?: number): string {
  return status === 2 ? '失败' : status === 1 ? '连通' : '未测试'
}

/** 最近测试连接状态标签颜色 */
export function testStatusTagType(status?: number): 'success' | 'error' | 'info' {
  return status === 2 ? 'error' : status === 1 ? 'success' : 'info'
}

/** 标准化状态：1 正常 2 异常 */
export function parseStatusLabel(status?: number): string {
  return status === 2 ? '异常' : status === 1 ? '正常' : '未知'
}

/** 标准化状态标签颜色 */
export function parseStatusTagType(status?: number): 'success' | 'error' | 'info' {
  return status === 2 ? 'error' : status === 1 ? 'success' : 'info'
}

/** 一致率兼容 0~1 小数与 0~100 百分数两种口径 */
export function normalizePercent(value: unknown): number | undefined {
  const rate = toFiniteNumber(value)
  if (rate === undefined || rate < 0) {
    return undefined
  }
  return Math.min(100, rate <= 1 ? rate * 100 : rate)
}

/** 一致率展示（带百分号） */
export function formatMatchPercent(value: unknown): string {
  const percent = normalizePercent(value)
  return percent === undefined ? '-' : `${percent.toFixed(2)}%`
}

/** JSON 对象 / JSON 字符串统一格式化，非法字符串按原文展示 */
export function formatJson(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '暂无数据'
  }
  let parsed: unknown = value
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) {
      return '暂无数据'
    }
    try {
      parsed = JSON.parse(text)
    } catch {
      return text
    }
  }
  if (parsed !== null && typeof parsed === 'object') {
    try {
      return JSON.stringify(parsed, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(parsed)
}

/** 解析 HTTP 取数配置；失败时仅返回错误文案，不回显可能含鉴权值的配置原文 */
export function parseHttpConfig(raw?: string): {
  config?: QuoteFetchHttpConfigVO
  error?: string
} {
  if (!raw) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('HTTP 配置不是 JSON 对象')
    }
    return { config: parsed as QuoteFetchHttpConfigVO }
  } catch (error) {
    return { error: (error as Error)?.message || 'HTTP 配置解析失败' }
  }
}
