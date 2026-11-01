<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="pageTitle" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 顶部提示：与 PC 端节点 formAlert 文案一致 -->
      <view class="m-24rpx mb-0 rounded-12rpx bg-[#e6f4ff] p-20rpx text-24rpx text-[#1677ff]">
        {{ node.formAlert }}
      </view>

      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <!-- 输入文件槽位：每槽位一个上传位（单文件） -->
        <view v-for="input in node.inputs" :key="input.slot" class="form-item">
          <view class="form-label" :class="{ required: input.required }">
            {{ input.label }}
          </view>
          <yd-upload
            v-model="inputUrls[input.slot]"
            accept="all"
            :directory="uploadDirectory(input.slot)"
            :multiple="false"
            :limit="1"
            :file-type="input.fileType"
          />
          <view v-if="input.help" class="mt-8rpx text-22rpx text-[#999]">
            {{ input.help }}
          </view>
        </view>

        <!-- 节点参数（如行程单模板版本） -->
        <view v-for="field in node.paramFields" :key="field.key" class="form-item">
          <view class="form-label required">
            {{ field.label }}
          </view>
          <picker
            mode="selector"
            :range="paramLabels(field)"
            :value="paramIndex(field)"
            @change="(event: any) => handleParamChange(field, event.detail.value)"
          >
            <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx">
              <text class="text-28rpx" :class="paramValues[field.key] ? 'text-[#333]' : 'text-[#999]'">
                {{ paramLabelOf(field) || `请选择${field.label}` }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
          <view v-if="field.help" class="mt-8rpx text-22rpx text-[#999]">
            {{ field.help }}
          </view>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <view class="form-label">
            备注
          </view>
          <wd-textarea
            v-model="description"
            :maxlength="255"
            clearable
            no-border
            placeholder="请输入备注（可选）"
          />
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部提交 -->
    <view class="fixed inset-x-0 bottom-0 z-10 flex gap-16rpx border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button class="flex-1" type="primary" :loading="submitting" @click="onSubmit">
        {{ taskId ? '保存修改' : '提交任务' }}
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FinFileTaskSaveReq } from '@/api/fin/fileTask'
import type { FileTaskNodeParamField } from '../components/file-task-nodes'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { getFileNameFromUrl } from '@/utils/download'
import { getDictOptions } from '@/hooks/useDict'
import { computed, reactive, ref } from 'vue'
import { createFinFileTask, getFinFileTask, updateFinFileTask } from '@/api/fin/fileTask'
import { FILE_TASK_RELOAD_EVENT, getFileTaskNode } from '../components/file-task-nodes'

defineOptions({
  name: 'FinFileTaskForm',
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

/** 节点编码（路由参数，必传） */
const nodeType = ref('')
const node = computed(() => getFileTaskNode(nodeType.value))

/** 编辑任务编号（新建时为空） */
const taskId = ref<number>()

const pageTitle = computed(() =>
  `${taskId.value ? '编辑' : '上传'}${node.value.title || ''}`)

/** 各输入槽位的已传文件地址（单文件 → 长度为 1 的数组） */
const inputUrls = reactive<Record<string, string[]>>({})
/** 节点参数取值（键为 paramFields.key，如 templateVersion） */
const paramValues = reactive<Record<string, string>>({})
const description = ref('')
const submitting = ref(false)

/** 上传目录：按节点 + 槽位隔离，便于文件管理 */
function uploadDirectory(slot: string) {
  return `fin/file-task/${nodeType.value}/${slot}`
}

// ========== 节点参数（picker + 字典选项） ==========

/** 某参数字段的选项列表（字典驱动） */
function paramOptions(field: FileTaskNodeParamField) {
  return field.dictType ? getDictOptions(field.dictType) : []
}
function paramLabels(field: FileTaskNodeParamField) {
  return paramOptions(field).map(item => item.label)
}
function paramIndex(field: FileTaskNodeParamField) {
  return paramOptions(field).findIndex(item => item.value === paramValues[field.key])
}
function paramLabelOf(field: FileTaskNodeParamField) {
  return paramOptions(field).find(item => item.value === paramValues[field.key])?.label
}
function handleParamChange(field: FileTaskNodeParamField, index: number) {
  const option = paramOptions(field)[index]
  if (option) {
    paramValues[field.key] = String(option.value)
  }
}

// ========== 编辑回显 ==========

onLoad(async (query) => {
  nodeType.value = String(query?.nodeType || '')
  if (!nodeType.value) {
    toast.show('缺少节点参数')
    setTimeout(() => navigateBackPlus(), 600)
    return
  }
  taskId.value = query?.id ? Number(query.id) : undefined
  // 新建时恢复节点参数默认值（如行程单模板版本）
  for (const field of node.value.paramFields ?? []) {
    paramValues[field.key] = field.defaultValue || ''
  }
  if (!taskId.value) {
    return
  }
  try {
    const detail = await getFinFileTask(nodeType.value, taskId.value)
    for (const input of node.value.inputs) {
      const file = detail.inputFiles?.find(f => f.slot === input.slot)
      inputUrls[input.slot] = file?.url ? [file.url] : []
    }
    for (const field of node.value.paramFields ?? []) {
      const value = detail.params?.[field.key]
      paramValues[field.key] = value != null ? String(value) : (field.defaultValue || '')
    }
    description.value = detail.description || ''
  } catch {
    // 业务错误 toast 已由 http 层提示
  }
})

/** 默认模板版本兜底：新建行程单任务时若字典暂未加载，仍按新版提交 */
function paramOrDefault(field: FileTaskNodeParamField) {
  return paramValues[field.key] || field.defaultValue
}

// ========== 提交 ==========

/** 组装提交体：各槽位文件收敛为 inputFiles、参数收敛为 params */
function buildSaveParams(): FinFileTaskSaveReq | null {
  const inputFiles = []
  for (const input of node.value.inputs) {
    const url = inputUrls[input.slot]?.[0]
    if (url) {
      inputFiles.push({ slot: input.slot, url, name: getFileNameFromUrl(url) })
    }
  }
  const params: Record<string, any> = {}
  for (const field of node.value.paramFields ?? []) {
    const value = paramOrDefault(field)
    if (value) {
      params[field.key] = value
    }
  }
  return {
    id: taskId.value,
    nodeType: nodeType.value,
    description: description.value.trim() || undefined,
    inputFiles,
    params: Object.keys(params).length > 0 ? params : undefined,
  }
}

function validate(): boolean {
  const missing = node.value.inputs.find(input => input.required && !inputUrls[input.slot]?.length)
  if (missing) {
    toast.show(`请上传「${missing.label}」`)
    return false
  }
  const noParam = (node.value.paramFields ?? []).find(field => !paramOrDefault(field))
  if (noParam) {
    toast.show(`请选择${noParam.label}`)
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) {
    return
  }
  const data = buildSaveParams()
  if (!data) {
    return
  }
  submitting.value = true
  try {
    if (taskId.value) {
      await updateFinFileTask(data)
      toast.success('已保存')
    } else {
      await createFinFileTask(data)
      toast.success('已提交，处理完成后可在列表查看结果')
    }
    uni.$emit(FILE_TASK_RELOAD_EVENT)
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
