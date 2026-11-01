<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="node.title" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

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
      :empty-view-text="`暂无${node.title}数据`"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ itemTitle(item) }}
            </view>
            <wd-tag :type="statusTagType(item.status)" plain class="ml-16rpx flex-shrink-0">
              {{ statusLabel(item.status) }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777] space-y-6rpx">
            <view v-for="input in inputSections(item)" :key="input.label" class="line-clamp-1">
              {{ input.label }}：{{ input.name }}
            </view>
            <view v-if="resultSection(item)" class="line-clamp-1 text-[#018d71]">
              结果文件：{{ resultSection(item)?.name }}
            </view>
            <view class="line-clamp-1">
              创建时间：{{ formatDateTime(item.createTime) }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增入口：上传文件发起任务 -->
    <wd-fab
      v-if="canCreate"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="goForm()"
    />

    <!-- 详情弹层：输入文件可预览，结果文件按权限预览，支持编辑/删除 -->
    <wd-popup v-model="showDetail" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          {{ activeItem ? itemTitle(activeItem) : `${node.title}详情` }}
        </view>

        <!-- 状态与结果摘要 -->
        <view v-if="activeItem" class="mb-16rpx flex items-center gap-16rpx">
          <wd-tag :type="statusTagType(activeItem.status)" plain>
            {{ statusLabel(activeItem.status) }}
          </wd-tag>
          <view v-if="activeItem.resultSummary" class="line-clamp-2 flex-1 text-24rpx text-[#999]">
            {{ activeItem.resultSummary }}
          </view>
        </view>

        <!-- 输入文件 -->
        <view v-for="section in inputSections(activeItem ?? undefined)" :key="section.label" class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            {{ section.label }}
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="mb-12rpx text-24rpx text-[#333]">
              {{ section.name }}
            </view>
            <wd-button
              v-if="section.url"
              size="small"
              type="primary"
              plain
              @click="previewFile(section.url, section.name)"
            >
              预览文件
            </wd-button>
          </view>
        </view>

        <!-- 结果文件（按 downloadResult 权限预览） -->
        <view v-if="activeResult" class="mb-16rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            结果文件
          </view>
          <view class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="mb-12rpx text-24rpx text-[#333]">
              {{ activeResult.name }}
            </view>
            <wd-button
              v-if="canDownloadResult"
              size="small"
              type="primary"
              plain
              @click="previewFile(activeResult.url, activeResult.name)"
            >
              查看结果文件
            </wd-button>
            <view v-else class="text-24rpx text-[#bbb]">
              暂无查看结果文件权限
            </view>
          </view>
        </view>

        <view class="mb-16rpx text-24rpx text-[#999]">
          创建时间：{{ formatDateTime(activeItem?.createTime) }}
        </view>

        <!-- 操作：编辑 / 删除（权限与 PC 端一致） -->
        <view v-if="activeItem" class="flex gap-16rpx">
          <wd-button v-if="canUpdate" class="flex-1" plain type="primary" @click="goForm(activeItem.id)">
            编辑
          </wd-button>
          <wd-button v-if="canDelete" class="flex-1" plain type="error" @click="onDelete(activeItem)">
            删除
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FinFileTaskVO } from '@/api/fin/fileTask'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { getFileNameFromUrl } from '@/utils/download'
import { formatDateTime } from '@/utils/date'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { deleteFinFileTask, getFinFileTaskPage } from '@/api/fin/fileTask'
import { FILE_TASK_RELOAD_EVENT, getFileTaskNode } from './file-task-nodes'

/**
 * 财务文件任务通用列表（行程单拆分/住宿单拆分/发票三域共用）。
 *
 * 由各列表页传入 nodeType 渲染对应节点：状态筛选、任务列表、详情预览、
 * 新增/编辑（跳表单页）、删除，权限按节点配置的 authPrefix 动态判断。
 */
const props = defineProps<{
  /** 节点编码（fin_file_task.node_type，如 bx_airline） */
  nodeType: string
}>()

