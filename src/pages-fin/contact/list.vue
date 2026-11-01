<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="公司通讯录" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 搜索：搜索字段切换（姓名/分组）+ 关键词 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="mb-12rpx flex items-center gap-16rpx">
        <text class="flex-shrink-0 text-26rpx text-[#666]">搜索字段</text>
        <picker mode="selector" :range="searchFieldLabels" :value="searchFieldIndex" @change="handleSearchFieldChange">
          <view class="flex items-center gap-8rpx">
            <text class="text-26rpx text-[#333]">{{ searchFieldLabels[searchFieldIndex] }}</text>
            <wd-icon name="arrow-down" size="24rpx" color="#999" />
          </view>
        </picker>
      </view>
      <wd-search
        v-model="keyword"
        placeholder="输入关键词搜索"
        hide-cancel
        @search="handleSearch"
        @clear="handleSearch"
      />

      <!-- 操作入口：Excel 导入（清空覆盖 / 追加） -->
      <view v-if="canImport" class="mt-12rpx flex justify-end">
        <wd-button size="small" type="primary" plain @click="onOpenImport">
          导入
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
      empty-view-text="暂无公司通讯录人员"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="goForm(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="flex items-center gap-16rpx">
              <text class="text-28rpx text-[#333] font-500">{{ item.name || '-' }}</text>
              <wd-tag v-if="item.groupName" type="primary" plain>
                {{ item.groupName }}
              </wd-tag>
            </view>
            <text class="ml-16rpx flex-shrink-0 text-24rpx text-[#999]">序号 {{ item.sortNo ?? '-' }}</text>
          </view>
          <view class="text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增人员入口 -->
    <wd-fab
      v-if="canCreate"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="goForm()"
    />

    <!-- 导入弹层：选择模式 + 选择文件 + 上传 -->
    <wd-popup v-model="showImport" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-500">
          导入公司通讯录
        </view>

        <view class="form-item">
          <view class="form-label required">
            导入模式
          </view>
          <picker mode="selector" :range="importModeLabels" :value="importModeIndex" @change="handleImportModeChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ importModeLabels[importModeIndex] }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
          <view class="mt-8rpx text-22rpx text-[#999]">
            {{ importModeHelp }}
          </view>
        </view>

        <view class="form-item">
          <view class="form-label required">
            Excel 文件
          </view>
          <wd-button plain block type="primary" @click="onChooseFile">
            {{ importFileName || '选择文件（.xlsx）' }}
          </wd-button>
          <view class="mt-8rpx text-22rpx text-[#999]">
            请使用「下载模板」提供的版式填写（分组 / 序号 / 姓名）
          </view>
        </view>

        <view class="flex gap-16rpx">
          <wd-button class="flex-1" plain @click="onDownloadTemplate">
            下载模板
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="importing"
            :disabled="!importFilePath"
            @click="onImportSubmit"
          >
            开始导入
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 导入结果弹层 -->
    <wd-popup v-model="showImportResult" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-60vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-center text-32rpx text-[#333] font-500">
          导入结果
        </view>
        <view v-if="importResult" class="mb-24rpx rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx text-[#333]">
          <view>模式：{{ importResult.mode === 1 ? '清空覆盖' : '追加' }}</view>
          <view class="mt-8rpx">
            共 {{ importResult.totalRows }} 行，成功 {{ importResult.successRows }} 行，失败 {{ importResult.errorRows }} 行
          </view>
        </view>
        <view v-if="importResult?.errors?.length" class="mb-16rpx text-26rpx text-[#999]">
          失败明细
        </view>
        <view
          v-for="(error, index) in importResult?.errors || []"
          :key="index"
          class="mb-12rpx rounded-12rpx bg-[#fff1f0] p-16rpx text-24rpx text-[#f5222d]"
        >
          第 {{ error.row }} 行：{{ error.reason }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { CompanyContactImportRespVO, CompanyContactVO } from '@/api/fin/companyContact'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { downloadApiFile } from '@/utils/download'
import { formatDateTime } from '@/utils/date'
import { chooseImportFile } from '@/http/multipart'
import { onMounted, onUnmounted, ref } from 'vue'
import { getCompanyContactPage, importCompanyContact } from '@/api/fin/companyContact'

defineOptions({
  name: 'FinCompanyContactList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { hasAccessByCodes } = useAccess()

const canCreate = hasAccessByCodes(['fin:company-contact:create'])
const canUpdate = hasAccessByCodes(['fin:company-contact:update'])
const canImport = hasAccessByCodes(['fin:company-contact:import'])

function handleBack() {
  navigateBackPlus()
}

// ========== 列表查询 ==========

/** 列表刷新事件名（表单页保存/删除后 uni.$emit 通知） */
const CONTACT_RELOAD_EVENT = 'fin:company-contact:reload'

/** 搜索字段：与后端分页参数一一对应（groupName 模糊 / name 模糊） */
const searchFields = [
  { label: '姓名', key: 'name' },
  { label: '分组', key: 'groupName' },
]
const searchFieldLabels = searchFields.map(item => item.label)
const searchFieldIndex = ref(0)
const keyword = ref('')
const list = ref<CompanyContactVO[]>([])
const pagingRef = ref<any>()

function handleSearchFieldChange(event: { detail: { value: number } }) {
  searchFieldIndex.value = event.detail.value
}

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const key = searchFields[searchFieldIndex.value].key
    const value = keyword.value.trim() || undefined
    const data = await getCompanyContactPage({
      pageNo,
      pageSize,
      name: key === 'name' ? value : undefined,
      groupName: key === 'groupName' ? value : undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 列表表单页保存后刷新（表单页 uni.$emit 通知） */
function reload() {
  pagingRef.value?.reload()
}
onMounted(() => uni.$on(CONTACT_RELOAD_EVENT, reload))
onUnmounted(() => uni.$off(CONTACT_RELOAD_EVENT, reload))

/** 跳新增/编辑表单页（卡片点击进入编辑需 update 权限，无权限不响应） */
function goForm(item?: CompanyContactVO) {
  if (item?.id && !canUpdate) {
    return
  }
  uni.navigateTo({
    url: `/pages-fin/contact/form${item?.id ? `?id=${item.id}` : ''}`,
  })
}

// ========== Excel 导入（清空覆盖 / 追加） ==========

const showImport = ref(false)
const importing = ref(false)
const importFilePath = ref('')
const importFileName = ref('')
const importResult = ref<CompanyContactImportRespVO>()
const showImportResult = ref(false)

/** 导入模式：1 清空覆盖 2 追加（与后端约定一致） */
const importModes = [
  { label: '清空覆盖', value: 1, help: '清空现有通讯录后按 Excel 全量导入' },
  { label: '追加', value: 2, help: '保留现有通讯录，将 Excel 数据追加进来' },
]
const importModeLabels = importModes.map(item => item.label)
const importModeIndex = ref(0)
const importModeHelp = ref(importModes[0].help)

function handleImportModeChange(event: { detail: { value: number } }) {
  importModeIndex.value = event.detail.value
  importModeHelp.value = importModes[event.detail.value].help
}

function onOpenImport() {
  importFilePath.value = ''
  importFileName.value = ''
  importResult.value = undefined
  showImport.value = true
}

/** 选择本地 Excel 文件（H5 / 微信小程序，App 端暂不支持） */
function onChooseFile() {
  chooseImportFile(
    (filePath, fileName) => {
      importFilePath.value = filePath
      importFileName.value = fileName
    },
    msg => toast.show(msg || '选择文件失败'),
  )
}

async function onImportSubmit() {
  if (!importFilePath.value) {
    toast.show('请先选择 Excel 文件')
    return
  }
  importing.value = true
  try {
    const result = await importCompanyContact(importFilePath.value, importModes[importModeIndex.value].value)
    showImport.value = false
    importResult.value = result
    showImportResult.value = true
    reload()
  } catch (error: any) {
    // 业务错误 toast 已由 http 层提示，这里兜底展示 multipart 层的报错信息
    toast.show(error?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

/** 下载通讯录导入模板（与导出版式一致） */
async function onDownloadTemplate() {
  try {
    await downloadApiFile('/fin/company-contact/get-import-template', undefined, '通讯录导入模板.xlsx')
  } catch {
    // 下载失败由 downloadApiFile 内部提示
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
  font-size: 28rpx;
  color: #333;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
