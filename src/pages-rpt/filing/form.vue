<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="isEdit ? '编辑报送任务' : '新建报送任务'" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1 p-24rpx" scroll-y>
      <view v-if="loading" class="flex justify-center py-120rpx">
        <wd-loading color="#018d71" />
      </view>

      <template v-else>
        <!-- 表单 -->
        <view class="mb-20rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="space-y-20rpx">
            <!-- 报表模板（必填） -->
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                报表模板<text class="text-[#f5222d]"> *</text>
              </view>
              <picker mode="selector" :range="templateLabels" :value="templateIndex(form.templateId)" @change="handlePickTemplate">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.templateId ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ templateLabelOf(form.templateId) || '请选择报表模板' }}
                </view>
              </picker>
            </view>

            <!-- 数据版本 -->
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                数据版本
              </view>
              <picker mode="selector" :range="batchLabels" :value="batchIndex(form.batchId)" @change="handlePickBatch">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.batchId != null ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ batchLabelOf(form.batchId) || '请选择数据版本' }}
                </view>
              </picker>
            </view>

            <!-- 报送截止日期 -->
            <view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                报送截止日期
              </view>
              <picker mode="date" :value="form.submitDeadline || ''" @change="e => form.submitDeadline = e.detail.value">
                <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.submitDeadline ? 'text-[#333]' : 'text-[#bbb]'">
                  {{ form.submitDeadline || '请选择报送截止日期' }}
                </view>
              </picker>
            </view>
          </view>
        </view>

        <!-- 版本解析提示（模板 + 数据版本确定后，按生效窗口解析将钉住的模板版本） -->
        <view
          v-if="resolveText"
          class="mb-20rpx rounded-16rpx p-24rpx text-26rpx"
          :class="resolveOk ? 'bg-[#e6f7f1] text-[#018d71]' : 'bg-[#fff1f0] text-[#f5222d]'"
        >
          {{ resolveText }}
        </view>

        <!-- 说明 -->
        <view class="mb-20rpx rounded-16rpx bg-[#f7f8f9] p-24rpx text-24rpx text-[#999] leading-relaxed">
          新建仅创建任务，原始申报表由所选模板的模板文件提供；创建后请在任务详情中使用「执行」生成报表。模板版本由生效窗口按数据版本所属期自动解析，无需手选。
        </view>
        <view class="h-160rpx" />
      </template>
    </scroll-view>

    <!-- 底部提交栏 -->
    <view v-if="!loading" class="absolute inset-x-0 bottom-0 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button type="primary" block :loading="submitting" :disabled="submitting" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TaxReportFilingVO } from '@/api/rpt/filing'
import type { TaxReportTemplateVO } from '@/api/rpt/template'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import { createTaxReportFiling, getTaxReportFiling, updateTaxReportFiling } from '@/api/rpt/filing'
import { getTaxReportTemplatePage, resolveTaxReportTemplateVersion } from '@/api/rpt/template'
import { getReportDataBatchList } from '@/api/validation/task'

