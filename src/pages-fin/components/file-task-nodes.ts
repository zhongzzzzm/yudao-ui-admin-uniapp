/**
 * 财务文件任务节点配置（App 端）。
 *
 * 与 PC 端 views/fin/file-task/nodes.ts、后端 FinFileTaskNodeEnum 的槽位（slot）约定一一对应，
 * 「上传文件 → 异步处理 → 生成结果文件」型节点统一走 /fin/file-task 接口。
 */
/** 输入文件槽位定义 */
export interface FileTaskNodeInput {
  slot: string // 槽位编码（与后端约定，如 airline / ledger）
  label: string // 表单/列表展示名
  required?: boolean // 是否必填（表单校验）
  fileType?: string[] // 允许的文件扩展名（空则不限制）
  help?: string // 表单帮助文案
}

/** 节点参数表单字段（如行程单模板版本下拉） */
export interface FileTaskNodeParamField {
  key: string // 参数键（对应后端 params.key）
  label: string // 展示名
  dictType?: string // 字典类型（取选项列表）
  defaultValue?: string // 新建时默认值
  help?: string // 帮助文案
}

/** 文件任务节点配置 */
export interface FileTaskNodeConfig {
  code: string // 节点编码（fin_file_task.node_type，路由参数用）
  title: string // 页面标题（导航栏、卡片、弹层标题）
  authPrefix: string // 权限前缀（拼接 create/update/delete/downloadResult）
  formAlert: string // 新增/编辑页顶部提示
  inputs: FileTaskNodeInput[] // 输入文件槽位
  paramFields?: FileTaskNodeParamField[] // 节点参数表单字段
}

/** 默认模板版本：当期渠道导出均为新版 */
export const DEFAULT_AIRLINE_TEMPLATE_VERSION = 'v202609'

/** 文件任务列表刷新事件名（列表页监听、表单页发起） */
export const FILE_TASK_RELOAD_EVENT = 'fin:file-task:reload'

/** 已登记的文件任务节点（行程单拆分/住宿单拆分/发票三域） */
export const FILE_TASK_NODES: FileTaskNodeConfig[] = [
  {
    code: 'bx_airline',
    title: '行程单拆分',
    authPrefix: 'fin:bx-airline',
    formAlert: '行程表按乘机人匹配【公司通讯录】分组拆分；模板版本需与表头一致，选错会处理失败。',
    inputs: [
      {
        slot: 'airline',
        label: '行程表',
        required: true,
        fileType: ['xls', 'xlsx'],
        help: '乘机人将按系统【公司通讯录】的分组匹配部门并汇总',
      },
      {
        slot: 'ledger',
        label: '出差台账',
        fileType: ['xls', 'xlsx'],
        help: '选填，上传后将在结果中追加「无单订票核查」',
      },
    ],
    paramFields: [
      {
        key: 'templateVersion',
        label: '模板版本',
        dictType: 'fin_airline_template_version',
        defaultValue: DEFAULT_AIRLINE_TEMPLATE_VERSION,
        help: '新版：含「民航发展基金/发票明细」列（2026-09 起）；旧版：仅机票明细 9 列。选错版本会处理失败并提示',
      },
    ],
  },
  {
    code: 'bx_hotel',
    title: '住宿单拆分',
    authPrefix: 'fin:bx-hotel',
    formAlert: '住宿单按入住人匹配【公司通讯录】分组拆分；可选台账按「外出培训」拆分为差旅/培训两列。',
    inputs: [
      {
        slot: 'hotel',
        label: '住宿单',
        required: true,
        fileType: ['xls', 'xlsx'],
        help: '入住人将按系统【公司通讯录】的分组匹配部门并汇总',
      },
      {
        slot: 'ledger',
        label: '出差台账',
        fileType: ['xls', 'xlsx'],
        help: '选填，按台账「外出培训」标记将各部门费用拆分为差旅/培训两列，匹配不上的入住人计入差旅费用',
      },
    ],
  },
  {
    code: 'invoice_ledger',
    title: '发票明细账',
    authPrefix: 'fin:invoice-ledger',
    formAlert: '上传发票台账与明细账，系统按发票号匹配发票是否已入账。',
    inputs: [
      { slot: 'invoice', label: '发票台账', required: true, fileType: ['xls', 'xlsx'] },
      { slot: 'ledger', label: '明细账', required: true, fileType: ['xls', 'xlsx'] },
    ],
  },
  {
    code: 'invoice_verification',
    title: '进项票抵扣',
    authPrefix: 'fin:invoice-verification',
    formAlert: '上传业务、财务、税局三方导出，系统按发票号勾兑识别抵扣差异。',
    inputs: [
      { slot: 'system', label: '业务导出', required: true, fileType: ['xls', 'xlsx'] },
      { slot: 'finance', label: '财务导出', required: true, fileType: ['xls', 'xlsx'] },
      { slot: 'tax', label: '税局导出', required: true, fileType: ['xls', 'xlsx'] },
    ],
  },
  {
    code: 'invoice_voucher',
    title: '发票凭证关联',
    authPrefix: 'fin:invoice-voucher',
    formAlert: '上传发票台账与凭证，系统按摘要中的合同编号/期数关联。',
    inputs: [
      { slot: 'invoice', label: '发票台账', required: true, fileType: ['xls', 'xlsx'] },
      { slot: 'voucher', label: '凭证', required: true, fileType: ['xls', 'xlsx'] },
    ],
  },
  {
    code: 'financial_report',
    title: '财务快报合并',
    authPrefix: 'fin:financial-report',
    formAlert: '上传当期与上年同期报表压缩包（不限目录结构），系统按固定单元格取值合并生成财务快报。',
    inputs: [
      {
        slot: 'current_period',
        label: '当期报表',
        required: true,
        fileType: ['zip'],
        help: '一家公司一份 Excel（两个 sheet：资产负债表、利润表），公司名取报表 A3 单元格的「单位」',
      },
      {
        slot: 'last_year_period',
        label: '上年同期报表',
        required: true,
        fileType: ['zip'],
        help: '同结构，一家公司一份 Excel（取利润表本年累计数作为上年同期）',
      },
    ],
  },
]

/** 按节点编码取配置；未登记的编码直接抛错（配置缺失应尽早暴露） */
export function getFileTaskNode(code: string): FileTaskNodeConfig {
  const node = FILE_TASK_NODES.find(item => item.code === code)
  if (!node) {
    throw new Error(`未登记的财务文件任务节点：${code}`)
  }
  return node
}
