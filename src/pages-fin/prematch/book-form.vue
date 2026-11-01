<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="初始化预收底稿台账" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 顶部提示：与 PC 端初始化弹窗文案一致 -->
      <view class="m-24rpx mb-0 rounded-12rpx bg-[#e6f7f4] px-24rpx py-20rpx text-24rpx text-[#018d71]">
        上传线下维护的预收底稿（一个文件可含多个科目 sheet，如 220302 预收租金 + 220399 其他）。系统解析全部记录并完成底稿内闭环，剩余未闭环的挂账/预收即初始底稿；基准期自动取底稿内最大日期所在月，台账名称缺省自动生成。之后每月在此台账上「上传月度账」滚动闭环。
      </view>

      <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <!-- 台账名称 -->
        <view class="form-item">
          <view class="form-label">
            台账名称
          </view>
          <wd-input v-model="form.name" :maxlength="64" clearable no-border placeholder="缺省自动生成：预收底稿_基准期" />
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <view class="form-label">
            备注
          </view>
          <wd-textarea v-model="form.remark" :maxlength="500" show-word-limit clearable no-border placeholder="备注（500 字以内）" />
        </view>

        <!-- 预收底稿文件 -->
        <view class="form-item">
          <view class="form-label required">
            预收底稿文件
          </view>
          <yd-upload
            v-model="fileUrls"
            accept="all"
            directory="fin-prematch"
            :limit="5"
            :file-type="excelTypes"
          />
        </view>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部提交 -->
    <view class="fixed inset-x-0 bottom-0 z-10 flex border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx">
      <wd-button class="flex-1" type="primary" :loading="submitting" @click="onSubmit">
        初始化台账
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { getFileNameFromUrl } from '@/utils/download'
import { reactive, ref } from 'vue'
import { createPrematchBook } from '@/api/fin/prematch'

defineOptions({
  name: 'FinPrematchBookForm',
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

const toast = useToast()

/** Excel 文件类型白名单（上传前本地校验） */
const excelTypes = ['xlsx', 'xls']

const form = reactive({
  name: '',
  remark: '',
})

/** 预收底稿文件 URL 列表（modelValue 为 string[]） */
const fileUrls = ref<string[]>([])

const submitting = ref(false)

/** 提交初始化：本地校验 → 调创建接口（后端同步解析底稿并完成底稿内闭环） */
async function onSubmit() {
  if (!fileUrls.value.length) {
    toast.show('请上传预收底稿文件')
    return
  }
  submitting.value = true
  try {
    await createPrematchBook({
      name: form.name || undefined,
      remark: form.remark || undefined,
      files: fileUrls.value.map(url => ({
        fileUrl: url,
        fileName: getFileNameFromUrl(url),
      })),
    })
    // 通知台账列表刷新
    uni.$emit('fin:prematch:book:reload')
    toast.show('台账初始化完成')
    setTimeout(() => navigateBackPlus(), 600)
  } catch {
    // 业务错误提示由 http 层统一弹出
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
  font-size: 26rpx;
  color: #666;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}
</style>
