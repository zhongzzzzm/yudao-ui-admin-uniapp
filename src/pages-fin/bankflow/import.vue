<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="银行流水导入" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 上传区 -->
      <view class="m-24rpx mb-0 rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx text-28rpx text-[#333] font-500">
          上传银行流水
        </view>
        <yd-upload
          v-model="urls"
          accept="all"
          :multiple="true"
          :limit="9"
          :file-size="20"
          :file-type="['xls', 'xlsx']"
          @uploaded="handleUploaded"
          @remove="handleRemoved"
        >
          <view class="flex flex-col items-center justify-center border border-[#dcdfe6] rounded-16rpx border-dashed py-48rpx">
            <wd-icon name="upload" size="64rpx" color="#018d71" />
            <view class="mt-16rpx text-26rpx text-[#666]">
              点击上传银行流水 Excel
            </view>
            <view class="mt-8rpx text-22rpx text-[#999]">
              支持 xls/xlsx，单个 ≤ 20MB，可多选多银行文件
            </view>
          </view>
        </yd-upload>
        <view class="mt-16rpx text-22rpx text-[#999]">
          上传后自动解析并匹配模板；同一文件重复导入会自动跳过已存在的流水。未匹配到模板的文件请在 PC 端手动映射。
        </view>
      </view>

      <!-- 空态 -->
      <view v-if="!items.length" class="py-80rpx text-center text-26rpx text-[#999]">
        还没有待导入的文件，请先上传银行流水 Excel
      </view>

      <!-- 文件卡片 -->
      <view
        v-for="item in items"
        :key="item.url"
        class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-center justify-between">
          <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
            {{ item.name }}
          </view>
          <wd-tag
            class="ml-16rpx flex-shrink-0"
            :type="statusTagType(item)"
            plain
          >
            {{ statusLabel(item) }}
          </wd-tag>
        </view>

        <!-- 解析中 / 失败 -->
        <view v-if="item.status === 'parsing'" class="text-24rpx text-[#999]">
          解析中…
        </view>
        <view v-else-if="item.status === 'error'" class="text-24rpx text-[#f5222d]">
          {{ item.errorMsg || '解析失败' }}
        </view>

        <!-- 导入结果（导入完成后优先展示） -->
        <template v-else-if="item.imported && item.result">
          <view class="flex flex-wrap gap-x-32rpx gap-y-8rpx text-24rpx text-[#777]">
            <view>
              新增 <text class="text-[#52c41a] font-500">{{ item.result.successRows ?? 0 }}</text> 行
            </view>
            <view>重复跳过 {{ item.result.duplicateRows ?? 0 }} 行</view>
            <view>异常 {{ item.result.errorRows ?? 0 }} 行</view>
          </view>
          <view
            v-if="item.result.directionReversalSuspect"
            class="mt-12rpx rounded-8rpx bg-[#fff7e6] px-16rpx py-12rpx text-22rpx text-[#fa8c16]"
          >
            疑似方向规则配反：收入支出占比异常，请核对模板方向规则
          </view>
          <view v-if="(item.result.errors?.length ?? 0) > 0" class="mt-12rpx">
            <view
              class="text-24rpx text-[#018d71]"
              @click="downloadErrorsCsv(item.name, item.result.errors || [])"
            >
              下载异常明细
            </view>
          </view>
        </template>

        <!-- 解析预览（未导入） -->
        <template v-else-if="item.status === 'ready' && item.preview">
          <view v-if="!item.preview.matched" class="rounded-8rpx bg-[#fff7e6] px-16rpx py-12rpx text-22rpx text-[#fa8c16]">
            未自动识别到匹配模板，请在 PC 端导入页手动映射后保存为模板
          </view>
          <template v-else>
            <view class="mb-8rpx text-22rpx text-[#999]">
              匹配模板：{{ item.preview.templateName || '自动识别' }}（{{ item.preview.matchBasis || '自动识别' }}）
            </view>
            <view class="flex flex-wrap gap-x-32rpx gap-y-8rpx text-24rpx text-[#777]">
              <view>共 <text class="text-[#333] font-500">{{ item.preview.totalRows ?? 0 }}</text> 行</view>
              <view>可导入 <text class="text-[#52c41a] font-500">{{ item.preview.successRows ?? 0 }}</text></view>
              <view>重复 <text class="text-[#fa8c16] font-500">{{ item.preview.duplicateRows ?? 0 }}</text></view>
              <view>异常 <text class="text-[#f5222d] font-500">{{ item.preview.errorRows ?? 0 }}</text></view>
            </view>
            <!-- 同文件重复导入提示 -->
            <view
              v-if="item.preview.importedBefore"
              class="mt-12rpx rounded-8rpx bg-[#e6f4ff] px-16rpx py-12rpx text-22rpx text-[#1677ff]"
            >
              该文件此前已导入过（成功 {{ item.preview.importedSuccessRows ?? 0 }} 行），再次导入将自动跳过已存在流水
            </view>
            <!-- 异常行 -->
            <view v-if="(item.preview.errors?.length ?? 0) > 0" class="mt-12rpx">
              <view
                class="text-24rpx text-[#018d71]"
                @click="downloadErrorsCsv(item.name, item.preview.errors || [])"
              >
                下载异常明细
              </view>
            </view>
          </template>
        </template>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部导入确认条 -->
    <view
      v-if="readyItems.length"
      class="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-t-[#f0f0f0] bg-white px-24rpx py-16rpx pb-[calc(16rpx+env(safe-area-inset-bottom))]"
    >
      <view class="min-w-0 flex-1 text-24rpx text-[#666]">
        <template v-if="importing">
          正在导入，请勿关闭页面…
        </template>
        <template v-else>
          可导入 <text class="text-[#52c41a] font-500">{{ totals.success }}</text> 行 ·
          重复 {{ totals.duplicate }} · 异常 {{ totals.errors }}
          <text class="text-22rpx text-[#999]">（异常行不参与导入）</text>
        </template>
      </view>
      <wd-button
        type="primary"
        size="small"
        :loading="importing"
        :disabled="totals.success === 0"
        @click="handleImport"
      >
        开始导入
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { BankFlowImportRespVO, BankFlowParsePreviewRespVO, BankFlowRowErrorVO } from '@/api/fin/bankFlow'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { computed, ref } from 'vue'
import { importBankFlows, parseBankFlowPreview } from '@/api/fin/bankFlow'
import { downloadTextFileH5 } from '@/utils/download'

