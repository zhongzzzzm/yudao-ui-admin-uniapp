<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="发起结息测算" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 顶部提示：随计算方式切换 -->
      <view class="m-24rpx mb-0 rounded-12rpx bg-[#e6f7f4] px-24rpx py-20rpx text-24rpx text-[#018d71]">
        {{
          isTrial
            ? '上传用友三栏式明细账（银行存款活期账户），对自选期间按单一年利率逐日计息（年化 360 天），不与账内入账利息核对；起始日不得早于账内首笔交易日。'
            : '上传用友三栏式明细账（银行存款活期账户），系统按账内「利息收入」结息日切分结息区间并逐日计息（年化 360 天），与账内入账利息自动核对差额。'
        }}
      </view>

      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <!-- 计算方式 -->
        <view class="form-item">
          <view class="form-label required">
            计算方式
          </view>
          <picker mode="selector" :range="calcModeLabels" :value="calcModeIndex" @change="handleCalcModeChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ calcModeLabels[calcModeIndex] || '请选择计算方式' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 三栏式明细账 -->
        <view class="form-item">
          <view class="form-label required">
            三栏式明细账
          </view>
          <yd-upload
            v-model="ledgerUrls"
            accept="all"
            directory="fin-deposit-interest"
            :limit="1"
            :file-type="excelTypes"
          >
            <view class="h-120rpx flex items-center justify-center border border-[#e5e6eb] rounded-12rpx border-dashed">
              <wd-icon name="add" size="40rpx" color="#999" />
              <text class="ml-8rpx text-26rpx text-[#999]">上传三栏式明细账（Excel）</text>
            </view>
          </yd-upload>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <view class="form-label">
            备注
          </view>
          <wd-textarea v-model="form.description" :maxlength="500" show-word-limit clearable no-border placeholder="如：工商银行南海支行 2026Q3 结息测算" />
        </view>

        <!-- 任意期间试算模式：期间与利率 -->
        <template v-if="isTrial">
          <view class="form-item">
            <view class="form-label required">
              试算起始日（含）
            </view>
            <picker mode="date" :value="form.periodStart" @change="e => (form.periodStart = String(e.detail.value))">
              <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
                <text class="text-28rpx" :class="form.periodStart ? 'text-[#333]' : 'text-[#999]'">
                  {{ form.periodStart || '请选择起始日' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item">
            <view class="form-label required">
              试算截止日（不含）
            </view>
            <picker mode="date" :value="form.periodEnd" @change="e => (form.periodEnd = String(e.detail.value))">
              <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
                <text class="text-28rpx" :class="form.periodEnd ? 'text-[#333]' : 'text-[#999]'">
                  {{ form.periodEnd || '请选择截止日' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item">
            <view class="form-label required">
              试算年利率（%）
            </view>
            <wd-input v-model="form.annualRate" type="digit" no-border placeholder="如 1.40" />
          </view>
        </template>

        <!-- 按结息点核对模式：利率段维护 -->
        <template v-else>
          <view class="form-item">
            <view class="flex items-center justify-between">
              <view class="form-label required mb-0">
                计息利率段
              </view>
              <wd-button size="small" type="primary" plain @click="addSegment">
                新增利率段
              </wd-button>
            </view>
            <view class="mt-8rpx text-22rpx text-[#999]">
              年利率（%），区间含起始日、不含截止日，相邻段需无缝衔接且不可重叠
            </view>
          </view>
          <view
            v-for="(seg, index) in segments"
            :key="index"
            class="mb-24rpx border border-[#e5e6eb] rounded-12rpx p-20rpx"
          >
            <view class="mb-12rpx flex items-center justify-between">
              <text class="text-26rpx text-[#666]">第 {{ index + 1 }} 段</text>
              <wd-button
                v-if="segments.length > 1"
                size="small"
                type="error"
                plain
                @click="removeSegment(index)"
              >
                删除
              </wd-button>
            </view>
            <view class="mb-16rpx flex gap-16rpx">
              <view class="flex-1">
                <view class="mb-8rpx text-22rpx text-[#999]">
                  起始日（含）
                </view>
                <picker mode="date" :value="seg.startDate" @change="e => (seg.startDate = String(e.detail.value))">
                  <view class="min-h-64rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-16rpx">
                    <text class="text-24rpx" :class="seg.startDate ? 'text-[#333]' : 'text-[#bbb]'">
                      {{ seg.startDate || '请选择' }}
                    </text>
                  </view>
                </picker>
              </view>
              <view class="flex-1">
                <view class="mb-8rpx text-22rpx text-[#999]">
                  截止日（不含）
                </view>
                <picker mode="date" :value="seg.endDate" @change="e => (seg.endDate = String(e.detail.value))">
                  <view class="min-h-64rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-16rpx">
                    <text class="text-24rpx" :class="seg.endDate ? 'text-[#333]' : 'text-[#bbb]'">
                      {{ seg.endDate || '请选择' }}
                    </text>
                  </view>
                </picker>
              </view>
            </view>
            <view>
              <view class="mb-8rpx text-22rpx text-[#999]">
                年利率（%）
              </view>
              <wd-input v-model="seg.annualRate" type="digit" no-border placeholder="如 1.40" />
            </view>
          </view>
        </template>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部提交 -->
    <view class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button class="flex-1" type="primary" :loading="submitting" @click="onSubmit">
        提交测算
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { computed, reactive, ref } from 'vue'
import { createDepositInterest } from '@/api/fin/depositInterest'

defineOptions({
  name: 'FinDepositInterestForm',
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

/** Excel 文件类型白名单（上传前本地校验） */
const excelTypes = ['xlsx', 'xls']

// ========== 计算方式：1=按结息点核对、2=任意期间试算 ==========

const CALC_MODE_RECONCILE = 1
const CALC_MODE_TRIAL = 2
const calcModeLabels = ['按结息点核对', '任意期间试算']
const calcModeOptions = [CALC_MODE_RECONCILE, CALC_MODE_TRIAL]
const form = reactive({
  calcMode: CALC_MODE_RECONCILE as number,
  description: '',
  periodStart: '',
  periodEnd: '',
  annualRate: '',
})

const calcModeIndex = computed(() => calcModeOptions.indexOf(form.calcMode))
const isTrial = computed(() => form.calcMode === CALC_MODE_TRIAL)

function handleCalcModeChange(e: any) {
  form.calcMode = calcModeOptions[Number(e.detail.value)] ?? CALC_MODE_RECONCILE
}

// ========== 表单 ==========

/** 三栏式明细账文件 URL（modelValue 为 string[]，取第一张） */
const ledgerUrls = ref<string[]>([])

// ========== 利率段（按结息点核对模式） ==========

interface SegmentRow {
  startDate: string
  endDate: string
  annualRate: string
}

const segments = ref<SegmentRow[]>([{ startDate: '', endDate: '', annualRate: '' }])

function addSegment() {
  segments.value.push({ startDate: '', endDate: '', annualRate: '' })
}

function removeSegment(index: number) {
  segments.value.splice(index, 1)
}

const submitting = ref(false)

/** 提交测算：本地校验 → 调创建接口（后端同步解析明细账并计算） */
async function onSubmit() {
  const fileUrl = ledgerUrls.value[0]
  if (!fileUrl) {
    toast.show('请上传三栏式明细账文件')
    return
  }
  const base = {
    description: form.description || undefined,
    fileUrl,
    calcMode: form.calcMode,
  }
  submitting.value = true
  try {
    if (isTrial.value) {
      // 试算模式：期间 + 单一年利率
      if (!form.periodStart || !form.periodEnd) {
        toast.show('请填写试算期间的起止日期')
        return
      }
      if (form.periodStart >= form.periodEnd) {
        toast.show('试算起始日必须早于截止日')
        return
      }
      const rate = Number(form.annualRate)
      if (!form.annualRate || !Number.isFinite(rate) || rate < 0 || rate > 100) {
        toast.show('请填写 0~100 之间的试算年利率')
        return
      }
      await createDepositInterest({
        ...base,
        rateSegments: [],
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        annualRate: rate,
      })
    } else {
      // 核对模式：逐段校验利率段
      if (!segments.value.length) {
        toast.show('请至少录入一个计息利率段')
        return
      }
      const rateSegments = []
      for (let i = 0; i < segments.value.length; i++) {
        const seg = segments.value[i]
        if (!seg.startDate || !seg.endDate) {
          toast.show(`利率段第 ${i + 1} 行起止日期不能为空`)
          return
        }
        if (seg.startDate >= seg.endDate) {
          toast.show(`利率段第 ${i + 1} 行起始日必须早于截止日`)
          return
        }
        const rate = Number(seg.annualRate)
        if (!seg.annualRate || !Number.isFinite(rate) || rate < 0 || rate > 100) {
          toast.show(`利率段第 ${i + 1} 行年利率须为 0~100 之间的数值`)
          return
        }
        rateSegments.push({ startDate: seg.startDate, endDate: seg.endDate, annualRate: rate })
      }
      await createDepositInterest({ ...base, rateSegments })
    }
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
