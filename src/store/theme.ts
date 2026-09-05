import type { ConfigProviderThemeVars } from '@wot-ui/ui/components/wd-config-provider/types'

import { defineStore } from 'pinia'

export const useThemeStore = defineStore(
  'theme-store',
  () => {
    /** 主题 */
    const theme = ref<'light' | 'dark'>('light')

    /** 主题变量 */
    const themeVars = ref<ConfigProviderThemeVars>({
      // 品牌主色：与设计方案 design token 一致（#018d71）。
      // wot 的 .wot-theme-light 会把 primary 色阶指向默认蓝，这里以内联样式覆盖（优先级高于主题类）。
      primary1: '#e6f4f1',
      primary2: '#c2e5de',
      primary3: '#9dd6ca',
      primary4: '#79c7b6',
      primary5: '#26a184',
      primary6: '#018d71',
      primary7: '#01725b',
      primary8: '#015947',
    })

    /** 设置主题变量 */
    const setThemeVars = (partialVars: Partial<ConfigProviderThemeVars>) => {
      themeVars.value = { ...themeVars.value, ...partialVars }
    }

    /** 切换主题 */
    const toggleTheme = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    return {
      /** 设置主题变量 */
      setThemeVars,
      /** 切换主题 */
      toggleTheme,
      /** 主题变量 */
      themeVars,
      /** 主题 */
      theme,
    }
  },
  {
    persist: true,
  },
)
