<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="摘要识别规则" placeholder safe-area-inset-top fixed @click-left="handleBack"
    >
      <template #right>
        <view class="flex items-center text-26rpx text-[#018d71]" @click="openTestParse">
          试解析
        </view>
      </template>
    </wd-navbar>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无识别规则"
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
              {{ item.name }}
            </view>
            <wd-tag :type="item.status === 1 ? 'info' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ item.status === 1 ? '停用' : '启用' }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#777] space-y-6rpx">
            <view class="line-clamp-1">
              {{ directionLabel(item.direction) }} · {{ actionLabel(item.action) }} · 优先级 {{ item.priority ?? '-' }}
            </view>
            <view v-if="item.action === 0" class="line-clamp-1">
              关键词：{{ item.keyword || '-' }}
            </view>
            <view v-else class="line-clamp-1">
              前缀：{{ item.prefix || '（无前缀通配）' }} · 尾缀：{{ item.suffixes?.join('、') || '（整段为主体）' }}
            </view>
          </view>
        </view>
        <!-- 底部按钮占位 -->
        <view v-if="canEdit" class="h-140rpx" />
      </view>
    </z-paging>

    <!-- 新增规则入口 -->
    <view
      v-if="canEdit"
      class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <wd-button class="flex-1" type="primary" @click="goCreate">
        新增规则
      </wd-button>
    </view>

    <!-- 行操作：编辑 / 启停用 / 删除 -->
    <wd-action-sheet
      v-model="showActions"
      :actions="rowActions"
      cancel-text="取消"
      title="规则操作"
      @select="handleRowAction"
      @close="showActions = false"
    />

    <!-- 摘要试解析弹层 -->
    <wd-popup v-model="showTest" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-75vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          摘要试解析
        </view>
        <view class="mb-16rpx rounded-12rpx bg-[#e6f7f4] px-20rpx py-16rpx text-24rpx text-[#018d71]">
          走生产解析管道试跑一条摘要，不落库；用于验证规则与记忆的命中效果。
        </view>
        <view class="form-item">
          <view class="form-label required">
            摘要
          </view>
          <wd-textarea v-model="testForm.summary" :maxlength="500" show-word-limit clearable no-border placeholder="输入要试解析的摘要原文" />
        </view>
        <view class="form-item">
          <view class="form-label required">
            方向
          </view>
          <picker mode="selector" :range="sideLabels" :value="sideIndex" @change="handleSideChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx text-[#333]">
                {{ sideLabels[sideIndex] || '请选择方向' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <wd-button class="mt-8rpx" block type="primary" :loading="testing" @click="onTestParse">
          试解析
        </wd-button>

        <!-- 解析结果 -->
        <view v-if="testResult" class="mt-24rpx rounded-12rpx bg-[#f7f8f9] p-20rpx text-24rpx">
          <view class="mb-12rpx text-26rpx font-500" :class="testResult.outcome === 'none' ? 'text-[#fa8c16]' : 'text-[#018d71]'">
            命中结果：{{ outcomeLabel(testResult.outcome) }}
          </view>
          <view v-if="testResult.ruleName" class="mb-8rpx text-[#666]">
            命中规则：{{ testResult.ruleName }}
          </view>
          <view v-if="testResult.action != null" class="mb-8rpx text-[#666]">
            解析动作：{{ actionLabel(testResult.action) }}
          </view>
          <view v-if="testResult.entityName" class="mb-8rpx text-[#666]">
            主体名：{{ testResult.entityName }}
          </view>
          <view v-if="testResult.contractNo" class="mb-8rpx text-[#666]">
            合同号：{{ testResult.contractNo }}
          </view>
          <view v-if="testResult.normalizedSummary" class="mb-8rpx text-[#666]">
            归一化摘要：{{ testResult.normalizedSummary }}
          </view>
          <view v-if="testResult.reason" class="mb-8rpx text-[#fa8c16]">
            原因：{{ testResult.reason }}
          </view>
          <view v-if="testResult.ignoreReason" class="mb-8rpx text-[#fa8c16]">
            忽略原因：{{ testResult.ignoreReason }}
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { PrematchRuleVO } from '@/api/fin/prematch'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { computed, reactive, ref } from 'vue'
import {
  deletePrematchRule,
  getPrematchRulePage,
  testParsePrematchRule,
  updatePrematchRuleStatus,
} from '@/api/fin/prematch'
import { useAccess } from '@/hooks/useAccess'

defineOptions({
  name: 'FinPrematchRuleList',
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
/** 规则维护权限（fin:prematch-rule:update / delete） */
const canEdit = computed(() =>
  hasAccessByCodes(['fin:prematch-rule:update']) || hasAccessByCodes(['fin:prematch-rule:delete']))

/** 方向：0=两侧通用、1=贷（收入侧）、2=借（消化侧） */
function directionLabel(value?: number) {
  return { 0: '两侧通用', 1: '贷（收入侧）', 2: '借（消化侧）' }[value ?? 0] ?? '-'
}

/** 动作：0=忽略、1=预收、2=租金挂账、3=转出、4=冲抵、5=退还 */
function actionLabel(value?: number) {
  return { 0: '忽略', 1: '预收', 2: '租金挂账', 3: '转出', 4: '冲抵', 5: '退还' }[value ?? 0] ?? '-'
}

const list = ref<PrematchRuleVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPrematchRulePage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function reload() {
  pagingRef.value?.reload()
}

// ========== 行操作（编辑 / 启停用 / 删除） ==========

const showActions = ref(false)
const activeItem = ref<PrematchRuleVO>()
const rowActions = computed<{ name: string, type: string, color?: string }[]>(() => {
  const item = activeItem.value
  const actions: { name: string, type: string, color?: string }[] = [{ name: '编辑', type: 'edit' }]
  if (item) {
    actions.push({ name: item.status === 1 ? '启用' : '停用', type: 'toggle' })
  }
  actions.push({ name: '删除', type: 'delete', color: '#ee0a24' })
  return actions
})

function openActions(item: PrematchRuleVO) {
  activeItem.value = item
  showActions.value = true
}

function goCreate() {
  uni.navigateTo({ url: '/pages-fin/prematch/rule-form' })
}

function handleRowAction({ item }: { item: { type: string } }) {
  showActions.value = false
  const rule = activeItem.value
  if (!rule) {
    return
  }
  if (item.type === 'edit') {
    uni.navigateTo({ url: `/pages-fin/prematch/rule-form?id=${rule.id}` })
    return
  }
  if (item.type === 'toggle') {
    const next = rule.status === 1 ? 0 : 1
    updatePrematchRuleStatus(rule.id, next).then(() => {
      toast.show(next === 1 ? '已停用' : '已启用')
      reload()
    }).catch(() => {})
    return
  }
  if (item.type === 'delete') {
    dialog.confirm({
      title: '确认删除',
      msg: `确认删除规则【${rule.name}】？删除后下次计算即生效。`,
    }).then(async () => {
      await deletePrematchRule(rule.id)
      toast.show('已删除')
      reload()
    }).catch(() => {})
  }
}

// ========== 摘要试解析 ==========

const showTest = ref(false)
const testing = ref(false)
const testForm = reactive({
  summary: '',
  side: 1,
})
/** 试解析方向：1=贷、2=借 */
const sideOptions = [
  { label: '贷（收入侧）', value: 1 },
  { label: '借（消化侧）', value: 2 },
]
const sideLabels = sideOptions.map(o => o.label)
const sideIndex = computed(() =>
  sideOptions.findIndex(o => o.value === testForm.side))
const testResult = ref<Awaited<ReturnType<typeof testParsePrematchRule>>>()

function handleSideChange(e: any) {
  testForm.side = sideOptions[Number(e.detail.value)]?.value ?? 1
}

function openTestParse() {
  testResult.value = undefined
  showTest.value = true
}

function outcomeLabel(outcome?: string) {
  return { memory: '识别记忆', rule: '识别规则', none: '未命中' }[outcome ?? ''] ?? '-'
}

/** 调试解析接口（走生产解析管道，不落库） */
async function onTestParse() {
  if (!testForm.summary) {
    toast.show('请输入要试解析的摘要')
    return
  }
  testing.value = true
  try {
    testResult.value = await testParsePrematchRule({
      summary: testForm.summary,
      side: testForm.side,
    })
  } catch {
    // 业务错误提示由 http 层统一弹出
  } finally {
    testing.value = false
  }
}
</script>

<style lang="scss" scoped>
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
