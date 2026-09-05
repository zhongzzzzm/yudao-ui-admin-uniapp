<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="报表表样" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view class="bg-white px-24rpx pb-16rpx pt-16rpx">
      <wd-search v-model="name" placeholder="搜索列名" hide-cancel @search="handleSearch" @clear="handleSearch" />
      <view v-if="canCreate || canImport" class="mt-12rpx flex justify-end gap-16rpx">
        <wd-button v-if="canImport" size="small" plain @click="handleImport">
          Excel导入
        </wd-button>
        <wd-button v-if="canCreate" size="small" type="primary" @click="openForm()">
          新建列定义
        </wd-button>
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="15"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无表样定义"
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
              {{ item.reportName || '-' }} · {{ item.name || '-' }}
            </view>
            <wd-tag v-if="item.isKeyColumn" type="warning" plain class="ml-16rpx flex-shrink-0">
              主键列
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              列序号：{{ item.columnIndex ?? '-' }} · {{ statusLabel(item.status) }}
            </view>
            <view v-if="item.description" class="line-clamp-1">
              {{ item.description }}
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
      :title="activeItem?.name || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新建/编辑表单 -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-80vh overflow-auto p-24rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑列定义' : '新建列定义' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              所属报表<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="selector" :range="reportLabels" @change="handleFormReport">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.reportId ? 'text-[#333]' : 'text-[#bbb]'">
                {{ reportLabels[reportIndex(form.reportId)] || '请选择报表' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              列名
            </view>
            <wd-input v-model="form.name" placeholder="请输入列名" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              列序号<text class="text-[#f5222d]"> *</text>
            </view>
            <wd-input v-model="columnIndexText" type="number" placeholder="请输入列序号" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              是否主键列
            </view>
            <radio-group class="flex gap-40rpx" @change="handleFormKeyColumn">
              <label class="flex items-center gap-8rpx text-26rpx">
                <radio :checked="form.isKeyColumn === 1" value="1" color="#018d71" />
                是
              </label>
              <label class="flex items-center gap-8rpx text-26rpx">
                <radio :checked="form.isKeyColumn === 0" value="0" color="#018d71" />
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
        <wd-button block class="mt-24rpx" type="primary" :disabled="saving" :loading="saving" @click="submitForm">
          保存
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportDefinitionVO } from '@/api/validation/reportDefinition'
import type { ReportVO } from '@/api/validation/report'
import { navigateBackPlus } from '@/utils'
import { chooseImportFile, uploadMultipart } from '@/http/multipart'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportDefinition,
  deleteReportDefinition,
  getReportDefinitionPage,
  updateReportDefinition,
} from '@/api/validation/reportDefinition'
import { getReportList } from '@/api/validation/report'

defineOptions({
  name: 'ValidationReportDefinition',
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
const canCreate = hasAccessByCodes(['validation:report-definition:create'])
const canUpdate = hasAccessByCodes(['validation:report-definition:update'])
const canDelete = hasAccessByCodes(['validation:report-definition:delete'])
const canImport = hasAccessByCodes(['validation:report-definition:import'])

const statusOptions = getDictOptions(DICT_TYPE.COMMON_STATUS)

function statusLabel(status?: number) {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.COMMON_STATUS, status) || '未知'
}

// 列表查询
const name = ref('')
const list = ref<ReportDefinitionVO[]>([])
const pagingRef = ref<any>()
/** 报表管理「查看定义」跳入时按报表过滤 */
const filterReportId = ref<number>()

onLoad((query) => {
  if (query?.reportId) {
    filterReportId.value = Number(query.reportId)
  }
})

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportDefinitionPage({ pageNo, pageSize, name: name.value.trim() || undefined, reportId: filterReportId.value })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportDefinitionVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportDefinitionVO) {
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
  if (item.key === 'edit') {
    openForm(target)
  } else if (item.key === 'delete') {
    dialog.confirm({
      title: '删除列定义',
      msg: `确认删除【${target.reportName || ''} ${target.name || ''}】？`,
    }).then(async () => {
      try {
        await deleteReportDefinition(target.id)
        uni.showToast({ title: '已删除', icon: 'none' })
        pagingRef.value?.reload()
      } catch (e: any) {
        uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
      }
    }).catch(() => {})
  }
}

// 表单
const showForm = ref(false)
const saving = ref(false)
const form = ref<Partial<ReportDefinitionVO>>({})
const columnIndexText = ref('')

const reports = ref<ReportVO[]>([])
const reportLabels = computed(() => reports.value.map(item => item.name || `报表${item.id}`))

function reportIndex(reportId?: number) {
  const idx = reports.value.findIndex(item => item.id === reportId)
  return idx < 0 ? 0 : idx
}

async function openForm(item?: ReportDefinitionVO) {
  form.value = item ? { ...item } : { status: 0, isKeyColumn: 0 }
  columnIndexText.value = item?.columnIndex != null ? String(item.columnIndex) : ''
  showForm.value = true
  if (!reports.value.length) {
    try {
      reports.value = await getReportList() || []
    } catch {
      reports.value = []
    }
  }
}

function handleFormReport(e: any) {
  form.value.reportId = reports.value[Number(e.detail.value)]?.id
}

function handleFormKeyColumn(e: any) {
  form.value.isKeyColumn = Number(e.detail.value)
}

function handleFormStatus(e: any) {
  form.value.status = Number(e.detail.value)
}

async function submitForm() {
  const columnIndex = Number(columnIndexText.value)
  if (!form.value.reportId) {
    uni.showToast({ title: '请选择所属报表', icon: 'none' })
    return
  }
  if (!Number.isInteger(columnIndex) || columnIndex < 0) {
    uni.showToast({ title: '请填写正确的列序号', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const data = { ...form.value, columnIndex }
    if (data.id) {
      await updateReportDefinition(data)
    } else {
      await createReportDefinition(data)
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

/** Excel 导入表样 */
function handleImport() {
  chooseImportFile(async (filePath) => {
    uni.showLoading({ title: '导入中...', mask: true })
    try {
      await uploadMultipart('/validation/report-definition/import', filePath)
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
