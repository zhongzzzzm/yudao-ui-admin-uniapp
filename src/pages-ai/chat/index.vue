<script lang="ts" setup>
import type { AiCard, AiMessage, AiProgressItem, deleteAiConversation, feedbackAiMessage, getAiConversationMessages, getAiConversationPage, goCardLink, renameAiConversation } from '@/api/ai/chat'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import MarkdownIt from 'markdown-it'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

import { sendSsePost } from '@/http/sse'

defineOptions({ name: 'AiChat' })

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const md = new MarkdownIt({ breaks: true, html: false, linkify: true })

const DEFAULT_ASKS = ['我的待办有哪些？', '未来 7 天有哪些到期任务？', '本月还有哪些税要申报？']
const MAX_INPUT = 2000

interface ChatMessageView {
  cards: AiCard[]
  content: string
  errorText?: string
  id?: number
  role: 'assistant' | 'user'
  status: 'done' | 'error' | 'streaming'
  tools: { label: string, name: string, status: 'done' | 'running' }[]
}

const messages = ref<ChatMessageView[]>([])
const inputValue = ref('')
const streaming = ref(false)
const ctrl = ref(new AbortController())
const scrollTop = ref(0)
const historyOpen = ref(false)
const historyList = ref<{ id: number, title: string }[]>([])
const renameOpen = ref(false)
const renameId = ref<number>()
const renameDraft = ref('')
const activeTitle = ref('AI 助手')
const employeeId = ref<number>()
const employeeGreeting = ref('')
const employeeQuickAsks = ref<string[]>([])

// 页面参数：employeeId/name（从员工列表页进入时携带）
onLoad((query) => {
  if (query?.employeeId) {
    employeeId.value = Number(query.employeeId)
    activeTitle.value = query.name ? decodeURIComponent(query.name) : 'AI 助手'
    if (query.greeting)
      employeeGreeting.value = decodeURIComponent(query.greeting)
    if (query.quickAsks) {
      try {
        employeeQuickAsks.value = JSON.parse(decodeURIComponent(query.quickAsks))
      } catch {}
    }
  }
})

/** markdown 渲染（防注入：html 关闭 + 输出经小程序富文本绑定） */
function renderMd(text: string): string {
  return md.render(text || '')
}

function parseCards(json?: string): AiCard[] {
  if (!json)
    return []
  try {
    return JSON.parse(json) as AiCard[]
  } catch {
    return []
  }
}

function scrollToBottom() {
  nextTick(() => {
    // 交替设置触发 scroll-view 滚动到底部
    scrollTop.value = scrollTop.value === 999999 ? 999998 : 999999
  })
}

function send(text?: string) {
  const content = (text ?? inputValue.value).trim()
  if (!content || streaming.value)
    return
  inputValue.value = ''
  messages.value.push({ cards: [], content, role: 'user', status: 'done', tools: [] })
  const assistant: ChatMessageView = { cards: [], content: '', role: 'assistant', status: 'streaming', tools: [] }
  messages.value.push(assistant)
  streaming.value = true
  ctrl.value = new AbortController()
  scrollToBottom()

  sendSsePost<{ content: string, conversationId?: number, employeeId?: number }>('/ai/chat/stream', {
    ctrl: ctrl.value,
    data: { content, employeeId: employeeId.value },
    onClose: () => {
      if (assistant.status === 'streaming')
        assistant.status = 'done'
      streaming.value = false
    },
    onError: () => {
      assistant.status = 'error'
      assistant.errorText = '网络异常，请稍后重试'
      streaming.value = false
    },
    onMessage: async (res) => {
      // sse.ts 解析出的 data 行；PC 协议下每帧为 JSON：<event 数据>
      // uni 分包无法读取 event 行名，这里约定后端移动端场景事件顺序可解析：
      // message 帧是 JSON 字符串，其余帧是对象。由内容类型区分。
      const raw = res.data
      if (!raw || raw === '[DONE]')
        return
      let parsed: any
      try {
        parsed = JSON.parse(raw)
      } catch {
        return
      }
      if (typeof parsed === 'string') {
        assistant.content += parsed
        scrollToBottom()
        return
      }
      if (parsed.conversationId && parsed.userMessageId) {
        // meta 帧
        return
      }
      if (parsed.messageId && parsed.stopped !== undefined) {
        assistant.id = parsed.messageId
        assistant.status = 'done'
        streaming.value = false
        return
      }
      if (parsed.code && parsed.message && !parsed.type) {
        assistant.status = 'error'
        assistant.errorText = parsed.message
        streaming.value = false
        return
      }
      if (parsed.type && (parsed.type === 'progress' || parsed.type === 'table' || parsed.type === 'chart' || parsed.type === 'approval_summary' || parsed.type === 'prefill')) {
        assistant.cards.push(parsed)
        scrollToBottom()
        return
      }
      if (parsed.name && parsed.status && parsed.label !== undefined) {
        const step = assistant.tools.find(t => t.name === parsed.name && t.status === 'running')
        if (step)
          step.status = 'done'
        else
          assistant.tools.push({ label: parsed.label, name: parsed.name, status: 'running' })
      }
    },
  })
}

