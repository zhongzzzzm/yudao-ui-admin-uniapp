<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="办税台账" placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view v-if="canInit" class="pr-10rpx" @click="showInit = true">
          <wd-icon name="plus-circle" size="40rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>

    <!-- 状态筛选条 -->
    <view class="flex gap-16rpx overflow-x-auto bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in statusChips"
        :key="chip.value"
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
          @click="goDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
                {{ item.companyName || '-' }}
              </view>
              <wd-tag :type="item.status === 0 ? 'warning' : 'success'" plain class="ml-16rpx flex-shrink-0">
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
  </view>
</template>

<script lang="ts" setup>
import type { CompanySimpleVO, TaxLedgerVO } from '@/api/tax/ledger'
import { navigateBackPlus } from '@/utils'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { getCompanySimpleList, getTaxLedgerPage, initTaxLedger } from '@/api/tax/ledger'
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

const statusChips = [
  { label: '待办', value: 0 },
  { label: '已办结', value: 1 },
  { label: '全部', value: -1 },
]
const currentStatus = ref(0)
const list = ref<TaxLedgerVO[]>([])
const pagingRef = ref<any>()

/** 公司筛选 */
const showCompanyPicker = ref(false)
const companyColumns = ref<CompanySimpleVO[]>([])
const currentCompany = ref<number>()
const currentCompanyName = computed(() =>
  companyColumns.value.find(c => c.id === currentCompany.value)?.companyName)
const companyActions = computed(() =>
  companyColumns.value.map(c => ({ name: c.companyName || '未命名公司' })))

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
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
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
      companyId: currentCompany.value,
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
</script>
