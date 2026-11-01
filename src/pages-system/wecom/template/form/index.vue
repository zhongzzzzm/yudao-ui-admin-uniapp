<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="模板名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入模板名称"
            />
          </wd-form-item>
          <wd-form-item title="模板编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="如 daily_reminder"
            />
          </wd-form-item>
          <!-- 推送配置：原生 picker 下拉 -->
          <wd-form-item title="推送配置" title-width="180rpx" prop="webhookId">
            <picker
              mode="selector"
              :range="webhookLabels"
              :value="webhookIndex"
              class="flex-1"
              @change="handleWebhookChange"
            >
              <view class="flex items-center gap-8rpx">
                <text class="flex-1" :class="formData.webhookId ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ webhookLabelOf(formData.webhookId) || '请选择推送配置' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <!-- 消息类型：原生 picker 下拉（text / markdown） -->
          <wd-form-item title="消息类型" title-width="180rpx" prop="msgType">
            <picker
              mode="selector"
              :range="msgTypeLabels"
              :value="msgTypeIndex"
              class="flex-1"
              @change="handleMsgTypeChange"
            >
              <view class="flex items-center gap-8rpx">
                <text class="flex-1 text-[#333]">
                  {{ formData.msgType }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <wd-form-item title="模板内容" title-width="180rpx">
            <wd-textarea
              v-model="formData.content"
              :maxlength="2000"
              show-word-limit
              clearable
              placeholder="支持 {param} 占位符；markdown 类型可用企微 markdown 语法"
            />
          </wd-form-item>
          <!-- @ 手机号（仅 text 类型生效） -->
          <wd-form-item v-if="formData.msgType === 'text'" title="@手机号" title-width="180rpx">
            <wd-textarea
              v-model="mentionedMobilesText"
              :maxlength="500"
              clearable
              placeholder="需要 @ 的手机号，多个用英文逗号分隔（选填）"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" center prop="status">
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <!-- 参数说明 -->
      <view class="mx-24rpx mt-16rpx rounded-xl bg-blue-50 px-20rpx py-16rpx text-24rpx text-blue-600">
        提示：内容中以 {参数名} 书写占位符，保存后由后端解析出模板参数，发送时按参数传值。
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WeComTemplate, WeComWebhookSimple } from '@/api/system/wecom'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createWeComTemplate,
  getSimpleWeComWebhookList,
  getWeComTemplate,
  updateWeComTemplate,
} from '@/api/system/wecom'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑消息模板' : '新增消息模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<WeComTemplate>({
  id: undefined,
  name: '',
  code: '',
  webhookId: undefined as unknown as number,
  msgType: 'text',
  content: '',
  mentionedMobileList: [],
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '模板名称不能为空' }],
  code: [{ required: true, message: '模板编码不能为空' }],
  webhookId: [{ required: true, message: '推送配置不能为空' }],
  msgType: [{ required: true, message: '消息类型不能为空' }],
  content: [{ required: true, message: '模板内容不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 推送配置精简列表（下拉用） */
const webhooks = ref<WeComWebhookSimple[]>([])
const webhookLabels = computed(() => webhooks.value.map(item => item.name))
const webhookIndex = computed(() =>
  Math.max(0, webhooks.value.findIndex(item => item.id === formData.value.webhookId)),
)

function webhookLabelOf(webhookId?: number): string {
  return webhooks.value.find(item => item.id === webhookId)?.name ?? ''
}

/** 选择推送配置 */
function handleWebhookChange(e: any) {
  const webhook = webhooks.value[Number(e.detail.value)]
  if (webhook) {
    formData.value.webhookId = webhook.id
  }
}

/** 消息类型（text / markdown） */
const msgTypes = ['text', 'markdown']
const msgTypeLabels = ['text 文本', 'markdown']
const msgTypeIndex = computed(() => Math.max(0, msgTypes.indexOf(formData.value.msgType)))

/** 选择消息类型 */
function handleMsgTypeChange(e: any) {
  formData.value.msgType = msgTypes[Number(e.detail.value)] ?? 'text'
}

/** @ 手机号（逗号分隔文本 ↔ 数组） */
const mentionedMobilesText = computed({
  get: () => (formData.value.mentionedMobileList ?? []).join(','),
  set: (value: string) => {
    formData.value.mentionedMobileList = value
      ? value.split(/[,，]/).map(item => item.trim()).filter(Boolean)
      : []
  },
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/wecom/index')
}

/** 加载模板详情与推送配置列表 */
async function getDetail() {
  const [webhookList, detail] = await Promise.all([
    getSimpleWeComWebhookList().catch(() => []),
    props.id ? getWeComTemplate(Number(props.id)) : Promise.resolve(undefined),
  ])
  webhooks.value = webhookList ?? []
  if (detail) {
    formData.value = { ...detail, mentionedMobileList: detail.mentionedMobileList ?? [] }
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateWeComTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createWeComTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:wecom-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
