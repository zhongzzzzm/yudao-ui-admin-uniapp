import { http } from '@/http/http'

/**
 * 流程定义（App 端裁剪口径：通用申请单发起时选择流程、解析「发起人自选」审批人节点）。
 * 完整的流程设计器仅在 PC 端提供。
 */

/** 流程定义（列表/详情返回字段裁剪） */
export interface BpmDefinitionVO {
  id: number // 编号
  key: string // 流程标识
  name: string // 流程名称
  version: number // 版本号
  businessModule?: string // 绑定的业务模块（bpm_general = 通用申请单）
  status?: number // 状态
  nodes?: string // 节点配置数组 JSON 字符串（仅详情返回）
}

/** 流程定义节点（nodes JSON 反序列化后的裁剪结构） */
export interface BpmDefinitionNode {
  nodeKey: string // 节点标识
  nodeName: string // 节点名称
  assignee?: {
    type?: number // 审批人规则：4 = 发起人自选
  }
}

/** 获得流程定义简单列表（启用中的已发布流程） */
export function getSimpleBpmDefinitionList() {
  return http.get<BpmDefinitionVO[]>('/bpm/process-definition/simple-list')
}

/** 获得流程定义详情（含 nodes 节点配置 JSON） */
export function getBpmDefinition(id: number) {
  return http.get<BpmDefinitionVO>('/bpm/process-definition/get', { id })
}
