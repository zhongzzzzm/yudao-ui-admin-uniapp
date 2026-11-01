<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="办税台账" placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view class="flex items-center gap-24rpx">
          <text v-if="canBatch" class="text-28rpx text-[#333]" @click="enterSelectMode">批量</text>
          <view v-if="canInit" @click="showInit = true">
            <wd-icon name="plus-circle" size="40rpx" color="#333" />
          </view>
        </view>
      </template>
    </wd-navbar>

    <!-- 关键字搜索：公司名称 / 办税人员 / 所属期（后端 keyword 模糊匹配） -->
    <view class="bg-white px-24rpx pb-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索公司 / 办税人 / 所属期"
        hide-cancel
        @search="handleSearch"
        @clear="handleSearch"
      />
    </view>

    <!-- 状态筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx pb-16rpx">
      <view
        v-for="chip in statusChips"
        :key="chip.label"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentStatus === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleStatusChange(chip.value)"
      >
        {{ chip.label }}
      </view>
      <!-- 公司筛选 -->
      <view
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentCompany ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="showCompanyPicker = true"
      >
        {{ currentCompanyName || '全部公司' }}
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
      empty-view-text="暂无办税任务"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm"
          @click="handleCardTap(item)"
        >
          <view class="p-24rpx">
            <!-- 批量选择圈 -->
            <view v-if="selectMode" class="mb-12rpx flex items-center justify-end">
              <view
                class="h-40rpx w-40rpx flex items-center justify-center border rounded-full"
                :class="selectedIds.includes(item.id) ? 'border-[#018d71] bg-[#018d71]' : 'border-[#ccc]'"
              >
                <wd-icon v-if="selectedIds.includes(item.id)" name="check" size="28rpx" color="#fff" />
              </view>
            </view>
            <view class="mb-12rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
                {{ item.companyName || '-' }}
              </view>
              <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
                {{ getDictLabel(DICT_TYPE.TAX_LEDGER_STATUS, item.status) || '未知' }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#777] space-y-6rpx">
              <view class="line-clamp-1">
                税种：{{ getDictLabel(DICT_TYPE.TAX_TYPE, item.taxType) || '-' }} · 所属期：{{ item.period || '-' }}
              </view>
              <view class="line-clamp-1">
                办税人：{{ item.taxPerson || '-' }} · 申报日期：{{ item.submitDate || '未申报' }}
              </view>
            </view>
            <view
              v-if="deadlineHint(item)"
              class="mt-12rpx text-24rpx"
              :class="deadlineHint(item)!.danger ? 'text-[#f5222d]' : 'text-[#fa8c16]'"
            >
              {{ deadlineHint(item)!.text }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 公司筛选 -->
    <wd-action-sheet
      v-model="showCompanyPicker"
      :actions="[{ name: '全部公司' }, ...companyActions]"
      cancel-text="取消"
      @select="handleCompanySelect"
      @close="showCompanyPicker = false"
    />

    <!-- 初始化弹层 -->
    <wd-popup v-model="showInit" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="p-24rpx pb-40rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-500">
          初始化办税台账
        </view>
        <view class="mb-12rpx text-26rpx text-[#999]">
          按办税月生成台账任务，已存在的不会重复生成
        </view>
        <wd-datetime-picker
          v-model="initMonth"
          type="year-month"
          label="办税月"
          :min-date="minInitDate"
          :max-date="maxInitDate"
        />
        <wd-button block class="mt-24rpx" type="primary" :loading="initting" :disabled="initting" @click="handleInit">
          开始初始化
        </wd-button>
      </view>
    </wd-popup>

    <!-- 批量上传：底部操作栏 -->
    <view
      v-if="selectMode"
      class="fixed inset-x-0 bottom-0 z-10 border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <view class="flex items-center gap-16rpx">
        <view class="min-w-0 flex-1">
          <view class="text-26rpx text-[#666]">
            已选 {{ selectedIds.length }} 条
          </view>
          <view v-if="batchState.reason" class="line-clamp-1 text-22rpx text-[#fa8c16]">
            {{ batchState.reason }}
          </view>
        </view>
        <wd-button plain @click="exitSelectMode">
          取消
        </wd-button>
        <wd-button type="primary" :disabled="!batchState.enabled" @click="openBatchUpload">
          上传材料
        </wd-button>
      </view>
    </view>

    <!-- 批量上传办税材料 -->
    <wd-popup v-model="showBatch" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom @close="showBatch = false">
      <view class="p-24rpx pb-40rpx">
        <view class="mb-8rpx text-32rpx text-[#333] font-500">
          批量上传办税材料
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          已选 {{ selectedLedgers.length }} 条任务，本次上传的文件将同时作为这些任务的材料（用于汇总申报）
        </view>
        <view class="mb-20rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            材料类型
          </view>
          <wd-radio-group v-model="batchMaterType" shape="button">
            <wd-radio v-if="batchDeclareRequired" :value="1">
              申报表
            </wd-radio>
            <wd-radio :value="2">
              完税证明
            </wd-radio>
          </wd-radio-group>
        </view>
        <view class="mb-20rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            材料文件
          </view>
          <yd-upload
            v-model="batchUrls"
            accept="all"
            directory="tax-ledger-material"
            :multiple="false"
            :limit="1"
            :file-size="50"
            :file-type="['pdf', 'jpg', 'jpeg', 'png']"
          />
        </view>
        <view class="mb-20rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            备注
          </view>
          <textarea
            v-model="batchRemark"
            :maxlength="200"
            placeholder="备注（选填）"
            class="min-h-120rpx w-full rounded-12rpx bg-[#f7f8f9] p-20rpx text-26rpx"
          />
        </view>
        <wd-button block type="primary" :loading="batchUploading" :disabled="batchUploading" @click="confirmBatchUpload">
          确认上传
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { CompanySimpleVO, TaxLedgerVO } from '@/api/tax/ledger'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { createTaxLedgerMaterialBatch, getCompanySimpleList, getTaxLedgerPage, initTaxLedger } from '@/api/tax/ledger'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

defineOptions({
  name: 'TaxLedgerList',
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

/** 初始化权限（tax:ledger:init） */
const canInit = computed(() => hasAccessByCodes(['tax:ledger:init']))

/**
 * 状态筛选条。台账仅两态：0 待办理（办理流在途，等待办税人提交办理）/ 1 已办理（提交办结）；
 * value 为 undefined 的「全部」不传状态条件。
 */
const statusChips: { label: string, value?: number[] }[] = [
  { label: '待办理', value: [0] },
  { label: '已办理', value: [1] },
  { label: '全部', value: undefined },
]
const currentStatus = ref<number[] | undefined>(statusChips[0]!.value)
const list = ref<TaxLedgerVO[]>([])
const pagingRef = ref<any>()

/** 关键字：公司名称 / 办税人 / 所属期（后端模糊匹配） */
const keyword = ref('')
function handleSearch() {
  pagingRef.value?.reload()
}

/** 公司筛选 */
const showCompanyPicker = ref(false)
const companyColumns = ref<CompanySimpleVO[]>([])
const currentCompany = ref<number>()
/** 公司展示名：名称（编码），无编码时只展示名称 */
function companyLabel(c?: CompanySimpleVO) {
  if (!c) {
    return ''
  }
  return c.companyCode ? `${c.companyName || '未命名公司'}（${c.companyCode}）` : (c.companyName || '未命名公司')
}
const currentCompanyName = computed(() =>
  companyLabel(companyColumns.value.find(c => c.id === currentCompany.value)))
const companyActions = computed(() =>
  companyColumns.value.map(c => ({ name: companyLabel(c) })))

function handleStatusChange(value?: number[]) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

/** 状态标签色：0待办理=要处理，1已办理=完结 */
function statusTagType(status?: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 0) {
    return 'warning'
  }
  return 'success'
}

function handleCompanySelect({ item, index }: { item: { name: string }, index: number }) {
  showCompanyPicker.value = false
  const next = index === 0 ? undefined : companyColumns.value[index - 1].id
  if (next === currentCompany.value) {
    return
  }
  currentCompany.value = next
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTaxLedgerPage({
      pageNo,
      pageSize,
      statusList: currentStatus.value,
      companyId: currentCompany.value,
      keyword: keyword.value.trim() || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 截止日提示（临近 3 天标橙、逾期标红） */
function deadlineHint(item: TaxLedgerVO): { text: string, danger: boolean } | null {
  if (!item.deadline || item.status !== 0) {
    return null
  }
  const days = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) {
    return { text: `申报已逾期 ${-days} 天`, danger: true }
  }
  if (days <= 3) {
    return { text: days === 0 ? '申报今天截止' : `申报 ${days} 天后截止`, danger: false }
  }
  return null
}

function goDetail(item: TaxLedgerVO) {
  uni.navigateTo({ url: `/pages-tax/ledger/detail?id=${item.id}` })
}

// ========== 批量上传办税材料（汇总申报：一份材料同时归档到多条任务） ==========

/** 批量上传权限（tax:ledger-material:create） */
const canBatch = computed(() => hasAccessByCodes(['tax:ledger-material:create']))

/** 批量选择模式：卡片点击改为勾选，不再跳详情 */
const selectMode = ref(false)
const selectedIds = ref<number[]>([])
const selectedLedgers = computed(() => list.value.filter(item => selectedIds.value.includes(item.id)))

function enterSelectMode() {
  selectMode.value = true
  selectedIds.value = []
}

const showBatch = ref(false)

function exitSelectMode() {
  selectMode.value = false
  selectedIds.value = []
  showBatch.value = false
}

function handleCardTap(item: TaxLedgerVO) {
  if (!selectMode.value) {
    goDetail(item)
    return
  }
  const idx = selectedIds.value.indexOf(item.id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(item.id)
  }
}

/**
 * 批量上传可用性，与 PC 端同口径：税种支持批量上传（后端派生的 batchUploadGroup 非空）、
 * 且分组与所属期完全一致。税种规则不在前端重写，只比较后端下发的分组标识。
 */
const batchState = computed(() => {
  const rows = selectedLedgers.value
  if (rows.length === 0) {
    return { enabled: false, reason: '请勾选办税任务' }
  }
  const first = rows[0]!
  if (!first.batchUploadGroup) {
    return { enabled: false, reason: '所选税种不支持批量上传（仅个税、印花税支持）' }
  }
  const sameGroup = rows.every(
    row => row.batchUploadGroup === first.batchUploadGroup && row.period === first.period,
  )
  if (!sameGroup) {
    return { enabled: false, reason: '只能勾选税种与所属期相同的办税任务' }
  }
  return { enabled: true, reason: '' }
})

const batchMaterType = ref<1 | 2>(1)
const batchUrls = ref<string[]>([])
const batchRemark = ref('')
const batchUploading = ref(false)

/** 同组税种的该标识必然一致（列表按分组校验过），取首行即可；未下发按最严口径要求申报表 */
const batchDeclareRequired = computed(() => selectedLedgers.value[0]?.declareRequired !== false)

function openBatchUpload() {
  if (!batchState.value.enabled) {
    uni.showToast({ icon: 'none', title: batchState.value.reason })
    return
  }
  batchMaterType.value = 1
  batchUrls.value = []
  batchRemark.value = ''
  showBatch.value = true
}

/** 从文件地址截取文件名（create-batch 的 fileName 必填） */
function resolveFileName(fileUrl: string) {
  const name = fileUrl.slice(Math.max(0, fileUrl.lastIndexOf('/') + 1))
  return name.split('?')[0] || fileUrl
}

async function confirmBatchUpload() {
  const rows = selectedLedgers.value
  const fileUrl = batchUrls.value[0]
  if (!rows.length || !fileUrl || batchUploading.value) {
    return
  }
  batchUploading.value = true
  try {
    // 覆盖前显式确认：已有同类型材料的任务按重传替换处理
    const materLabel = batchMaterType.value === 1 ? '纳税申报表' : '完税证明'
    const overwriteCount = rows.filter(row =>
      batchMaterType.value === 1 ? row.declareUploaded === true : row.paymentProofUploaded === true,
    ).length
    if (overwriteCount > 0) {
      await dialog.confirm({
        title: '确认覆盖已有材料？',
        msg: `${overwriteCount} 条任务已有${materLabel}，继续将被本次上传的文件覆盖。`,
      })
    }
    await createTaxLedgerMaterialBatch({
      ledgerIds: rows.map(row => row.id),
      materType: batchMaterType.value,
      fileName: resolveFileName(fileUrl),
      fileUrl,
      remark: batchRemark.value.trim() || undefined,
    })
    showBatch.value = false
    uni.showToast({ icon: 'none', title: `已为 ${rows.length} 条办税任务上传材料` })
    exitSelectMode()
    pagingRef.value?.reload()
  } catch {
    // 业务错误 toast 已由 http 层提示；确认框取消则保留弹层内容供调整
  } finally {
    batchUploading.value = false
  }
}

/** 初始化 */
const showInit = ref(false)
const initting = ref(false)
const now = new Date()
const initMonth = ref<number>(now.getTime())
const minInitDate = ref(new Date(now.getFullYear() - 1, 0, 1).getTime())
const maxInitDate = ref(new Date(now.getFullYear() + 1, 11, 31).getTime())

async function handleInit() {
  initting.value = true
  try {
    const d = new Date(initMonth.value)
    const taxMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const count = await initTaxLedger({ taxMonth })
    showInit.value = false
    dialog.alert({ title: '初始化完成', msg: `本次共生成 ${count ?? 0} 条办税任务` })
    pagingRef.value?.reload()
  } catch (e: any) {
    dialog.alert({ title: '初始化失败', msg: e?.message || '请稍后重试' })
  } finally {
    initting.value = false
  }
}

/** 预热公司列表与字典 */
getCompanySimpleList().then((list) => {
  companyColumns.value = list
}).catch(() => {})
getDictOptions(DICT_TYPE.TAX_TYPE)
getDictOptions(DICT_TYPE.TAX_LEDGER_STATUS)
getDictOptions(DICT_TYPE.TAX_MATER_TYPE)
</script>
