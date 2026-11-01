<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="发起流动性测算" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 提示 -->
      <view class="m-24rpx mb-0 rounded-12rpx bg-[#e6f7f4] px-24rpx py-20rpx text-24rpx text-[#018d71]">
        上传应收租金表与刚兑表，填写参数后提交，系统自动测算未来三个月流动性指标。
      </view>

      <!-- 表单区 -->
      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <!-- 测算时点 -->
        <view class="form-item">
          <view class="form-label required">
            测算时点
          </view>
          <picker mode="selector" :range="monthLabels" :value="monthIndex" @change="handleMonthChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ form.point || '请选择测算时点' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
          <view class="mt-8rpx text-22rpx text-[#999]">
            自该时点下一个月起测算三个月
          </view>
        </view>

        <!-- 上月末账面现金资产 -->
        <view class="form-item">
          <view class="form-label required">
            上月末账面现金资产（合并口径）
          </view>
          <wd-input
            v-model="form.lastMonthCash"
            type="digit"
            no-border
            placeholder="请输入金额（元）"
          />
        </view>

        <!-- 应收租金表 -->
        <view class="form-item">
          <view class="form-label required">
            应收租金表
          </view>
          <yd-upload
            v-model="rentUrls"
            accept="all"
            directory="fin-liquidity"
            :limit="1"
            :file-type="excelTypes"
          >
            <view class="h-120rpx flex items-center justify-center border border-[#e5e6eb] rounded-12rpx border-dashed">
              <wd-icon name="add" size="40rpx" color="#999" />
              <text class="ml-8rpx text-26rpx text-[#999]">上传应收租金表（Excel）</text>
            </view>
          </yd-upload>
        </view>

        <!-- 刚兑表 -->
        <view class="form-item">
          <view class="form-label required">
            刚兑表
          </view>
          <yd-upload
            v-model="redemptionUrls"
            accept="all"
            directory="fin-liquidity"
            :limit="1"
            :file-type="excelTypes"
          >
            <view class="h-120rpx flex items-center justify-center border border-[#e5e6eb] rounded-12rpx border-dashed">
              <wd-icon name="add" size="40rpx" color="#999" />
              <text class="ml-8rpx text-26rpx text-[#999]">上传刚兑表（Excel）</text>
            </view>
          </yd-upload>
        </view>

        <!-- 三个月投放金额 -->
        <view class="form-item">
          <view class="form-label">
            第一个月投放金额（元）
          </view>
          <wd-input v-model="form.firstMonthLoanCash" type="digit" no-border placeholder="默认 0" />
        </view>
        <view class="form-item">
          <view class="form-label">
            第二个月投放金额（元）
          </view>
          <wd-input v-model="form.secondMonthLoanCash" type="digit" no-border placeholder="默认 0" />
        </view>
        <view class="form-item">
          <view class="form-label">
            第三个月投放金额（元）
          </view>
          <wd-input v-model="form.thirdMonthLoanCash" type="digit" no-border placeholder="默认 0" />
        </view>

        <!-- 三个月至少保有现金资产 -->
        <view class="form-item">
          <view class="form-label">
            第一个月至少保有现金资产（元）
          </view>
          <wd-input v-model="form.firstMonthMinimumCash" type="digit" no-border placeholder="默认 0" />
        </view>
        <view class="form-item">
          <view class="form-label">
            第二个月至少保有现金资产（元）
          </view>
          <wd-input v-model="form.secondMonthMinimumCash" type="digit" no-border placeholder="默认 0" />
        </view>
        <view class="form-item">
          <view class="form-label">
            第三个月至少保有现金资产（元）
          </view>
          <wd-input v-model="form.thirdMonthMinimumCash" type="digit" no-border placeholder="默认 0" />
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <view class="form-label">
            备注
          </view>
          <wd-textarea v-model="form.remark" :maxlength="500" show-word-limit clearable no-border placeholder="备注（500 字以内）" />
        </view>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部提交 -->
    <view class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button
        v-if="canCreate"
        class="flex-1"
        type="primary"
        :loading="submitting"
        @click="onSubmit"
      >
        提交测算
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { createLiquidityCalculation } from '@/api/fin/liquidity'
import { useAccess } from '@/hooks/useAccess'
import { computed, reactive, ref } from 'vue'

defineOptions({
  name: 'FinLiquidityCalculationForm',
})

function handleBack() {
  navigateBackPlus()
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { hasAccessByCodes } = useAccess()
/** 发起测算权限（fin:liquidity-calculation:create） */
const canCreate = computed(() => hasAccessByCodes(['fin:liquidity-calculation:create']))

/** Excel 文件类型白名单（上传前本地校验） */
const excelTypes = ['xlsx', 'xls']

// ========== 测算时点选择（近 24 个月） ==========

/** 生成近 24 个月的 yyyy-MM 列表（当月起往前推） */
function buildMonthOptions() {
  const list: string[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return list
}
const monthLabels = buildMonthOptions()
const form = reactive({
  point: monthLabels[0] ?? '',
  lastMonthCash: '',
  firstMonthLoanCash: '',
  secondMonthLoanCash: '',
  thirdMonthLoanCash: '',
  firstMonthMinimumCash: '',
  secondMonthMinimumCash: '',
  thirdMonthMinimumCash: '',
  remark: '',
})

const monthIndex = computed(() => monthLabels.indexOf(form.point))

function handleMonthChange(e: any) {
  form.point = monthLabels[Number(e.detail.value)] || ''
}

// ========== 表单 ==========

/** 应收租金表文件 URL（modelValue 为 string[]，取第一张） */
const rentUrls = ref<string[]>([])
/** 刚兑表文件 URL */
const redemptionUrls = ref<string[]>([])

/** 金额文本转数值（空串返回 undefined，后端默认 0） */
function toAmount(text?: string): number | undefined {
  if (text == null || text === '') {
    return undefined
  }
  const num = Number(text)
  return Number.isFinite(num) ? num : undefined
}

const submitting = ref(false)

/** 提交测算：本地校验 → 调创建接口（后端同步解析文件并生成三个月测算） */
async function onSubmit() {
  if (!form.point) {
    toast.show('请选择测算时点')
    return
  }
  const lastMonthCash = toAmount(form.lastMonthCash)
  if (lastMonthCash == null) {
    toast.show('请输入上月末账面现金资产')
    return
  }
  if (!rentUrls.value[0]) {
    toast.show('请上传应收租金表')
    return
  }
  if (!redemptionUrls.value[0]) {
    toast.show('请上传刚兑表')
    return
  }
  submitting.value = true
  try {
    await createLiquidityCalculation({
      point: form.point,
      lastMonthCash,
      receivableRent: rentUrls.value[0],
      rigidRedemption: redemptionUrls.value[0],
      firstMonthLoanCash: toAmount(form.firstMonthLoanCash),
      secondMonthLoanCash: toAmount(form.secondMonthLoanCash),
      thirdMonthLoanCash: toAmount(form.thirdMonthLoanCash),
      firstMonthMinimumCash: toAmount(form.firstMonthMinimumCash),
      secondMonthMinimumCash: toAmount(form.secondMonthMinimumCash),
      thirdMonthMinimumCash: toAmount(form.thirdMonthMinimumCash),
      remark: form.remark || undefined,
    })
    toast.show('测算已完成')
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误提示由 http 层统一弹出
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #666;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
