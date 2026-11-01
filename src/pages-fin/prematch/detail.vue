<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="台账详情" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!book" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadAll">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 台账信息 -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">
              {{ book.name || `预收底稿 #${book.id}` }}
            </text>
            <wd-tag type="primary" plain class="ml-16rpx flex-shrink-0">
              当期 {{ book.currentPeriod || '-' }}
            </wd-tag>
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">基准期</text>
              <text class="flex-1 text-[#333]">{{ book.basePeriod || '-' }}</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">批次数</text>
              <text class="flex-1 text-[#333]">{{ book.batchCount ?? 0 }} 期（含初始化）</text>
            </view>
            <view class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">当前底稿</text>
              <text class="flex-1 text-[#333]">
                {{ book.openItemCount ?? 0 }} 行 · 剩余 {{ formatMoney(book.openAmount) }}
              </text>
            </view>
            <view v-if="book.remark" class="flex">
              <text class="w-180rpx flex-shrink-0 text-[#999]">备注</text>
              <text class="flex-1 text-[#333]">{{ book.remark }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view v-if="canCreate" class="mt-20rpx flex flex-wrap gap-16rpx">
            <wd-button size="small" type="primary" @click="openUpload">
              上传月度账
            </wd-button>
            <wd-button v-if="canRecalc" size="small" plain @click="onRecalc">
              重算本期
            </wd-button>
            <wd-button v-if="canRollback" size="small" plain type="error" @click="onRollbackLatest">
              回滚本期
            </wd-button>
          </view>
        </view>

        <!-- 期次选择 + 批次概览 -->
        <view class="mx-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <text class="text-28rpx text-[#333] font-500">期次概览</text>
            <picker mode="selector" :range="batchLabels" :value="batchIndex" @change="handleBatchChange">
              <view class="flex items-center gap-8rpx">
                <text class="text-28rpx text-[#333]">{{ activeBatchLabel }}</text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view v-if="activeBatch" class="grid grid-cols-2 gap-x-24rpx gap-y-12rpx px-24rpx py-20rpx text-24rpx">
            <view>
              <text class="text-[#999]">本期参与 </text>
              <text class="text-[#333]">{{ activeBatch.txnCount ?? 0 }} 行</text>
            </view>
            <view>
              <text class="text-[#999]">新增入稿 </text>
              <text class="text-[#333]">{{ activeBatch.newIncomeCount ?? 0 }} 行</text>
            </view>
            <view>
              <text class="text-[#999]">同月闭环 </text>
              <text class="text-[#333]">{{ activeBatch.sameMonthGroupCount ?? 0 }} 组</text>
            </view>
            <view>
              <text class="text-[#999]">闭环出稿 </text>
              <text class="text-[#333]">{{ activeBatch.draftClosedCount ?? 0 }} 行</text>
            </view>
            <view>
              <text class="text-[#999]">串科目闭环 </text>
              <text class="text-[#333]">{{ activeBatch.crossClosedCount ?? 0 }} 笔</text>
            </view>
            <view>
              <text class="text-[#999]">算后底稿 </text>
              <text class="text-[#333]">
                {{ activeBatch.openAfterCount ?? 0 }} 行 · {{ formatMoney(activeBatch.openAfterAmount) }}
              </text>
            </view>
            <view>
              <text class="text-[#999]">无来源残额 </text>
              <text class="text-[#333]">
                {{ activeBatch.noSourceCount ?? 0 }} 笔 · {{ formatMoney(activeBatch.noSourceAmount) }}
              </text>
            </view>
            <view>
              <text class="text-[#999]">无法识别 </text>
              <text class="text-[#333]">{{ activeBatch.unrecognizedCount ?? 0 }} 行</text>
            </view>
          </view>
          <!-- 勾稽提示 -->
          <view v-if="activeBatch?.reconcileNotes?.length" class="px-24rpx pb-20rpx">
            <view
              v-for="(note, i) in activeBatch.reconcileNotes"
              :key="i"
              class="mb-8rpx rounded-8rpx bg-[#fffbe6] px-16rpx py-12rpx text-22rpx text-[#ad6800]"
            >
              {{ note }}
            </view>
          </view>
        </view>

        <!-- 月度余额矩阵（期次 × 科目，横向滚动） -->
        <view class="m-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            月度余额矩阵
          </view>
          <scroll-view scroll-x class="w-full">
            <view class="min-w-full">
              <!-- 表头 -->
              <view class="matrix-row matrix-head">
                <text class="matrix-cell w-140rpx">期次</text>
                <text v-for="acc in matrixAccounts" :key="acc" class="matrix-cell flex-1">
                  {{ matrixAccountLabel(acc) }}
                </text>
                <text class="matrix-cell w-180rpx">合计期末</text>
                <text class="matrix-cell w-180rpx">在稿剩余</text>
              </view>
              <!-- 数据行：旧 → 新 -->
              <view v-for="row in matrixRows" :key="row.period" class="matrix-row">
                <text class="matrix-cell w-140rpx" :class="{ 'text-[#018d71]': row.period === book.currentPeriod }">
                  {{ row.period }}
                </text>
                <text v-for="acc in matrixAccounts" :key="acc" class="matrix-cell flex-1">
                  {{ formatMoney(row.cells[acc]?.closingBalance) }}
                </text>
                <text class="matrix-cell w-180rpx">
                  {{ formatMoney(row.closingTotal) }}
                </text>
                <text class="matrix-cell w-180rpx">
                  {{ formatMoney(row.draftTotal) }}
                </text>
              </view>
              <view v-if="!matrixRows.length" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
                暂无期次数据
              </view>
            </view>
          </scroll-view>
          <view class="px-24rpx pb-20rpx text-22rpx text-[#999]">
            期末与在稿剩余按科目汇总；上一行期末即下一行期初逐期滚平。
          </view>
        </view>

        <!-- 明细页签：底稿行 / 闭环明细 / 异常清单 -->
        <view class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex border-b border-b-[#f0f0f0]">
            <view
              v-for="tab in detailTabs"
              :key="tab.key"
              class="flex-1 py-20rpx text-center text-26rpx"
              :class="activeTab === tab.key ? 'text-[#018d71] font-500' : 'text-[#666]'"
              @click="switchTab(tab.key)"
            >
              {{ tab.label }}
            </view>
          </view>

          <!-- 底稿行 -->
          <template v-if="activeTab === 'item'">
            <view
              v-for="item in itemList"
              :key="item.id"
              class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx"
            >
              <view class="flex items-center justify-between">
                <text class="line-clamp-1 flex-1 text-26rpx text-[#333]">
                  {{ item.entityName || '-' }}<template v-if="item.contractNo"> · {{ item.contractNo }}</template>
                </text>
                <text class="ml-12rpx flex-shrink-0 text-26rpx text-[#018d71] font-500">
                  {{ formatMoney(item.remainingAmount) }}
                </text>
              </view>
              <view class="mt-4rpx text-22rpx text-[#999]">
                {{ item.accountCode || '-' }} · {{ item.incomeAction === 2 ? '租金挂账' : '预收' }} · 原发生 {{ item.originDate || '-' }}
              </view>
              <view v-if="item.originSummary" class="line-clamp-1 mt-4rpx text-22rpx text-[#999]">
                {{ item.originSummary }}
              </view>
            </view>
          </template>

          <!-- 闭环明细 -->
          <template v-else-if="activeTab === 'closure'">
            <view
              v-for="row in closureList"
              :key="row.id"
              class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx"
            >
              <view class="flex items-center justify-between">
                <text class="line-clamp-1 flex-1 text-26rpx text-[#333]">
                  {{ row.entityName || '-' }}<template v-if="row.contractNo"> · {{ row.contractNo }}</template>
                </text>
                <text class="ml-12rpx flex-shrink-0 text-26rpx text-[#333] font-500">
                  {{ formatMoney(row.appliedAmount) }}
                </text>
              </view>
              <view class="mt-4rpx text-22rpx text-[#999]">
                {{ scopeLabel(row.scope) }} · {{ consumeActionLabel(row.consumeAction) }} · {{ row.consumeDate || '-' }}
              </view>
              <view class="mt-4rpx text-22rpx text-[#999]">
                入稿 {{ formatMoney(row.originAmount) }} → 闭环 {{ formatMoney(row.consumeAmount) }} · 剩余 {{ formatMoney(row.itemRemaining) }}
              </view>
            </view>
          </template>

          <!-- 异常清单 -->
          <template v-else>
            <view
              v-for="row in exceptionList"
              :key="row.id"
              class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx"
              @click="openMemoryForm(row)"
            >
              <view class="flex items-center justify-between">
                <wd-tag :type="exceptionTagType(row.exceptionType)" plain size="small">
                  {{ exceptionLabel(row.exceptionType) }}
                </wd-tag>
                <text class="ml-12rpx flex-shrink-0 text-26rpx text-[#333] font-500">
                  {{ formatMoney(row.amount) }}
                </text>
              </view>
              <view class="line-clamp-2 mt-8rpx text-24rpx text-[#333]">
                {{ row.summary || '-' }}
              </view>
              <view class="mt-4rpx text-22rpx text-[#999]">
                {{ row.accountCode || '-' }} · {{ row.side === 2 ? '借' : '贷' }} · {{ row.txnDate || '-' }} · {{ row.voucher || '-' }}
              </view>
              <view class="mt-4rpx text-22rpx" :class="row.memoryMatched ? 'text-[#018d71]' : 'text-[#fa8c16]'">
                {{ row.memoryMatched ? '已补录识别记忆' : '点击补录识别记忆 ›' }}
              </view>
            </view>
          </template>

          <!-- 空态 -->
          <view v-if="!activeList.length" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
            {{ emptyText }}
          </view>
          <!-- 加载更多 -->
          <view v-if="listHasMore" class="py-20rpx text-center text-24rpx text-[#018d71]" @click="loadMoreList">
            {{ listLoading ? '加载中…' : '加载更多' }}
          </view>
        </view>
        <view class="h-40rpx" />
      </template>
    </scroll-view>

    <!-- 上传月度账弹层 -->
    <wd-popup v-model="showUpload" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          上传月度明细账
        </view>
        <view class="mb-16rpx rounded-12rpx bg-[#e6f7f4] px-20rpx py-16rpx text-24rpx text-[#018d71]">
          可一次上传多个月：单文件多月区间或多个文件均可，系统按期次从旧到新逐月闭环，任一月校验失败整体不落库。期次须晚于当前期（{{ book?.currentPeriod || '-' }}），传错可在详情页回滚重传。
        </view>
        <yd-upload
          v-model="uploadUrls"
          accept="all"
          directory="fin-prematch"
          :limit="20"
          :file-type="excelTypes"
        />
        <wd-button class="mt-24rpx" block type="primary" :loading="uploading" @click="onUploadConfirm">
          上传并计算
        </wd-button>
      </view>
    </wd-popup>

    <!-- 补录识别记忆弹层 -->
    <wd-popup v-model="showMemory" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-75vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          补录摘要识别
        </view>
        <view class="mb-16rpx rounded-12rpx bg-[#e6f7f4] px-20rpx py-16rpx text-24rpx text-[#018d71]">
          人工解析一次无法识别的摘要，保存后相同写法全租户自动识别；已落库的账需「重算本期」重新识别。
        </view>
        <view class="form-item">
          <view class="form-label required">
            摘要原文
          </view>
          <wd-textarea v-model="memoryForm.summary" :maxlength="500" show-word-limit clearable no-border placeholder="摘要原文" />
        </view>
        <view class="form-item">
          <view class="form-label required">
            主体名
          </view>
          <wd-input v-model="memoryForm.entityName" :maxlength="128" clearable no-border placeholder="摘要中解析出的主体名" />
        </view>
        <view class="form-item">
          <view class="form-label">
            合同号
          </view>
          <wd-input v-model="memoryForm.contractNo" :maxlength="64" clearable no-border placeholder="可空" />
        </view>
        <view class="form-item">
          <view class="form-label required">
            动作
          </view>
          <picker mode="selector" :range="memoryActionLabels" :value="memoryActionIndex" @change="handleMemoryActionChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ memoryActionLabels[memoryActionIndex] || '请选择动作' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <wd-button class="mt-8rpx" block type="primary" :loading="memorySaving" @click="onMemorySave">
          保存记忆
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type {
  PrematchBatchVO,
  PrematchBookVO,
  PrematchClosureVO,
  PrematchExceptionVO,
  PrematchItemVO,
} from '@/api/fin/prematch'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { getFileNameFromUrl } from '@/utils/download'
import { formatMoney } from '@/utils/format'
import { computed, reactive, ref } from 'vue'
import {
  createPrematchMemory,
  deleteLatestPrematchBatch,
  getPrematchBatchPage,
  getPrematchBook,
  getPrematchClosurePage,
  getPrematchExceptionPage,
  getPrematchItemPage,
  uploadPrematchBatch,
} from '@/api/fin/prematch'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'FinPrematchBookDetail',
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
const canCreate = hasAccessByCodes(['fin:prematch:create'])
const canDelete = hasAccessByCodes(['fin:prematch:delete'])

/** Excel 文件类型白名单（上传前本地校验） */
const excelTypes = ['xlsx', 'xls']
const PAGE_SIZE = 20

// ========== 台账与批次 ==========

const bookId = ref<number>()
const loading = ref(false)
const book = ref<PrematchBookVO>()
/** 批次列表（新 → 旧） */
const batches = ref<PrematchBatchVO[]>([])

const batchIndex = ref(0)
const activeBatch = computed(() => batches.value[batchIndex.value])
const batchLabels = computed(() =>
  batches.value.map(b => `${b.period || '-'}（${b.batchType === 1 ? '初始化' : '月度账'}）`))
const activeBatchLabel = computed(() => batchLabels.value[batchIndex.value] || '请选择期次')

function handleBatchChange(e: any) {
  batchIndex.value = Number(e.detail.value)
  // 闭环/异常按批次过滤，切换期次后重置列表
  reloadList()
}

/** 加载台账信息与批次列表 */
async function loadAll() {
  if (!bookId.value) {
    return
  }
  loading.value = true
  try {
    book.value = await getPrematchBook(bookId.value)
    const data = await getPrematchBatchPage({ pageNo: 1, pageSize: 100, bookId: bookId.value })
    batches.value = data.list ?? []
    batchIndex.value = 0
    reloadList()
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  if (query?.id) {
    bookId.value = Number(query.id)
  }
  loadAll()
})

// ========== 月度余额矩阵（期次 × 科目，旧 → 新） ==========

/** 全部科目编码（取最新批次的科目顺序为基准） */
const matrixAccounts = computed(() => {
  const codes: string[] = []
  for (const batch of batches.value) {
    for (const stat of batch.accountStats ?? []) {
      if (stat.accountCode && !codes.includes(stat.accountCode)) {
        codes.push(stat.accountCode)
      }
    }
  }
  return codes
})

function matrixAccountLabel(code: string) {
  for (const batch of batches.value) {
    const stat = batch.accountStats?.find(s => s.accountCode === code)
    if (stat?.accountName) {
      return stat.accountName.length > 8 ? `${stat.accountName.slice(0, 8)}…` : stat.accountName
    }
  }
  return code
}

interface MatrixRow {
  period: string
  /** 各科目账面期末余额 */
  cells: Record<string, { closingBalance?: number }>
  /** 合计期末 */
  closingTotal: number
  /** 在稿剩余合计 */
  draftTotal: number
}

const matrixRows = computed<MatrixRow[]>(() =>
  [...batches.value].reverse().map((batch) => {
    const cells: Record<string, { closingBalance?: number }> = {}
    let closingTotal = 0
    let draftTotal = 0
    for (const stat of batch.accountStats ?? []) {
      if (!stat.accountCode) {
        continue
      }
      cells[stat.accountCode] = { closingBalance: stat.closingBalance }
      closingTotal += stat.closingBalance ?? 0
      draftTotal += stat.openAmount ?? 0
    }
    return { period: batch.period || '-', cells, closingTotal, draftTotal }
  }))

// ========== 明细页签（底稿行 / 闭环明细 / 异常清单） ==========

const detailTabs = [
  { key: 'item', label: '底稿行' },
  { key: 'closure', label: '闭环明细' },
  { key: 'exception', label: '异常清单' },
] as const
type TabKey = typeof detailTabs[number]['key']
const activeTab = ref<TabKey>('item')

const itemList = ref<PrematchItemVO[]>([])
const closureList = ref<PrematchClosureVO[]>([])
const exceptionList = ref<PrematchExceptionVO[]>([])
const listPageNo = ref(1)
const listHasMore = ref(false)
const listLoading = ref(false)

const activeList = computed<unknown[]>(() => {
  if (activeTab.value === 'item') {
    return itemList.value
  }
  if (activeTab.value === 'closure') {
    return closureList.value
  }
  return exceptionList.value
})

const emptyText = computed(() => {
  if (activeTab.value === 'item') {
    return '该台账暂无在稿底稿行'
  }
  if (activeTab.value === 'closure') {
    return '该期暂无闭环明细'
  }
  return '该期暂无异常行'
})

function switchTab(key: TabKey) {
  if (activeTab.value === key) {
    return
  }
  activeTab.value = key
  reloadList()
}

/** 重置并加载第一页 */
function reloadList() {
  listPageNo.value = 1
  itemList.value = []
  closureList.value = []
  exceptionList.value = []
  listHasMore.value = false
  loadMoreList()
}

/** 追加加载当前页签列表 */
async function loadMoreList() {
  if (listLoading.value) {
    return
  }
  if (activeTab.value !== 'item' && !activeBatch.value) {
    return
  }
  listLoading.value = true
  try {
    const pageNo = listPageNo.value
    if (activeTab.value === 'item') {
      const data = await getPrematchItemPage({ pageNo, pageSize: PAGE_SIZE, bookId: bookId.value! })
      itemList.value.push(...data.list)
      listHasMore.value = pageNo * PAGE_SIZE < data.total
    } else if (activeTab.value === 'closure') {
      const data = await getPrematchClosurePage({ pageNo, pageSize: PAGE_SIZE, batchId: activeBatch.value!.id })
      closureList.value.push(...data.list)
      listHasMore.value = pageNo * PAGE_SIZE < data.total
    } else {
      const data = await getPrematchExceptionPage({ pageNo, pageSize: PAGE_SIZE, batchId: activeBatch.value!.id })
      exceptionList.value.push(...data.list)
      listHasMore.value = pageNo * PAGE_SIZE < data.total
    }
    listPageNo.value = pageNo + 1
  } finally {
    listLoading.value = false
  }
}

function scopeLabel(scope?: number) {
  return { 1: '同月闭环', 2: '同科目勾销', 3: '串科目勾销' }[scope ?? 0] ?? '-'
}

function consumeActionLabel(action?: number) {
  return { 1: '转出', 2: '冲抵', 3: '退还' }[action ?? 0] ?? '-'
}

function exceptionLabel(type?: number) {
  return { 1: '无来源残额', 2: '无法识别', 3: '调平忽略' }[type ?? 0] ?? '未知'
}

function exceptionTagType(type?: number): 'warning' | 'error' | 'info' {
  if (type === 2) {
    return 'error'
  }
  if (type === 1) {
    return 'warning'
  }
  return 'info'
}

// ========== 上传月度账 / 回滚 / 重算 ==========

const showUpload = ref(false)
const uploadUrls = ref<string[]>([])
const uploading = ref(false)

/** 仅最新一期「月度批次」可回滚/重算（初始化批次不可单删） */
const latestMonthlyBatch = computed(() => {
  const first = batches.value[0]
  return first && first.batchType === 2 ? first : undefined
})
const canRollback = computed(() => canDelete && !!latestMonthlyBatch.value)
const canRecalc = computed(() =>
  canDelete && !!latestMonthlyBatch.value && (latestMonthlyBatch.value.files?.length ?? 0) > 0)

function openUpload() {
  uploadUrls.value = []
  showUpload.value = true
}

/** 上传月度明细账并同步计算 */
async function onUploadConfirm() {
  if (!bookId.value) {
    return
  }
  if (!uploadUrls.value.length) {
    toast.show('请上传本月明细账文件')
    return
  }
  uploading.value = true
  try {
    await uploadPrematchBatch({
      bookId: bookId.value,
      files: uploadUrls.value.map(url => ({
        fileUrl: url,
        fileName: getFileNameFromUrl(url),
      })),
    })
    showUpload.value = false
    uni.$emit('fin:prematch:book:reload')
    toast.show('上传完成，已按期次逐月闭环')
    loadAll()
  } catch {
    // 业务错误提示由 http 层统一弹出
  } finally {
    uploading.value = false
  }
}

/** 回滚最新一期月度批次（线下核对发现问题时的补救路径） */
function onRollbackLatest() {
  const batch = latestMonthlyBatch.value
  if (!bookId.value || !batch) {
    return
  }
  dialog.confirm({
    title: `回滚本期【${batch.period || '-'}】？`,
    msg: '将撤销该期全部闭环（被消化的底稿行恢复、本期入稿行删除），台账回到上期末；线下核对发现问题后用此入口重传正确月份。',
  }).then(async () => {
    try {
      await deleteLatestPrematchBatch(bookId.value!)
      uni.$emit('fin:prematch:book:reload')
      toast.show('已回滚本期')
      loadAll()
    } catch {
      // 业务错误提示由 http 层统一弹出
    }
  }).catch(() => {})
}

/** 一键重算本期：回滚最新一期月度批次，并用该批次留存的原文件按最新记忆重算 */
function onRecalc() {
  const batch = latestMonthlyBatch.value
  if (!bookId.value || !batch) {
    return
  }
  const files = batch.files ?? []
  if (!files.length) {
    toast.show('该批次未留存原上传文件，无法自动重算，请通过「上传月度账」重新上传')
    return
  }
  dialog.confirm({
    title: `回滚并重算【${batch.period || '-'}】？`,
    msg: '将撤销本期全部闭环结果，按最新识别记忆用原上传文件重新计算，无需重新选文件。',
  }).then(async () => {
    try {
      await deleteLatestPrematchBatch(bookId.value!)
      await uploadPrematchBatch({ bookId: bookId.value!, files, period: batch.period || undefined })
      uni.$emit('fin:prematch:book:reload')
      toast.show('重算完成，已按最新记忆重新识别')
      loadAll()
    } catch {
      // 回滚成功但重算失败（如原文件被清理）时提示用户重新上传
      toast.show('回滚已完成，但重算失败：请检查原文件是否仍可访问，然后通过「上传月度账」重新上传')
      loadAll()
    }
  }).catch(() => {})
}

// ========== 补录识别记忆 ==========

const showMemory = ref(false)
const memorySaving = ref(false)
/** 动作选项：1=预收、2=租金挂账、3=转出、4=冲抵、5=退还 */
const memoryActionOptions = [
  { label: '预收', value: 1 },
  { label: '租金挂账', value: 2 },
  { label: '转出', value: 3 },
  { label: '冲抵', value: 4 },
  { label: '退还', value: 5 },
]
const memoryActionLabels = memoryActionOptions.map(o => o.label)
const memoryForm = reactive({
  exceptionId: undefined as number | undefined,
  side: 1,
  summary: '',
  entityName: '',
  contractNo: '',
  action: 1 as number,
})
const memoryActionIndex = computed(() =>
  memoryActionOptions.findIndex(o => o.value === memoryForm.action))

function handleMemoryActionChange(e: any) {
  memoryForm.action = memoryActionOptions[Number(e.detail.value)]?.value ?? 1
}

function openMemoryForm(row: PrematchExceptionVO) {
  if (!canCreate) {
    return
  }
  if (row.exceptionType === 3) {
    toast.show('调平忽略行无需补录识别记忆')
    return
  }
  memoryForm.exceptionId = row.id
  memoryForm.side = row.side === 2 ? 2 : 1
  memoryForm.summary = row.summary || ''
  memoryForm.entityName = ''
  memoryForm.contractNo = ''
  memoryForm.action = 1
  showMemory.value = true
}

/** 保存识别记忆（相同写法全租户自动识别） */
async function onMemorySave() {
  if (!memoryForm.summary) {
    toast.show('摘要原文不能为空')
    return
  }
  if (!memoryForm.entityName) {
    toast.show('请填写主体名')
    return
  }
  memorySaving.value = true
  try {
    await createPrematchMemory({
      exceptionId: memoryForm.exceptionId,
      side: memoryForm.side,
      summary: memoryForm.summary,
      entityName: memoryForm.entityName,
      contractNo: memoryForm.contractNo || undefined,
      action: memoryForm.action,
    })
    toast.show('记忆已保存，重算本期后生效')
    showMemory.value = false
    reloadList()
  } catch {
    // 业务错误提示由 http 层统一弹出
  } finally {
    memorySaving.value = false
  }
}
</script>

<style lang="scss" scoped>
.matrix-row {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f7f8f9;
  padding: 16rpx 24rpx;

  &:last-child {
    border-bottom: none;
  }

  &.matrix-head {
    background: #fafafa;
    font-weight: 500;
    color: #666;
  }
}

.matrix-cell {
  flex-shrink: 0;
  margin-right: 24rpx;
  font-size: 24rpx;
  color: #333;
  text-align: right;
  white-space: nowrap;

  &:first-child {
    text-align: left;
  }
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #666;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
