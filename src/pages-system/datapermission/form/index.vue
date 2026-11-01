<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 表单区域 -->
      <view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="规则名称" title-width="180rpx" prop="name">
              <wd-input
                v-model="formData.name"
                clearable
                placeholder="请输入规则名称"
              />
            </wd-form-item>
            <wd-form-item title="目标表名" title-width="180rpx" prop="tableName">
              <wd-input
                v-model="formData.tableName"
                clearable
                placeholder="如 system_user"
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

        <!-- 过滤条件（移动端以 JSON 编辑，完整可视化条件构建器留 PC 端） -->
        <view class="mx-24rpx mt-24rpx">
          <view class="mb-12rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-500">过滤条件（JSON）</text>
            <text class="text-24rpx text-[#999]" @click="fillExample">
              填入示例
            </text>
          </view>
          <wd-textarea
            v-model="conditionsText"
            :maxlength="5000"
            auto-height
            custom-class="bg-gray-50 rounded-xl"
            placeholder="条件数组 JSON，每项字段：column（列名/表别名）、operator（= / != / > / IN / LIKE 等）、valueType（value 静态值 / sql 原生表达式）、value（值）、logic（与前一条件的连接：AND / OR，首条可空）"
          />
          <view class="mt-12rpx rounded-xl bg-blue-50 px-20rpx py-16rpx text-24rpx text-blue-600">
            提示：移动端通过 JSON 维护条件数组；带下拉候选、逐行增删的可视化条件构建器请在 PC 端使用。
          </view>
        </view>
      </view>
    </scroll-view>

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
import type { DataPermissionCondition, DataPermissionRule } from '@/api/system/datapermission'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createDataPermissionRule,
  getDataPermissionRule,
  updateDataPermissionRule,
} from '@/api/system/datapermission'
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
const getTitle = computed(() => props.id ? '编辑数据权限规则' : '新增数据权限规则')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DataPermissionRule>({
  id: undefined,
  name: '',
  tableName: '',
  conditions: [],
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '规则名称不能为空' }],
  tableName: [{ required: true, message: '目标表名不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 条件数组 JSON 文本（双向：编辑时反序列化、展示时序列化） */
const conditionsText = ref('[]')

/** 填入示例条件，方便理解格式 */
function fillExample() {
  conditionsText.value = JSON.stringify([
    { column: 'dept_id', operator: '=', valueType: 'sql', value: 'dept_id', logic: '' },
  ], null, 2)
}

/** 解析条件 JSON（失败 toast 提示），返回 null 表示不通过 */
function parseConditions(): DataPermissionCondition[] | null {
  let parsed: any
  try {
    parsed = JSON.parse(conditionsText.value || '[]')
  } catch {
    toast.show('过滤条件不是合法 JSON')
    return null
  }
  if (!Array.isArray(parsed)) {
    toast.show('过滤条件必须是 JSON 数组')
    return null
  }
  const invalidIndex = parsed.findIndex((item: any) => !item?.column || !item?.operator)
  if (invalidIndex >= 0) {
    toast.show(`第 ${invalidIndex + 1} 条条件缺少 column 或 operator`)
    return null
  }
  return parsed as DataPermissionCondition[]
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/datapermission/index')
}

/** 加载规则详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getDataPermissionRule(Number(props.id))
  formData.value = detail
  conditionsText.value = JSON.stringify(detail.conditions ?? [], null, 2)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const conditions = parseConditions()
  if (conditions === null) {
    return
  }
  formLoading.value = true
  try {
    formData.value.conditions = conditions
    if (props.id) {
      await updateDataPermissionRule(formData.value)
      toast.success('修改成功')
    } else {
      await createDataPermissionRule(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:data-permission-rule:reload')
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