const node = getFileTaskNode(props.nodeType)

function handleBack() {
  navigateBackPlus()
}

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const canCreate = hasAccessByCodes([`${node.authPrefix}:create`])
const canUpdate = hasAccessByCodes([`${node.authPrefix}:update`])
const canDelete = hasAccessByCodes([`${node.authPrefix}:delete`])
const canDownloadResult = hasAccessByCodes([`${node.authPrefix}:downloadResult`])

/** fin 文件任务统一状态：0 处理中 1 处理完成 2 处理失败 */
const statusChips = [
  { label: '全部', value: -1 },
  { label: '处理中', value: 0 },
  { label: '处理完成', value: 1 },
  { label: '处理失败', value: 2 },
]

const currentStatus = ref(-1)
const list = ref<FinFileTaskVO[]>([])
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
    const data = await getFinFileTaskPage({
      pageNo,
      pageSize,
      nodeType: props.nodeType,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 列表表单页保存后刷新（表单页 uni.$emit 通知） */
function reload() {
  pagingRef.value?.reload()
}
onMounted(() => uni.$on(FILE_TASK_RELOAD_EVENT, reload))
onUnmounted(() => uni.$off(FILE_TASK_RELOAD_EVENT, reload))

function statusLabel(status?: number | null): string {
  return ({ 0: '处理中', 1: '处理完成', 2: '处理失败' } as Record<number, string>)[status ?? -1] ?? '未知'
}

function statusTagType(status?: number | null): 'primary' | 'success' | 'error' | 'info' {
  if (status === 1) {
    return 'success'
  }
  if (status === 2) {
    return 'error'
  }
  if (status === 0) {
    return 'primary'
  }
  return 'info'
}

/** 卡片标题：失败记录的 description 可能是异常堆栈，统一回退为节点名 */
function itemTitle(item: FinFileTaskVO): string {
  if (item.status === 2) {
    return item.nodeLabel || node.title
  }
  return item.description || item.nodeLabel || node.title
}

/** 输入文件区：按节点槽位展开为 文件名 列表 */
function inputSections(item?: FinFileTaskVO) {
  if (!item) {
    return []
  }
  return node.inputs.map(({ slot, label }) => {
    const file = item.inputFiles?.find(f => f.slot === slot)
    const url = file?.url || ''
    return { label, url, name: url ? (file?.name || getFileNameFromUrl(url)) : '-' }
  })
}

/** 结果文件区：输出槽位固定为 result */
function resultSection(item?: FinFileTaskVO) {
  const file = item?.outputFiles?.find(f => f.slot === 'result')
  return file?.url
    ? { url: file.url, name: file.name || getFileNameFromUrl(file.url) }
    : undefined
}

// ========== 详情弹层 ==========

const showDetail = ref(false)
const activeItem = ref<FinFileTaskVO | null>(null)

/** 当前详情的结果文件（无则不渲染结果区块） */
const activeResult = computed(() => resultSection(activeItem.value ?? undefined))

function openDetail(item: FinFileTaskVO) {
  activeItem.value = item
  showDetail.value = true
}

/** 跳新增/编辑表单页 */
function goForm(id?: number) {
  showDetail.value = false
  uni.navigateTo({
    url: `/pages-fin/file-task/form?nodeType=${props.nodeType}${id ? `&id=${id}` : ''}`,
  })
}

/** 删除任务（二次确认） */
async function onDelete(item: FinFileTaskVO) {
  showDetail.value = false
  await dialog.confirm({
    title: '删除确认',
    msg: `确定删除该${node.title}任务（编号 ${item.id}）吗？`,
  })
  try {
    await deleteFinFileTask(props.nodeType, item.id)
    toast.success('删除成功')
    reload()
  } catch {
    // 业务错误 toast 已由 http 层提示
  }
}

/** 统一走 kkfileview 预览，失败由预览页兜底 */
function previewFile(url: string, name?: string) {
  uni.navigateTo({
    url: `/pages/common/preview?fileUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(name || '')}`,
  })
}
</script>
