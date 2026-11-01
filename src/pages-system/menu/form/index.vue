<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 表单区域 -->
      <view class="pt-24rpx">
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <!-- 菜单类型：原生 picker 下拉 -->
            <wd-form-item title="菜单类型" title-width="180rpx" prop="type">
              <picker
                mode="selector"
                :range="typeLabels"
                :value="typeIndex"
                class="flex-1"
                @change="handleTypeChange"
              >
                <view class="flex items-center gap-8rpx">
                  <text class="flex-1 text-[#333]">
                    {{ typeLabel(formData.type) }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </wd-form-item>
            <!-- 父菜单：原生 picker 下拉（全部菜单，带缩进标识） -->
            <wd-form-item title="上级菜单" title-width="180rpx" prop="parentId">
              <picker
                mode="selector"
                :range="parentLabels"
                :value="parentIndex"
                class="flex-1"
                @change="handleParentChange"
              >
                <view class="flex items-center gap-8rpx">
                  <text class="flex-1 truncate text-[#333]">
                    {{ parentLabelOf(formData.parentId) }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </wd-form-item>
            <wd-form-item title="菜单名称" title-width="180rpx" prop="name">
              <wd-input
                v-model="formData.name"
                clearable
                placeholder="请输入菜单名称"
              />
            </wd-form-item>
            <!-- 权限标识：按钮类型必填，目录/菜单选填 -->
            <wd-form-item title="权限标识" title-width="180rpx" prop="permission">
              <wd-input
                v-model="formData.permission"
                clearable
                placeholder="如 system:menu:create"
              />
            </wd-form-item>
            <wd-form-item title="显示排序" title-width="180rpx" prop="sort">
              <wd-input
                v-model="formData.sort"
                type="number"
                clearable
                placeholder="数值越小越靠前"
              />
            </wd-form-item>
            <!-- 路由地址 / 组件路径：目录与菜单才需要 -->
            <template v-if="formData.type !== 3">
              <wd-form-item title="路由地址" title-width="180rpx" prop="path">
                <wd-input
                  v-model="formData.path"
                  clearable
                  placeholder="如 user"
                />
              </wd-form-item>
              <wd-form-item v-if="formData.type === 2" title="组件路径" title-width="180rpx" prop="component">
                <wd-input
                  v-model="formData.component"
                  clearable
                  placeholder="如 system/user/index"
                />
              </wd-form-item>
              <wd-form-item title="显示状态" title-width="180rpx" center prop="visible">
                <wd-switch
                  v-model="formData.visible"
                  :active-value="true"
                  :inactive-value="false"
                />
              </wd-form-item>
              <wd-form-item title="开启缓存" title-width="180rpx" center prop="keepAlive">
                <wd-switch
                  v-model="formData.keepAlive"
                  :active-value="true"
                  :inactive-value="false"
                />
              </wd-form-item>
            </template>
            <wd-form-item title="状态" title-width="180rpx" center prop="status">
              <wd-switch
                v-model="formData.status"
                :active-value="CommonStatusEnum.ENABLE"
                :inactive-value="CommonStatusEnum.DISABLE"
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <!-- 说明 -->
        <view class="mx-24rpx mt-16rpx rounded-xl bg-blue-50 px-20rpx py-16rpx text-24rpx text-blue-600">
          提示：图标、组件名称等高级字段请在 PC 端维护；App 覆盖菜单的核心字段。
        </view>
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Menu } from '@/api/system/menu'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMenu, getMenu, getMenuList, updateMenu } from '@/api/system/menu'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  /** 编辑时的菜单编号 */
  id?: number | any
  /** 新增时指定的上级菜单编号 */
  parentId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑菜单' : '新增菜单')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Menu>({
  id: undefined,
  name: '',
  permission: '',
  type: 2,
  sort: 0,
  parentId: Number(props.parentId ?? 0),
  path: '',
  icon: '',
  component: '',
  status: CommonStatusEnum.ENABLE,
  visible: true,
  keepAlive: false,
}) // 表单数据
const formSchema = {
  name: [{ required: true, message: '菜单名称不能为空' }],
  type: [{ required: true, message: '菜单类型不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  // 按钮类型必须带权限标识，目录/菜单选填
  permission: [{ required: () => formData.value.type === 3, message: '权限标识不能为空' }],
}
const formRef = ref<FormInstance>() // 表单组件引用

/** 菜单类型选项（字典 system_menu_type：目录/菜单/按钮） */
const typeOptions = getIntDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE)
const typeLabels = computed(() => typeOptions.map(item => item.label))
const typeIndex = computed(() => Math.max(0, typeOptions.findIndex(item => item.value === formData.value.type)))

function typeLabel(value?: number): string {
  return getDictLabel(DICT_TYPE.SYSTEM_MENU_TYPE, value) ?? '未知'
}

/** 选择菜单类型 */
function handleTypeChange(e: any) {
  const option = typeOptions[Number(e.detail.value)]
  if (option) {
    formData.value.type = option.value
  }
}

/** 全部菜单扁平列表（父菜单下拉用，根级固定为 0） */
const allMenus = ref<Menu[]>([])
const parentLabels = computed(() => ['根目录', ...allMenus.value.map(item => item.name)])
const parentIndex = computed(() => {
  if (formData.value.parentId === 0) {
    return 0
  }
  return Math.max(0, allMenus.value.findIndex(item => item.id === formData.value.parentId))
})

function parentLabelOf(parentId?: number): string {
  if (parentId === 0) {
    return '根目录'
  }
  const menu = allMenus.value.find(item => item.id === parentId)
  return menu ? menu.name : `菜单 ${parentId ?? '-'}`
}

/** 选择上级菜单 */
function handleParentChange(e: any) {
  const idx = Number(e.detail.value)
  if (idx === 0) {
    formData.value.parentId = 0
  } else {
    const menu = allMenus.value[idx - 1]
    if (menu?.id != null) {
      formData.value.parentId = menu.id
    }
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/menu/index')
}

/** 加载详情与上级菜单候选 */
async function getDetail() {
  const listPromise = getMenuList().catch(() => [])
  const [menuList, detail] = await Promise.all([
    listPromise,
    props.id ? getMenu(Number(props.id)) : Promise.resolve(undefined),
  ])
  // 上级候选排除自身（编辑时不能把自己选为父级）
  allMenus.value = (menuList ?? []).filter(item => item.id !== props.id)
  if (detail) {
    formData.value = detail
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    formData.value.sort = Number(formData.value.sort)
    if (props.id) {
      await updateMenu(formData.value)
      toast.success('修改成功')
    } else {
      await createMenu(formData.value)
      toast.success('新增成功')
    }
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
