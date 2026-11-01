<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow title="导入公司" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 上传 Excel -->
      <view class="m-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx text-28rpx text-[#333] font-500">
          数据文件
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          仅允许导入 xls、xlsx 格式文件，按公司代码匹配：已存在则更新，不存在则新增；硬校验失败整批回滚
        </view>
        <yd-upload
          v-model="fileUrls"
          accept="all"
          directory="tax-company"
          :multiple="false"
          :limit="1"
          :file-size="50"
          :file-type="['xls', 'xlsx']"
        />
        <wd-button
          block
          class="mt-24rpx"
          type="primary"
          :loading="importing"
          :disabled="importing || fileUrls.length === 0"
          @click="handleImport"
        >
          开始导入
        </wd-button>
      </view>

      <!-- 导入结果 -->
      <view v-if="result" class="mx-24rpx mb-24rpx overflow-hidden rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx text-28rpx text-[#333] font-500">
          导入结果
        </view>
        <view class="mb-8rpx text-26rpx text-[#333]">
          导入成功 <text class="text-[#018d71] font-500">{{ result.total }}</text> 条
        </view>
        <view class="mb-8rpx text-26rpx text-[#333]">
          自动绑定办税系统用户 <text class="text-[#018d71] font-500">{{ result.boundCount }}</text> 家
        </view>
        <template v-if="(result.unboundList?.length ?? 0) > 0">
          <view class="mb-8rpx mt-16rpx text-26rpx text-[#fa8c16]">
            以下 {{ result.unboundList.length }} 家公司未能自动绑定办税人员系统用户，请在公司定义里手动选择：
          </view>
          <view
            v-for="(item, index) in result.unboundList"
            :key="index"
            class="flex items-start justify-between border-b border-b-[#f7f7f7] py-16rpx last:border-b-0"
          >
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-26rpx text-[#333]">
                {{ item.companyName || '-' }}（{{ item.companyCode || '-' }}）
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                办税人员：{{ item.taxPerson || '-' }}
              </view>
            </view>
            <wd-tag type="warning" plain class="ml-16rpx flex-shrink-0">
              {{ unboundReason(item.reason) }}
            </wd-tag>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TaxCompanyImportRespVO } from '@/api/tax/company'
import { navigateBackPlus } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { importTaxCompanyExcel } from '@/api/tax/company'

defineOptions({
  name: 'TaxCompanyImport',
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

/** 上传后的 Excel 文件地址（限 1 个） */
const fileUrls = ref<string[]>([])
const importing = ref(false)
const result = ref<TaxCompanyImportRespVO | null>(null)

/** 未自动绑定原因文案：与后端 CompanyTaxPersonUnboundVO 枚举一致 */
function unboundReason(reason?: number) {
  if (reason === 2) {
    return '存在多个同名用户'
  }
  if (reason === 1) {
    return '未找到同名系统用户'
  }
  return '未自动绑定'
}

async function handleImport() {
  const url = fileUrls.value[0]
  if (!url || importing.value) {
    return
  }
  importing.value = true
  result.value = null
  try {
    const resp = await importTaxCompanyExcel(url)
    result.value = resp
    toast.show(`导入成功，共 ${resp.total} 条`)
    // 通知列表页刷新
    uni.$emit('taxCompanyChanged')
  } catch {
    // 业务错误 toast 已由 http 层提示（如校验失败整批回滚的原因）
  } finally {
    importing.value = false
  }
}
</script>
