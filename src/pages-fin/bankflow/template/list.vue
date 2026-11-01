<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="解析模板" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 状态筛选条 + 新增入口 -->
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
      <wd-button
        v-if="canCreate"
        class="ml-auto flex-shrink-0"
        size="small"
        type="primary"
        @click="goForm()"
      >
        新增模板
      </wd-button>
    </view>

    <!-- 模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无解析模板"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.name }}
            </view>
            <wd-tag class="ml-16rpx flex-shrink-0" :type="item.status === 0 ? 'success' : 'info'" plain>
              {{ item.status === 0 ? '启用' : '停用' }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#777] space-y-4rpx">
            <view class="line-clamp-1">
              银行/渠道：{{ item.bankName || '-' }}
            </view>
            <view class="line-clamp-1">
              识别关键词：{{ (item.recognizeKeywords || []).join('、') || '-' }}
            </view>
            <view v-if="item.fileNameKeywords?.length" class="line-clamp-1">
              文件名信号：{{ item.fileNameKeywords.join('、') }}
            </view>
            <view class="line-clamp-1">
              累计识别 {{ item.matchedCount ?? 0 }} 次{{ item.lastMatchedTime ? ` · 最近 ${formatDateTime(item.lastMatchedTime)}` : '' }}
            </view>
            <view v-if="item.remark" class="line-clamp-2">
              备注：{{ item.remark }}
            </view>
          </view>
          <!-- 操作：编辑 / 复制 / 启停 / 删除 -->
          <view class="mt-16rpx flex justify-end gap-16rpx border-t border-t-[#f5f6f8] pt-16rpx">
            <wd-button v-if="canUpdate" size="small" plain type="primary" @click="goForm(item.id)">
              编辑
            </wd-button>
            <wd-button v-if="canCreate" size="small" plain @click="goCopy(item)">
              复制
            </wd-button>
            <wd-button v-if="canUpdate" size="small" plain @click="onToggleStatus(item)">
              {{ item.status === 0 ? '停用' : '启用' }}
            </wd-button>
            <wd-button v-if="canDelete" size="small" plain type="error" @click="onDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { BankFlowTemplateVO } from '@/api/fin/bankFlowTemplate'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { ref } from 'vue'
import { deleteBankFlowTemplate, getBankFlowTemplatePage, updateBankFlowTemplateStatus } from '@/api/fin/bankFlowTemplate'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'FinBankFlowTemplateList',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

/** 模板维护权限（与 PC 端按钮权限一致） */
const canCreate = hasAccessByCodes(['fin:bank-flow-template:create'])
const canUpdate = hasAccessByCodes(['fin:bank-flow-template:update'])
const canDelete = hasAccessByCodes(['fin:bank-flow-template:delete'])

function handleBack() {
  navigateBackPlus()
}

/** 模板状态：0 启用 1 停用 */
const statusChips = [
  { label: '全部', value: -1 },
  { label: '启用', value: 0 },
  { label: '停用', value: 1 },
]
const currentStatus = ref(-1)
const list = ref<BankFlowTemplateVO[]>([])
const pagingRef = ref<any>()

function handleStatusChange(value: number) {
  if (currentStatus.value === value) {
    return
  }
  currentStatus.value = value
  pagingRef.value?.reload()
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getBankFlowTemplatePage({
      pageNo,
      pageSize,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 新增（无参）/ 编辑（带 id） */
function goForm(id?: number) {
  uni.navigateTo({ url: id ? `/pages-fin/bankflow/template/form?id=${id}` : '/pages-fin/bankflow/template/form' })
}

/** 复制派生：复制基础字段与解析配置，保存为新模板 */
function goCopy(item: BankFlowTemplateVO) {
  uni.navigateTo({ url: `/pages-fin/bankflow/template/form?id=${item.id}&copy=1` })
}

/** 启停用模板 */
function onToggleStatus(item: BankFlowTemplateVO) {
  const target = item.status === 0 ? 1 : 0
  const action = target === 0 ? '启用' : '停用'
  dialog.confirm({
    title: `确认${action}`,
    msg: `确认${action}模板【${item.name}】？${target === 1 ? '停用后导入文件不再自动匹配该模板。' : ''}`,
  }).then(async () => {
    try {
      await updateBankFlowTemplateStatus(item.id, target)
      toast.show(`已${action}`)
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 删除模板 */
function onDelete(item: BankFlowTemplateVO) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除模板【${item.name}】？已导入的流水不受影响，但同格式文件此后将无法自动识别。`,
  }).then(async () => {
    try {
      await deleteBankFlowTemplate(item.id)
      toast.show('已删除')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

// 模板新增/编辑/复制保存后刷新列表
uni.$on('fin:bankflow-template:reload', () => {
  pagingRef.value?.reload()
})
onUnload(() => {
  uni.$off('fin:bankflow-template:reload')
})
</script>
