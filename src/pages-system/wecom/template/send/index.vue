<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="测试发送企微消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 模板信息 -->
    <view class="mx-24rpx mt-24rpx rounded-xl bg-white p-24rpx shadow-sm">
      <view class="mb-12rpx text-30rpx font-semibold">
        {{ template?.name || props.code }}
      </view>
      <view class="text-24rpx text-[#777] space-y-6rpx">
        <view class="line-clamp-1">
          模板编码：{{ template?.code }}
        </view>
        <view class="line-clamp-1">
          消息类型：{{ template?.msgType }}
        </view>
        <view v-if="(template?.params?.length ?? 0) > 0" class="line-clamp-1">
          模板参数：{{ (template?.params ?? []).join('、') }}
        </view>
      </view>
    </view>

    <!-- 发送表单 -->
    <view class="mt-24rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 推送配置（覆盖模板默认配置）：原生 picker 下拉 -->
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
                  {{ webhookLabelOf(formData.webhookId) || '使用模板默认配置' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <!-- 动态参数：按模板解析出的参数名逐个填写 -->
          <wd-form-item
            v-for="param in template?.params ?? []"
            :key="param"
            :title="param"
            title-width="180rpx"
          >
            <wd-input
              v-model="formData.params[param]"
              clearable
              :placeholder="`请输入参数 ${param} 的值`"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <!-- 外发提示 -->
      <view class="mx-24rpx mt-16rpx rounded-xl bg-orange-50 px-20rpx py-16rpx text-24rpx text-orange-600">
        注意：点击发送将真实推送到企微群，发送结果可在「发送日志」中查看。
      </view>
    </view>

    <!-- 底部发送按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="sendLoading"
        @click="handleSend"
      >
        发送
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WeComTemplate, WeComWebhookSimple } from '@/api/system/wecom'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getSimpleWeComWebhookList,
  getWeComTemplatePage,
  sendWeComTemplate,
} from '@/api/system/wecom'
import { delay, navigateBackPlus } from '@/utils'

const props = defineProps<{
  /** 模板编码（列表页透传） */
  code?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const template = ref<WeComTemplate>() // 模板信息
const sendLoading = ref(false) // 发送中状态
const formData = reactive({
  webhookId: undefined as number | undefined,
  params: {} as Record<string, string>,
}) // 发送表单
const formSchema = {}
const formRef = ref<FormInstance>()

/** 推送配置精简列表（覆盖默认配置时选择） */
const webhooks = ref<WeComWebhookSimple[]>([])
const webhookLabels = computed(() => webhooks.value.map(item => item.name))
const webhookIndex = computed(() =>
  Math.max(0, webhooks.value.findIndex(item => item.id === formData.webhookId)),
)

function webhookLabelOf(webhookId?: number): string {
  return webhooks.value.find(item => item.id === webhookId)?.name ?? ''
}

/** 选择推送配置 */
function handleWebhookChange(e: any) {
  const webhook = webhooks.value[Number(e.detail.value)]
  if (webhook) {
    formData.webhookId = webhook.id
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/wecom/index')
}

/** 加载模板信息（按编码查分页取第一条）与推送配置列表 */
async function loadTemplate() {
  const [webhookList, templates] = await Promise.all([
    getSimpleWeComWebhookList().catch(() => []),
    props.code ? getWeComTemplatePage({ code: props.code, pageNo: 1, pageSize: 1 }) : Promise.resolve(undefined),
  ])
  webhooks.value = webhookList ?? []
  template.value = templates?.list?.[0]
}

/** 发送测试消息（真实外发到企微群，结果到日志页查看） */
async function handleSend() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  sendLoading.value = true
  try {
    const params: Record<string, any> = {}
    for (const [key, value] of Object.entries(formData.params)) {
      params[key] = value ?? ''
    }
    await sendWeComTemplate({ templateCode: props.code!, templateParams: params, webhookId: formData.webhookId })
    toast.success('发送成功')
    uni.$emit('system:wecom-log:reload')
    delay(handleBack)
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    sendLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadTemplate()
})
</script>
