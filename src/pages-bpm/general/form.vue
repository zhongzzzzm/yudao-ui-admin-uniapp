<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow :title="pageTitle" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 表单区 -->
      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="form-item">
          <view class="form-label required">
            申请标题
          </view>
          <wd-input
            v-model="form.title"
            :maxlength="128"
            clearable
            no-border
            placeholder="如：11 月团建经费申请"
          />
        </view>
        <view class="form-item">
          <view class="form-label required">
            申请事由
          </view>
          <wd-textarea
            v-model="form.reason"
            :maxlength="2000"
            show-word-limit
            clearable
            no-border
            placeholder="申请事由（2000 字以内）"
          />
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label mb-0">
            申请金额（元）
          </view>
          <wd-input
            v-model="amountText"
            class="w-240rpx text-right"
            type="digit"
            no-border
            placeholder="0.00"
          />
        </view>
        <view class="form-item">
          <view class="form-label">
            附件
          </view>
          <yd-upload
            v-model="attachmentUrls"
            accept="all"
            directory="bpm-general"
            :limit="9"
          />
        </view>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作 -->
    <view class="fixed inset-x-0 bottom-0 z-10 flex gap-16rpx border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button class="flex-1" plain @click="onSaveDraft">
        保存草稿
      </wd-button>
      <wd-button class="flex-1" type="primary" @click="onOpenSubmit">
        提交审批
      </wd-button>
    </view>

    <!-- 提交审批弹层：选流程 → 审批链预览 → 自选审批人 -->
    <wd-popup v-model="showSubmit" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="max-h-[75vh] overflow-y-auto px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          提交审批
        </view>

        <!-- 选择流程 -->
        <view class="form-item">
          <view class="form-label required">
            审批流程
          </view>
          <picker mode="selector" :range="definitionLabels" @change="handleDefinitionChange">
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="selectedDefinitionId ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedDefinitionLabel || '请选择审批流程' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
          <view v-if="definitions.length === 0 && definitionsLoaded" class="mt-8rpx text-24rpx text-[#fa8c16]">
            暂无绑定「通用申请单」的启用流程，请联系管理员
          </view>
        </view>

        <!-- 发起人自选审批人节点 -->
        <view v-for="(node, index) in selfSelectNodes" :key="node.nodeKey" class="form-item">
          <view class="form-label required">
            节点【{{ node.nodeName }}】审批人
          </view>
          <UserPicker
            v-model="node.userIds"
            type="checkbox"
            title="选择审批人"
            @confirm="(users: User[]) => onSelfSelectConfirm(index, users)"
          >
            <template #default>
              <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
                <text class="text-28rpx" :class="node.userIds.length > 0 ? 'text-[#333]' : 'text-[#999]'">
                  {{ node.userNames.join('、') || '请选择审批人' }}
                </text>
                <wd-icon name="arrow-right" size="24rpx" color="#999" />
              </view>
            </template>
          </UserPicker>
        </view>

        <!-- 审批链预览 -->
        <view v-if="selectedDefinitionId" class="mb-24rpx rounded-12rpx bg-[#f7f8fa] p-20rpx">
          <view class="mb-12rpx text-24rpx text-[#999]">
            审批链预览
          </view>
          <view v-if="preview && !preview.canStart" class="mb-12rpx rounded-8rpx bg-[#fff1f0] px-16rpx py-12rpx text-24rpx text-[#f5222d]">
            您不在该流程的发起范围内，提交将被拒绝
          </view>
          <view
            v-for="(node, nIndex) in preview?.nodes || []"
            :key="node.nodeKey"
            class="mb-16rpx border-b border-b-[#e8e8e8] border-b-dashed pb-16rpx last:mb-0 last:border-b-0 last:pb-0"
          >
            <view class="flex items-center gap-12rpx">
              <view class="h-36rpx w-36rpx flex shrink-0 items-center justify-center rounded-full bg-[#018d71] text-22rpx text-white">
                {{ nIndex + 1 }}
              </view>
              <text class="text-28rpx text-[#333] font-500">
                {{ node.nodeName }}
              </text>
              <text class="text-22rpx text-[#999]">
                {{ node.nodeTypeName }}<template v-if="node.approveModeName"> · {{ node.approveModeName }}</template>
              </text>
            </view>
            <view class="mt-6rpx pl-48rpx text-24rpx">
              <view>
                <text class="text-[#999]">审批人：</text>
                <text :class="node.assigneeEmpty && !(node.fallbackNames && node.fallbackNames.length) ? 'text-[#f5222d]' : 'text-[#555]'">
                  {{ assigneeText(node) }}
                </text>
              </view>
              <view v-if="node.conditionsText" class="text-[#999]">
                条件：{{ node.conditionsText }}
              </view>
              <view v-if="node.timeoutHours" class="text-[#bbb]">
                超时 {{ node.timeoutHours }} 小时催办<template v-if="node.timeoutAction === 2">
                  ，超时自动通过
                </template><template v-if="node.timeoutAction === 3">
                  ，超时自动退回发起人
                </template>
              </view>
            </view>
          </view>
          <view v-if="preview && preview.nodes.length === 0" class="text-24rpx text-[#bbb]">
            未获取到节点信息
          </view>
        </view>

        <view class="flex gap-16rpx">
          <wd-button class="flex-1" plain @click="showSubmit = false">
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="submitting"
            :disabled="!selectedDefinitionId"
            @click="onSubmitConfirm"
          >
            确认提交
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { BpmDefinitionNode, BpmDefinitionVO } from '@/api/bpm/definition'
import type { BpmPreviewNode } from '@/api/bpm/instance'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { getFileNameFromUrl } from '@/utils/download'
import UserPicker from '@/components/system-select/user-picker.vue'
import {
  createBpmGeneralApply,
  getBpmGeneralApply,
  submitBpmGeneralApply,
  updateBpmGeneralApply,
} from '@/api/bpm/general'
import { getBpmDefinition, getSimpleBpmDefinitionList } from '@/api/bpm/definition'
import { getBpmInstancePreview } from '@/api/bpm/instance'
import { computed, ref } from 'vue'

