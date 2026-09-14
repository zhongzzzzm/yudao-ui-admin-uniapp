<script lang="ts" setup>
import type { AiEmployee } from '@/api/ai/chat'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

import { displayAvatar, getMyAiEmployees } from '@/api/ai/chat'

defineOptions({ name: 'AiEmployeeList' })

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false)
const employees = ref<AiEmployee[]>([])

async function refresh() {
  loading.value = true
  try {
    employees.value = await getMyAiEmployees()
  } catch {
    employees.value = []
  } finally {
    loading.value = false
  }
}

function goChat(employee: AiEmployee) {
  const greeting = employee.greeting ? encodeURIComponent(employee.greeting) : ''
  const quickAsks = employee.quickAsks?.length ? encodeURIComponent(JSON.stringify(employee.quickAsks)) : ''
  uni.navigateTo({
    url: `/pages-ai/chat/index?employeeId=${employee.id}&name=${encodeURIComponent(employee.name)}&greeting=${greeting}&quickAsks=${quickAsks}`,
  })
}

function handleBack() {
  uni.navigateBack()
}

onLoad(() => {})
onShow(refresh)
</script>

<template>
  <view class="yd-page-container yd-page-container-paging flex flex-col">
    <wd-navbar

      title="智能员工"
      placeholder safe-area-inset-top left-arrow fixed
      @click-left="handleBack"
    />
    <view class="min-h-0 flex-1 overflow-y-auto px-24rpx pt-24rpx">
      <view class="mb-16rpx text-24rpx text-gray-400">
        选择一位员工开始对话，每位员工有专属的能力与话术
      </view>
      <view
        v-for="employee in employees"
        :key="employee.id"
        class="mb-16rpx flex items-center rounded-2xl bg-white px-24rpx py-24rpx"
        @click="goChat(employee)"
      >
        <view class="mr-20rpx h-80rpx w-80rpx flex items-center justify-center rounded-full bg-[#018d71]/10 text-36rpx">
          {{ displayAvatar(employee.avatar) }}
        </view>
        <view class="min-w-0 flex-1">
          <view class="flex items-center gap-8rpx">
            <text class="text-30rpx font-500">{{ employee.name }}</text>
            <wd-tag v-if="employee.builtin" plain type="primary" custom-class="!text-20rpx">
              内置
            </wd-tag>
          </view>
          <view class="mt-4rpx text-24rpx text-gray-400">
            {{ employee.jobTitle || employee.description || '专属 AI 助手' }}
          </view>
        </view>
        <text class="text-gray-300">▸</text>
      </view>
      <view v-if="!loading && employees.length === 0" class="mt-120rpx text-center text-24rpx text-gray-400">
        暂无可用的智能员工，请联系管理员
      </view>
    </view>
  </view>
</template>
