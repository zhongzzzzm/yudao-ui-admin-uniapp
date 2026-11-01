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
          <wd-form-item title="配置名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入配置名称"
            />
          </wd-form-item>
          <wd-form-item title="配置编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="如 ops_alert"
            />
          </wd-form-item>
          <wd-form-item title="Webhook Key" title-width="180rpx" prop="webhookKey">
            <wd-input
              v-model="formData.webhookKey"
              show-password
              clearable
              :placeholder="props.id ? '留空表示不修改' : '请输入企微机器人 webhook key'"
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
      <!-- Key 说明 -->
      <view class="mx-24rpx mt-16rpx rounded-xl bg-blue-50 px-20rpx py-16rpx text-24rpx text-blue-600">
        提示：webhook key 即企微群机器人地址 https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key= 之后的 key，App 不回显已有 key，编辑时留空则保持不变。
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
import type { WeComWebhook } from '@/api/system/wecom'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWeComWebhook, getWeComWebhook, updateWeComWebhook } from '@/api/system/wecom'
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
const getTitle = computed(() => props.id ? '编辑推送配置' : '新增推送配置')
const formLoading = ref(false) // 表单提交状态
const formData = ref<WeComWebhook>({
  id: undefined,
  name: '',
  code: '',
  webhookKey: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '配置名称不能为空' }],
  code: [{ required: true, message: '配置编码不能为空' }],
  // 编辑时 key 留空表示不修改，仅新增时必填
  webhookKey: [{ required: () => !props.id, message: 'webhook key 不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/wecom/index')
}

/** 加载配置详情（App 不回显 webhook key，编辑留空表示不修改，与后端约定一致） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getWeComWebhook(Number(props.id))
  formData.value = { ...detail, webhookKey: '' }
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
      await updateWeComWebhook(formData.value)
      toast.success('修改成功')
    } else {
      await createWeComWebhook(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:wecom-webhook:reload')
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
