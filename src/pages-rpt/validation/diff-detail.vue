<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="对比结果" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无对比结果"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm"
          @click="openFields(item)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-28rpx text-[#333] font-500">
              {{ item.reportName || '对比报表' }}
            </view>
            <wd-tag :type="item.diffRows ? 'warning' : 'success'" plain class="ml-16rpx flex-shrink-0">
              {{ item.diffRows ? '有差异' : '一致' }}
            </wd-tag>
          </view>
          <view class="text-26rpx text-[#777]">
            差异行 {{ item.diffRows ?? 0 }} / 总行数 {{ item.totalRows ?? 0 }}
          </view>
          <view v-if="item.diffRows" class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button size="small" plain @click.stop="openRows(item)">
              行级差异
            </wd-button>
            <wd-button size="small" type="primary" plain @click.stop="openFields(item)">
              字段明细
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 字段级差异明细 -->
    <wd-popup v-model="showFields" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          字段差异明细
        </view>
        <view v-if="fieldLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="fields.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无差异明细
        </view>
        <view v-else class="space-y-16rpx">
          <view v-for="field in fields" :key="field.id" class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="mb-8rpx text-26rpx text-[#333] font-500">
              {{ field.fieldName || '差异字段' }}
              <text class="ml-8rpx text-24rpx text-[#999]">行 {{ field.cmpRowIndex ?? field.hisRowIndex ?? '-' }}</text>
            </view>
            <view class="grid grid-cols-2 gap-12rpx text-24rpx">
              <view class="rounded-8rpx bg-white p-12rpx">
                <view class="mb-4rpx text-[#999]">
                  历史值
                </view>
                <view class="text-[#333]">
                  {{ field.hisValue ?? '-' }}
                </view>
              </view>
              <view class="rounded-8rpx bg-white p-12rpx">
                <view class="mb-4rpx text-[#999]">
                  当前值
                </view>
                <view class="text-[#f5222d]">
                  {{ field.cmpValue ?? '-' }}
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-if="fieldHasMore" class="py-16rpx text-center text-24rpx text-[#999]" @click="loadFields">
          加载更多
        </view>
      </view>
    </wd-popup>

    <!-- 行级差异明细：可跳转历史/当前版本的原始数据行 -->
    <wd-popup v-model="showRows" position="bottom" custom-class="rounded-t-24rpx" closable safe-area-inset-bottom>
      <view class="max-h-70vh overflow-auto p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-500">
          行级差异明细
        </view>
        <view v-if="rowLoading" class="flex justify-center py-40rpx">
          <wd-loading color="#018d71" />
        </view>
        <view v-else-if="rows.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无差异明细
        </view>
        <view v-else class="space-y-16rpx">
          <view v-for="row in rows" :key="row.id" class="rounded-12rpx bg-[#f7f8f9] p-20rpx">
            <view class="mb-8rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-26rpx text-[#333] font-500">
                {{ row.logicalKey || '差异行' }}
              </view>
              <wd-tag v-if="row.diffType" type="warning" plain class="ml-16rpx flex-shrink-0">
                {{ row.diffType }}
              </wd-tag>
            </view>
            <view class="mb-8rpx text-24rpx text-[#999]">
              历史行号 {{ row.hisRowIndex ?? '-' }} · 当前行号 {{ row.cmpRowIndex ?? '-' }}
            </view>
            <view v-if="canQueryReportData" class="flex justify-end gap-16rpx">
              <wd-button
                size="small"
                plain
                @click="goRowData(row.hisBatchId, row.hisRowIndex)"
              >
                查看历史数据
              </wd-button>
              <wd-button
                size="small"
                plain
                @click="goRowData(row.cmpBatchId, row.cmpRowIndex)"
              >
                查看当前数据
              </wd-button>
            </view>
          </view>
        </view>
        <view v-if="rowHasMore" class="py-16rpx text-center text-24rpx text-[#999]" @click="loadRows">
          加载更多
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { DiffDetailVO, DiffFieldDetailVO, DiffResultVO } from '@/api/validation/task'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { ref } from 'vue'
import { getDiffDetailPage, getDiffFieldDetailPage, getDiffResultPage } from '@/api/validation/task'

defineOptions({
  name: 'DiffTaskDetail',
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

const taskId = ref<number>()
const list = ref<DiffResultVO[]>([])
const pagingRef = ref<any>()

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDiffResultPage({ pageNo, pageSize, taskId: taskId.value })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 字段差异弹层 */
const showFields = ref(false)
const fieldLoading = ref(false)
const fields = ref<DiffFieldDetailVO[]>([])
const fieldHasMore = ref(false)
const fieldPageNo = ref(1)
const activeResultId = ref<number>()

function openFields(item: DiffResultVO) {
  if (!item.diffRows) {
    return
  }
  activeResultId.value = item.id
  showFields.value = true
  fields.value = []
  fieldPageNo.value = 1
  loadFields()
}

async function loadFields() {
  if (!activeResultId.value) {
    return
  }
  fieldLoading.value = fields.value.length === 0
  try {
    const data = await getDiffFieldDetailPage({
      pageNo: fieldPageNo.value,
      pageSize: 20,
      resultId: activeResultId.value,
    })
    fields.value = [...fields.value, ...data.list]
    fieldHasMore.value = fields.value.length < (data.total ?? 0)
    fieldPageNo.value += 1
  } catch {
    fields.value = []
    fieldHasMore.value = false
  } finally {
    fieldLoading.value = false
  }
}

/** 行级差异弹层 */
const { hasAccessByCodes } = useAccess()
const canQueryReportData = hasAccessByCodes(['validation:report-data:query'])

const showRows = ref(false)
const rowLoading = ref(false)
const rows = ref<DiffDetailVO[]>([])
const rowHasMore = ref(false)
const rowPageNo = ref(1)
const activeRowResult = ref<DiffResultVO>()

function openRows(item: DiffResultVO) {
  if (!item.diffRows) {
    return
  }
  activeRowResult.value = item
  showRows.value = true
  rows.value = []
  rowPageNo.value = 1
  loadRows()
}

async function loadRows() {
  if (!activeRowResult.value) {
    return
  }
  rowLoading.value = rows.value.length === 0
  try {
    const data = await getDiffDetailPage({
      pageNo: rowPageNo.value,
      pageSize: 20,
      resultId: activeRowResult.value.id,
    })
    rows.value = [...rows.value, ...data.list]
    rowHasMore.value = rows.value.length < (data.total ?? 0)
    rowPageNo.value += 1
  } catch {
    rows.value = []
    rowHasMore.value = false
  } finally {
    rowLoading.value = false
  }
}

/** 跳原始数据行（reportId 取当前报表级结果） */
function goRowData(batchId?: number, rowIndex?: number) {
  if (!activeRowResult.value?.reportId) {
    return
  }
  uni.navigateTo({
    url: `/pages-rpt/validation/report-data?reportId=${activeRowResult.value.reportId}&batchId=${batchId ?? ''}&rowIndex=${rowIndex ?? ''}`,
  })
}

onLoad((query) => {
  taskId.value = Number(query?.id)
})
</script>
