import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 数据底稿定义（App 只读查看）：定义列表、布局版本列表、两版本表样对比。
 * 定义与布局版本的新建/发布等编辑操作在 PC 端完成。
 */

/** 底稿定义 */
export interface SourceFileDefVO {
  id: number // 编号
  code: string // 编码（唯一）
  name: string // 名称
  deptId?: number // 负责部门ID（关联 system_dept.id）
  remark?: string // 备注
  matchKeywords?: string // 文件名识别关键词（逗号分隔）
  matchExcludeKeywords?: string // 文件名排除关键词（逗号分隔）
  matchEnabled?: number // 是否参与文件名自动识别（0 否 / 1 是）
  createTime?: string // 创建时间
  currentDefVersionNo?: number // 当前布局版本号（最新已生效的发布版本；空 = 无）
}

/** 底稿布局版本 */
export interface SourceFileDefVersionVO {
  id: number // 编号
  defId: number // 底稿定义ID
  defName?: string // 底稿定义名称
  versionNo: number // 版本号
  status: number // 状态：0草稿 1已发布 2已废弃
  statusName?: string // 状态名称
  templateFile?: string // 标准底稿文件路径
  effectiveTime?: number // 生效时间（含，毫秒时间戳）
  expireTime?: number // 失效时间（不含），空 = 长期有效
  publishTime?: number // 发布时间
  publisher?: string // 发布人
  changeDesc?: string // 变更说明
  createTime?: string // 创建时间
  fingerprintJson?: string // 内容指纹配置 JSON（防传错校验基准；空=未配置）
  fingerprintSource?: number // 指纹来源：0未配置 1人工配置 2学习生成
}

/** 表样对比 - 行差异条目 */
export interface LayoutDiffRowItem {
  diffType: 'ADDED' | 'AMBIGUOUS' | 'LABEL_CHANGED' | 'REMOVED' | 'SHIFTED' // 差异类型
  oldRow?: number // 基准版 Excel 行号（1-based）
  newRow?: number // 对比版 Excel 行号（1-based）
  oldLabel?: string // 基准版行标签
  newLabel?: string // 对比版行标签
  candidates?: number[] // AMBIGUOUS 时的候选对比版行号（升序）
}

/** 表样对比 - Sheet 差异条目 */
export interface LayoutDiffSheetItem {
  status: 'ADDED' | 'CHANGED' | 'REMOVED' | 'SAME' // Sheet 级状态
  sheetName?: string // Sheet 名
  targetSheetName?: string // 对比版 Sheet 名（与基准版同名时省略）
  stats?: {
    addedCount: number // 新增行数
    ambiguousCount: number // 歧义行数
    dominantShift: number // 主导位移行数
    sameCount: number // 相同行数
    shiftedCount: number // 位移行数
    unmatchedCount: number // 未匹配行数
  }
  sourceUsedCols?: number // 基准版使用列数
  targetUsedCols?: number // 对比版使用列数
  headerChanged?: boolean // 表头是否变化
  rowItems?: LayoutDiffRowItem[] // 行差异明细
  omittedCount?: number // 超出明细上限被省略的条数
}

/** 表样对比结果（同一定义两个布局版本的底稿文件行级差异） */
export interface SourceFileDefVersionLayoutDiffVO {
  source: { id: number, status: number, versionNo: number } // 基准版本信息
  target: { id: number, status: number, versionNo: number } // 对比版本信息
  same: boolean // true = 两版表样一致（无行差异、无 Sheet 增删、列数/表头未变）
  sheetItems: LayoutDiffSheetItem[] // Sheet 差异列表
  warnings: string[] // 警告文案
}

/** 行差异类型文案 */
export const LAYOUT_DIFF_TYPE_LABELS: Record<string, string> = {
  ADDED: '新增行',
  AMBIGUOUS: '歧义行',
  LABEL_CHANGED: '标签变更',
  REMOVED: '删除行',
  SHIFTED: '位移',
}

/** 获得底稿定义分页 */
export function getSourceFileDefPage(params: PageParam & {
  name?: string // 名称关键字
  code?: string // 编码
}) {
  return http.get<PageResult<SourceFileDefVO>>('/rpt/source-file-def/page', params)
}

/** 获得底稿定义详情 */
export function getSourceFileDef(id: number) {
  return http.get<SourceFileDefVO>('/rpt/source-file-def/get', { id })
}

/** 获得底稿布局版本列表 */
export function getSourceFileDefVersionList(defId: number) {
  return http.get<SourceFileDefVersionVO[]>('/rpt/source-file-def/version/list', { defId })
}

/** 表样对比（同一定义两个布局版本的底稿文件行级差异，只读不落库） */
export function layoutDiffSourceFileDefVersion(sourceVersionId: number, targetVersionId: number) {
  return http.get<SourceFileDefVersionLayoutDiffVO>('/rpt/source-file-def/version/layout-diff', { sourceVersionId, targetVersionId })
}
