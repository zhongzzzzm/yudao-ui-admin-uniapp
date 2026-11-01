<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 邮箱账号列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无邮箱账号"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.mail }}
            </view>
            <view class="ml-16rpx rounded-full bg-blue-50 px-16rpx py-4rpx text-22rpx text-blue-500">
              {{ item.host }}:{{ item.port }}
            </view>
          </view>
          <view class="text-26rpx text-[#666] space-y-6rpx">
            <view class="line-clamp-1">
              用户名：{{ item.username }}
            </view>
            <view>
              安全：SSL {{ item.sslEnable ? '开' : '关' }} · STARTTLS {{ item.starttlsEnable ? '开' : '关' }}
            </view>
          </view>
          <!-- 操作：编辑 / 删除 -->
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
      v-if="hasAccessByCodes(['system:mail-account:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/system/mail'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { deleteMailAccount, getMailAccountPage } from '@/api/system/mail'
import { useAccess } from '@/hooks/useAccess'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<MailAccount[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 查询邮箱账号分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getMailAccountPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增邮箱账号 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-system/mail/account/form/index' })
}

/** 编辑邮箱账号 */
function handleEdit(item: MailAccount) {
  uni.navigateTo({ url: `/pages-system/mail/account/form/index?id=${item.id}` })
}

/** 删除邮箱账号 */
function handleDelete(item: MailAccount) {
  dialog.confirm({
    title: '确认删除',
    msg: `确认删除邮箱账号【${item.mail}】？删除后关联模板不可用。`,
  }).then(async () => {
    try {
      await deleteMailAccount(item.id!)
      toast.success('删除成功')
      reload()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:mail-account:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('system:mail-account:reload', reload)
})
</script>