defineOptions({
  name: 'BpmGeneralApplyForm',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()

function handleBack() {
  navigateBackPlus()
}

/** 编辑单据编号（新建时为空） */
const applyId = ref<number>()

const pageTitle = computed(() => (applyId.value ? '编辑申请单' : '新建申请单'))

/** 表单数据（附件以 URL 数组维护，保存时序列化为 [{url, name}] JSON） */
const form = ref({
  title: '',
  reason: '',
})
const amountText = ref('')
const attachmentUrls = ref<string[]>([])
const loading = ref(false)

onLoad(async (query) => {
  if (query?.id) {
    applyId.value = Number(query.id)
    loading.value = true
    try {
      const detail = await getBpmGeneralApply(applyId.value)
      form.value.title = detail.title
      form.value.reason = detail.reason
      amountText.value = detail.amount != null ? String(detail.amount) : ''
      attachmentUrls.value = parseAttachments(detail.attachments).map(item => item.url)
    } finally {
      loading.value = false
    }
  }
})

/** 解析附件 JSON（[{url, name}]，兼容脏数据） */
function parseAttachments(attachments?: string): { name?: string, url: string }[] {
  if (!attachments) {
    return []
  }
  try {
    const parsed = JSON.parse(attachments)
    return Array.isArray(parsed) ? parsed.filter(item => item?.url) : []
  } catch {
    return []
  }
}

/** 金额文本 → 数值（非法输入按 0 处理） */
const amountValue = computed(() => {
  const num = Number(amountText.value)
  return Number.isFinite(num) && num >= 0 ? num : 0
})

/** 组装保存参数 */
function buildSaveParams() {
  return {
    id: applyId.value,
    title: form.value.title.trim(),
    reason: form.value.reason.trim(),
    amount: amountValue.value,
    attachments: JSON.stringify(
      attachmentUrls.value.map(url => ({ url, name: getFileNameFromUrl(url) || '附件' })),
    ),
  }
}

function validateBase(): boolean {
  if (!form.value.title.trim() || !form.value.reason.trim()) {
    toast.show('请填写申请标题与事由')
    return false
  }
  return true
}

/** 保存草稿（新建 → create，编辑 → update） */
async function onSaveDraft() {
  if (!validateBase()) {
    return
  }
  try {
    if (applyId.value) {
      await updateBpmGeneralApply(buildSaveParams())
    } else {
      applyId.value = await createBpmGeneralApply(buildSaveParams())
    }
    toast.success('已保存')
  } catch {
    // 业务错误 toast 已由 http 层提示
  }
}

// ========== 提交审批（选流程 → 自选审批人 → 提交） ==========

interface SelfSelectNode {
  nodeKey: string
  nodeName: string
  userIds: number[]
  userNames: string[]
}

const showSubmit = ref(false)
const submitting = ref(false)
const definitions = ref<BpmDefinitionVO[]>([])
const definitionsLoaded = ref(false)
const selectedDefinitionId = ref<number>()
const selfSelectNodes = ref<SelfSelectNode[]>([])
const preview = ref<Awaited<ReturnType<typeof getBpmInstancePreview>>>()

const definitionLabels = computed(() =>
  definitions.value.map(d => `${d.name}（v${d.version}）`),
)
const selectedDefinitionLabel = computed(() => {
  const index = definitions.value.findIndex(d => d.id === selectedDefinitionId.value)
  return index >= 0 ? definitionLabels.value[index] : ''
})

/** 打开提交弹层：拉取绑定「通用申请单」的启用流程 */
async function onOpenSubmit() {
  if (!validateBase()) {
    return
  }
  if (!definitionsLoaded.value) {
    try {
      const all = await getSimpleBpmDefinitionList()
      definitions.value = all.filter(d => d.businessModule === 'bpm_general')
      definitionsLoaded.value = true
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }
  showSubmit.value = true
}

/** 选择流程后：加载审批链预览，并解析「发起人自选」审批人节点 */
async function handleDefinitionChange(event: { detail: { value: number } }) {
  const definition = definitions.value[event.detail.value]
  if (!definition) {
    return
  }
  selectedDefinitionId.value = definition.id
  preview.value = undefined
  selfSelectNodes.value = []
  try {
    const detail = await getBpmDefinition(definition.id)
    const nodes = parseNodes(detail.nodes)
    selfSelectNodes.value = nodes
      .filter(node => node.assignee?.type === 4)
      .map(node => ({ nodeKey: node.nodeKey, nodeName: node.nodeName, userIds: [], userNames: [] }))
  } catch {
    // 节点解析失败不阻断，提交时后端仍强校验
  }
  try {
    preview.value = await getBpmInstancePreview(definition.id)
  } catch {
    // 预览失败不阻断，提交时后端仍强校验
  }
}

/** 解析流程定义的节点配置 JSON（兼容脏数据） */
function parseNodes(nodesJson?: string): BpmDefinitionNode[] {
  if (!nodesJson) {
    return []
  }
  try {
    const parsed = JSON.parse(nodesJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 自选审批人确认：写回节点已选用户 */
function onSelfSelectConfirm(index: number, users: User[]) {
  const node = selfSelectNodes.value[index]
  if (node) {
    node.userIds = users.map(user => user.id!)
    node.userNames = users.map(user => user.nickname || String(user.id))
  }
}

/** 预览节点的审批人展示文案（与 PC 端口径一致） */
function assigneeText(node: BpmPreviewNode): string {
  if (node.selfSelect) {
    return '发起人自选（提交时选择）'
  }
  if (node.businessResolved) {
    return '由业务单据解析（发起时确定）'
  }
  if (node.assigneeNames && node.assigneeNames.length > 0) {
    return node.assigneeNames.join('、')
  }
  if (node.fallbackNames && node.fallbackNames.length > 0) {
    return `兜底：${node.fallbackNames.join('、')}`
  }
  return '无法确定审批人'
}

/** 确认提交：校验自选节点 → 保存单据 → 发起流程 */
async function onSubmitConfirm() {
  if (!selectedDefinitionId.value) {
    return
  }
  const missing = selfSelectNodes.value.find(node => node.userIds.length === 0)
  if (missing) {
    toast.show(`请选择节点【${missing.nodeName}】的审批人`)
    return
  }
  submitting.value = true
  try {
    const selfSelectAssignees: Record<string, number[]> = {}
    selfSelectNodes.value.forEach((node) => {
      selfSelectAssignees[node.nodeKey] = node.userIds
    })
    // 提交接口事务内「保存单据 + 发起流程」：草稿先落库拿编号，再提交
    if (!applyId.value) {
      applyId.value = await createBpmGeneralApply(buildSaveParams())
    }
    await submitBpmGeneralApply({
      ...buildSaveParams(),
      id: applyId.value,
      definitionId: selectedDefinitionId.value,
      selfSelectAssignees: Object.keys(selfSelectAssignees).length > 0 ? selfSelectAssignees : undefined,
    })
    toast.success('提交成功，已进入审批')
    showSubmit.value = false
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #333;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
