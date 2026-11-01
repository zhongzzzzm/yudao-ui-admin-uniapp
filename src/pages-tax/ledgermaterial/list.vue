<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="台账附件" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 筛选：台账ID + 附件类型（后端分页仅支持这两个条件） -->
    <view class="bg-white px-24rpx pb-16rpx pt-16rpx">
      <view class="flex items-center gap-16rpx">
        <wd-input
          v-model="ledgerIdText"
          class="flex-1"
          type="number"
          no-border
          clearable
          placeholder="按台账ID查询"
          @confirm="handleSearch"
          @clear="handleSearch"
        />
        <wd-button size="small" type="primary" plain @click="handleSearch">
          查询
        </wd-button>
      </view>
      <view class="mt-12rpx flex gap-16rpx overflow-x-auto">
        <view
          v-for="chip in materChips"
          :key="String(chip.value)"
          class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
          :class="currentMaterType === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
          @click="handleMaterTypeChange(chip.value)"
        >
          {{ chip.label }}
        </view>
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
      empty-view-text="暂无台账附件"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="previewFile(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.fileName || '附件' }}
            </view>
            <wd-tag
              :type="item.materType === 1 ? 'primary' : 'success'"
              plain
              class="ml-16rpx flex-shrink-0"
            >
              {{ getDictLabel(DICT_TYPE.TAX_MATER_TYPE, item.materType) || '附件' }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#777] space-y-6rpx">
            <view>台账ID：{{ item.ledgerId ?? '-' }}<text v-if="item.dueAmount != null"> · 应补退税额：{{ item.dueAmount }}</text></view>
            <view v-if="item.remark">
              备注：{{ item.remark }}
            </view>
            <view class="text-[#999]">
              上传时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
          <view v-if="canDelete" class="mt-16rpx flex justify-end border-t border-t-[#f7f7f7] pt-16rpx">
            <wd-button size="small" type="error" plain @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TaxLedgerMaterialVO } from '@/api/tax/ledger'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { deleteTaxLedgerMaterial } from '@/api/tax/ledger'
import { getTaxLedgerMaterialPage } from '@/api/tax/ledgermaterial'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'TaxLedgerMaterialList',
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
/** 删除附件权限（tax:ledger-material:delete），运维级操作 */
const canDelete = computed(() => hasAccessByCodes(['tax:ledger-material:delete']))

const list = ref<TaxLedgerMaterialVO[]>([])
const pagingRef = ref<any>()

/** 台账ID筛选（输入为空则不过滤） */
const ledgerIdText = ref('')
const currentLedgerId = ref<number>()

/** 附件类型筛选：undefined 为全部 */
const currentMaterType = ref<number>()
const materChips: { label: string, value?: number }[] = [
  { label: '全部', value: undefined },
  { label: '申报表', value: 1 },
  { label: '完税证明', value: 2 },
]

function handleSearch() {
  const parsed = Number(ledgerIdText.value)
  currentLedgerId.value = ledgerIdText.value.trim() && !Number.isNaN(parsed) ? parsed : undefined
  pagingRef.value?.reload()
}

function handleMaterTypeChange(value?: number) {
  if (currentMaterType.value === value) {
    return
  }
  currentMaterType.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTaxLedgerMaterialPage({
      pageNo,
      pageSize,
      ledgerId: currentLedgerId.value,
      materType: currentMaterType.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 点击附件在线预览 */
function previewFile(item: TaxLedgerMaterialVO) {
  if (!item.fileUrl) {
    return
  }
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(item.fileUrl)}&fileName=${encodeURIComponent(item.fileName || '附件')}`,
  })
}

/** 删除附件：凭证明细原始数据，删除会联动台账办结状态回退，需二次确认 */
function handleDelete(item: TaxLedgerMaterialVO) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除【${item.fileName || '附件'}】？删除后该任务对应材料缺失，办结状态将自动回退。`,
  }).then(async () => {
    try {
      await deleteTaxLedgerMaterial(item.id)
      uni.showToast({ title: '已删除', icon: 'none' })
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

getDictOptions(DICT_TYPE.TAX_MATER_TYPE)
</script>