function stop() {
  ctrl.value.abort()
  streaming.value = false
}

async function retry(item: ChatMessageView) {
  const index = messages.value.indexOf(item)
  for (let i = index - 1; i >= 0; i--) {
    if (messages.value[i]?.role === 'user') {
      const content = messages.value[i]!.content
      messages.value.splice(i)
      send(content)
      return
    }
  }
}

async function feedback(item: ChatMessageView, rating: 1 | -1) {
  if (!item.id)
    return
  await feedbackAiMessage(item.id, rating)
  toast.show('感谢反馈')
}

async function openHistory() {
  const page = await getAiConversationPage()
  historyList.value = page.list.map(item => ({ id: item.id, title: item.title }))
  historyOpen.value = true
}

async function loadHistory(id: number, title: string) {
  historyOpen.value = false
  const list = await getAiConversationMessages(id)
  messages.value = list.map((item: AiMessage) => ({
    cards: parseCards(item.cardsJson),
    content: item.content,
    id: item.id,
    role: item.role,
    status: 'done',
    tools: [],
  }))
  activeTitle.value = title
  scrollToBottom()
}

function startRename(item: { id: number, title: string }) {
  renameId.value = item.id
  renameDraft.value = item.title
  renameOpen.value = true
}

async function confirmRename() {
  const id = renameId.value
  const title = renameDraft.value.trim()
  renameOpen.value = false
  if (!id || !title)
    return
  await renameAiConversation(id, title)
  const item = historyList.value.find(h => h.id === id)
  if (item)
    item.title = title
  toast.show('已重命名')
}

async function removeHistory(id: number) {
  await deleteAiConversation(id)
  historyList.value = historyList.value.filter(item => item.id !== id)
  toast.show('已删除')
}

function handleBack() {
  uni.navigateBack()
}

function newConversation() {
  messages.value = []
  activeTitle.value = 'AI 助手'
}

function itemDeadlineClass(item: AiProgressItem) {
  return item.overdue ? 'text-red-500' : 'text-gray-400'
}

interface ChartBar {
  label: string
  percent: number
  value: number
}

/** chart 卡降级为条形列表（App 无 echarts，按首个数值列等比展示） */
function chartBars(card: AiCard): ChartBar[] {
  const data: any[] = card.data || []
  if (data.length === 0)
    return []
  const xKey: string = card.xKey || Object.keys(data[0] || {})[0] || ''
  const seriesKeys: string[] = card.series || []
  const keys = seriesKeys.length > 0
    ? seriesKeys
    : Object.keys(data[0] || {}).filter(key => key !== xKey)
  const valueKey = keys[0] ?? ''
  const list = data.map((row) => {
    const raw = row[valueKey]
    const num = Number(raw)
    return { label: String(row[xKey] ?? ''), value: Number.isFinite(num) ? num : 0 }
  })
  const max = Math.max(...list.map(item => item.value), 0)
  return list.map(item => ({
    ...item,
    percent: max > 0 ? Math.max(Math.round((item.value / max) * 100), 2) : 0,
  }))
}

/** 低置信度字段标黄提醒核对 */
function isLowConfidence(field: { confidence?: number }): boolean {
  return (field.confidence ?? 1) < 0.6
}

const inputCount = computed(() => inputValue.value.length)
const sendDisabled = computed(() => !inputValue.value.trim() || inputValue.value.length > MAX_INPUT)

onBeforeUnmount(() => {
  ctrl.value.abort()
})
</script>

