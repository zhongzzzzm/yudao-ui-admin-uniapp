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
          <wd-form-item title="客户端名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入客户端名称"
            />
          </wd-form-item>
          <!-- 社交平台：原生 picker 下拉（字典 system_social_type） -->
          <wd-form-item title="社交平台" title-width="180rpx" prop="socialType">
            <picker
              mode="selector"
              :range="socialTypeLabels"
              :value="socialTypeIndex"
              class="flex-1"
              @change="handleSocialTypeChange"
            >
              <view class="flex items-center gap-8rpx">
                <text class="flex-1" :class="formData.socialType != null ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ socialTypeLabel(formData.socialType) || '请选择社交平台' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <!-- 用户类型：原生 picker 下拉 -->
          <wd-form-item title="用户类型" title-width="180rpx" prop="userType">
            <picker
              mode="selector"
              :range="userTypeLabels"
              :value="userTypeIndex"
              class="flex-1"
              @change="handleUserTypeChange"
            >
              <view class="flex items-center gap-8rpx">
                <text class="flex-1" :class="formData.userType != null ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ getDictLabel(DICT_TYPE.USER_TYPE, formData.userType) || '请选择用户类型' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <wd-form-item title="客户端编号" title-width="180rpx" prop="clientId">
            <wd-input
              v-model="formData.clientId"
              clearable
              placeholder="平台分配的 clientId"
            />
          </wd-form-item>
          <wd-form-item title="客户端密钥" title-width="180rpx" prop="clientSecret">
            <wd-input
              v-model="formData.clientSecret"
              show-password
              clearable
              placeholder="平台分配的 clientSecret"
            />
          </wd-form-item>
          <wd-form-item title="代理 ID" title-width="180rpx">
            <wd-input
              v-model="formData.agentId"
              clearable
              placeholder="企微应用 agentId（选填）"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" center prop="status">
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
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
import type { SocialClient } from '@/api/system/social/client'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createSocialClient, getSocialClient, updateSocialClient } from '@/api/system/social/client'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
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
const getTitle = computed(() => props.id ? '编辑社交客户端' : '新增社交客户端')
const formLoading = ref(false) // 表单提交状态
const formData = ref<SocialClient>({
  id: undefined,
  name: '',
  socialType: undefined as unknown as number,
  userType: undefined as unknown as number,
  clientId: '',
  clientSecret: '',
  agentId: '',
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '客户端名称不能为空' }],
  socialType: [{ required: true, message: '社交平台不能为空' }],
  userType: [{ required: true, message: '用户类型不能为空' }],
  clientId: [{ required: true, message: '客户端编号不能为空' }],
  clientSecret: [{ required: true, message: '客户端密钥不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 社交平台选项（字典 system_social_type） */
const socialTypeOptions = getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE)
const socialTypeLabels = computed(() => socialTypeOptions.map(item => item.label))
const socialTypeIndex = computed(() =>
  Math.max(0, socialTypeOptions.findIndex(item => item.value === formData.value.socialType)),
)

function socialTypeLabel(value?: number): string {
  return getDictLabel(DICT_TYPE.SYSTEM_SOCIAL_TYPE, value) ?? ''
}

/** 选择社交平台 */
function handleSocialTypeChange(e: any) {
  const option = socialTypeOptions[Number(e.detail.value)]
  if (option) {
    formData.value.socialType = option.value
  }
}

/** 用户类型选项（字典 user_type） */
const userTypeOptions = getIntDictOptions(DICT_TYPE.USER_TYPE)
const userTypeLabels = computed(() => userTypeOptions.map(item => item.label))
const userTypeIndex = computed(() =>
  Math.max(0, userTypeOptions.findIndex(item => item.value === formData.value.userType)),
)

/** 选择用户类型 */
function handleUserTypeChange(e: any) {
  const option = userTypeOptions[Number(e.detail.value)]
  if (option) {
    formData.value.userType = option.value
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/social/client/index')
}

/** 加载客户端详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSocialClient(Number(props.id))
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
      await updateSocialClient(formData.value)
      toast.success('修改成功')
    } else {
      await createSocialClient(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:social-client:reload')
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
