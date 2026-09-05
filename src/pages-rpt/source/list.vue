<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="数据底稿" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="failed" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadData">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 数据版本选择（wd-picker 2.x 为纯弹层组件，需自渲染选中值与触发区） -->
        <view class="m-24rpx mb-0 flex items-center justify-between rounded-16rpx bg-white px-24rpx py-16rpx shadow-sm">
          <text class="text-28rpx text-[#333]">数据版本</text>
          <picker mode="selector" :range="batchLabels" :value="batchIndex(batchId)" @change="handleBatchChange">
            <view class="flex items-center gap-8rpx">
              <text class="text-28rpx" :class="batchId != null ? 'text-[#333]' : 'text-[#bbb]'">
                {{ batchLabelOf(batchId) || '请选择数据版本' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 上传进度 -->
        <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-500">底稿上传进度</text>
            <text class="text-26rpx" :class="progressDone ? 'text-[#52c41a]' : 'text-[#fa8c16]'">
              {{ availability?.uploadedDraftCount ?? 0 }}/{{ availability?.requiredDraftCount ?? 0 }}
            </text>
          </view>
          <wd-progress :percentage="progressPercent" color="#018d71" />
          <!-- 可生成 / 未就绪 报表概览 -->
          <view class="mt-16rpx flex flex-wrap gap-12rpx">
            <wd-tag v-for="item in availability?.ready || []" :key="item.templateId" type="success" plain>
              {{ item.templateName }} 可生成
            </wd-tag>
            <wd-tag v-for="item in availability?.notReady || []" :key="item.templateId" type="warning" plain>
              {{ item.templateName }} 缺底稿
            </wd-tag>
          </view>
        </view>

        <!-- 底稿列表 -->
        <view class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view
            v-for="draft in availability?.draftProgress || []"
            :key="draft.draftDefId"
            class="flex items-center justify-between border-b border-b-[#f7f8f9] px-24rpx py-24rpx last:border-b-0"
          >
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-28rpx text-[#333]">
                {{ draft.draftName }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ draft.uploaded ? '已上传' : '待上传' }}
              </view>
            </view>
            <view class="ml-16rpx flex-shrink-0">
              <wd-button
                v-if="draft.uploaded"
                size="small"
                type="primary"
                plain
                @click="previewDraft(draft)"
              >
                预览
              </wd-button>
              <wd-button
                v-else-if="canUpload"
                size="small"
                type="primary"
                :loading="uploadingDefId === draft.draftDefId"
                :disabled="uploadingDefId != null"
                @click="openUpload(draft)"
              >
                上传
              </wd-button>
            </view>
          </view>
          <view
            v-if="(availability?.draftProgress?.length ?? 0) === 0"
            class="py-60rpx text-center text-26rpx text-[#999]"
          >
            当前版本无需上传底稿
          </view>
        </view>
        <view class="h-40rpx" />
      </template>
    </scroll-view>

    <!-- 上传来源选择 -->
    <wd-action-sheet
      v-model="showUploadSheet"
      :actions="uploadActions"
      cancel-text="取消"
      title="选择上传方式"
      @select="handleUploadAction"
      @close="showUploadSheet = false"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DraftProgressItem } from '@/api/rpt/sourceFile'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getReportDataBatchList } from '@/api/validation/task'
import { getSourceFileAvailability, uploadOneSourceFile } from '@/api/rpt/sourceFile'
import { SOURCE_FILE_ALLOWED_EXT, validateUploadFiles } from '@/utils/uploadValidate'
import type { ChosenFileMeta } from '@/utils/uploadValidate'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'SourceFileList',
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

/** 上传权限（rpt:source-file:create） */
const canUpload = computed(() => hasAccessByCodes(['rpt:source-file:create']))

const loading = ref(true)
const failed = ref(false)
const availability = ref<Awaited<ReturnType<typeof getSourceFileAvailability>> | null>(null)

/** 数据版本选择 */
const batchId = ref<number>()
const batchColumns = ref<{ label: string, value: number }[]>([])
const batchLabels = computed(() => batchColumns.value.map(c => c.label))
function batchIndex(id?: number) {
  return batchColumns.value.findIndex(c => c.value === id)
}
function batchLabelOf(id?: number) {
  return batchColumns.value[batchIndex(id)]?.label
}

const progressPercent = computed(() => {
  const a = availability.value
  if (!a || !a.requiredDraftCount) {
    return 0
  }
  return Math.round(((a.uploadedDraftCount ?? 0) / a.requiredDraftCount) * 100)
})
const progressDone = computed(() =>
  availability.value != null
  && availability.value.uploadedDraftCount >= availability.value.requiredDraftCount
  && availability.value.requiredDraftCount > 0)

