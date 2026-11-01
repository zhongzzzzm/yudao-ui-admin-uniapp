<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="指标血缘" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 方向筛选条 -->
    <view class="flex gap-16rpx bg-white px-24rpx py-16rpx">
      <view
        v-for="chip in directionChips"
        :key="chip.value"
        class="flex-shrink-0 rounded-full px-24rpx py-8rpx text-24rpx"
        :class="currentDirection === chip.value ? 'bg-[#018d71] text-white' : 'bg-[#f5f6f8] text-[#666]'"
        @click="handleDirectionChange(chip.value)"
      >
        {{ chip.label }}
      </view>
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <!-- 加载失败 -->
      <view v-else-if="!lineage" class="flex flex-col items-center pt-240rpx">
        <wd-icon name="exclamation-circle" size="80rpx" color="#fa8c16" />
        <text class="mt-24rpx text-28rpx text-[#999]">加载失败，请稍后重试</text>
        <wd-button class="mt-32rpx" size="small" plain @click="loadLineage">
          重试
        </wd-button>
      </view>

      <template v-else>
        <!-- 截断提示 -->
        <view v-if="lineage.truncated" class="mx-24rpx mt-24rpx rounded-16rpx bg-[#fffbe6] p-20rpx text-24rpx text-[#fa8c16]">
          血缘节点过多，仅展示部分链路，可在 PC 端查看完整拓扑图
        </view>

        <!-- 根指标 -->
        <view v-if="rootNode" class="m-24rpx overflow-hidden rounded-16rpx bg-[#e6f7f1] p-24rpx shadow-sm">
          <view class="mb-8rpx flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ rootNode.label || rootNode.id }}
            </text>
            <wd-tag type="primary" plain class="ml-16rpx flex-shrink-0">
              根指标
            </wd-tag>
          </view>
          <view v-if="rootNode.subLabel" class="text-24rpx text-[#777]">
            {{ rootNode.subLabel }}
          </view>
          <view v-if="rootNode.valueSource" class="mt-4rpx text-24rpx text-[#777]">
            取值来源：{{ rootNode.valueSource }}
          </view>
        </view>

        <!-- 上游链路 -->
        <view v-if="currentDirection !== 'down' && upstreamNodes.length" class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            上游来源（本指标取数依赖）
          </view>
          <view
            v-for="item in upstreamNodes"
            :key="`up-${item.node.id}`"
            class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx last:border-b-0"
            :style="{ paddingLeft: `${48 + Math.min(item.depth - 1, 4) * 32}rpx` }"
          >
            <view class="flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-26rpx text-[#333]">
                {{ item.node.label || item.node.id }}
              </text>
              <wd-tag :type="nodeTagType(item.node.type)" plain class="ml-12rpx flex-shrink-0">
                {{ nodeTypeLabel(item.node.type) }}
              </wd-tag>
            </view>
            <view v-if="item.node.subLabel" class="mt-4rpx text-24rpx text-[#999]">
              {{ item.node.subLabel }}
            </view>
            <view v-if="item.edge?.label" class="mt-4rpx text-24rpx text-[#018d71]">
              关联：{{ item.edge.label }}
            </view>
            <view v-if="item.node.extra" class="mt-4rpx text-24rpx text-[#fa8c16]">
              {{ item.node.extra }}
            </view>
          </view>
        </view>

        <!-- 下游链路 -->
        <view v-if="currentDirection !== 'up' && downstreamNodes.length" class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-28rpx text-[#333] font-500">
            下游消费（引用本指标）
          </view>
          <view
            v-for="item in downstreamNodes"
            :key="`down-${item.node.id}`"
            class="border-b border-b-[#f7f8f9] px-24rpx py-20rpx last:border-b-0"
            :style="{ paddingLeft: `${48 + Math.min(item.depth - 1, 4) * 32}rpx` }"
          >
            <view class="flex items-center justify-between">
              <text class="line-clamp-1 flex-1 text-26rpx text-[#333]">
                {{ item.node.label || item.node.id }}
              </text>
              <wd-tag :type="nodeTagType(item.node.type)" plain class="ml-12rpx flex-shrink-0">
                {{ nodeTypeLabel(item.node.type) }}
              </wd-tag>
            </view>
            <view v-if="item.node.subLabel" class="mt-4rpx text-24rpx text-[#999]">
              {{ item.node.subLabel }}
            </view>
            <view v-if="item.edge?.label" class="mt-4rpx text-24rpx text-[#018d71]">
              关联：{{ item.edge.label }}
            </view>
            <view v-if="item.node.extra" class="mt-4rpx text-24rpx text-[#fa8c16]">
              {{ item.node.extra }}
            </view>
          </view>
        </view>

        <!-- 空态 -->
        <view v-if="!upstreamNodes.length && !downstreamNodes.length" class="py-60rpx text-center text-26rpx text-[#999]">
          暂无上下游关联节点
        </view>
        <view class="h-40rpx" />
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { DataIndicatorLineageEdgeVO, DataIndicatorLineageNodeVO, DataIndicatorLineageRespVO } from '@/api/rpt/dataIndicator'
import { navigateBackPlus } from '@/utils'
import { computed, ref } from 'vue'
import {
  getDataIndicatorLineage,
  LINEAGE_NODE_TYPE_LABELS,
  LINEAGE_NODE_TYPE_TAG_TYPE,
} from '@/api/rpt/dataIndicator'

defineOptions({
  name: 'RptIndicatorLineage',
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

/** 方向筛选（与后端 DataIndicatorLineageReqVO.direction 对齐） */
const directionChips: { label: string, value: 'both' | 'down' | 'up' }[] = [
  { label: '上下游', value: 'both' },
  { label: '仅上游', value: 'up' },
  { label: '仅下游', value: 'down' },
]
const currentDirection = ref<'both' | 'down' | 'up'>('both')

const rootIndicatorId = ref<number>()
const loading = ref(true)
const lineage = ref<DataIndicatorLineageRespVO>()

function nodeTypeLabel(type?: string): string {
  return LINEAGE_NODE_TYPE_LABELS[type ?? ''] ?? '节点'
}

function nodeTagType(type?: string): 'primary' | 'success' | 'warning' | 'info' {
  return LINEAGE_NODE_TYPE_TAG_TYPE[type ?? ''] ?? 'info'
}

/** 层级展示项：节点 + 连接它的边 + 层级深度（1 = 根的直接关联） */
interface LineageItem {
  node: DataIndicatorLineageNodeVO
  edge?: DataIndicatorLineageEdgeVO
  depth: number
}

const upstreamNodes = ref<LineageItem[]>([])
const downstreamNodes = ref<LineageItem[]>([])

const rootNode = computed(() =>
  lineage.value?.nodes?.find(n => n.id === lineage.value?.rootNodeId))

/** 最大展开层级（与后端 depth 上限对齐，防环后仍可能很深） */
const MAX_DEPTH = 5

/**
 * 从根出发按方向展开为缩进层级列表。
 * 边方向为 from(来源) → to(消费方)：上游沿「to → from」找来源，下游沿「from → to」找消费方。
 */
function buildDirectionNodes(nodes: DataIndicatorLineageNodeVO[], edges: DataIndicatorLineageEdgeVO[], direction: 'up' | 'down'): LineageItem[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const rootId = lineage.value?.rootNodeId
  const root = rootId ? nodeMap.get(rootId) : undefined
  if (!root) {
    return []
  }
  // 邻接表：parentId → 子节点（含连接边）
  const adjacency = new Map<string, { node: DataIndicatorLineageNodeVO, edge: DataIndicatorLineageEdgeVO }[]>()
  for (const edge of edges) {
    const childId = direction === 'up' ? edge.from : edge.to
    const parentId = direction === 'up' ? edge.to : edge.from
    const child = nodeMap.get(childId)
    if (!child) {
      continue
    }
    if (!adjacency.has(parentId)) {
      adjacency.set(parentId, [])
    }
    adjacency.get(parentId)!.push({ node: child, edge })
  }
  // 逐层展开，visited 防环，最多 MAX_DEPTH 层
  const result: LineageItem[] = []
  const visited = new Set<string>([root.id])
  let frontier: LineageItem[] = []
  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    const parents = depth === 1 ? [{ node: root, edge: undefined as DataIndicatorLineageEdgeVO | undefined }] : frontier
    frontier = []
    for (const parent of parents) {
      for (const child of adjacency.get(parent.node.id) ?? []) {
        if (visited.has(child.node.id)) {
          continue
        }
        visited.add(child.node.id)
        const item: LineageItem = { node: child.node, edge: child.edge, depth }
        result.push(item)
        frontier.push(item)
      }
    }
    if (!frontier.length) {
      break
    }
  }
  return result
}

/** 加载血缘（节点 + 边）并展开为上下游层级列表 */
async function loadLineage() {
  if (!rootIndicatorId.value) {
    return
  }
  loading.value = true
  try {
    const data = await getDataIndicatorLineage({
      id: rootIndicatorId.value,
      direction: currentDirection.value,
      depth: 3,
    })
    lineage.value = data
    const nodes = data.nodes ?? []
    const edges = data.edges ?? []
    upstreamNodes.value = currentDirection.value === 'down' ? [] : buildDirectionNodes(nodes, edges, 'up')
    downstreamNodes.value = currentDirection.value === 'up' ? [] : buildDirectionNodes(nodes, edges, 'down')
  } catch (e) {
    console.error('加载指标血缘失败：', e)
    lineage.value = undefined
  } finally {
    loading.value = false
  }
}

function handleDirectionChange(value: 'both' | 'down' | 'up') {
  if (currentDirection.value === value) {
    return
  }
  currentDirection.value = value
  loadLineage()
}

onLoad((query) => {
  rootIndicatorId.value = Number(query?.id)
  loadLineage()
})
</script>
