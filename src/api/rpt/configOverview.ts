import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/**
 * 报送配置总览（App 只读查看）：以报送事项为行聚合模板/映射/底稿/指标就绪度。
 * 缺失项的处理入口多为 PC 配置页，App 内仅跳转已有页面（报送任务/数据底稿）。
 */

/** 就绪度：ready=可初始化 repairable=可修复 incomplete=配置不全 */
export type ReportReadiness = 'incomplete' | 'ready' | 'repairable'

/** 任务阶段 key（与后端 stageCounts 对应） */
export type OverviewStageKey
  = | 'generated'
    | 'generateFail'
    | 'generating'
    | 'pending'
    | 'reviewDone'
    | 'reviewError'
    | 'waitReview'

/** 缺失项（后端统一下发展示文案） */
export interface ReportMissingItemVO {
  type: string // 缺失类型：DRAFT/INDICATOR/MAPPING/SOURCE_REPORT/TEMPLATE_FILE
  label: string // 展示文案，如「底稿未上传」
  targetName?: string // 目标名称（底稿/模板/指标名）
  jumpPath?: string // PC 端跳转路径（App 不用，仅展示文案）
}

/** 报表模板就绪度 */
export interface ReportTemplateOverviewVO {
  id: number // 模板 ID
  name?: string // 报表名
  templateConfigured?: boolean // 模板是否已上传
  mappingCount?: number // 映射格数
  mappingConfigured?: boolean // 映射是否配置
}

/** 底稿定义就绪度 */
export interface ReportDraftDefOverviewVO {
  id: number // 底稿定义 ID
  name?: string // 底稿名
  deptId?: number // 负责部门 ID
  uploaded?: boolean // 当前数据版本是否已上传（未指定版本为空）
}

/** 报送配置总览行 */
export interface SubmitOverviewVO {
  submitId: number // 报送事项 ID
  submitName?: string // 报送事项名
  submitCode?: string // 报送事项编码
  frequency?: number // 报送频率（1月 2季 3半年 4年）
  batchId?: number // 数据版本 ID
  templateCount?: number // 模板总数
  templateReadyCount?: number // 模板就绪数
  mappingTotal?: number // 映射格总数
  templates: ReportTemplateOverviewVO[] // 模板明细
  draftDefRequired?: number // 需上传底稿定义数
  draftDefUploaded?: number // 已上传底稿数
  draftDefs: ReportDraftDefOverviewVO[] // 底稿定义明细
  indicatorRequired?: number // 需计算指标数
  indicatorOk?: number // 指标成功数
  indicatorFailed?: number // 指标失败数
  indicatorMissing?: number // 指标未计算数
  stageCounts: Record<OverviewStageKey, number> // 各阶段任务数
  filingTotal?: number // 任务总数
  readiness: ReportReadiness // 就绪度
  nextAction?: string // 下一步建议文案
  missingItems: ReportMissingItemVO[] // 缺失项列表
}

/** 获得报送配置总览分页 */
export function getReportOverviewPage(params: PageParam & {
  batchId?: number // 数据版本 ID（空=只评估配置层）
  frequency?: number // 报送频率
  name?: string // 事项名称关键字
}) {
  return http.get<PageResult<SubmitOverviewVO>>('/rpt/report-config-overview/page', params)
}
