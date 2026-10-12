import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 数据指标值（App 只读查询 + 溯源链路；计算触发在 PC 端完成） */

/** 数据指标值 */
export interface DataIndicatorValueVO {
  id: number // 编号
  indicatorId: number // 数据指标 ID
  indicatorCode?: string // 指标编码
  indicatorName?: string // 指标名称
  dimensionId?: number // 数据维度 ID
  valueType?: number // 取值方式：1 底稿固定单元格 2 底稿+Java处理器 3 维度关联取值 4 报表取值
  linkTargetDimensionName?: string // 关联目标维度名（取值方式=3）
  batchId: number // 数据版本 ID
  batchDate?: string // 数据版本日期
  ruleId?: number // 取数规则 ID（计算时刻快照）
  ruleVersionNo?: number // 取数规则版本号
  defVersionId?: number // 底稿布局版本 ID（计算时刻快照）
  defVersionNo?: number // 底稿布局版本号
  ruleVersionInferred?: boolean // 规则版本是否为按现行窗口推断（历史值）
  memberId?: number // 维度成员 ID（多成员维度时使用，单实体=0）
  memberName?: string // 维度成员名称
  value?: string // 指标值
  status?: number // 计算状态：0 成功 1 失败
  errorMsg?: string // 失败原因
  computeTime?: string // 计算时间
}

/** 指标值来源明细 */
export interface IndicatorValueSourceVO {
  id: number // 编号
  valueId: number // 指标值 ID
  seq: number // 来源顺序
  ruleId?: number // 取数规则 ID（计算时刻快照）
  defVersionId?: number // 底稿布局版本 ID（计算时刻快照）
  sourceType: number // 来源类型：1 底稿单元格 2 底稿匹配行 3 HANDLER区域 4 LINK关联取值 5 公式/中间量 6 报表单元格
  sourceFileId?: number // 底稿实例 ID
  sourceFileName?: string // 底稿实例名称
  sourceFileUrl?: string // 底稿文件 URL（查看原文）
  sourceFilingId?: number // 来源报表任务 ID（sourceType=6）
  sourceReportName?: string // 来源报表名称（sourceType=6）
  sourceReportUrl?: string // 来源报表结果文件 URL（sourceType=6）
  sourceBatchId?: number // 来源底稿的数据版本 ID
  sheetName?: string // 来源 Sheet 名
  sheetIndex?: number // 来源 Sheet 序号（0-based）
  cellRef?: string // 来源单元格（如 C5）
  rowNo?: number // 来源行号（0-based，匹配行场景）
  rawValue?: string // 原始值（清洗/变换前）
  transformDesc?: string // 变换说明
  refValueId?: number // 关联的指标值 ID（LINK 型来源指向被引用的值）
  remark?: string // 备注（LINK 链路路径说明等）
}

/** 指标值来源链路树节点（LINK 关联链逐级下钻） */
export interface IndicatorSourceTreeNodeVO {
  value: DataIndicatorValueVO // 本节点的指标值
  sources: IndicatorValueSourceVO[] // 本节点的来源明细
  children: IndicatorSourceTreeNodeVO[] // 被引用（LINK 关联）的下级节点
}

/** 来源类型文案 */
export const SOURCE_TYPE_LABELS: Record<number, string> = {
  1: '底稿单元格',
  2: '底稿匹配行',
  3: 'HANDLER 区域',
  4: 'LINK 关联取值',
  5: '公式/中间量',
  6: '报表单元格',
}

/** 获得数据指标值分页 */
export function getDataIndicatorValuePage(params: PageParam & {
  batchId?: number // 数据版本 ID
  dimensionId?: number // 数据维度 ID
  indicatorName?: string // 指标名称关键字
  status?: number // 计算状态：0 成功 1 失败
}) {
  return http.get<PageResult<DataIndicatorValueVO>>('/rpt/data-indicator-value/page', params)
}

/** 获得指标值的来源明细（溯源，按 seq 排序） */
export function getIndicatorValueSources(id: number) {
  return http.get<IndicatorValueSourceVO[]>(`/rpt/data-indicator-value/${id}/sources`)
}

/** 获得指标值的来源链路树（LINK 关联链逐级展开，防循环） */
export function getIndicatorValueSourceTree(id: number, maxDepth = 3) {
  return http.get<IndicatorSourceTreeNodeVO>(`/rpt/data-indicator-value/${id}/source-tree`, { maxDepth })
}
