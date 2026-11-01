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
          <wd-form-item title="客户端名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入客户端名称"
            />
          </wd-form-item>
          <wd-form-item title="客户端编号" title-width="200rpx" prop="clientId">
            <wd-input
              v-model="formData.clientId"
              clearable
              placeholder="认证用，如 ganfanren-app"
            />
          </wd-form-item>
          <wd-form-item title="客户端密钥" title-width="200rpx" prop="secret">
            <wd-input
              v-model="formData.secret"
              show-password
              clearable
              placeholder="请输入客户端密钥"
            />
          </wd-form-item>
          <wd-form-item title="访问令牌有效期" title-width="200rpx" prop="accessTokenValiditySeconds">
            <wd-input
              v-model="formData.accessTokenValiditySeconds"
              type="number"
              clearable
              placeholder="单位：秒，如 1800"
            />
          </wd-form-item>
          <wd-form-item title="刷新令牌有效期" title-width="200rpx" prop="refreshTokenValiditySeconds">
            <wd-input
              v-model="formData.refreshTokenValiditySeconds"
              type="number"
              clearable
              placeholder="单位：秒，如 43200"
            />
          </wd-form-item>
          <!-- 授权类型：多选下拉 -->
          <wd-form-item title="授权类型" title-width="200rpx" prop="authorizedGrantTypes">
            <wd-select-picker
              v-model="formData.authorizedGrantTypes"
              :columns="grantTypeOptions"
              label-key="label"
              value-key="value"
              title="选择授权类型"
              type="checkbox"
              root-portal
            />
          </wd-form-item>
          <!-- 重定向 URI：换行分隔 -->
          <wd-form-item title="重定向 URI" title-width="200rpx">
            <wd-textarea
              v-model="redirectUrisText"
              :maxlength="1000"
              clearable
              placeholder="多个 URI 用英文逗号或换行分隔"
            />
          </wd-form-item>
          <!-- 授权范围：换行分隔（移动端简化输入） -->
          <wd-form-item title="授权范围" title-width="200rpx">
            <wd-textarea
              v-model="scopesText"
              :maxlength="500"
              clearable
              placeholder="多个 scope 用英文逗号分隔，如 user.read,user.write"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" center prop="status">
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="应用描述" title-width="200rpx">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入应用描述"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <!-- 说明 -->
      <view class="mx-24rpx mt-16rpx rounded-xl bg-blue-50 px-20rpx py-16rpx text-24rpx text-blue-600">
        提示：logo、资源编号、附加信息等高级配置请在 PC 端维护；移动端覆盖常用字段。
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
import type { OAuth2Client } from '@/api/system/oauth2'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createOAuth2Client, getOAuth2Client, updateOAuth2Client } from '@/api/system/oauth2'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

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
const getTitle = computed(() => props.id ? '编辑 OAuth2 客户端' : '新增 OAuth2 客户端')
const formLoading = ref(false) // 表单提交状态
const formData = ref<OAuth2Client>({
  id: undefined,
  clientId: '',
  secret: '',
  name: '',
  logo: '',
  description: '',
  status: CommonStatusEnum.ENABLE,
  accessTokenValiditySeconds: 1800,
  refreshTokenValiditySeconds: 43200,
  redirectUris: [],
  authorizedGrantTypes: [],
  scopes: [],
  autoApproveScopes: [],
  authorities: [],
  resourceIds: [],
  additionalInformation: '',
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '客户端名称不能为空' }],
  clientId: [{ required: true, message: '客户端编号不能为空' }],
  secret: [{ required: true, message: '客户端密钥不能为空' }],
  accessTokenValiditySeconds: [{ required: true, message: '访问令牌有效期不能为空' }],
  refreshTokenValiditySeconds: [{ required: true, message: '刷新令牌有效期不能为空' }],
  authorizedGrantTypes: [{ required: true, message: '授权类型不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 授权类型选项（取系统字典 system_oauth2_grant_type） */
const grantTypeOptions = getIntDictOptions(DICT_TYPE.SYSTEM_OAUTH2_GRANT_TYPE)

/** 重定向 URI（逗号/换行分隔文本 ↔ 数组） */
const redirectUrisText = computed({
  get: () => (formData.value.redirectUris ?? []).join(','),
  set: (value: string) => {
    formData.value.redirectUris = value
      ? value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean)
      : []
  },
})

/** 授权范围（逗号分隔文本 ↔ 数组） */
const scopesText = computed({
  get: () => (formData.value.scopes ?? []).join(','),
  set: (value: string) => {
    formData.value.scopes = value
      ? value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean)
      : []
  },
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/oauth2/client/index')
}

/** 加载客户端详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getOAuth2Client(Number(props.id))
  formData.value = {
    ...detail,
    redirectUris: detail.redirectUris ?? [],
    authorizedGrantTypes: detail.authorizedGrantTypes ?? [],
    scopes: detail.scopes ?? [],
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
    formData.value.accessTokenValiditySeconds = Number(formData.value.accessTokenValiditySeconds)
    formData.value.refreshTokenValiditySeconds = Number(formData.value.refreshTokenValiditySeconds)
    if (props.id) {
      await updateOAuth2Client(formData.value)
      toast.success('修改成功')
    } else {
      await createOAuth2Client(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:oauth2-client:reload')
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
