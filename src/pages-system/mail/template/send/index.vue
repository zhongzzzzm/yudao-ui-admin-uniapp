<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="测试发送邮件"
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
          邮件标题：{{ template?.title }}
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
          <wd-form-item title="收件邮箱" title-width="180rpx" prop="mail">
            <wd-input
              v-model="formData.mail"
              clearable
              placeholder="请输入收件邮箱地址"
            />
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
    </view>

    <!-- 底部发送按钮（真实外发） -->
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
import type { MailTemplate } from '@/api/system/mail'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, reactive, ref } from 'vue'
import { getMailTemplatePage, sendMailTemplate } from '@/api/system/mail'
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
const template = ref<MailTemplate>() // 模板信息
const sendLoading = ref(false) // 发送中状态
const formData = reactive({
  mail: '',
  params: {} as Record<string, string>,
}) // 发送表单
const formSchema = {
  mail: [{ required: true, message: '收件邮箱不能为空' }, { type: 'email', message: '请输入正确的邮箱地址' }],
}
const formRef = ref<FormInstance>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 加载模板信息（按编码查分页取第一条） */
async function loadTemplate() {
  if (!props.code) {
    return
  }
  const data = await getMailTemplatePage({ code: props.code, pageNo: 1, pageSize: 1 })
  template.value = data.list?.[0]
}

/** 发送测试邮件（真实外发，发送结果到日志页查看） */
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
    await sendMailTemplate({ mail: formData.mail, templateCode: props.code!, templateParams: params })
    toast.success('发送成功')
    uni.$emit('system:mail-log:reload')
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
