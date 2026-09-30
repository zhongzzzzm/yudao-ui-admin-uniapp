<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="报表数据" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 筛选：报表 / 数据版本 / 行号 -->
    <view class="flex flex-wrap items-center gap-16rpx bg-white px-24rpx pb-16rpx pt-16rpx">
      <picker mode="selector" :range="['全部报表', ...reportLabels]" @change="handleFilterReport">
        <view class="rounded-full bg-[#f5f6f8] px-24rpx py-10rpx text-24rpx" :class="filterReportId ? 'text-[#018d71]' : 'text-[#666]'">
          {{ filterReportId ? reportLabels[reportIndex(filterReportId)] : '全部报表' }} ▾
        </view>
      </picker>
      <picker mode="selector" :range="['全部版本', ...batchLabels]" @change="handleFilterBatch">
        <view class="rounded-full bg-[#f5f6f8] px-24rpx py-10rpx text-24rpx" :class="filterBatchId ? 'text-[#018d71]' : 'text-[#666]'">
          {{ filterBatchId ? batchLabels[batchIndex(filterBatchId)] : '全部版本' }} ▾
        </view>
      </picker>
      <input
        v-model="filterRowIndexText"
        type="number"
        placeholder="行号"
        class="w-140rpx rounded-full bg-[#f5f6f8] px-24rpx py-10rpx text-24rpx"
        @confirm="handleSearch"
      >
      <wd-button size="small" plain @click="handleSearch">
        筛选
      </wd-button>
      <view class="flex-1" />
      <wd-button v-if="canCreate" size="small" type="primary" @click="openForm()">
        新增
      </wd-button>
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
      empty-view-text="暂无报表数据"
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
              {{ item.reportName || '-' }}
            </view>
            <wd-tag plain class="ml-16rpx flex-shrink-0">
              行 {{ item.rowIndex ?? '-' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              数据版本：{{ item.batchDate || item.batchId || '-' }}
            </view>
            <view class="line-clamp-2 break-all rounded-8rpx bg-[#f7f8f9] p-12rpx text-24rpx text-[#555]">
              {{ valuePreview(item.value) }}
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
      :title="`行 ${activeItem?.rowIndex ?? ''}`"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新增/编辑表单 -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-80vh overflow-auto p-24rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑数据行' : '新增数据行' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              报表<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="selector" :range="reportLabels" @change="handleFormReport">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.reportId ? 'text-[#333]' : 'text-[#bbb]'">
                {{ reportLabels[reportIndex(form.reportId)] || '请选择报表' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              数据版本<text class="text-[#f5222d]"> *</text>
            </view>
            <picker mode="selector" :range="batchLabels" @change="handleFormBatch">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.batchId ? 'text-[#333]' : 'text-[#bbb]'">
                {{ batchLabels[batchIndex(form.batchId)] || '请选择数据版本' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              行序号<text class="text-[#f5222d]"> *</text>
            </view>
            <wd-input v-model="rowIndexText" type="number" placeholder="请输入行序号" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              行数据（JSON）
            </view>
            <textarea
              v-model="valueText"
              :maxlength="20000"
              placeholder="请输入行数据 JSON，如 {&quot;列名&quot;: &quot;值&quot;, ...}"
              class="min-h-240rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
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
import type { ReportDataVO } from '@/api/validation/reportData'
import type { ReportVO } from '@/api/validation/report'
import type { ReportDataBatchVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportData,
  deleteReportData,
  getReportDataPage,
  updateReportData,
} from '@/api/validation/reportData'
import { getReportList } from '@/api/validation/report'
import { getReportDataBatchList } from '@/api/validation/task'

defineOptions({
  name: 'ValidationReportDataList',
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
const canCreate = hasAccessByCodes(['validation:report-data:create'])
const canUpdate = hasAccessByCodes(['validation:report-data:update'])
const canDelete = hasAccessByCodes(['validation:report-data:delete'])

function valuePreview(value?: string) {
  if (!value) {
    return '-'
  }
  return value.length > 80 ? `${value.slice(0, 80)}...` : value
}

// 下拉数据源
const reports = ref<ReportVO[]>([])
const batches = ref<ReportDataBatchVO[]>([])
const reportLabels = computed(() => reports.value.map(item => item.name || `报表${item.id}`))
const batchLabels = computed(() =>
  batches.value.map(b => b.batchDate || `版本${b.id}`),
)

function reportIndex(reportId?: number) {
  const idx = reports.value.findIndex(item => item.id === reportId)
  return idx < 0 ? 0 : idx
}

function batchIndex(batchId?: number) {
  const idx = batches.value.findIndex(b => b.id === batchId)
  return idx < 0 ? 0 : idx
}

function loadPickers() {
  if (!reports.value.length) {
    getReportList().then(data => reports.value = data || []).catch(() => reports.value = [])
  }
  if (!batches.value.length) {
    getReportDataBatchList().then(data => batches.value = data || []).catch(() => batches.value = [])
  }
}

// 筛选
const filterReportId = ref<number>()
const filterBatchId = ref<number>()
const filterRowIndexText = ref('')
const list = ref<ReportDataVO[]>([])
const pagingRef = ref<any>()

function handleFilterReport(e: any) {
  filterReportId.value = Number(e.detail.value) > 0 ? reports.value[Number(e.detail.value) - 1]?.id : undefined
}

function handleFilterBatch(e: any) {
  filterBatchId.value = Number(e.detail.value) > 0 ? batches.value[Number(e.detail.value) - 1]?.id : undefined
}

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  const rowIndex = Number(filterRowIndexText.value)
  try {
    const data = await getReportDataPage({
      pageNo,
      pageSize,
      reportId: filterReportId.value,
      batchId: filterBatchId.value,
      rowIndex: filterRowIndexText.value !== '' && Number.isInteger(rowIndex) ? rowIndex : undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportDataVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  // 查看明细（与 PC 端 validation:report-data:view 对应）
  actions.push({ name: '查看明细', key: 'view' })
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportDataVO) {
  activeItem.value = item
  showActions.value = true
}

function handleAction({ item }: { item: { key: string } }) {
  showActions.value = false
  const target = activeItem.value
  if (!target) {
    return
  }
  if (item.key === 'view') {
    // get 接口无联表字段，把列表行的报表名/数据日期带上用于详情展示
    const name = encodeURIComponent(target.reportName || '')
    const date = encodeURIComponent(target.batchDate || '')
    uni.navigateTo({ url: `/pages-rpt/validation/report-data?id=${target.id}&reportName=${name}&batchDate=${date}` })
  } else if (item.key === 'edit') {
    openForm(target)
  } else if (item.key === 'delete') {
    dialog.confirm({
      title: '删除数据行',
      msg: `确认删除【${target.reportName || '报表'}】第 ${target.rowIndex ?? '-'} 行？`,
    }).then(async () => {
      try {
        await deleteReportData(target.id)
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
const form = ref<Partial<ReportDataVO>>({})
const rowIndexText = ref('')
const valueText = ref('')

function openForm(item?: ReportDataVO) {
  form.value = item ? { ...item } : {}
  rowIndexText.value = item?.rowIndex != null ? String(item.rowIndex) : ''
  valueText.value = item?.value || ''
  loadPickers()
  showForm.value = true
}

function handleFormReport(e: any) {
  form.value.reportId = reports.value[Number(e.detail.value)]?.id
}

function handleFormBatch(e: any) {
  form.value.batchId = batches.value[Number(e.detail.value)]?.id
}

async function submitForm() {
  const rowIndex = Number(rowIndexText.value)
  if (!form.value.reportId || !form.value.batchId) {
    uni.showToast({ title: '请选择报表和数据版本', icon: 'none' })
    return
  }
  if (!Number.isInteger(rowIndex) || rowIndex < 0) {
    uni.showToast({ title: '请填写正确的行序号', icon: 'none' })
    return
  }
  if (valueText.value.trim()) {
    try {
      JSON.parse(valueText.value)
    } catch {
      uni.showToast({ title: '行数据不是合法 JSON', icon: 'none' })
      return
    }
  }
  saving.value = true
  try {
    const data = { ...form.value, rowIndex, value: valueText.value }
    if (data.id) {
      await updateReportData(data)
    } else {
      await createReportData(data)
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

onLoad(() => {
  loadPickers()
})
</script>