defineOptions({
  name: 'FilingForm',
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
const dialog = useDialog()

const loading = ref(true)
const submitting = ref(false)
/** 编辑模式：id 存在即为编辑（仅更新模板/数据版本等元数据，不重新执行） */
const isEdit = ref(false)
const filingId = ref<number>()

const form = reactive({
  templateId: undefined as number | undefined,
  batchId: undefined as number | undefined,
  submitDeadline: '',
})

// ========== 报表模板选项 ==========

const templates = ref<TaxReportTemplateVO[]>([])
const templateLabels = computed(() => templates.value.map(t => t.name || `模板 #${t.id}`))
function templateIndex(id?: number) {
  return templates.value.findIndex(t => t.id === id)
}
function templateLabelOf(id?: number) {
  return templates.value[templateIndex(id)]?.name
}

// ========== 数据版本选项 ==========

const batches = ref<{ id: number, batchDate?: string }[]>([])
const batchLabels = computed(() => batches.value.map(b => b.batchDate || `版本${b.id}`))
function batchIndex(id?: number) {
  return batches.value.findIndex(b => b.id === id)
}
function batchLabelOf(id?: number) {
  return batches.value[batchIndex(id)]?.batchDate
}

// ========== 版本解析提示 ==========

const resolveText = ref('')
const resolveOk = ref(true)
let resolveTimer: ReturnType<typeof setTimeout> | undefined

/** 模板/数据版本变化后延迟解析（防抖，避免连续选择多次请求） */
function scheduleResolve() {
  if (resolveTimer) {
    clearTimeout(resolveTimer)
  }
  resolveText.value = ''
  resolveOk.value = true
  if (!form.templateId || form.batchId == null) {
    return
  }
  resolveTimer = setTimeout(() => {
    resolveTaxReportTemplateVersion(form.templateId!, form.batchId!).then((resolved) => {
      if (resolved.resolved && resolved.versionNo) {
        resolveText.value = `将使用版本：V${resolved.versionNo}`
        resolveOk.value = true
      } else {
        resolveText.value = '该模板没有覆盖该所属期的已发布版本，请先在 PC 端模板「版本管理」中发布'
        resolveOk.value = false
      }
    }).catch(() => {
      resolveText.value = ''
      resolveOk.value = true
    })
  }, 300)
}

function handlePickTemplate(e: any) {
  const item = templates.value[Number(e.detail.value)]
  if (!item || item.id === form.templateId) {
    return
  }
  form.templateId = item.id
  scheduleResolve()
}

function handlePickBatch(e: any) {
  const item = batches.value[Number(e.detail.value)]
  if (!item || item.id === form.batchId) {
    return
  }
  form.batchId = item.id
  scheduleResolve()
}

// ========== 加载与提交 ==========

/** 加载选项数据；编辑模式同时回填任务原值 */
async function load() {
  loading.value = true
  try {
    const [templateRes, batchList] = await Promise.all([
      getTaxReportTemplatePage({ pageNo: 1, pageSize: 100 }),
      getReportDataBatchList(),
    ])
    templates.value = templateRes.list || []
    batches.value = (batchList || []).slice().sort(
      (a, b) => String(b.batchDate ?? '').localeCompare(String(a.batchDate ?? '')),
    )
    if (isEdit.value && filingId.value) {
      const filing: TaxReportFilingVO = await getTaxReportFiling(filingId.value)
      form.templateId = filing.templateId
      form.batchId = filing.batchId
      form.submitDeadline = filing.submitDeadline || ''
      scheduleResolve()
    }
  } finally {
    loading.value = false
  }
}

/** 提交：新建仅传模板/数据版本/截止日期；编辑仅更新元数据 */
function handleSubmit() {
  if (!form.templateId) {
    toast.show('请选择报表模板')
    return
  }
  dialog.confirm({
    title: isEdit.value ? '确认保存' : '确认创建',
    msg: isEdit.value
      ? '确认保存修改？仅更新模板/数据版本，不会重新执行任务。'
      : '确认创建报送任务？创建后请在任务详情中执行生成报表。',
  }).then(() => {
    doSubmit()
  }).catch(() => {})
}

async function doSubmit() {
  submitting.value = true
  try {
    if (isEdit.value && filingId.value) {
      await updateTaxReportFiling({
        id: filingId.value,
        templateId: form.templateId!,
        batchId: form.batchId,
        submitDeadline: form.submitDeadline || undefined,
      })
      toast.show('保存成功')
    } else {
      await createTaxReportFiling({
        templateId: form.templateId!,
        batchId: form.batchId,
        submitDeadline: form.submitDeadline || undefined,
      })
      toast.show('任务创建成功')
    }
    setTimeout(() => navigateBackPlus(), 600)
  } catch (e: any) {
    toast.show(e?.message || (isEdit.value ? '保存失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

onLoad((query) => {
  if (query?.id) {
    isEdit.value = true
    filingId.value = Number(query.id)
  }
  load()
})
</script>
