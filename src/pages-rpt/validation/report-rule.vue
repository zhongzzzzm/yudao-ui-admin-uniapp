<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="校验规则" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view class="bg-white px-24rpx pb-16rpx pt-16rpx">
      <wd-search v-model="ruleCode" placeholder="搜索规则编号" hide-cancel @search="handleSearch" @clear="handleSearch" />
      <view v-if="canCreate || canImport" class="mt-12rpx flex justify-end gap-16rpx">
        <wd-button v-if="canImport" size="small" plain @click="showImport = true">
          Excel导入
        </wd-button>
        <wd-button v-if="canCreate" size="small" type="primary" @click="goForm()">
          新建规则
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
      empty-view-text="暂无校验规则"
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
              {{ item.ruleCode || '-' }}
              <text v-if="item.version" class="ml-8rpx text-24rpx text-[#999]">v{{ item.version }}</text>
            </view>
            <wd-tag :type="item.status === 0 ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              类型：{{ item.typeName || '-' }} · 报表：{{ item.reportName || '-' }}
            </view>
            <view class="line-clamp-2">
              {{ item.ruleDescription || '-' }}
            </view>
            <view class="line-clamp-1">
              校验标识：{{ getDictLabel(DICT_TYPE.VALIDATION_FLAG, item.validationFlag) || '-' }}
              <text v-if="item.involvedTableNames" class="ml-8rpx">· 涉及：{{ item.involvedTableNames }}</text>
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
      :title="activeItem?.ruleCode || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

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

    <!-- 导入：选类型 + 选文件 -->
    <wd-popup v-model="showImport" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-500">
          Excel 导入规则
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          规则类型<text class="text-[#f5222d]"> *</text>
        </view>
        <picker mode="selector" :range="typeLabels" @change="handleImportType">
          <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="importTypeId ? 'text-[#333]' : 'text-[#bbb]'">
            {{ typeLabels[typeIndex(importTypeId)] || '请选择规则类型' }}
          </view>
        </picker>
        <view
          class="mt-20rpx min-h-72rpx flex items-center justify-between rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx"
          @click="handleImportFile"
        >
          <view class="line-clamp-1 flex-1 text-26rpx" :class="importFileName ? 'text-[#333]' : 'text-[#bbb]'">
            {{ importFileName || '点击选择 Excel 文件' }}
          </view>
          <wd-icon v-if="importing" name="loading" size="32rpx" color="#018d71" />
        </view>
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :disabled="!importTypeId || !importFilePath || importing"
          :loading="importing"
          @click="submitImport"
        >
          开始导入
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ReportRuleVO } from '@/api/validation/reportRule'
import type { ReportDataBatchVO } from '@/api/validation/task'
import type { ReportRuleTypeVO } from '@/api/validation/reportRuleType'
import { navigateBackPlus } from '@/utils'
import { chooseImportFile, uploadMultipart } from '@/http/multipart'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  deleteReportRule,
  getReportRulePage,
  testReportRule,
  validateReportRule,
} from '@/api/validation/reportRule'
import { getReportDataBatchList } from '@/api/validation/task'
import { getReportRuleTypeList } from '@/api/validation/reportRuleType'

