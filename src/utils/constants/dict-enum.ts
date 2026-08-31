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
  REPORT_FILING_REVIEW_STATUS: 'report_filing_review_status', // 底稿复核状态
  REPORT_FILING_REVIEW_RESULT: 'report_filing_review_result', // 底稿复核结果
}

/** 字典类型枚举 - 统一导出 */
export const DICT_TYPE = {
  ...INFRA_DICT,
  ...SYSTEM_DICT,
  ...COMMON_DICT,
  ...TAX_DICT,
} as const
