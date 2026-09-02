<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="报送字典" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view class="bg-white px-24rpx pb-16rpx pt-16rpx">
      <wd-search v-model="name" placeholder="搜索字典名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
      <view v-if="canCreate || canImport" class="mt-12rpx flex justify-end gap-16rpx">
        <wd-button v-if="canImport" size="small" plain @click="handleImport">
          导入字典数据
        </wd-button>
        <wd-button v-if="canCreate" size="small" type="primary" @click="openForm()">
          新建字典
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
      empty-view-text="暂无报送字典"
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
            <view class="ml-16rpx flex-shrink-0 text-24rpx text-[#018d71]">
              码值 ›
            </view>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              编码：{{ item.code || '-' }}
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
      <view class="p-24rpx pb-40rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑字典' : '新建字典' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              编码
            </view>
            <wd-input v-model="form.code" placeholder="请输入编码" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              名称
            </view>
            <wd-input v-model="form.name" placeholder="请输入名称" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              备注
            </view>
            <textarea
              v-model="form.description"
              :maxlength="200"
              placeholder="请输入备注"
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
import type { ReportDictVO } from '@/api/validation/reportDict'
import { navigateBackPlus } from '@/utils'
import { chooseImportFile, uploadMultipart } from '@/http/multipart'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportDict,
  deleteReportDict,
  getReportDictPage,
  updateReportDict,
} from '@/api/validation/reportDict'

defineOptions({
  name: 'ValidationReportDict',
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
const canCreate = hasAccessByCodes(['validation:report-dict:create'])
const canUpdate = hasAccessByCodes(['validation:report-dict:update'])
const canDelete = hasAccessByCodes(['validation:report-dict:delete'])
const canImport = hasAccessByCodes(['validation:report-dict:import'])

// 列表查询
const name = ref('')
const list = ref<ReportDictVO[]>([])
const pagingRef = ref<any>()

function handleSearch() {
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReportDictPage({ pageNo, pageSize, name: name.value.trim() || undefined })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportDictVO>()

const actionOptions = computed(() => {
  const actions: { name: string, key: string, color?: string }[] = []
  actions.push({ name: '码值管理', key: 'data' })
  if (canUpdate) {
    actions.push({ name: '编辑', key: 'edit' })
  }
  if (canDelete) {
    actions.push({ name: '删除', key: 'delete', color: '#ee0a24' })
  }
  return actions
})

function openActions(item: ReportDictVO) {
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
    case 'data': {
      uni.navigateTo({ url: `/pages-rpt/validation/report-dict-data?dictId=${target.id}&name=${encodeURIComponent(target.name || '')}` })
      break
    }
    case 'edit': {
      openForm(target)
      break
    }
    case 'delete': {
      dialog.confirm({
        title: '删除字典',
        msg: `确认删除【${target.name}】及其全部码值？`,
      }).then(async () => {
        try {
          await deleteReportDict(target.id!)
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

// 表单
const showForm = ref(false)
const saving = ref(false)
const form = ref<ReportDictVO>({})

function openForm(item?: ReportDictVO) {
  form.value = item ? { ...item } : {}
  showForm.value = true
}

async function submitForm() {
  if (!form.value.name?.trim()) {
    uni.showToast({ title: '请填写名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateReportDict(form.value)
    } else {
      await createReportDict(form.value)
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

/** 导入字典数据文件 */
function handleImport() {
  chooseImportFile(async (filePath) => {
    uni.showLoading({ title: '导入中...', mask: true })
    try {
      await uploadMultipart('/validation/report-dict/import', filePath)
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