defineOptions({
  name: 'ValidationReportRuleList',
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
const canCreate = hasAccessByCodes(['validation:report-rule:create'])
const canUpdate = hasAccessByCodes(['validation:report-rule:update'])
const canDelete = hasAccessByCodes(['validation:report-rule:delete'])
const canImport = hasAccessByCodes(['validation:report-rule:import'])
const canValidate = hasAccessByCodes(['validation:report-rule:validation'])
const canTest = hasAccessByCodes(['validation:report-rule:test'])

function statusLabel(status?: number) {
  if (status == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.COMMON_STATUS, status) || '未知'
}

// 列表查询（支持从规则类型页跳入按类型过滤）
const ruleCode = ref('')
const filterTypeId = ref<number>()
const list = ref<ReportRuleVO[]>([])
const pagingRef = ref<any>()

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportRulePage({
      pageNo,
      pageSize,
      ruleCode: ruleCode.value.trim() || undefined,
      typeId: filterTypeId.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function goForm(item?: ReportRuleVO) {
  uni.navigateTo({ url: `/pages-rpt/validation/report-rule-form${item ? `?id=${item.id}` : ''}` })
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportRuleVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canTest) {
    actions.push({ name: '测试', key: 'test' })
  }
  if (canValidate) {
    actions.push({ name: '校验', key: 'validate' })
  }
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportRuleVO) {
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
      goForm(target)
      break
    }
    case 'test': {
      handleTest(target)
      break
    }
    case 'validate': {
      openValidate(target)
      break
    }
    case 'delete': {
      dialog.confirm({
        title: '删除规则',
        msg: `确认删除【${target.ruleCode}】？`,
      }).then(async () => {
        try {
          await deleteReportRule(target.id)
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

/** 规则测试：展示通过与否及错误信息 */
function handleTest(target: ReportRuleVO) {
  uni.showLoading({ title: '测试中...', mask: true })
  testReportRule(target.id).then((result) => {
    uni.hideLoading()
    dialog.alert({
      title: result.passed ? '测试通过' : '测试未通过',
      msg: result.message || (result.passed ? '规则执行通过' : '规则执行失败'),
    }).catch(() => {})
  }).catch((e: any) => {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '测试失败', icon: 'none' })
  })
}

// 校验
const acting = ref(false)
const showValidate = ref(false)
const validateBatchId = ref<number>()
const validateTarget = ref<ReportRuleVO>()
const batches = ref<ReportDataBatchVO[]>([])
const batchLabels = computed(() =>
  batches.value.map(b => b.batchDate || `版本${b.id}`),
)

function batchIndex(batchId?: number) {
  const idx = batches.value.findIndex(b => b.id === batchId)
  return idx < 0 ? 0 : idx
}

function openValidate(item: ReportRuleVO) {
  validateTarget.value = item
  validateBatchId.value = undefined
  getReportDataBatchList().then((data) => {
    batches.value = data || []
  }).catch(() => {
    batches.value = []
  })
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
    msg: `将按所选数据版本执行规则【${target.ruleCode}】，是否继续？`,
  }).then(async () => {
    acting.value = true
    try {
      await validateReportRule([target.id], validateBatchId.value!)
      uni.showToast({ title: '已提交校验', icon: 'none' })
      showValidate.value = false
    } catch (e: any) {
      uni.showToast({ title: e?.message || '校验失败', icon: 'none' })
    } finally {
      acting.value = false
    }
  }).catch(() => {})
}

// 导入
const showImport = ref(false)
const importing = ref(false)
const importTypeId = ref<number>()
const importFilePath = ref('')
const importFileName = ref('')
const ruleTypes = ref<ReportRuleTypeVO[]>([])
const typeLabels = computed(() => ruleTypes.value.map(item => item.name || `类型${item.id}`))

function typeIndex(typeId?: number) {
  const idx = ruleTypes.value.findIndex(item => item.id === typeId)
  return idx < 0 ? 0 : idx
}

function handleImportType(e: any) {
  importTypeId.value = ruleTypes.value[Number(e.detail.value)]?.id
}

function handleImportFile() {
  if (importing.value) {
    return
  }
  chooseImportFile((filePath, fileName) => {
    importFilePath.value = filePath
    importFileName.value = fileName
  }, msg => uni.showToast({ title: msg, icon: 'none' }))
}

function submitImport() {
  if (!importTypeId.value || !importFilePath.value) {
    return
  }
  importing.value = true
  uploadMultipart('/validation/report-rule/import', importFilePath.value, { typeId: String(importTypeId.value) })
    .then(() => {
      uni.showToast({ title: '导入成功', icon: 'none' })
      showImport.value = false
      importFilePath.value = ''
      importFileName.value = ''
      pagingRef.value?.reload()
    })
    .catch((e: any) => {
      uni.showToast({ title: e?.message || '导入失败', icon: 'none' })
    })
    .finally(() => {
      importing.value = false
    })
}

function loadTypes() {
  if (!ruleTypes.value.length) {
    getReportRuleTypeList().then((data) => {
      ruleTypes.value = data || []
    }).catch(() => {
      ruleTypes.value = []
    })
  }
}

onLoad((query) => {
  if (query?.typeId) {
    filterTypeId.value = Number(query.typeId)
  }
  loadTypes()
})
</script>
