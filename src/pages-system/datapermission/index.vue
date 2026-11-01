<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      left-arrow title="数据权限规则" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <!-- 关键字搜索 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <wd-search
        v-model="keyword"
        placeholder="搜索规则名称 / 表名"
        hide-cancel
        @search="pagingRef?.reload()"
        @clear="pagingRef?.reload()"
      />
    </view>

    <!-- 规则列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无数据权限规则"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" class="ml-16rpx flex-shrink-0" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">目标表名：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.tableName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">过滤条件：</text>
            <text class="min-w-0 flex-1 truncate">{{ (item.conditions?.length ?? 0) }} 条</text>
          </view>
          <view v-if="item.remark" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="line-clamp-1">{{ item.remark }}</text>
          </view>
          <!-- 操作：编辑 / 删除（删除前提示引用角色数） -->
          <view class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button size="small" plain @click.stop="handleEdit(item)">
              编辑
            </wd-button>
            <wd-button size="small" plain type="error" @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:data-permission-rule:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DataPermissionRule } from '@/api/system/datapermission'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  deleteDataPermissionRule,
  getDataPermissionRulePage,
  listDataPermissionRuleRoles,
} from '@/api/system/datapermission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

defineOptions({
  name: 'SystemDataPermissionRule',
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
const list = ref<DataPermissionRule[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 关键字（规则名称/表名，同时下发后端模糊匹配）

/** 查询规则分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const kw = keyword.value.trim() || undefined
    const data = await getDataPermissionRulePage({ name: kw, tableName: kw, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 新增规则 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/datapermission/form/index' })
}

/** 编辑规则 */
function handleEdit(item: DataPermissionRule) {
  uni.navigateTo({ url: `/pages-system/datapermission/form/index?id=${item.id}` })
}

/** 删除规则（先查引用角色数，一并提示） */
async function handleDelete(item: DataPermissionRule) {
  let roleCount = 0
  try {
    roleCount = (await listDataPermissionRuleRoles(item.id!))?.length ?? 0
  } catch {
    // 查询失败不阻塞删除确认
  }
  dialog.confirm({
    title: '确认删除',
    msg: roleCount > 0
      ? `规则【${item.name}】正被 ${roleCount} 个角色引用，删除后这些角色的数据权限将失效，确认删除？`
      : `确认删除数据权限规则【${item.name}】？`,
  }).then(async () => {
    try {
      await deleteDataPermissionRule(item.id!)
      toast.success('删除成功')
      pagingRef.value?.reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:data-permission-rule:reload', () => pagingRef.value?.reload())
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:data-permission-rule:reload')
})

function handleBack() {
  navigateBackPlus()
}
</script>
