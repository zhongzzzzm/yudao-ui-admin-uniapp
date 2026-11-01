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
          <!-- 节假日日期：datetime picker -->
          <wd-form-item title="节假日日期" title-width="180rpx" prop="holidayDate" is-link @click="pickerVisible = true">
            <wd-input
              v-model="formData.holidayDate"
              placeholder="请选择日期"
              disabled
              custom-class="pointer-events-none"
            />
          </wd-form-item>
          <!-- 类型：原生 picker 下拉 -->
          <wd-form-item title="节假日类型" title-width="180rpx" prop="type">
            <picker
              mode="selector"
              :range="typeLabels"
              :value="typeIndex"
              class="flex-1"
              @change="handleTypeChange"
            >
              <view class="flex items-center gap-8rpx">
                <text class="flex-1" :class="formData.type ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ typeLabel(formData.type) || '请选择节假日类型' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </wd-form-item>
          <!-- 是否调休补班 -->
          <wd-form-item title="调休补班" title-width="180rpx" center prop="workdayFlag">
            <wd-switch
              v-model="formData.workdayFlag"
              :active-value="true"
              :inactive-value="false"
            />
          </wd-form-item>
          <wd-form-item title="归属年份" title-width="180rpx" prop="year">
            <wd-input
              v-model="formData.year"
              type="number"
              clearable
              placeholder="如 2026（默认按日期自动生成）"
            />
          </wd-form-item>
          <wd-form-item title="描述" title-width="180rpx">
            <wd-textarea
              v-model="formData.description"
              placeholder="如：春节"
              :maxlength="100"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <!-- 说明 -->
      <view class="mx-24rpx mt-16rpx rounded-xl bg-blue-50 px-20rpx py-16rpx text-24rpx text-blue-600">
        提示：法定节假日与调休安排建议使用列表页的「同步」按钮批量拉取，手工维护仅用于个别修正。
      </view>
    </view>

    <!-- 日期选择器 -->
    <wd-datetime-picker
      v-model="pickerValue"
      v-model:visible="pickerVisible"
      title="请选择节假日日期"
      type="date"
      @confirm="handleDateConfirm"
    />

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
import type { Holiday } from '@/api/system/holiday'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createHoliday, getHoliday, updateHoliday } from '@/api/system/holiday'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'

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
const getTitle = computed(() => props.id ? '编辑节假日' : '新增节假日')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Holiday>({
  id: undefined,
  holidayDate: '',
  type: undefined as unknown as number,
  workdayFlag: false,
  year: new Date().getFullYear(),
  description: '',
}) // 表单数据
const formSchema = {
  holidayDate: [{ required: true, message: '节假日日期不能为空' }],
  type: [{ required: true, message: '节假日类型不能为空' }],
  year: [{ required: true, message: '归属年份不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 日期选择器（wd-datetime-picker 值为时间戳，格式化回 yyyy-MM-dd） */
const pickerVisible = ref(false)
const pickerValue = ref<number>(Date.now())

function handleDateConfirm({ value }: { value: number }) {
  formData.value.holidayDate = formatDate(value)
  // 日期变化时自动带出归属年份
  formData.value.year = new Date(value).getFullYear()
}

/** 节假日类型：1 春节、2 元旦、3 清明、4 劳动节、5 端午、6 中秋、7 国庆、8 其他 */
const holidayTypes = [
  { label: '春节', value: 1 },
  { label: '元旦', value: 2 },
  { label: '清明', value: 3 },
  { label: '劳动节', value: 4 },
  { label: '端午', value: 5 },
  { label: '中秋', value: 6 },
  { label: '国庆', value: 7 },
  { label: '其他', value: 8 },
]
const typeLabels = computed(() => holidayTypes.map(item => item.label))
const typeIndex = computed(() =>
  Math.max(0, holidayTypes.findIndex(item => item.value === formData.value.type)),
)

function typeLabel(value?: number): string {
  return holidayTypes.find(item => item.value === value)?.label ?? ''
}

/** 选择节假日类型 */
function handleTypeChange(e: any) {
  const option = holidayTypes[Number(e.detail.value)]
  if (option) {
    formData.value.type = option.value
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/holiday/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getHoliday(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    formData.value.year = Number(formData.value.year)
    if (props.id) {
      await updateHoliday(formData.value)
      toast.success('修改成功')
    } else {
      await createHoliday(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:holiday:reload')
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