/** 加载数据版本列表与底稿可用性 */
async function loadData() {
  loading.value = true
  failed.value = false
  try {
    if (!batchColumns.value.length) {
      const batches = await getReportDataBatchList()
      batchColumns.value = batches.map(batch => ({
        label: `${batch.batchDate || batch.description || '数据版本'}${batch.description && batch.batchDate ? `（${batch.description}）` : ''}`,
        value: batch.id,
      }))
      // 默认选中最早未完成或最新版本：无指定时取列表第一个（后端默认最新）
      if (!batchId.value && batchColumns.value.length) {
        batchId.value = batchColumns.value[0].value
      }
    }
    await loadAvailability()
  } catch (e) {
    console.error('加载底稿数据失败：', e)
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function loadAvailability() {
  availability.value = await getSourceFileAvailability(batchId.value)
}

function handleBatchChange(e: any) {
  const item = batchColumns.value[Number(e.detail.value)]
  if (!item || item.value === batchId.value) {
    return
  }
  batchId.value = item.value
  loadAvailability().catch(() => toast.show('加载可用性失败'))
}

/** 预览已上传底稿 */
function previewDraft(draft: DraftProgressItem) {
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(draft.fileUrl || '')}&fileName=${encodeURIComponent(draft.draftName)}`,
  })
}

/** 上传入口：选择来源 */
const showUploadSheet = ref(false)
const uploadingDefId = ref<number>()
const uploadActions = [
  { name: '拍照上传', type: 'camera' },
  { name: '从相册选择', type: 'album' },
  { name: '选择文件', type: 'file' },
]
const activeDraft = ref<DraftProgressItem | null>(null)

function openUpload(draft: DraftProgressItem) {
  if (!batchId.value) {
    toast.show('请先选择数据版本')
    return
  }
  activeDraft.value = draft
  showUploadSheet.value = true
}

function handleUploadAction({ item }: { item: { type: string } }) {
  showUploadSheet.value = false
  const draft = activeDraft.value
  if (!draft || !batchId.value) {
    return
  }
  if (item.type === 'camera') {
    // 拍照一次一张
    uni.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: res => handleFilesChosen(draft, toChosenFiles(res)),
    })
  } else if (item.type === 'album') {
    // 相册支持多选
    uni.chooseImage({
      count: 9,
      sourceType: ['album'],
      success: res => handleFilesChosen(draft, toChosenFiles(res)),
    })
  } else {
    // #ifdef MP-WEIXIN
    uni.chooseMessageFile({
      count: 9,
      type: 'file',
      success: res => handleFilesChosen(draft, toChosenFiles(res)),
    })
    // #endif
    // #ifdef H5
    uni.chooseFile?.({
      count: 9,
      success: (res: any) => handleFilesChosen(draft, toChosenFiles(res)),
    })
    // #endif
    // #ifdef APP-PLUS
    toast.show('App 端请使用拍照或相册上传')
    // #endif
  }
}

/** 统一提取选择结果（路径 + 文件名 + 大小），优先取 tempFiles（含文件名/大小，H5 blob 路径推不出扩展名） */
function toChosenFiles(res: any): ChosenFileMeta[] {
  const files = res?.tempFiles
  if (Array.isArray(files) && files.length) {
    return files.map((f: any) => ({
      path: f.path ?? f.tempFilePath ?? res.tempFilePaths?.[0],
      name: f.name,
      size: f.size,
    })).filter((f: ChosenFileMeta) => !!f.path)
  }
  return (res?.tempFilePaths ?? []).map((p: string) => ({ path: p }))
}

/** 选择完成：先本地校验（类型/大小），再按数量走单张或批量上传 */
function handleFilesChosen(draft: DraftProgressItem, files: ChosenFileMeta[]) {
  if (!files.length) {
    return
  }
  const { valid, invalidCount, firstError } = validateUploadFiles(files, SOURCE_FILE_ALLOWED_EXT)
  if (invalidCount > 0) {
    toast.show(firstError || `已跳过 ${invalidCount} 个不符合要求的文件`)
  }
  if (!valid.length) {
    return
  }
  if (valid.length === 1) {
    doUpload(draft, valid[0])
  } else {
    doBatchUpload(draft, valid)
  }
}

/** 执行上传（单张）；类型白名单 + 大小上限已在选择后本地校验 */
async function doUpload(draft: DraftProgressItem, file: ChosenFileMeta) {
  if (!file?.path || !batchId.value) {
    return
  }
  uploadingDefId.value = draft.draftDefId
  try {
    const result = await uploadOneSourceFile(draft.draftDefId, batchId.value, file.path)
    if (result.success) {
      toast.show(`「${draft.draftName}」上传成功`)
      availability.value = result.availability ?? availability.value
      loadAvailability().catch(() => {})
    } else {
      toast.show(result.message || '上传失败')
    }
  } catch (e: any) {
    toast.show(e?.message || '上传失败，请重试')
  } finally {
    uploadingDefId.value = undefined
  }
}

/** 批量上传：逐张串行，结束后汇总「成功 N / 失败 M」（复用 uploadingDefId 置灰按钮） */
async function doBatchUpload(draft: DraftProgressItem, files: ChosenFileMeta[]) {
  if (!batchId.value) {
    return
  }
  uploadingDefId.value = draft.draftDefId
  uni.showLoading({ title: `上传中 0/${files.length}`, mask: true })
  let successCount = 0
  let failCount = 0
  try {
    for (let i = 0; i < files.length; i++) {
      uni.showLoading({ title: `上传中 ${i + 1}/${files.length}`, mask: true })
      try {
        const result = await uploadOneSourceFile(draft.draftDefId, batchId.value, files[i].path)
        if (result.success) {
          successCount++
          availability.value = result.availability ?? availability.value
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
  } finally {
    uni.hideLoading()
    uploadingDefId.value = undefined
    loadAvailability().catch(() => {})
    toast.show(failCount === 0 ? `已上传 ${successCount} 个文件` : `成功 ${successCount} 个，失败 ${failCount} 个`)
  }
}

onLoad((query) => {
  if (query?.batchId) {
    batchId.value = Number(query.batchId)
  }
  loadData()
})
</script>