<template>
  <view class="yd-page-container yd-page-container-paging flex flex-col">
    <wd-navbar

      title=""
      placeholder safe-area-inset-top left-arrow fixed
      @click-left="handleBack"
    >
      <template #title>
        <view class="flex items-center gap-1" @click="openHistory">
          <text>{{ activeTitle }}</text>
          <text class="text-xs text-gray-400">▸</text>
        </view>
      </template>
      <template #right>
        <text class="text-sm text-[#018d71]" @click="newConversation">新对话</text>
      </template>
    </wd-navbar>

    <!-- 消息流 -->
    <scroll-view :scroll-top="scrollTop" class="min-h-0 flex-1" scroll-y>
      <view class="px-24rpx pb-24rpx">
        <!-- 欢迎态 -->
        <view v-if="messages.length === 0" class="mt-160rpx text-center">
          <view class="text-60rpx">
            🤖
          </view>
          <view class="mt-16rpx text-32rpx font-500">
            {{ employeeGreeting || '你好，我是 AI 助手' }}
          </view>
          <view class="mt-8rpx text-24rpx text-gray-400">
            可以问我任务进度和业务数据
          </view>
          <view class="mt-24rpx flex flex-wrap justify-center gap-16rpx">
            <view
              v-for="ask in (employeeQuickAsks.length > 0 ? employeeQuickAsks : DEFAULT_ASKS)"
              :key="ask"
              class="rounded-full bg-gray-100 px-24rpx py-12rpx text-24rpx"
              @click="send(ask)"
            >
              {{ ask }}
            </view>
          </view>
        </view>

        <view v-for="(item, index) in messages" :key="index" class="mb-24rpx">
          <!-- 用户消息 -->
          <view v-if="item.role === 'user'" class="flex justify-end">
            <view class="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-[#018d71] px-24rpx py-16rpx text-28rpx text-white">
              {{ item.content }}
            </view>
          </view>
          <!-- AI 消息 -->
          <view v-else class="flex flex-col gap-16rpx">
            <view v-if="item.tools.length > 0" class="flex flex-wrap gap-16rpx text-22rpx text-gray-500">
              <text v-for="(tool, tIndex) in item.tools" :key="tIndex">
                <text :class="tool.status === 'running' ? 'text-blue-500' : 'text-green-500'">●</text>
                {{ tool.label }}
              </text>
            </view>
            <view v-if="item.content" class="text-28rpx leading-6">
              <rich-text :nodes="renderMd(item.content)" />
            </view>
            <!-- 进度卡片 -->
            <view
              v-for="(card, cIndex) in item.cards"
              :key="cIndex"
              class="rounded-2xl bg-gray-50 p-20rpx"
            >
              <view v-if="card.type === 'progress'">
                <view class="mb-12rpx text-26rpx font-500">
                  {{ card.title }}
                </view>
                <view
                  v-for="(p, pIndex) in card.items || []"
                  :key="pIndex"
                  class="mb-12rpx rounded-xl bg-white px-20rpx py-16rpx"
                  @click="goCardLink(p.link)"
                >
                  <view class="text-26rpx">
                    {{ p.title }}
                  </view>
                  <view v-if="p.stage" class="mt-4rpx text-22rpx text-gray-500">
                    {{ p.stage }}
                  </view>
                  <view v-if="p.deadlineTip" :class="itemDeadlineClass(p)" class="mt-4rpx text-22rpx">
                    {{ p.deadlineTip }}
                  </view>
                </view>
              </view>
              <!-- 表格卡片 -->
              <view v-else-if="card.type === 'table'">
                <view class="mb-8rpx text-26rpx font-500">
                  {{ card.title }}
                </view>
                <view
                  v-for="(row, rIndex) in card.rows || []"
                  :key="rIndex"
                  class="mb-8rpx rounded-xl bg-white px-20rpx py-12rpx text-24rpx"
                >
                  <view v-for="col in card.columns || []" :key="col.key" class="flex justify-between py-2rpx">
                    <text class="text-gray-500">{{ col.label }}</text>
                    <text class="max-w-[60%] truncate">{{ row[col.key] }}</text>
                  </view>
                </view>
                <view v-if="card.truncated" class="text-22rpx text-gray-400">
                  共 {{ card.totalRows }} 行，已展示前 {{ card.rows?.length }} 行
                </view>
              </view>
              <!-- 审批摘要卡片 -->
              <view v-else-if="card.type === 'approval_summary'">
                <view class="mb-8rpx text-26rpx font-500">
                  {{ card.title }}
                </view>
                <rich-text :nodes="renderMd(card.summaryMd || '')" />
                <view v-if="card.risks && card.risks.length > 0" class="mt-8rpx">
                  <view class="mb-4rpx text-22rpx text-orange-600">
                    风险与关注点
                  </view>
                  <view v-for="(risk, rIdx) in card.risks" :key="rIdx" class="text-22rpx text-orange-700">
                    · {{ risk }}
                  </view>
                </view>
              </view>
              <!-- 图表卡片（App 端降级为条形展示，最多 10 项） -->
              <view v-else-if="card.type === 'chart'">
                <view class="mb-8rpx text-26rpx font-500">
                  {{ card.title }}
                </view>
                <view v-for="(bar, bIndex) in chartBars(card).slice(0, 10)" :key="bIndex" class="mb-12rpx">
                  <view class="mb-4rpx flex items-center justify-between text-24rpx">
                    <text class="min-w-0 flex-1 truncate text-gray-600">{{ bar.label }}</text>
                    <text class="ml-16rpx text-gray-800">{{ bar.value }}</text>
                  </view>
                  <view class="h-12rpx overflow-hidden rounded-full bg-gray-200">
                    <view class="h-12rpx rounded-full bg-[#018d71]" :style="{ width: `${bar.percent}%` }" />
                  </view>
                </view>
                <view v-if="chartBars(card).length > 10" class="text-22rpx text-gray-400">
                  共 {{ chartBars(card).length }} 项，已展示前 10 项
                </view>
                <view v-if="chartBars(card).length === 0" class="text-22rpx text-gray-400">
                  暂无可视化数据
                </view>
              </view>
              <!-- 表单预填卡片 -->
              <view v-else-if="card.type === 'prefill'">
                <view class="mb-8rpx text-26rpx font-500">
                  {{ card.title || 'AI 识别结果' }}
                </view>
                <view v-for="field in card.fields || []" :key="field.key" class="flex justify-between gap-16rpx py-4rpx text-24rpx">
                  <text class="shrink-0 text-gray-500">{{ field.label }}</text>
                  <text
                    class="min-w-0 flex-1 truncate text-right"
                    :class="isLowConfidence(field) ? 'text-orange-600' : 'text-gray-800'"
                  >
                    {{ field.value }}<template v-if="isLowConfidence(field)">（请核对）</template>
                  </text>
                </view>
                <view class="mt-4rpx text-22rpx text-gray-400">
                  识别结果仅供参考，带入表单后请确认再提交
                </view>
              </view>
            </view>
            <!-- 错误 -->
            <view
              v-if="item.status === 'error'"
              class="flex items-center justify-between border border-red-200 rounded-xl bg-red-50 px-20rpx py-16rpx"
              @click="retry(item)"
            >
              <text class="text-26rpx text-red-600">{{ item.errorText }}（点击重试）</text>
            </view>
            <!-- 反馈 -->
            <view v-if="item.status === 'done' && item.id" class="flex gap-24rpx text-26rpx text-gray-300">
              <text @click="feedback(item, 1)">👍</text>
              <text @click="feedback(item, -1)">👎</text>
            </view>
            <view
              v-if="item.status === 'streaming' && !item.content && item.tools.length === 0"
              class="animate-pulse text-24rpx text-gray-400"
            >
              正在思考…
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区 -->
    <view class="border-t border-gray-100 bg-white px-24rpx py-16rpx pb-[env(safe-area-inset-bottom)]">
      <view class="flex items-end gap-16rpx">
        <wd-input
          v-model="inputValue"
          :maxlength="MAX_INPUT"
          clearable
          custom-class="flex-1"
          no-border
          placeholder="输入问题，发送给 AI 助手"
        />
        <wd-button v-if="streaming" plain size="small" type="error" @click="stop">
          停止
        </wd-button>
        <wd-button v-else :disabled="sendDisabled" size="small" type="primary" @click="send()">
          发送
        </wd-button>
      </view>
    </view>

    <!-- 历史会话 -->
    <wd-popup v-model="historyOpen" closable custom-class="rounded-t-24rpx" position="bottom" safe-area-inset-bottom>
      <view class="max-h-60vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-28rpx font-500">
          历史会话
        </view>
        <view v-for="item in historyList" :key="item.id" class="flex items-center justify-between border-b border-gray-50 py-20rpx">
          <text class="min-w-0 flex-1 truncate text-28rpx" @click="loadHistory(item.id, item.title)">
            {{ item.title }}
          </text>
          <text class="ml-16rpx text-24rpx text-gray-400" @click="startRename(item)">改名</text>
          <text class="ml-16rpx text-24rpx text-red-400" @click="removeHistory(item.id)">删除</text>
        </view>
        <view v-if="historyList.length === 0" class="py-40rpx text-center text-24rpx text-gray-400">
          暂无历史会话
        </view>
      </view>
    </wd-popup>

    <!-- 重命名会话 -->
    <wd-popup v-model="renameOpen" closable custom-class="rounded-t-24rpx" position="bottom" safe-area-inset-bottom>
      <view class="p-24rpx pb-48rpx">
        <view class="mb-16rpx text-30rpx font-500">
          重命名会话
        </view>
        <wd-input v-model="renameDraft" :maxlength="50" clearable placeholder="输入新标题" />
        <wd-button block class="mt-24rpx" type="primary" @click="confirmRename">
          保存
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>
