<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="任务详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!ledger" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadDetail">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 基本信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="flex-1 text-32rpx text-[#333] font-semibold">{{ ledger.companyName || '-' }}</text>
            <view class="ml-16rpx flex flex-shrink-0 items-center gap-12rpx">
              <wd-tag :type="ledger.status === 0 ? 'warning' : 'success'" plain>
                {{ getDictLabel(DICT_TYPE.TAX_LEDGER_STATUS, ledger.status) || '未知' }}
              </wd-tag>
              <view v-if="canEdit" class="p-8rpx" @click="openRemarkEditor">
                <wd-icon name="edit" size="36rpx" color="#018d71" />
              </view>
            </view>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">税种</text>
              <text class="flex-1 text-[#333]">{{ getDictLabel(DICT_TYPE.TAX_TYPE, ledger.taxType) || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">所属期</text>
              <text class="flex-1 text-[#333]">{{ ledger.period || '-' }}（{{ getDictLabel(DICT_TYPE.TAX_FREQ, ledger.freq) || '-' }}）</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">办税人</text>
              <text class="flex-1 text-[#333]">{{ ledger.taxPerson || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">申报截止</text>
              <text class="flex-1" :class="deadlineDanger ? 'text-[#f5222d]' : 'text-[#333]'">
                {{ ledger.deadline || '-' }}{{ deadlineText ? `（${deadlineText}）` : '' }}
              </text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">申报日期</text>
              <text class="flex-1 text-[#333]">{{ ledger.submitDate || '未申报' }}</text>
            </view>
            <view v-if="ledger.taxAmount != null" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">税额</text>
              <text class="flex-1 text-[#333]">{{ ledger.taxAmount }}（已缴 {{ ledger.paidAmount ?? 0 }}）</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">备注</text>
              <text class="flex-1 text-[#333]">{{ ledger.remark || '-' }}</text>
            </view>
          </view>
        </view>

        <!-- 申报材料状态 -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            申报材料
          </view>
          <view
            v-for="item in materialItems"
            :key="item.key"
            class="flex items-center justify-between border-b border-b-[#f7f8f9] px-24rpx py-24rpx last:border-b-0"
          >
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                {{ item.label }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.url ? '已上传' : '未上传' }}
              </view>
            </view>
            <view v-if="item.url" class="ml-16rpx flex-shrink-0">
              <wd-button size="small" type="primary" plain @click="previewFile(item.url, item.label)">
                预览
              </wd-button>
            </view>
          </view>
        </view>

        <!-- 附件列表 -->
        <view class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <text class="text-28rpx text-[#333] font-500">全部附件</text>
            <wd-button
              v-if="canUploadMaterial"
              size="small"
              type="primary"
              :disabled="uploading"
              :loading="uploading"
              @click="showUploadSheet = true"
            >
              上传材料
            </wd-button>
          </view>
          <view
            v-for="material in materials"
            :key="material.id"
            class="flex items-center justify-between border-b border-b-[#f7f8f9] px-24rpx py-24rpx last:border-b-0"
            @click="previewFile(material.fileUrl || '', material.fileName || '附件')"
          >
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-28rpx text-[#333]">
                {{ material.fileName || '附件' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ getDictLabel(DICT_TYPE.TAX_MATER_TYPE, material.materType) || '附件' }}
                · {{ formatDateTime(material.createTime) }}
              </view>
            </view>
            <wd-icon name="arrow-right" size="36rpx" color="#bbb" />
          </view>
          <view v-if="materials.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
            暂无附件
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

    <!-- 材料类型确认 -->
    <wd-popup v-model="showTypeConfirm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-500">
          选择材料类型
        </view>
        <wd-radio-group v-model="materialType" shape="button">
          <wd-radio :value="1">
            申报表
          </wd-radio>
          <wd-radio :value="2">
            完税证明
          </wd-radio>
        </wd-radio-group>
        <wd-button block class="mt-32rpx" type="primary" :loading="uploading" :disabled="uploading" @click="confirmUpload">
          确认上传
        </wd-button>
      </view>
    </wd-popup>
    <!-- 编辑备注 -->
    <wd-popup v-model="showRemark" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-500">
          编辑备注
        </view>
        <textarea
          v-model="remarkDraft"
          :maxlength="200"
          placeholder="请输入备注"
          class="min-h-140rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
        />
        <view class="mt-8rpx text-right text-22rpx text-[#bbb]">
          {{ remarkDraft.length }}/200
        </view>
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :disabled="remarkSaving"
          :loading="remarkSaving"
          @click="saveRemark"
        >
          保存
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TaxLedgerMaterialVO, TaxLedgerVO } from '@/api/tax/ledger'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createTaxLedgerMaterialBatch,
  getTaxLedger,
  getTaxLedgerMaterialListByLedger,
  updateTaxLedger,
} from '@/api/tax/ledger'
import { uploadFile } from '@/api/infra/file'
import { useAccess } from '@/hooks/useAccess'
import { MAX_UPLOAD_SIZE_MB } from '@/utils/uploadValidate'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'TaxLedgerDetail',
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

const ledgerId = ref<number>()
const loading = ref(true)
const ledger = ref<TaxLedgerVO | null>(null)
const materials = ref<TaxLedgerMaterialVO[]>([])

/** 上传材料权限（tax:ledger-material:create） */
const canUploadMaterial = computed(() => hasAccessByCodes(['tax:ledger-material:create']))

/** 编辑备注（tax:ledger:update），状态由附件驱动不可手改 */
const canEdit = computed(() => hasAccessByCodes(['tax:ledger:update']))
const showRemark = ref(false)
const remarkDraft = ref('')
const remarkSaving = ref(false)

function openRemarkEditor() {
  remarkDraft.value = ledger.value?.remark || ''
  showRemark.value = true
}

async function saveRemark() {
  const l = ledger.value
  if (!l || remarkSaving.value) {
    return
  }
  remarkSaving.value = true
  try {
    // 与 PC 编辑表单同口径：只回传可编辑字段，其余由后端保留
    await updateTaxLedger({
      id: l.id,
      companyId: l.companyId,
      taxType: l.taxType,
      period: l.period,
      freq: l.freq,
      status: l.status,
      remark: remarkDraft.value.trim(),
    } as TaxLedgerVO)
    toast.show('备注已保存')
    showRemark.value = false
    loadDetail()
  } catch (e: any) {
    toast.show(e?.message || '保存失败，请重试')
  } finally {
    remarkSaving.value = false
  }
}

/** 申报材料行（申报表 / 完税证明） */
const materialItems = computed(() => {
  const l = ledger.value
  if (!l) {
    return []
  }
  const items: { key: string, label: string, url?: string }[] = []
  if (l.declareRequired !== false) {
    items.push({ key: 'declare', label: '纳税申报表', url: l.declareFileUrl })
  }
  items.push({ key: 'proof', label: '完税证明', url: l.paymentProofFileUrl })
  return items
})

const deadlineDanger = computed(() => {
  if (!ledger.value?.deadline || ledger.value.status !== 0) {
    return false
  }
  return new Date(ledger.value.deadline).getTime() < Date.now()
})
const deadlineText = computed(() => {
  if (!ledger.value?.deadline || ledger.value.status !== 0) {
    return ''
  }
  const days = Math.ceil((new Date(ledger.value.deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) {
    return `已逾期 ${-days} 天`
  }
  if (days <= 3) {
    return days === 0 ? '今天截止' : `${days} 天后截止`
  }
  return ''
})

async function loadDetail() {
  if (!ledgerId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    ledger.value = await getTaxLedger(ledgerId.value)
    getTaxLedgerMaterialListByLedger(ledgerId.value).then((list) => {
      materials.value = list
    }).catch(() => {})
  } catch (e) {
    console.error('加载办税任务失败：', e)
    ledger.value = null
  } finally {
    loading.value = false
  }
}

/** 文件在线预览 */
function previewFile(fileUrl: string, fileName: string) {
  if (!fileUrl) {
    return
  }
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(fileUrl)}&fileName=${encodeURIComponent(fileName)}`,
  })
}

/** 上传：来源选择 → 类型确认 → 上传 → 归档 */
const showUploadSheet = ref(false)
const showTypeConfirm = ref(false)
const uploading = ref(false)
const materialType = ref<1 | 2>(1)
const pendingFilePath = ref('')
const pendingFileName = ref('')
const uploadActions = [
  { name: '拍照上传', type: 'camera' },
  { name: '从相册选择', type: 'album' },
  { name: '选择文件', type: 'file' },
]

function handleUploadAction({ item }: { item: { type: string } }) {
  showUploadSheet.value = false
  if (item.type === 'camera') {
    uni.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: res => handleFileChosen(res.tempFilePaths[0], undefined, res.tempFiles?.[0]?.size),
    })
  } else if (item.type === 'album') {
    uni.chooseImage({
      count: 1,
      sourceType: ['album'],
      success: res => handleFileChosen(res.tempFilePaths[0], undefined, res.tempFiles?.[0]?.size),
    })
  } else {
    // #ifdef MP-WEIXIN
    uni.chooseMessageFile({
      count: 1,
      type: 'file',
      success: res => handleFileChosen(res.tempFiles[0].path, res.tempFiles[0].name, res.tempFiles[0].size),
    })
    // #endif
    // #ifdef H5
    uni.chooseFile?.({
      count: 1,
      success: (res: any) => handleFileChosen(res.tempFilePaths[0], res.tempFiles?.[0]?.name, res.tempFiles?.[0]?.size),
    })
    // #endif
    // #ifdef APP-PLUS
    toast.show('App 端请使用拍照或相册上传')
    // #endif
  }
}

function handleFileChosen(filePath?: string, fileName?: string, fileSize?: number) {
  if (!filePath) {
    return
  }
  // 大小上限本地即时校验（类型白名单在确认上传时校验）
  if (fileSize != null && fileSize > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    toast.show(`文件大小不能超过 ${MAX_UPLOAD_SIZE_MB}MB`)
    return
  }
  pendingFilePath.value = filePath
  pendingFileName.value = fileName || filePath.split('/').pop() || '附件'
  materialType.value = 1
  showTypeConfirm.value = true
}
/** 类型白名单：申报表/完税证明支持 pdf 与图片 */
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png']

async function confirmUpload() {
  const filePath = pendingFilePath.value
  if (!filePath || !ledgerId.value) {
    return
  }
  const ext = pendingFileName.value.split('.').pop()?.toLowerCase() || ''
  if (ext && !ALLOWED_EXT.includes(ext)) {
    toast.show(`仅支持 ${ALLOWED_EXT.join('/')} 格式`)
    return
  }
  uploading.value = true
  try {
    // 先传文件服务器拿 URL，再归档到台账
    const fileUrl = await uploadFile(filePath)
    const count = await createTaxLedgerMaterialBatch({
      ledgerIds: [ledgerId.value],
      materType: materialType.value,
      fileName: pendingFileName.value,
      fileUrl,
    })
    showTypeConfirm.value = false
    toast.show(`已归档 ${count ?? 1} 条附件`)
    loadDetail()
  } catch (e: any) {
    toast.show(e?.message || '上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

onLoad((query) => {
  ledgerId.value = Number(query?.id)
  loadDetail()
})

getDictOptions(DICT_TYPE.TAX_TYPE)
getDictOptions(DICT_TYPE.TAX_FREQ)
getDictOptions(DICT_TYPE.TAX_LEDGER_STATUS)
getDictOptions(DICT_TYPE.TAX_MATER_TYPE)
</script>
