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
        <!-- 办理引导条：当前用户是该任务办理节点处理人 -->
        <view v-if="canSubmitHandle" class="mx-24rpx mt-24rpx flex items-center gap-16rpx rounded-16rpx bg-[#e6f7f1] p-20rpx">
          <wd-icon name="warning-circle" size="36rpx" color="#018d71" />
          <view class="flex-1 text-24rpx text-[#018d71]">
            该任务等待您办理：请填写申报信息、上传申报表/完税证明后提交办理（提交即办结，不允许驳回）
          </view>
        </view>
        <!-- 基本信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="flex-1 text-32rpx text-[#333] font-semibold">{{ ledger.companyName || '-' }}</text>
            <view class="ml-16rpx flex flex-shrink-0 items-center gap-12rpx">
              <wd-tag :type="statusTagType(ledger.status)" plain>
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
        <!-- 办理操作栏占位，避免内容被遮挡 -->
        <view :class="canSubmitHandle ? 'h-200rpx' : 'h-40rpx'" />
        <!-- 查看办理流程入口（两态均可看办理记录） -->
        <view
          class="mx-24rpx mb-24rpx flex items-center justify-between rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openFlow"
        >
          <view>
            <view class="text-28rpx text-[#333]">
              查看流程
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              查看办理流程与办理记录
            </view>
          </view>
          <wd-icon name="arrow-right" size="40rpx" color="#bbb" />
        </view>
      </template>
    </scroll-view>

    <!-- 办理中：底部操作栏（填报信息 + 提交办理） -->
    <view
      v-if="canSubmitHandle"
      class="absolute inset-x-0 bottom-0 z-10 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <view class="flex gap-20rpx">
        <wd-button plain block type="primary" :disabled="submitting" @click="openFormEditor">
          填报申报信息
        </wd-button>
        <wd-button block type="primary" :loading="submitting" :disabled="submitting" @click="openSubmitDialog">
          提交办理
        </wd-button>
      </view>
    </view>

    <!-- 查看流程弹层 -->
    <wd-popup
      v-model="showFlow"
      position="bottom"
      custom-class="rounded-t-24rpx"
      closable
      safe-area-inset-bottom
      @close="showFlow = false"
    >
      <view class="p-24rpx pb-40rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-500">
          查看流程
        </view>
        <scroll-view class="max-h-60vh" scroll-y>
          <fg-bpm-flow :items="flowItems" :loading="flowLoading" />
        </scroll-view>
      </view>
    </wd-popup>

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
    <!-- 填报申报信息（走引擎 save-fields：字段权限校验 + old→new 留痕） -->
    <wd-popup v-model="showForm" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-500">
          填报申报信息
        </view>
        <view class="space-y-20rpx">
          <wd-datetime-picker v-model="formDateTs" type="date" label="申报日期" />
          <wd-input v-model="formDraft.taxAmount" label="应纳税额（元）" placeholder="请输入金额" type="digit" />
          <wd-input v-model="formDraft.paidAmount" label="已缴金额（元）" placeholder="请输入金额" type="digit" />
          <view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              备注
            </view>
            <textarea
              v-model="formDraft.remark"
              :maxlength="200"
              placeholder="请输入备注"
              class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
            />
          </view>
        </view>
        <wd-button
          block
          class="mt-32rpx"
          type="primary"
          :loading="formSaving"
          :disabled="formSaving"
          @click="saveForm"
        >
          保存
        </wd-button>
      </view>
    </wd-popup>

    <!-- 提交办理（轻确认 + 办理说明选填；提交即办结，不允许驳回） -->
    <wd-popup v-model="showSubmit" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-12rpx text-32rpx text-[#333] font-500">
          提交办理
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          提交后任务即办理完成并办结，单据将锁定；办理任务不允许驳回。
        </view>
        <textarea
          v-model="submitComment"
          :maxlength="200"
          placeholder="办理说明（选填）"
          class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
        />
        <wd-button
          block
          class="mt-32rpx"
          type="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="confirmSubmit"
        >
          确认提交
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
import type { FgBpmFlowItem } from '@/components/fg-bpm-flow/fg-bpm-flow.vue'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { saveBpmTaskFields, submitBpmTaskHandle } from '@/api/bpm/task'
import { useUserStore } from '@/store'
import {
  createTaxLedgerMaterialBatch,
  getTaxLedger,
  getTaxLedgerMaterialListByLedger,
  getTaxLedgerReviewFlow,
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
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const ledgerId = ref<number>()
const loading = ref(true)
const ledger = ref<TaxLedgerVO | null>(null)
const materials = ref<TaxLedgerMaterialVO[]>([])

/** 当前登录用户 id（办理人匹配用） */
const { userInfo } = storeToRefs(useUserStore())

/** 办理中任务：当前用户是该台账进行中办理实例的待办理处理人时记录 taskId */
const pendingTaskId = ref<number>()
const canSubmitHandle = computed(() => pendingTaskId.value != null)

/** 上传材料权限（tax:ledger-material:create） */
const canUploadMaterial = computed(() => hasAccessByCodes(['tax:ledger-material:create']))

/** 编辑备注（tax:ledger:update），状态由附件与办理流驱动不可手改 */
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

/** 状态标签色：0待办理=要处理，1已办理=完结（与列表页同口径） */
function statusTagType(status?: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 0) {
    return 'warning'
  }
  return 'success'
}

// ========== 办理（当前用户为办理节点处理人时出现） ==========

/** 刷新办理信息：定位进行中实例上属于当前用户的待办理任务 */
async function refreshHandleInfo() {
  pendingTaskId.value = undefined
  if (!ledgerId.value) {
    return
  }
  try {
    const flows = await getTaxLedgerReviewFlow(ledgerId.value)
    const running = (flows ?? []).find(f => f.status === 1 && f.currentNodeType === 2)
    if (!running || !running.tasks) {
      return
    }
    const myTask = running.tasks.find(t =>
      t.status === 0
      && t.assigneeUserId === userInfo.value?.userId
      && t.round === running.round
      && t.nodeKey === running.currentNodeKey,
    )
    if (myTask?.id) {
      pendingTaskId.value = myTask.id
    }
  } catch {
    // 流程信息获取失败不影响详情浏览，仅隐藏办理入口
  }
}

/** 日期 → yyyy-MM-dd（本地时区） */
function formatDateTs(ts: number): string {
  const d = new Date(ts)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** 填报申报信息（引擎 save-fields：字段权限校验 + old→new 留痕，与直改台账不同） */
const showForm = ref(false)
const formSaving = ref(false)
const formDateTs = ref<number>(Date.now())
const formDraft = ref({ taxAmount: '', paidAmount: '', remark: '' })

function openFormEditor() {
  const l = ledger.value
  if (!l) {
    return
  }
  formDateTs.value = l.submitDate ? new Date(l.submitDate).getTime() : Date.now()
  formDraft.value = {
    taxAmount: l.taxAmount == null ? '' : String(l.taxAmount),
    paidAmount: l.paidAmount == null ? '' : String(l.paidAmount),
    remark: l.remark || '',
  }
  showForm.value = true
}

async function saveForm() {
  if (!pendingTaskId.value || formSaving.value) {
    return
  }
  const { taxAmount, paidAmount, remark } = formDraft.value
  for (const [label, v] of [['应纳税额', taxAmount], ['已缴金额', paidAmount]] as const) {
    if (v !== '' && Number.isNaN(Number(v))) {
      toast.show(`${label}格式不正确，请输入数字`)
      return
    }
  }
  formSaving.value = true
  try {
    await saveBpmTaskFields(pendingTaskId.value, {
      paidAmount,
      remark,
      submitDate: formatDateTs(formDateTs.value),
      taxAmount,
    })
    toast.show('申报信息已保存')
    showForm.value = false
    loadDetail()
  } catch (e: any) {
    toast.show(e?.message || '保存失败，请重试')
  } finally {
    formSaving.value = false
  }
}

/** 提交办理（提交即办结；引擎侧必填兜底 + 抢占互斥） */
const showSubmit = ref(false)
const submitComment = ref('')
const submitting = ref(false)

function openSubmitDialog() {
  submitComment.value = ''
  showSubmit.value = true
}

async function confirmSubmit() {
  if (!pendingTaskId.value || submitting.value) {
    return
  }
  submitting.value = true
  try {
    await submitBpmTaskHandle(pendingTaskId.value, submitComment.value.trim() || undefined)
    toast.show('办理已提交，任务已办结')
    showSubmit.value = false
    pendingTaskId.value = undefined
    loadDetail()
  } catch (e: any) {
    toast.show(e?.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

/** 查看流程弹层（每轮实例一组） */
const showFlow = ref(false)
const flowLoading = ref(false)
const flowItems = ref<FgBpmFlowItem[]>([])

async function openFlow() {
  if (!ledgerId.value) {
    return
  }
  showFlow.value = true
  flowLoading.value = true
  try {
    const flows = await getTaxLedgerReviewFlow(ledgerId.value)
    flowItems.value = (flows ?? []).map(f => ({
      label: `第 ${f.round} 轮 · ${f.businessTitle || '办税任务办理'}`,
      detail: f,
    }))
  } catch {
    flowItems.value = []
  } finally {
    flowLoading.value = false
  }
}

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
    refreshHandleInfo()
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