defineOptions({
  name: 'FinBankFlowImport',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()

function handleBack() {
  navigateBackPlus()
}

// ========== 文件列表（上传 → 解析预览 → 导入） ==========

/** yd-upload 收集到的文件访问地址（仅作上传组件受控值） */
const urls = ref<string[]>([])

/** 单个待导入文件状态 */
interface ImportItem {
  url: string // 上传后的访问地址（infra 存储）
  name: string // 文件名
  status: 'parsing' | 'ready' | 'error' // 解析状态
  errorMsg?: string // 解析失败原因
  preview?: BankFlowParsePreviewRespVO // 解析预览结果
  importing?: boolean // 导入中
  imported?: boolean // 已导入
  result?: BankFlowImportRespVO // 导入结果
}

const items = ref<ImportItem[]>([])

/** 从上传结果中解析文件的访问地址（与 yd-upload 内部口径一致） */
function resolveItemUrl(file: any): string {
  if (file?.response) {
    try {
      const response = typeof file.response === 'string' ? JSON.parse(file.response) : file.response
      return response?.data || file.url
    } catch {
      return file.url
    }
  }
  return file?.url || ''
}

/** 上传完成：加入列表并自动解析预览（同一地址去重） */
function handleUploaded(url: string, name?: string) {
  if (!url || items.value.some(item => item.url === url)) {
    return
  }
  const item: ImportItem = {
    url,
    name: name || url.split('/').pop() || '银行流水文件',
    status: 'parsing',
  }
  items.value.push(item)
  parseItem(item)
}

/** 从上传列表移除：按访问地址同步移除文件卡片（本地临时路径 / 远程地址都尝试匹配） */
function handleRemoved(event: any) {
  const file = event?.file
  const remoteUrl = resolveItemUrl(file)
  items.value = items.value.filter(item => item.url !== remoteUrl && item.url !== file?.url)
}

/** 解析预览（不落库）：匹配模板 + 行数统计 + 异常行 */
async function parseItem(item: ImportItem) {
  item.status = 'parsing'
  item.errorMsg = undefined
  try {
    item.preview = await parseBankFlowPreview({ fileUrl: item.url, fileName: item.name })
    item.status = 'ready'
  } catch (e: any) {
    item.status = 'error'
    item.errorMsg = e?.message || '解析失败，请确认文件为银行流水导出 Excel'
  }
}

const readyItems = computed(() => items.value.filter(item => item.status === 'ready' && !item.imported))

/** 可导入行数汇总（仅未导入的文件） */
const totals = computed(() => {
  let success = 0
  let duplicate = 0
  let errors = 0
  readyItems.value.forEach((item) => {
    success += item.preview?.successRows ?? 0
    duplicate += item.preview?.duplicateRows ?? 0
    errors += item.preview?.errorRows ?? 0
  })
  return { success, duplicate, errors }
})

function statusTagType(item: ImportItem): 'primary' | 'success' | 'error' | 'warning' | 'info' {
  if (item.status === 'error') {
    return 'error'
  }
  if (item.imported) {
    return 'success'
  }
  if (item.status === 'parsing') {
    return 'primary'
  }
  return item.preview?.matched ? 'success' : 'warning'
}

function statusLabel(item: ImportItem): string {
  if (item.status === 'error') {
    return '失败'
  }
  if (item.imported) {
    return '已导入'
  }
  if (item.status === 'parsing') {
    return '解析中'
  }
  return item.preview?.matched ? '待导入' : '未识别'
}

// ========== 导入 ==========

const importing = ref(false)

async function handleImport() {
  if (!readyItems.value.length || importing.value) {
    return
  }
  // 同文件重复导入确认
  const beforeItems = readyItems.value.filter(item => item.preview?.importedBefore)
  if (beforeItems.length) {
    dialog.confirm({
      title: '存在重复导入的文件',
      msg: `${beforeItems.map(item => item.name).join('、')} 此前已成功导入过，继续导入将自动跳过已存在的流水，仅补录新增行。是否继续？`,
    }).then(() => doImport()).catch(() => {})
    return
  }
  await doImport()
}

/** 逐文件串行导入（幂等：重复行后端自动跳过），结束后汇总提示并通知列表刷新 */
async function doImport() {
  importing.value = true
  let successCount = 0
  let failCount = 0
  try {
    for (const item of readyItems.value) {
      item.importing = true
      try {
        item.result = await importBankFlows({ fileUrl: item.url, fileName: item.name })
        item.imported = true
        successCount++
      } catch (e: any) {
        item.status = 'error'
        item.errorMsg = e?.message || '导入失败'
        failCount++
      } finally {
        item.importing = false
      }
    }
  } finally {
    importing.value = false
    // 通知列表页刷新（导入完成后流水明细有新数据）
    if (successCount > 0) {
      uni.$emit('fin:bankflow:reload')
    }
    if (failCount === 0) {
      toast.show(`导入完成，成功 ${successCount} 个文件`)
    } else {
      toast.show(`成功 ${successCount} 个文件，失败 ${failCount} 个`)
    }
  }
}

// ========== 异常明细下载（CSV，含 BOM 防 Excel 乱码） ==========

function downloadErrorsCsv(fileName: string, errors: BankFlowRowErrorVO[]) {
  const lines = [
    '行号,原因',
    ...errors.map(e => `${e.rowNo},"${e.reason.replace(/"/g, '""')}"`),
  ]
  const content = `\uFEFF${lines.join('\n')}`
  // #ifdef H5
  downloadTextFileH5(content, `${fileName}_异常明细.csv`, 'text/csv;charset=utf-8')
  // #endif
  // #ifndef H5
  toast.show('异常明细请前往 H5 端或 PC 端下载')
  // #endif
}
</script>
