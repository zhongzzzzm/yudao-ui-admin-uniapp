/** ========== COMMON - 通用模块 ========== */
const COMMON_DICT = {
  USER_TYPE: 'user_type',
  COMMON_STATUS: 'common_status',
  TERMINAL: 'terminal', // 终端
  DATE_INTERVAL: 'date_interval', // 数据间隔
} as const

/** ========== SYSTEM - 系统模块 ========== */
const SYSTEM_DICT = {
  SYSTEM_USER_SEX: 'system_user_sex',
  SYSTEM_MENU_TYPE: 'system_menu_type',
  SYSTEM_ROLE_TYPE: 'system_role_type',
  SYSTEM_DATA_SCOPE: 'system_data_scope',
  SYSTEM_NOTICE_TYPE: 'system_notice_type',
  SYSTEM_LOGIN_TYPE: 'system_login_type',
  SYSTEM_LOGIN_RESULT: 'system_login_result',
  SYSTEM_SMS_CHANNEL_CODE: 'system_sms_channel_code',
  SYSTEM_SMS_TEMPLATE_TYPE: 'system_sms_template_type',
  SYSTEM_SMS_SEND_STATUS: 'system_sms_send_status',
  SYSTEM_SMS_RECEIVE_STATUS: 'system_sms_receive_status',
  SYSTEM_OAUTH2_GRANT_TYPE: 'system_oauth2_grant_type',
  SYSTEM_MAIL_SEND_STATUS: 'system_mail_send_status',
  SYSTEM_NOTIFY_TEMPLATE_TYPE: 'system_notify_template_type',
  SYSTEM_SOCIAL_TYPE: 'system_social_type',
  SYSTEM_DICT_COLOR_TYPE: 'system_dict_color_type', // 字典颜色类型
} as const

/** ========== INFRA - 基础设施模块 ========== */
const INFRA_DICT = {
  INFRA_BOOLEAN_STRING: 'infra_boolean_string',
  INFRA_JOB_STATUS: 'infra_job_status',
  INFRA_JOB_LOG_STATUS: 'infra_job_log_status',
  INFRA_API_ERROR_LOG_PROCESS_STATUS: 'infra_api_error_log_process_status',
  INFRA_CONFIG_TYPE: 'infra_config_type',
  INFRA_CODEGEN_TEMPLATE_TYPE: 'infra_codegen_template_type',
  INFRA_CODEGEN_FRONT_TYPE: 'infra_codegen_front_type',
  INFRA_CODEGEN_SCENE: 'infra_codegen_scene',
  INFRA_FILE_STORAGE: 'infra_file_storage',
  INFRA_OPERATE_TYPE: 'infra_operate_type',
} as const

/** ========== TAX / RPT - 报送与税务模块 ========== */
const TAX_DICT = {
  TAX_TYPE: 'tax_type', // 税种
  TAX_FREQ: 'tax_freq', // 办税频率
  TAX_LEDGER_STATUS: 'tax_ledger_status', // 办税台账状态
  TAX_MATER_TYPE: 'tax_mater_type', // 台账附件类型
  TAX_LOAN_STATUS: 'tax_loan_status', // 投放状态：未投放/已投放
  TAX_VAT_RATE: 'tax_vat_rate', // 增值税税率：免税/6%/13%
  YES_NO: 'yes_no', // 是否
  REPORT_FILING_REVIEW_STATUS: 'report_filing_review_status', // 底稿复核状态
  REPORT_FILING_REVIEW_RESULT: 'report_filing_review_result', // 底稿复核结果
  VALIDATION_DATA_STATUS: 'validation_data_status', // 数据/对比任务状态
  VALIDATION_CATEGORY: 'validation_category', // 校验报表分类
  VALIDATION_FLAG: 'validation_flag', // 校验标识
  VALIDATION_RULE_CATEGORY: 'validation_rule_category', // 校验规则大类
  VALIDATION_RULE_TYPE: 'validation_rule_type', // 校验规则细类
}

/** ========== BPM - 轻量审批引擎 ========== */
const BPM_DICT = {
  BPM_INSTANCE_STATUS: 'bpm_instance_status', // 审批实例状态：1审批中/2已办结/3已驳回/4已作废
  BPM_TASK_STATUS: 'bpm_task_status', // 审批任务状态：0待审批/1已通过/2已驳回/3已失效
} as const

/** ========== FL - 报价测算 ========== */
const FL_DICT = {
  FL_QUOTE_STATUS: 'fl_quote_status', // 方案状态：0草稿/1已确认
  FL_QUOTE_LEASE_METHOD: 'fl_quote_lease_method', // 租赁方式
  FL_QUOTE_PAY_FREQ: 'fl_quote_pay_freq', // 支付频率：月/双月/季/四个月/半年/年
  FL_QUOTE_PREPAY: 'fl_quote_prepay', // 先付/后付
  FL_QUOTE_PAY_METHOD: 'fl_quote_pay_method', // 投放付款方式
  FL_QUOTE_CAL_METHOD: 'fl_quote_cal_method', // 租金计算方式
  FL_QUOTE_MANUAL_KIND: 'fl_quote_manual_kind', // 手工收支类别
  FL_QUOTE_DEPOSIT_METHOD: 'fl_quote_deposit_method', // 保证金收取方式
  FL_QUOTE_DEPOSIT_RETURN: 'fl_quote_deposit_return', // 保证金退回方式
  FL_QUOTE_SRV_METHOD: 'fl_quote_srv_method', // 服务费收取/支付方式
  FL_QUOTE_SRV_BASE: 'fl_quote_srv_base', // 服务费基数
  FL_QUOTE_RATIO_BASE: 'fl_quote_ratio_base', // 计算比例基数
  FL_QUOTE_TAX_MODE: 'fl_quote_tax_mode', // 税种口径
}

/** 字典类型枚举 - 统一导出 */
export const DICT_TYPE = {
  ...INFRA_DICT,
  ...SYSTEM_DICT,
  ...COMMON_DICT,
  ...TAX_DICT,
  ...BPM_DICT,
  ...FL_DICT,
} as const
