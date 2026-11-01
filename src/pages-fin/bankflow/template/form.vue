<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view v-if="loaded">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="模板名" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="如：工商银行-对公网银流水"
            />
          </wd-form-item>
          <wd-form-item title="银行/渠道名" title-width="200rpx" prop="bankName">
            <wd-input
              v-model="formData.bankName"
              clearable
              placeholder="如：工商银行"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio :value="0">
                启用
              </wd-radio>
              <wd-radio :value="1">
                停用
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="识别关键词" title-width="200rpx" prop="recognizeKeywordsText">
            <wd-textarea
              v-model="formData.recognizeKeywordsText"
              clearable
              placeholder="表头区需全部命中的关键词，用、/，/空格分隔（如：交易日期、对方账号）"
              :rows="2"
            />
          </wd-form-item>
          <wd-form-item title="文件名信号" title-width="200rpx" prop="fileNameKeywordsText">
            <wd-textarea
              v-model="formData.fileNameKeywordsText"
              clearable
              placeholder="银行名/别名关键词，用、/，/空格分隔（选填）"
              :rows="2"
            />
          </wd-form-item>
          <wd-form-item title="样本文件名" title-width="200rpx" prop="sampleFileName">
            <wd-input
              v-model="formData.sampleFileName"
              clearable
              placeholder="选填"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="选填"
              :rows="2"
            />
          </wd-form-item>
        </wd-cell-group>

        <!-- 解析配置 JSON（表头定位 / 列映射 / 方向规则等） -->
        <view class="mt-24rpx px-24rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-500">
            解析配置 JSON
          </view>
          <view class="mb-12rpx text-22rpx text-[#999]">
            表头定位、列映射、方向规则等以后端 BankFlowTemplateConfig 结构直接编辑；完整可视化映射编辑器请使用 PC 端。
          </view>
          <wd-textarea
            v-model="configJson"
            custom-class="font-mono"
            placeholder="解析配置 JSON"
            :rows="12"
          />
        </view>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view v-if="loaded" class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="saving"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { BankFlowTemplateConfig, BankFlowTemplateSaveReqVO } from '@/api/fin/bankFlowTemplate'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { createBankFlowTemplate, getBankFlowTemplate, updateBankFlowTemplate } from '@/api/fin/bankFlowTemplate'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

defineOptions({
  name: 'FinBankFlowTemplateForm',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()

/** 新建时预填的解析配置骨架（字段含义见 API 层中文注释） */
const DEFAULT_CONFIG_JSON = `{
  "recognizeKeywords": [],
  "fileNameKeywords": [],
  "sheetIndex": null,
  "sheetName": "",
  "headerRowIndex": null,
  "headerRowSpan": 1,
  "dataStartOffset": 1,
  "dataRowSpan": 1,
  "dateFormat": "",
  "headerCellRules": {},
  "columnMapping": {},
  "directionRule": { "strategy": "S1" },
  "rowFilter": {},
  "dataEndRule": {}
}`

const loaded = ref(false)
const saving = ref(false)
/** 模板 id（编辑/复制时存在） */
const templateId = ref<number>()
/** 复制派生模式：载入模板后去掉 id，保存为新模板 */
const copyMode = ref(false)

const getTitle = computed(() => {
  if (copyMode.value) {
    return '复制解析模板'
  }
  return templateId.value ? '编辑解析模板' : '新增解析模板'
})

/** 表单数据（关键词以编辑态字符串承载，提交时拆分为数组） */
type TemplateForm = Omit<BankFlowTemplateSaveReqVO, 'recognizeKeywords' | 'fileNameKeywords'> & {
  recognizeKeywordsText: string // 识别关键词编辑态（、/，/空格分隔，提交时拆分为数组）
  fileNameKeywordsText: string // 文件名信号编辑态
}

const formData = ref<TemplateForm>({
  name: '',
  bankName: '',
  status: 0,
  recognizeKeywordsText: '',
  fileNameKeywordsText: '',
  config: {},
  sampleFileName: '',
  remark: '',
})

/** 解析配置 JSON 编辑态 */
const configJson = ref(DEFAULT_CONFIG_JSON)

const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名不能为空' }],
  bankName: [{ required: true, message: '银行/渠道名不能为空' }],
  recognizeKeywordsText: [{ required: true, message: '识别关键词不能为空' }],
})
const formRef = ref<FormInstance>()

function handleBack() {
  navigateBackPlus()
}

/** 关键词编辑态 → 数组（、，,;；空白分隔） */
function splitKeywords(text: string): string[] {
  return (text || '').split(/[,，、;；\s]+/).map(item => item.trim()).filter(Boolean)
}

/** 关键词数组 → 编辑态 */
function joinKeywords(keywords?: string[]): string {
  return (keywords || []).join('、')
}

/** 加载模板（编辑 / 复制共用） */
async function loadTemplate(id: number) {
  const template = await getBankFlowTemplate(id)
  formData.value = {
    // 复制模式去掉 id，保存为新模板
    id: copyMode.value ? undefined : template.id,
    name: copyMode.value ? `${template.name}-副本` : template.name,
    bankName: template.bankName,
    status: template.status ?? 0,
    recognizeKeywordsText: joinKeywords(template.recognizeKeywords),
    fileNameKeywordsText: joinKeywords(template.fileNameKeywords),
    config: template.config || {},
    sampleFileName: template.sampleFileName || '',
    remark: template.remark || '',
  }
  configJson.value = JSON.stringify(template.config || {}, null, 2)
  loaded.value = true
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 解析配置必须是合法 JSON 对象
  let config: BankFlowTemplateConfig
  try {
    config = JSON.parse(configJson.value)
  } catch {
    toast.show('解析配置不是合法 JSON，请检查')
    return
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    toast.show('解析配置必须是 JSON 对象')
    return
  }
  const recognizeKeywords = splitKeywords(formData.value.recognizeKeywordsText)
  if (!recognizeKeywords.length) {
    toast.show('识别关键词不能为空')
    return
  }
  saving.value = true
  try {
    const payload: BankFlowTemplateSaveReqVO = {
      id: formData.value.id,
      name: formData.value.name.trim(),
      bankName: formData.value.bankName.trim(),
      status: formData.value.status,
      recognizeKeywords,
      fileNameKeywords: splitKeywords(formData.value.fileNameKeywordsText),
      config,
      sampleFileName: formData.value.sampleFileName?.trim() || undefined,
      remark: formData.value.remark?.trim() || undefined,
    }
    if (payload.id) {
      await updateBankFlowTemplate(payload)
      toast.success('修改成功')
    } else {
      await createBankFlowTemplate(payload)
      toast.success('新增成功')
    }
    // 通知模板列表刷新
    uni.$emit('fin:bankflow-template:reload')
    delay(handleBack)
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  if (query?.id) {
    templateId.value = Number(query.id)
    copyMode.value = query.copy === '1'
  }
  if (templateId.value) {
    loadTemplate(templateId.value).catch(() => {
      toast.show('模板加载失败')
      delay(handleBack)
    })
  } else {
    loaded.value = true
  }
})
</script>
