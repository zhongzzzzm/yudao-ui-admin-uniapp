<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="企微机器人推送"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换：推送配置 / 消息模板 / 发送日志 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="推送配置" />
        <wd-tab title="消息模板" />
        <wd-tab title="发送日志" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <WebhookList v-show="tabType === 'webhook'" class="min-h-0 flex-1" />
    <TemplateList v-show="tabType === 'template'" class="min-h-0 flex-1" />
    <LogList v-show="tabType === 'log'" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import LogList from './components/log-list.vue'
import TemplateList from './components/template-list.vue'
import WebhookList from './components/webhook-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['webhook', 'template', 'log']
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
