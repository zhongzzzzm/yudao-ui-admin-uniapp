import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 数据指标（App 只读查看）：指标列表、上下游血缘拓扑。
 * 指标的新建/编辑/发布规则版本等操作在 PC 端完成。
 */

/** 数据指标取值方式 */
export const DATA_INDICATOR_VALUE_TYPE_LABELS: Record<number, string> = {
  1: '底稿固定单元格',
  2: '底稿+处理器',
  3: '维度关联取值',
  4: '报表取值',
  5: '指标公式',
  6: '来源公式',
}

/** 血缘节点类型文案（与后端 LineageNode.type 对应） */
export const LINEAGE_NODE_TYPE_LABELS: Record<string, string> = {
  INDICATOR: '数据指标',
  DRAFT_DEF: '底稿定义',
  TEMPLATE: '报表模板',
  DIMENSION: '数据维度',
  CELL_MAPPING: '单元格映射',
}

/** 血缘节点类型 → 标签配色 */
export const LINEAGE_NODE_TYPE_TAG_TYPE: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  INDICATOR: 'primary',
  DRAFT_DEF: 'success',
  TEMPLATE: 'warning',
  DIMENSION: 'info',
  CELL_MAPPING: 'warning',
}

/** 数据指标 */
export interface DataIndicatorVO {
  id: number // 编号
  dimensionId: number // 数据维度ID
  memberId?: number // 维度成员ID（多成员维度 1:1；单实体维度为空）
  indicatorCode: string // 指标编码
  indicatorName: string // 指标名称
  valueType: number // 取值方式：1底稿固定单元格 2底稿+处理器 3维度关联取值 4报表取值 5指标公式 6来源公式
  sourceDraftDefId?: number // 绑定底稿定义ID（底稿来源时使用）
  sourceTemplateId?: number // 绑定报表模板ID（报表取值/来源公式-报表来源时使用）
  sourceSheet?: number // 来源Sheet序号（0-based）
  sourceCell?: string // 来源单元格，如 G5
  handlerCode?: string // 取值处理器编码
  handlerParams?: string // 处理器参数/来源公式（JSON）
  displayOrder?: number // 显示顺序
  enabled?: boolean // 是否启用
  remark?: string // 备注
  createTime?: string // 创建时间
  currentRuleVersionNo?: number // 当前版本号（最新已生效的取数规则版本；空 = 无）
}

/** 血缘查询请求参数 */
export interface DataIndicatorLineageReqVO {
  id: number // 根指标ID（必填）
  direction?: 'both' | 'down' | 'up' // 方向：up=仅上游 down=仅下游 both=上下游（默认）
  depth?: number // 展开深度（1~5，默认 3）
  aggregateByDimension?: boolean // 是否按维度聚合（同维度成员指标折叠为一个维度节点）
  includeConsumers?: boolean // 下游是否含报表消费方（单元格映射/报表模板，默认 true）
  batchId?: number // 数据版本ID（按该版本解析规则与消费方；为空=不按版本）
  ruleVersionId?: number // 规则版本ID（按指定规则版本建图）
}

/** 血缘节点 */
export interface DataIndicatorLineageNodeVO {
  id: string // 节点唯一键，如 IND:12 / DRAFT:8 / TPL:3 / DIM:2 / MAP:9
  type: string // 节点类型：INDICATOR/DRAFT_DEF/TEMPLATE/DIMENSION/CELL_MAPPING
  label?: string // 主标题
  subLabel?: string // 副标题（维度/成员/编码等）
  refId?: number // 业务ID（指标ID/底稿定义ID/模板ID/维度ID/映射ID）
  valueType?: number // 取值方式（仅 INDICATOR 节点）
  valueSource?: string // 取值来源描述（仅 INDICATOR：单元格坐标/处理器/公式原文）
  ruleId?: number // 规则版本ID（仅 INDICATOR 节点）
  ruleVersionNo?: number // 规则版本号（仅 INDICATOR 节点）
  enabled?: boolean // 是否启用（仅 INDICATOR 节点）
  root?: boolean // 是否为根节点
  extra?: string // 额外说明（如「已删除」「未找到」）
}

/** 血缘边（from=来源，to=消费方） */
export interface DataIndicatorLineageEdgeVO {
  from: string // 来源节点ID
  to: string // 消费方节点ID
  relation?: string // 关系类型
  label?: string // 边标签（如 Sheet0!G5、变量@时点）
}

/** 血缘响应（节点 + 边，配置态拓扑） */
export interface DataIndicatorLineageRespVO {
  rootNodeId?: string // 根节点ID（节点唯一键）
  truncated?: boolean // 是否因节点过多而截断
  nodes?: DataIndicatorLineageNodeVO[] // 节点列表
  edges?: DataIndicatorLineageEdgeVO[] // 边列表
}

/** 获得数据指标分页 */
export function getDataIndicatorPage(params: PageParam & {
  keyword?: string // 关键字（编码/名称模糊匹配）
  dimensionId?: number // 数据维度ID
  enabled?: boolean // 是否启用
}) {
  return http.get<PageResult<DataIndicatorVO>>('/rpt/data-indicator/page', params)
}

/** 获得数据指标详情 */
export function getDataIndicator(id: number) {
  return http.get<DataIndicatorVO>('/rpt/data-indicator/get', { id })
}

/** 获得数据指标上下游血缘（配置态拓扑） */
export function getDataIndicatorLineage(params: DataIndicatorLineageReqVO) {
  return http.get<DataIndicatorLineageRespVO>('/rpt/data-indicator/lineage', params)
}
