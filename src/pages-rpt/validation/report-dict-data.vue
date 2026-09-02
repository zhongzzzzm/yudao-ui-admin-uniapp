<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="dictName || '码值管理'" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <view v-if="canCreate" class="flex justify-end bg-white px-24rpx pb-16rpx pt-16rpx">
      <wd-button size="small" type="primary" @click="openForm()">
        新增码值
      </wd-button>
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex justify-center py-80rpx">
        <wd-loading color="#018d71" />
      </view>
      <view v-else-if="list.length === 0" class="py-120rpx text-center text-26rpx text-[#999]">
        暂无码值
      </view>
      <view v-else class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openActions(item)"
        >
          <view class="mb-8rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.name || '-' }}
            </view>
            <wd-tag :type="item.status ? 'success' : 'info'" plain class="ml-16rpx flex-shrink-0">
              {{ item.status ? '填报' : '不填报' }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#777] space-y-4rpx">
            <view class="line-clamp-1">
              字典值：{{ item.value || '-' }}
              <text v-if="item.parentValue" class="ml-8rpx">· 上级：{{ item.parentValue }}</text>
            </view>
            <view v-if="item.startDate || item.endDate" class="line-clamp-1">
              有效期：{{ item.startDate || '-' }} ~ {{ item.endDate || '-' }}
            </view>
            <view v-if="item.description" class="line-clamp-1">
              {{ item.description }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 卡片操作面板 -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionOptions"
      cancel-text="取消"
      :title="activeItem?.name || '操作'"
      @select="handleAction"
      @close="showActions = false"
    />

    <!-- 新增/编辑表单 -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-80vh overflow-auto p-24rpx">
        <view class="mb-20rpx text-32rpx text-[#333] font-500">
          {{ form.id ? '编辑码值' : '新增码值' }}
        </view>
        <view class="space-y-20rpx">
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              字典名称
            </view>
            <wd-input v-model="form.name" placeholder="请输入字典名称" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              字典值
            </view>
            <wd-input v-model="form.value" placeholder="请输入字典值" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              上级码值
            </view>
            <wd-input v-model="form.parentValue" placeholder="请输入上级码值（选填）" no-border custom-class="bg-[#f7f8f9] rounded-12rpx" />
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              生效日期
            </view>
            <picker mode="date" :value="form.startDate" @change="e => form.startDate = e.detail.value">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.startDate ? 'text-[#333]' : 'text-[#bbb]'">
                {{ form.startDate || '请选择生效日期' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              失效日期
            </view>
            <picker mode="date" :value="form.endDate" @change="e => form.endDate = e.detail.value">
              <view class="min-h-72rpx rounded-12rpx bg-[#f7f8f9] px-20rpx py-16rpx text-26rpx" :class="form.endDate ? 'text-[#333]' : 'text-[#bbb]'">
                {{ form.endDate || '请选择失效日期' }}
              </view>
            </picker>
          </view>
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              备注
            </view>
            <textarea
              v-model="form.description"
              :maxlength="200"
              placeholder="请输入备注"
              class="min-h-100rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
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
import type { ReportDictDataVO } from '@/api/validation/reportDict'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import {
  createReportDictData,
  deleteReportDictData,
  getReportDictDataListByDictId,
  updateReportDictData,
} from '@/api/validation/reportDict'

defineOptions({
  name: 'ValidationReportDictData',
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

const dictId = ref<number>()
const dictName = ref('')
const loading = ref(false)
const list = ref<ReportDictDataVO[]>([])

async function load() {
  if (!dictId.value) {
    return
  }
  loading.value = true
  try {
    list.value = await getReportDictDataListByDictId(dictId.value) || []
  } catch {
    list.value = []
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 卡片操作
const showActions = ref(false)
const activeItem = ref<ReportDictDataVO>()

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

function openActions(item: ReportDictDataVO) {
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
      title: '删除码值',
      msg: `确认删除【${target.name || target.value}】？`,
    }).then(async () => {
      try {
        await deleteReportDictData(target.id!)
        uni.showToast({ title: '已删除', icon: 'none' })
        load()
      } catch (e: any) {
        uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
      }
    }).catch(() => {})
  }
}

// 表单
const showForm = ref(false)
const saving = ref(false)
const form = ref<ReportDictDataVO>({})

function openForm(item?: ReportDictDataVO) {
  form.value = item ? { ...item } : { dictId: dictId.value }
  showForm.value = true
}

async function submitForm() {
  if (!form.value.value?.trim()) {
    uni.showToast({ title: '请填写字典值', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateReportDictData(form.value)
    } else {
      await createReportDictData(form.value)
    }
    uni.showToast({ title: '保存成功', icon: 'none' })
    showForm.value = false
    load()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  dictId.value = query?.dictId ? Number(query.dictId) : undefined
  dictName.value = query?.name ? decodeURIComponent(query.name) : ''
  load()
})
</script>
