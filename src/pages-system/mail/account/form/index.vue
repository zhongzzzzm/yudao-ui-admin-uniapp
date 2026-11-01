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
          <wd-form-item title="邮箱地址" title-width="180rpx" prop="mail">
            <wd-input
              v-model="formData.mail"
              clearable
              placeholder="请输入邮箱地址"
            />
          </wd-form-item>
          <wd-form-item title="登录用户名" title-width="180rpx" prop="username">
            <wd-input
              v-model="formData.username"
              clearable
              placeholder="请输入 SMTP 登录用户名"
            />
          </wd-form-item>
          <wd-form-item title="登录密码" title-width="180rpx" prop="password">
            <wd-input
              v-model="formData.password"
              show-password
              clearable
              placeholder="请输入 SMTP 登录密码 / 授权码"
            />
          </wd-form-item>
          <wd-form-item title="SMTP 服务器" title-width="180rpx" prop="host">
            <wd-input
              v-model="formData.host"
              clearable
              placeholder="如 smtp.exmail.qq.com"
            />
          </wd-form-item>
          <wd-form-item title="端口" title-width="180rpx" prop="port">
            <wd-input
              v-model="formData.port"
              type="number"
              clearable
              placeholder="如 465"
            />
          </wd-form-item>
          <wd-form-item title="SSL" title-width="180rpx" center>
            <wd-switch
              v-model="formData.sslEnable"
              :active-value="true"
              :inactive-value="false"
            />
          </wd-form-item>
          <wd-form-item title="STARTTLS" title-width="180rpx" center>
            <wd-switch
              v-model="formData.starttlsEnable"
              :active-value="true"
              :inactive-value="false"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
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
import type { MailAccount } from '@/api/system/mail'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMailAccount, getMailAccount, updateMailAccount } from '@/api/system/mail'
import { delay, navigateBackPlus } from '@/utils'

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
const getTitle = computed(() => props.id ? '编辑邮箱账号' : '新增邮箱账号')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MailAccount>({
  id: undefined,
  mail: '',
  username: '',
  password: '',
  host: '',
  port: 465,
  sslEnable: true,
  starttlsEnable: false,
}) // 表单数据
const formSchema = {
  mail: [{ required: true, message: '邮箱地址不能为空' }, { type: 'email', message: '请输入正确的邮箱地址' }],
  username: [{ required: true, message: '登录用户名不能为空' }],
  password: [{ required: true, message: '登录密码不能为空' }],
  host: [{ required: true, message: 'SMTP 服务器不能为空' }],
  port: [{ required: true, message: '端口不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 加载账号详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMailAccount(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    formData.value.port = Number(formData.value.port)
    if (props.id) {
      await updateMailAccount(formData.value)
      toast.success('修改成功')
    } else {
      await createMailAccount(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:mail-account:reload')
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
