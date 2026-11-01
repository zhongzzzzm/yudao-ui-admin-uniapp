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
              placeholder="如 test_mail"
            />
          </wd-form-item>
          <!-- 发件账号：原生 picker 下拉 -->
          <wd-form-item title="发件账号" title-width="180rpx" prop="accountId">
            <picker
              mode="selector"
              :range="accountLabels"
              :value="accountIndex"
              class="flex-1"
              @change="handleAccountChange"
            >
              <view class="flex items-center gap-8rpx">
                <text class="flex-1" :class="formData.accountId ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ accountLabelOf(formData.accountId) || '请选择发件邮箱账号' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <wd-form-item title="发件人名称" title-width="180rpx" prop="nickname">
            <wd-input
              v-model="formData.nickname"
              clearable
              placeholder="请输入发件人名称"
            />
          </wd-form-item>
          <wd-form-item title="邮件标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              placeholder="支持 {param} 占位符"
            />
          </wd-form-item>
          <wd-form-item title="模板内容" title-width="180rpx" prop="content" title-height="">
            <wd-textarea
              v-model="formData.content"
              :maxlength="2000"
              show-word-limit
              clearable
              placeholder="支持 HTML 与 {param} 占位符"
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
        提示：标题与内容中以 {参数名} 书写占位符，保存后由后端解析出模板参数，发送时按参数传值。
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
import type { MailAccountSimple, MailTemplate } from '@/api/system/mail'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createMailTemplate,
  getMailTemplate,
  getSimpleMailAccountList,
  updateMailTemplate,
} from '@/api/system/mail'
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
const getTitle = computed(() => props.id ? '编辑邮件模板' : '新增邮件模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MailTemplate>({
  id: undefined,
  name: '',
  code: '',
  accountId: undefined as unknown as number,
  nickname: '',
  title: '',
  content: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '模板名称不能为空' }],
  code: [{ required: true, message: '模板编码不能为空' }],
  accountId: [{ required: true, message: '发件账号不能为空' }],
  title: [{ required: true, message: '邮件标题不能为空' }],
  content: [{ required: true, message: '模板内容不能为空' }],
  nickname: [{ required: true, message: '发件人名称不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 发件账号精简列表（下拉用） */
const accounts = ref<MailAccountSimple[]>([])
const accountLabels = computed(() => accounts.value.map(item => item.mail))
const accountIndex = computed(() =>
  Math.max(0, accounts.value.findIndex(item => item.id === formData.value.accountId)),
)

function accountLabelOf(accountId?: number): string {
  return accounts.value.find(item => item.id === accountId)?.mail ?? ''
}

/** 选择发件账号 */
function handleAccountChange(e: any) {
  const account = accounts.value[Number(e.detail.value)]
  if (account) {
    formData.value.accountId = account.id
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 加载模板详情与发件账号列表 */
async function getDetail() {
  const [accountList, detail] = await Promise.all([
    getSimpleMailAccountList().catch(() => []),
    props.id ? getMailTemplate(Number(props.id)) : Promise.resolve(undefined),
  ])
  accounts.value = accountList ?? []
  if (detail) {
    formData.value = detail
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
      await updateMailTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createMailTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:mail-template:reload')
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
