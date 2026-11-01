<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="节假日日历"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 年份筛选（含同步入口） -->
    <view class="flex items-center justify-between bg-white px-24rpx py-16rpx">
      <!-- 年份下拉：原生 picker -->
      <picker mode="selector" :range="yearLabels" :value="yearIndex" @change="handleYearChange">
        <view class="flex items-center gap-8rpx">
          <text class="text-28rpx text-[#333]">
            {{ yearLabels[yearIndex] }}
          </text>
          <wd-icon name="arrow-down" size="24rpx" color="#999" />
        </view>
      </picker>
      <!-- 同步节假日（拉取外部数据源） -->
      <wd-button
        v-if="hasAccessByCodes(['system:holiday:sync'])"
        size="small" plain type="primary" :loading="syncing"
        @click="onSync"
      >
        同步 {{ selectedYear }} 年
      </wd-button>
    </view>

    <!-- 节假日列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="20"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无节假日数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ formatDate(item.holidayDate) }}<text class="ml-16rpx text-24rpx text-[#999]">周{{ weekLabel(item.weekDay) }}</text>
            </view>
            <view
              class="ml-16rpx flex-shrink-0 rounded-full px-16rpx py-4rpx text-22rpx"
              :class="item.workdayFlag ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'"
            >
              {{ item.workdayFlag ? '调休补班' : '放假' }}
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">类型：</text>
            <text>{{ typeLabel(item.type) }}</text>
          </view>
          <view v-if="item.description" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">描述：</text>
            <text class="line-clamp-1">{{ item.description }}</text>
          </view>
          <!-- 操作：编辑 / 删除 -->
          <view class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['system:holiday:update'])"
              size="small" plain @click.stop="handleEdit(item)"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['system:holiday:delete'])"
              size="small" plain type="error" @click.stop="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:holiday:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Holiday } from '@/api/system/holiday'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { deleteHoliday, getHolidayPage, syncHoliday } from '@/api/system/holiday'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'

defineOptions({
  name: 'SystemHoliday',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<Holiday[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const syncing = ref(false) // 同步中状态

/** 年份候选（近三年 + 当前 + 未来两年） */
const currentYear = new Date().getFullYear()
const yearLabels = computed(() =>
  Array.from({ length: 5 }, (_, idx) => `${currentYear - 2 + idx} 年`),
)
const yearIndex = ref(2)
const selectedYear = computed(() => currentYear - 2 + yearIndex.value)

/** 切换年份 */
function handleYearChange(e: any) {
  yearIndex.value = Number(e.detail.value)
  pagingRef.value?.reload()
}

/** 节假日类型文案：1 春节、2 元旦、3 清明、4 劳动节、5 端午、6 中秋、7 国庆、8 其他 */
function typeLabel(type?: number): string {
  return { 1: '春节', 2: '元旦', 3: '清明', 4: '劳动节', 5: '端午', 6: '中秋', 7: '国庆', 8: '其他' }[type ?? 0] ?? '未知'
}

/** 星期文案（后端 1-7 对应周一到周日） */
function weekLabel(weekDay?: number): string {
  return { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日' }[weekDay ?? 0] ?? '-'
}

/** 查询节假日分页（按年份筛选） */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getHolidayPage({ pageNo, pageSize, year: selectedYear.value })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 同步节假日数据（拉取外部数据源，覆盖后入库） */
function onSync() {
  dialog.confirm({
    title: '确认同步',
    msg: `将拉取 ${selectedYear.value} 年法定节假日与调休数据入库（已有记录会更新），确定同步？`,
  }).then(async () => {
    syncing.value = true
    try {
      await syncHoliday(selectedYear.value)
      toast.success('同步成功')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    } finally {
      syncing.value = false
    }
  }).catch(() => {})
}

/** 新增节假日 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/holiday/form/index' })
}

/** 编辑节假日 */
function handleEdit(item: Holiday) {
  uni.navigateTo({ url: `/pages-system/holiday/form/index?id=${item.id}` })
}

/** 删除节假日 */
function handleDelete(item: Holiday) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除【${formatDate(item.holidayDate)}】的节假日记录？`,
  }).then(async () => {
    try {
      await deleteHoliday(item.id!)
      toast.success('删除成功')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:holiday:reload', () => pagingRef.value?.reload())
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:holiday:reload')
})
</script>
