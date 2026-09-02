<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="报表管理" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 搜索 + 操作 -->
    <view class="bg-white px-24rpx pb-16rpx pt-16rpx">
      <wd-search v-model="name" placeholder="搜索报表名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
      <view v-if="canCreate || canImport" class="mt-12rpx flex justify-end gap-16rpx">
        <wd-button v-if="canImport" size="small" plain @click="handleImportClick">
          导入数据
        </wd-button>
        <wd-button v-if="canCreate" size="small" type="primary" @click="openForm()">
          新建报表
        </wd-button>
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无报表"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openActions(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.name || '-' }}
            </view>
            <wd-tag :type="item.status === 0 ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              分类：{{ item.categoryName || '-' }} · 编码：{{ item.code || '-' }}
            </view>
            <view class="line-clamp-1">
              数据日期：{{ item.reportDate || '-' }} · {{ dataStatusLabel(item.dataStatus) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 卡片操作面板 -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionOptions"
      cancel-text="取消"
      :title="activeItem?.name || '报表操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新建/编辑表单 -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-80vh overflow-auto p-24rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑报表' : '新建报表' }}
        </view>

        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              分类<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="selector" :range="ruleTypeLabels" @change="handleFormCategory">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.category ? 'text-[#333]' : 'text-[#bbb]'">
                {{ ruleTypeLabels[ruleTypeIndex(form.category)] || '请选择分类' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              名字<text class="text-[#f5222d]"> *</text>
            </view>
            <wd-input v-model="form.name" placeholder="请输入名字" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              编码<text class="text-[#f5222d]"> *</text>
            </view>
            <wd-input v-model="form.code" placeholder="请输入编码" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              数据日期
            </view>
            <picker mode="date" :value="form.reportDate" @change="handleFormReportDate">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.reportDate ? 'text-[#333]' : 'text-[#bbb]'">
                {{ form.reportDate || '请选择数据日期' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              数据文件
            </view>
            <view class="min-h-72rpx flex items-center justify-between rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx" @click="handleFormFile">
              <view class="line-clamp-1 flex-1 text-26rpx" :class="form.file ? 'text-[#333]' : 'text-[#bbb]'">
                {{ form.fileName || '点击选择文件上传' }}
              </view>
              <wd-icon v-if="uploading" name="loading" size="32rpx" color="#018d71" />
              <wd-icon v-else name="arrow-right" size="32rpx" color="#bbb" />
            </view>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              更新数据
            </view>
            <radio-group class="flex gap-40rpx" @change="handleFormUpdated">
              <label class="flex items-center gap-8rpx text-26rpx">
                <radio :checked="form.updated === true" value="true" color="#018d71" />
                是
              </label>
              <label class="flex items-center gap-8rpx text-26rpx">
                <radio :checked="form.updated === false" value="false" color="#018d71" />
                否
              </label>
            </radio-group>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              状态
            </view>
            <radio-group class="flex gap-40rpx" @change="handleFormStatus">
              <label v-for="opt in statusOptions" :key="String(opt.value)" class="flex items-center gap-8rpx text-26rpx">
                <radio :checked="form.status === opt.value" :value="String(opt.value)" color="#018d71" />
                {{ opt.label }}
              </label>
            </radio-group>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              描述
            </view>
            <textarea
              v-model="form.description"
              :maxlength="200"
              placeholder="请输入描述"
              class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
            />
          </view>
        </view>

        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :disabled="saving"
          :loading="saving"
          @click="submitForm"
        >
          保存
        </wd-button>
      </view>
    </wd-popup>

    <!-- 校验：选择数据版本 -->
    <wd-popup v-model="showValidate" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-500">
          选择数据版本校验
        </view>
        <picker mode="selector" :range="batchLabels" @change="handleValidateBatch">
          <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="validateBatchId ? 'text-[#333]' : 'text-[#bbb]'">
            {{ batchLabels[batchIndex(validateBatchId)] || '请选择数据版本' }}
          </view>
        </picker>
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :disabled="!validateBatchId || acting"
          :loading="acting"
          @click="submitValidate"
        >
          开始校验
        </wd-button>
      </view>
    </wd-popup>

    <!-- 对比：选择历史/当前数据版本 -->
    <wd-popup v-model="showCompare" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-500">
          选择两个数据版本对比
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          历史数据版本
        </view>
        <picker mode="selector" :range="batchLabels" @change="handleCompareHis">
          <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="compareHisId ? 'text-[#333]' : 'text-[#bbb]'">
            {{ batchLabels[batchIndex(compareHisId)] || '请选择历史数据版本' }}
          </view>
        </picker>
        <view class="mb-8rpx mt-16rpx text-26rpx text-[#666]">
          当前数据版本
        </view>
        <picker mode="selector" :range="batchLabels" @change="handleCompareCmp">
          <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="compareCmpId ? 'text-[#333]' : 'text-[#bbb]'">
            {{ batchLabels[batchIndex(compareCmpId)] || '请选择当前数据版本' }}
          </view>
        </picker>
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :disabled="!compareHisId || !compareCmpId || acting"
          :loading="acting"
          @click="submitCompare"
        >
          开始对比
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportVO } from '@/api/validation/report'
import type { ReportDataBatchVO } from '@/api/validation/task'
import type { ReportRuleTypeVO } from '@/api/validation/reportRuleType'
import { navigateBackPlus } from '@/utils'
import { chooseImportFile, uploadMultipart } from '@/http/multipart'
import { uploadFile } from '@/api/infra/file'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getFileNameFromUrl } from '@/utils/download'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  compareReport,
  createReport,
  deleteReport,
  deleteReportData,
  getReportPage,
  updateReport,
  validateReport,
} from '@/api/validation/report'
import { getReportRuleTypeList } from '@/api/validation/reportRuleType'
import { getReportDataBatchList } from '@/api/validation/task'

defineOptions({
  name: 'ValidationReportList',
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

const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const canCreate = hasAccessByCodes(['validation:report:create'])
const canUpdate = hasAccessByCodes(['validation:report:update'])
const canDelete = hasAccessByCodes(['validation:report:delete'])
const canImport = hasAccessByCodes(['validation:report:import'])
const canValidate = hasAccessByCodes(['validation:report:validation'])
const canCompare = hasAccessByCodes(['validation:report:compare'])
const canDeleteData = hasAccessByCodes(['validation:report:deleteData'])

const statusOptions = getDictOptions(DICT_TYPE.COMMON_STATUS)

function statusLabel(status?: number) {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.COMMON_STATUS, status) || '未知'
}

function dataStatusLabel(status?: number) {
  if (status == null) {
    return '无数据'
  }
  return getDictLabel(DICT_TYPE.VALIDATION_DATA_STATUS, status) || '未知'
}

// 列表查询
const name = ref('')
const list = ref<ReportVO[]>([])
const pagingRef = ref<any>()

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportPage({ pageNo, pageSize, name: name.value.trim() || undefined })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作面板：按权限动态生成
const showActions = ref(false)
const activeItem = ref<ReportVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canValidate) {
    actions.push({ name: '校验', key: 'validate' })
  }
  if (canCompare) {
    actions.push({ name: '对比', key: 'compare' })
  }
  if (canDeleteData) {
    actions.push({ name: '清除数据', key: 'deleteData', color: '#ee0a24' })
  }
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportVO) {
  if (actionOptions.value.length === 0) {
    return
  }
  activeItem.value = item
  showActions.value = true
}

function handleAction({ item }: { item: { key: string } }) {
  showActions.value = false
  const target = activeItem.value
  if (!target) {
    return
  }
  switch (item.key) {
    case 'edit': {
      openForm(target)
      break
    }
    case 'validate': {
      openValidate(target)
      break
    }
    case 'compare': {
      openCompare(target)
      break
    }
    case 'deleteData': {
      dialog.confirm({
        title: '清除数据',
        msg: `将清除【${target.name}】下的全部报表数据，不可恢复，是否继续？`,
      }).then(async () => {
        try {
          await deleteReportData([target.id])
          uni.showToast({ title: '数据已清除', icon: 'none' })
          pagingRef.value?.reload()
        } catch (e: any) {
          uni.showToast({ title: e?.message || '清除失败', icon: 'none' })
        }
      }).catch(() => {})
      break
    }
    case 'delete': {
      dialog.confirm({
        title: '删除报表',
        msg: `确认删除【${target.name}】？`,
      }).then(async () => {
        try {
          await deleteReport(target.id)
          uni.showToast({ title: '已删除', icon: 'none' })
          pagingRef.value?.reload()
        } catch (e: any) {
          uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
        }
      }).catch(() => {})
      break
    }
  }
}

// 数据版本下拉（校验/对比共用）
const batches = ref<ReportDataBatchVO[]>([])
const batchLabels = computed(() =>
  batches.value.map(b => `${b.batchDate || ''}${b.description ? ` ${b.description}` : ''}` || `版本${b.id}`),
)

function batchIndex(batchId?: number) {
  const idx = batches.value.findIndex(b => b.id === batchId)
  return idx < 0 ? 0 : idx
}

async function loadBatches() {
  if (batches.value.length) {
    return
  }
  try {
    batches.value = await getReportDataBatchList() || []
  } catch {
    batches.value = []
  }
}

// 校验（与对比共用提交锁）
const acting = ref(false)
const showValidate = ref(false)
const validateBatchId = ref<number>()
const validateTarget = ref<ReportVO>()

function openValidate(item: ReportVO) {
  validateTarget.value = item
  validateBatchId.value = undefined
  loadBatches()
  showValidate.value = true
}

function handleValidateBatch(e: any) {
  validateBatchId.value = batches.value[Number(e.detail.value)]?.id
}

function submitValidate() {
  if (!validateBatchId.value || !validateTarget.value) {
    return
  }
  const target = validateTarget.value
  dialog.confirm({
    title: '确认校验',
    msg: `将按所选数据版本对【${target.name}】执行校验，是否继续？`,
  }).then(async () => {
    acting.value = true
    try {
      await validateReport([target.id], validateBatchId.value!)
      uni.showToast({ title: '已提交校验', icon: 'none' })
      showValidate.value = false
      pagingRef.value?.reload()
    } catch (e: any) {
      uni.showToast({ title: e?.message || '校验失败', icon: 'none' })
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

// 对比
const showCompare = ref(false)
const compareHisId = ref<number>()
const compareCmpId = ref<number>()
const compareTarget = ref<ReportVO>()

function openCompare(item: ReportVO) {
  compareTarget.value = item
  compareHisId.value = undefined
  compareCmpId.value = undefined
  loadBatches()
  showCompare.value = true
}

function handleCompareHis(e: any) {
  compareHisId.value = batches.value[Number(e.detail.value)]?.id
}

function handleCompareCmp(e: any) {
  compareCmpId.value = batches.value[Number(e.detail.value)]?.id
}

function submitCompare() {
  if (!compareHisId.value || !compareCmpId.value || !compareTarget.value) {
    return
  }
  const target = compareTarget.value
  dialog.confirm({
    title: '确认对比',
    msg: `将对【${target.name}】执行历史/当前版本对比，是否继续？`,
  }).then(async () => {
    acting.value = true
    try {
      await compareReport([target.id], compareHisId.value!, compareCmpId.value!)
      uni.showToast({ title: '已提交对比', icon: 'none' })
      showCompare.value = false
    } catch (e: any) {
      uni.showToast({ title: e?.message || '对比失败', icon: 'none' })
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

// 新建/编辑表单
const showForm = ref(false)
const saving = ref(false)
const form = ref<Partial<ReportVO> & { fileName?: string }>({})

const ruleTypes = ref<ReportRuleTypeVO[]>([])
const ruleTypeLabels = computed(() => ruleTypes.value.map(item => item.name || `类型${item.id}`))

function ruleTypeIndex(category?: number) {
  const idx = ruleTypes.value.findIndex(item => item.id === category)
  return idx < 0 ? 0 : idx
}

async function openForm(item?: ReportVO) {
  form.value = item
    ? { ...item, fileName: item.file ? getFileNameFromUrl(item.file) : undefined }
    : { status: 0, updated: false }
  showForm.value = true
  if (!ruleTypes.value.length) {
    try {
      ruleTypes.value = await getReportRuleTypeList() || []
    } catch {
      ruleTypes.value = []
    }
  }
}

function handleFormCategory(e: any) {
  form.value.category = ruleTypes.value[Number(e.detail.value)]?.id
}

function handleFormReportDate(e: any) {
  form.value.reportDate = e.detail.value
}

function handleFormUpdated(e: any) {
  form.value.updated = e.detail.value === 'true'
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

/** 表单内上传数据文件：先传文件服务拿 URL */
const uploading = ref(false)

function handleFormFile() {
  if (uploading.value) {
    return
  }
  chooseImportFile(async (filePath, fileName) => {
    uploading.value = true
    try {
      form.value.file = await uploadFile(filePath)
      form.value.fileName = fileName
    } catch (e: any) {
      uni.showToast({ title: e?.message || '文件上传失败', icon: 'none' })
    } finally {
      uploading.value = false
    }
  }, msg => uni.showToast({ title: msg, icon: 'none' }))
}

async function submitForm() {
  const data = form.value
  if (!data.category || !data.name?.trim() || !data.code?.trim()) {
    uni.showToast({ title: '请填写分类、名字和编码', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (data.id) {
      await updateReport(data)
    } else {
      await createReport(data)
    }
    uni.showToast({ title: '保存成功', icon: 'none' })
    showForm.value = false
    pagingRef.value?.reload()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

/** 导入数据（全局：报文数据文件，按编码匹配报表） */
function handleImportClick() {
  chooseImportFile(async (filePath) => {
    uni.showLoading({ title: '导入中...', mask: true })
    try {
      await uploadMultipart('/validation/report/import', filePath)
      uni.hideLoading()
      uni.showToast({ title: '导入成功', icon: 'none' })
      pagingRef.value?.reload()
    } catch (e: any) {
      uni.hideLoading()
      uni.showToast({ title: e?.message || '导入失败', icon: 'none' })
    }
  }, msg => uni.showToast({ title: msg, icon: 'none' }))
}
</script>
