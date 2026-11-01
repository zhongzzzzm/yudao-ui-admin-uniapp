<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      left-arrow :title="pageTitle" placeholder safe-area-inset-top fixed @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="flex flex-col items-center pt-240rpx">
        <wd-loading color="#018d71" />
      </view>

      <template v-else>
        <!-- ==================== 基本信息 ==================== -->
        <view class="m-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="section-title">
            基本信息
          </view>
          <view class="form-item">
            <view class="form-label">
              方案名称
            </view>
            <wd-input
              v-model="form.quotName"
              :disabled="locked"
              :maxlength="64"
              clearable
              no-border
              placeholder="为空则取方案编号"
            />
          </view>
          <view class="form-item">
            <view class="form-label">
              客户名称
            </view>
            <wd-input
              v-model="form.customerName"
              :disabled="locked"
              :maxlength="64"
              clearable
              no-border
              placeholder="请输入客户名称"
            />
          </view>
          <view class="form-item">
            <view class="form-label">
              起租日
            </view>
            <picker
              mode="date"
              :value="form.leaseCommencementDate"
              :disabled="locked"
              @change="onDatePick('leaseCommencementDate', $event)"
            >
              <view class="picker-cell">
                <text :class="form.leaseCommencementDate ? 'text-[#333]' : 'text-[#999]'">
                  {{ form.leaseCommencementDate || '请选择起租日（默认取投放日）' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item">
            <view class="form-label">
              备注
            </view>
            <wd-textarea
              v-model="form.memo"
              :disabled="locked"
              :maxlength="255"
              clearable
              no-border
              placeholder="备注（选填）"
            />
          </view>
        </view>

        <!-- ==================== 投放与租金（主参数） ==================== -->
        <view class="m-24rpx mt-0 rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="section-title">
            投放与租金
          </view>
          <view class="form-item">
            <view class="form-label required">
              投放日期
            </view>
            <picker
              mode="date"
              :value="form.planDateLoan"
              :disabled="locked"
              @change="onDatePick('planDateLoan', $event)"
            >
              <view class="picker-cell">
                <text :class="form.planDateLoan ? 'text-[#333]' : 'text-[#999]'">
                  {{ form.planDateLoan || '请选择投放日期' }}
                </text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item flex items-center justify-between">
            <view class="form-label required mb-0">
              设备总金额（元）
            </view>
            <wd-input
              v-model="form.totalAmount"
              class="w-320rpx text-right"
              :disabled="locked"
              type="digit"
              no-border
              placeholder="0.00"
            />
          </view>
          <view class="form-item flex items-center justify-between">
            <view class="flex flex-col items-start">
              <view class="form-label mb-0">
                首付款（元）
              </view>
              <view class="mt-4rpx text-22rpx text-[#999]">
                {{ ratioHint('down') }}
              </view>
            </view>
            <view class="flex flex-col items-end">
              <wd-input
                v-model="form.downPayment"
                class="w-320rpx text-right"
                :disabled="locked"
                type="digit"
                no-border
                placeholder="0.00"
                @blur="onCashBlur('down')"
              />
              <view v-if="!locked && ratioEditable('down')" class="mt-4rpx flex items-center">
                <text class="text-22rpx text-[#999]">按比例</text>
                <input
                  v-model="ratioTexts.down"
                  class="ratio-input"
                  type="digit"
                  @blur="onRatioBlur('down')"
                >
                <text class="text-22rpx text-[#999]">%</text>
              </view>
            </view>
          </view>
          <view class="form-item flex items-center justify-between">
            <view class="form-label mb-0">
              商业折扣（元）
            </view>
            <wd-input
              v-model="form.tradeDiscount"
              class="w-320rpx text-right"
              :disabled="locked"
              type="digit"
              no-border
              placeholder="0.00"
            />
          </view>
          <view class="form-item">
            <view class="form-label required">
              租赁方式
            </view>
            <picker
              mode="selector"
              :range="labelsOf(leaseMethodOpts)"
              :value="indexOfValue(leaseMethodOpts, form.leaseMethod)"
              :disabled="locked"
              @change="onLeaseMethodPick($event)"
            >
              <view class="picker-cell">
                <text class="text-[#333]">{{ labelOf(leaseMethodOpts, form.leaseMethod) || '请选择租赁方式' }}</text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item">
            <view class="form-label required">
              租赁期限（月）
            </view>
            <wd-input
              v-model="form.leaseTimes"
              class="cell-input"
              :disabled="locked"
              type="number"
              no-border
              placeholder="如 36（需被支付频率整除）"
            />
          </view>
          <view class="form-item">
            <view class="form-label required">
              支付频率
            </view>
            <picker
              mode="selector"
              :range="labelsOf(payFreqOpts)"
              :value="indexOfValue(payFreqOpts, form.paymentFreq)"
              :disabled="locked"
              @change="onDictPick(payFreqOpts, 'paymentFreq', $event)"
            >
              <view class="picker-cell">
                <text class="text-[#333]">{{ labelOf(payFreqOpts, form.paymentFreq) || '请选择支付频率' }}</text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item">
            <view class="form-label required">
              先付 / 后付
            </view>
            <picker
              mode="selector"
              :range="labelsOf(prepayOpts)"
              :value="indexOfValue(prepayOpts, form.prepayFlag)"
              :disabled="locked"
              @change="onDictPick(prepayOpts, 'prepayFlag', $event)"
            >
              <view class="picker-cell">
                <text class="text-[#333]">{{ labelOf(prepayOpts, form.prepayFlag) || '请选择' }}</text>
                <wd-icon name="arrow-down" size="24rpx" color="#999" />
              </view>
            </picker>
          </view>
          <view class="form-item flex items-center justify-between">
            <view class="flex flex-col items-start">
              <view class="form-label required mb-0">
                租息年利率
              </view>
              <view v-if="hasRateFloat" class="mt-4rpx text-22rpx text-[#999]">
                由基准利率 ± 浮动自动合成
              </view>
            </view>
            <view class="flex items-center">
              <input
                v-model="rateTexts.finalRate"
                class="rate-input"
                type="digit"
                :disabled="locked"
                placeholder="0.00"
                @blur="onRateBlur('finalRate')"
              >
              <text class="text-28rpx text-[#333]">%</text>
            </view>
          </view>
          <view class="form-item flex items-center justify-between">
            <view class="form-label mb-0">
              计划收租日
            </view>
            <wd-input
              v-model="form.planLeaseDay"
              class="w-320rpx text-right"
              :disabled="locked"
              type="number"
              no-border
              placeholder="0 = 随起租日，1-31"
            />
          </view>
          <view class="form-item flex items-center justify-between">
            <view class="form-label mb-0">
              延迟期（日）
            </view>
            <wd-input
              v-model="form.delayPeriod"
              class="w-320rpx text-right"
              :disabled="locked"
              type="number"
              no-border
              placeholder="0"
            />
          </view>
          <view class="form-item">
            <view class="form-label">
              宽限期（月）
            </view>
            <wd-input
              v-model="form.gracePeriod"
              class="cell-input"
              :disabled="locked"
              type="number"
              no-border
              placeholder="0"
            />
          </view>
        </view>

        <!-- ==================== 保证金（渐进披露折叠区） ==================== -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex items-center justify-between px-24rpx py-20rpx" @click="toggleSection('deposit')">
            <view class="flex items-center gap-16rpx">
              <text class="text-28rpx text-[#333] font-500">保证金</text>
              <text class="text-24rpx" :class="hasDeposit ? 'text-[#018d71]' : 'text-[#999]'">
                {{ depositSummary }}
              </text>
            </view>
            <wd-icon :name="openSections.includes('deposit') ? 'arrow-up' : 'arrow-down'" size="24rpx" color="#999" />
          </view>
          <view v-if="openSections.includes('deposit')" class="border-t border-t-[#f0f0f0] p-24rpx">
            <view class="form-item">
              <view class="form-label">
                收取方式
              </view>
              <picker
                mode="selector"
                :range="labelsOf(depositMethodOpts)"
                :value="indexOfValue(depositMethodOpts, form.depositMethod)"
                :disabled="locked"
                @change="onDictPick(depositMethodOpts, 'depositMethod', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(depositMethodOpts, form.depositMethod) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="flex flex-col items-start">
                <view class="form-label mb-0">
                  保证金金额（元）
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  {{ ratioHint('deposit') }}
                </view>
              </view>
              <view class="flex flex-col items-end">
                <wd-input
                  v-model="form.depositCash"
                  class="w-320rpx text-right"
                  :disabled="locked || form.depositMethod === 3"
                  :type="form.depositMethod === 3 ? 'text' : 'digit'"
                  no-border
                  :placeholder="form.depositMethod === 3 ? '手工明细维护' : '0.00'"
                  @blur="onCashBlur('deposit')"
                />
                <view v-if="!locked && form.depositMethod !== 3 && ratioEditable('deposit')" class="mt-4rpx flex items-center">
                  <text class="text-22rpx text-[#999]">按比例</text>
                  <input
                    v-model="ratioTexts.deposit"
                    class="ratio-input"
                    type="digit"
                    @blur="onRatioBlur('deposit')"
                  >
                  <text class="text-22rpx text-[#999]">%</text>
                </view>
              </view>
            </view>
            <view class="form-item">
              <view class="form-label">
                起始收取日期
              </view>
              <picker
                mode="date"
                :value="form.depositStartDate"
                :disabled="locked"
                @change="onDatePick('depositStartDate', $event)"
              >
                <view class="picker-cell">
                  <text :class="form.depositStartDate ? 'text-[#333]' : 'text-[#999]'">
                    {{ form.depositStartDate || '空 = 投放日' }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                退回方式
              </view>
              <picker
                mode="selector"
                :range="labelsOf(depositReturnOpts)"
                :value="indexOfValue(depositReturnOpts, form.depositReturnMethod)"
                :disabled="locked"
                @change="onDictPick(depositReturnOpts, 'depositReturnMethod', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(depositReturnOpts, form.depositReturnMethod) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                是否计息
              </view>
              <picker
                mode="selector"
                :range="labelsOf(yesNoOpts)"
                :value="indexOfValue(yesNoOpts, form.depositInterestFlag)"
                :disabled="locked"
                @change="onDictPick(yesNoOpts, 'depositInterestFlag', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(yesNoOpts, form.depositInterestFlag) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                保证金年利率
              </view>
              <view class="flex items-center">
                <input
                  v-model="rateTexts.depositRate"
                  class="rate-input"
                  type="digit"
                  :disabled="locked || form.depositInterestFlag === 0"
                  placeholder="0.00"
                  @blur="onRateBlur('depositRate')"
                >
                <text class="text-28rpx text-[#333]">%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- ==================== 服务费（渐进披露折叠区） ==================== -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex items-center justify-between px-24rpx py-20rpx" @click="toggleSection('srv')">
            <view class="flex items-center gap-16rpx">
              <text class="text-28rpx text-[#333] font-500">服务费</text>
              <text class="text-24rpx" :class="hasSrvFee ? 'text-[#018d71]' : 'text-[#999]'">
                {{ srvSummary }}
              </text>
            </view>
            <wd-icon :name="openSections.includes('srv') ? 'arrow-up' : 'arrow-down'" size="24rpx" color="#999" />
          </view>
          <view v-if="openSections.includes('srv')" class="border-t border-t-[#f0f0f0] p-24rpx">
            <view class="mb-8rpx text-26rpx text-[#018d71] font-500">
              收入
            </view>
            <view class="form-item">
              <view class="form-label">
                收取方式
              </view>
              <picker
                mode="selector"
                :range="labelsOf(srvMethodOpts)"
                :value="indexOfValue(srvMethodOpts, form.srvInMethod)"
                :disabled="locked"
                @change="onDictPick(srvMethodOpts, 'srvInMethod', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(srvMethodOpts, form.srvInMethod) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                收入基数
              </view>
              <picker
                mode="selector"
                :range="labelsOf(srvBaseOpts)"
                :value="indexOfValue(srvBaseOpts, form.srvInBase)"
                :disabled="locked"
                @change="onDictPick(srvBaseOpts, 'srvInBase', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(srvBaseOpts, form.srvInBase) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="flex flex-col items-start">
                <view class="form-label mb-0">
                  收入金额（元）
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  {{ srvInMethod === 3 ? '手工维护：以手工收支明细为准' : ratioHint('srvIn') }}
                </view>
              </view>
              <view class="flex flex-col items-end">
                <wd-input
                  v-model="form.srvInCash"
                  class="w-320rpx text-right"
                  :disabled="locked || srvInMethod === 3"
                  :type="srvInMethod === 3 ? 'text' : 'digit'"
                  no-border
                  :placeholder="srvInMethod === 3 ? '手工明细维护' : '0.00'"
                  @blur="onCashBlur('srvIn')"
                />
                <view v-if="!locked && srvInMethod !== 3 && ratioEditable('srvIn')" class="mt-4rpx flex items-center">
                  <text class="text-22rpx text-[#999]">按比例</text>
                  <input
                    v-model="ratioTexts.srvIn"
                    class="ratio-input"
                    type="digit"
                    @blur="onRatioBlur('srvIn')"
                  >
                  <text class="text-22rpx text-[#999]">%</text>
                </view>
              </view>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                收入税率
              </view>
              <view class="flex items-center">
                <input
                  v-model="rateTexts.srvInTaxRate"
                  class="rate-input"
                  type="digit"
                  :disabled="locked"
                  placeholder="0.00"
                  @blur="onRateBlur('srvInTaxRate')"
                >
                <text class="text-28rpx text-[#333]">%</text>
              </view>
            </view>

            <view class="mb-8rpx mt-24rpx text-26rpx text-[#fa8c16] font-500">
              支出
            </view>
            <view class="form-item">
              <view class="form-label">
                支付方式
              </view>
              <picker
                mode="selector"
                :range="labelsOf(srvMethodOpts)"
                :value="indexOfValue(srvMethodOpts, form.srvOutMethod)"
                :disabled="locked"
                @change="onDictPick(srvMethodOpts, 'srvOutMethod', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(srvMethodOpts, form.srvOutMethod) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                支出基数
              </view>
              <picker
                mode="selector"
                :range="labelsOf(srvBaseOpts)"
                :value="indexOfValue(srvBaseOpts, form.srvOutBase)"
                :disabled="locked"
                @change="onDictPick(srvBaseOpts, 'srvOutBase', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(srvBaseOpts, form.srvOutBase) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="flex flex-col items-start">
                <view class="form-label mb-0">
                  支出金额（元）
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  {{ srvOutMethod === 3 ? '手工维护：以手工收支明细为准' : ratioHint('srvOut') }}
                </view>
              </view>
              <view class="flex flex-col items-end">
                <wd-input
                  v-model="form.srvOutCash"
                  class="w-320rpx text-right"
                  :disabled="locked || srvOutMethod === 3"
                  :type="srvOutMethod === 3 ? 'text' : 'digit'"
                  no-border
                  :placeholder="srvOutMethod === 3 ? '手工明细维护' : '0.00'"
                  @blur="onCashBlur('srvOut')"
                />
                <view v-if="!locked && srvOutMethod !== 3 && ratioEditable('srvOut')" class="mt-4rpx flex items-center">
                  <text class="text-22rpx text-[#999]">按比例</text>
                  <input
                    v-model="ratioTexts.srvOut"
                    class="ratio-input"
                    type="digit"
                    @blur="onRatioBlur('srvOut')"
                  >
                  <text class="text-22rpx text-[#999]">%</text>
                </view>
              </view>
            </view>
            <view class="form-item">
              <view class="form-label">
                首期支出日期
              </view>
              <picker
                mode="date"
                :value="form.srvOutFirstDate"
                :disabled="locked"
                @change="onDatePick('srvOutFirstDate', $event)"
              >
                <view class="picker-cell">
                  <text :class="form.srvOutFirstDate ? 'text-[#333]' : 'text-[#999]'">
                    {{ form.srvOutFirstDate || '空 = 投放日' }}
                  </text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                支出税率
              </view>
              <view class="flex items-center">
                <input
                  v-model="rateTexts.srvOutTaxRate"
                  class="rate-input"
                  type="digit"
                  :disabled="locked"
                  placeholder="0.00"
                  @blur="onRateBlur('srvOutTaxRate')"
                >
                <text class="text-28rpx text-[#333]">%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- ==================== 高级参数（渐进披露折叠区） ==================== -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex items-center justify-between px-24rpx py-20rpx" @click="toggleSection('advanced')">
            <view class="flex items-center gap-16rpx">
              <text class="text-28rpx text-[#333] font-500">高级参数</text>
              <text class="text-24rpx" :class="advancedCustomized ? 'text-[#018d71]' : 'text-[#999]'">
                {{ advancedCustomized ? '已自定义' : '默认值' }}
              </text>
            </view>
            <wd-icon :name="openSections.includes('advanced') ? 'arrow-up' : 'arrow-down'" size="24rpx" color="#999" />
          </view>
          <view v-if="openSections.includes('advanced')" class="border-t border-t-[#f0f0f0] p-24rpx">
            <view class="form-item flex items-center justify-between">
              <view class="flex flex-col items-start">
                <view class="form-label mb-0">
                  基准利率
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  配合浮动自动合成租息年利率
                </view>
              </view>
              <view class="flex items-center">
                <input
                  v-model="rateTexts.baseRate"
                  class="rate-input"
                  type="digit"
                  :disabled="locked"
                  placeholder="0.00"
                  @blur="onRateBlur('baseRate')"
                >
                <text class="text-28rpx text-[#333]">%</text>
              </view>
            </view>
            <view class="form-item">
              <view class="form-label">
                浮动方式
              </view>
              <picker
                mode="selector"
                :range="labelsOf(floatMethodOpts)"
                :value="indexOfValue(floatMethodOpts, form.floatMethod)"
                :disabled="locked"
                @change="onDictPick(floatMethodOpts, 'floatMethod', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(floatMethodOpts, form.floatMethod) || '未设置' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                浮动值
              </view>
              <view class="flex items-center">
                <input
                  v-model="rateTexts.floatValue"
                  class="rate-input"
                  type="digit"
                  :disabled="locked"
                  placeholder="0.00"
                  @blur="onRateBlur('floatValue')"
                >
                <text class="text-28rpx text-[#333]">%</text>
              </view>
            </view>
            <view class="form-item">
              <view class="form-label">
                计算比例基数
              </view>
              <picker
                mode="selector"
                :range="labelsOf(ratioBaseOpts)"
                :value="indexOfValue(ratioBaseOpts, form.ratioBase)"
                :disabled="locked"
                @change="onDictPick(ratioBaseOpts, 'ratioBase', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(ratioBaseOpts, form.ratioBase) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                名义货价（留购价）
              </view>
              <wd-input
                v-model="form.nominalPrice"
                class="w-320rpx text-right"
                :disabled="locked"
                type="digit"
                no-border
                placeholder="0.00"
              />
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="form-label mb-0">
                资产余值（元）
              </view>
              <wd-input
                v-model="form.assetsMargin"
                class="w-320rpx text-right"
                :disabled="locked"
                type="digit"
                no-border
                placeholder="0.00"
              />
            </view>
            <view class="form-item flex items-center justify-between">
              <view class="flex flex-col items-start">
                <view class="form-label mb-0">
                  租金税率
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  随租赁方式联动：直租 13% / 回租 6%
                </view>
              </view>
              <view class="flex items-center">
                <input
                  v-model="rateTexts.quoteTaxRate"
                  class="rate-input"
                  type="digit"
                  :disabled="locked"
                  placeholder="0.00"
                  @blur="onRateBlur('quoteTaxRate')"
                >
                <text class="text-28rpx text-[#333]">%</text>
              </view>
            </view>
            <view class="form-item">
              <view class="form-label">
                税种
              </view>
              <picker
                mode="selector"
                :range="labelsOf(taxModeOpts)"
                :value="indexOfValue(taxModeOpts, form.taxMode)"
                :disabled="locked"
                @change="onDictPick(taxModeOpts, 'taxMode', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(taxModeOpts, form.taxMode) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                本金是否开票
              </view>
              <picker
                mode="selector"
                :range="labelsOf(yesNoOpts)"
                :value="indexOfValue(yesNoOpts, form.corpusInvoiceFlag)"
                :disabled="locked"
                @change="onDictPick(yesNoOpts, 'corpusInvoiceFlag', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(yesNoOpts, form.corpusInvoiceFlag) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                年计算天数
              </view>
              <picker
                mode="selector"
                :range="labelsOf(daysOpts)"
                :value="indexOfValue(daysOpts, form.yearDays)"
                :disabled="locked"
                @change="onDictPick(daysOpts, 'yearDays', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(daysOpts, form.yearDays) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                IRR 年化天数
              </view>
              <picker
                mode="selector"
                :range="labelsOf(daysOpts)"
                :value="indexOfValue(daysOpts, form.irrDays)"
                :disabled="locked"
                @change="onDictPick(daysOpts, 'irrDays', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(daysOpts, form.irrDays) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
            <view class="form-item">
              <view class="form-label">
                计算精度
              </view>
              <picker
                mode="selector"
                :range="labelsOf(digitOpts)"
                :value="indexOfValue(digitOpts, form.calDigit)"
                :disabled="locked"
                @change="onDictPick(digitOpts, 'calDigit', $event)"
              >
                <view class="picker-cell">
                  <text class="text-[#333]">{{ labelOf(digitOpts, form.calDigit) || '请选择' }}</text>
                  <wd-icon name="arrow-down" size="24rpx" color="#999" />
                </view>
              </picker>
            </view>
          </view>
        </view>

        <!-- ==================== 即时勾稽提示 ==================== -->
        <view
          v-for="issue in immediateIssues"
          :key="issue.text"
          class="m-24rpx mt-0 rounded-12rpx px-20rpx py-16rpx text-24rpx"
          :class="issue.type === 'error' ? 'bg-[#fff1f0] text-[#f5222d]' : 'bg-[#fffbe6] text-[#d48806]'"
        >
          {{ issue.type === 'error' ? '✕' : '!' }} {{ issue.text }}
        </view>

        <!-- ==================== 子表编辑（投放计划 / 租金规则 / 手工收支） ==================== -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <wd-tabs v-model="activeTab">
            <wd-tab title="投放计划">
              <view class="p-24rpx">
                <view v-if="!form.loanPlans.length" class="py-32rpx text-center text-26rpx text-[#999]">
                  暂无投放计划，至少需要一笔
                </view>
                <view
                  v-for="(row, index) in form.loanPlans"
                  :key="index"
                  class="row-card"
                  @click="openLoanRow(index)"
                >
                  <view class="flex items-center justify-between">
                    <text class="text-28rpx text-[#333]">{{ row.planDate || '-' }}</text>
                    <text class="text-28rpx text-[#333] font-500">{{ formatMoney(toNum(row.cash)) }}</text>
                  </view>
                  <view class="mt-4rpx flex items-center justify-between">
                    <text class="text-24rpx text-[#999]">{{ labelOf(payMethodOpts, row.payMethod) || '-' }}</text>
                    <text v-if="!locked" class="row-del" @click.stop="removeRow('loan', index)">删除</text>
                  </view>
                </view>
                <wd-button v-if="!locked" plain block size="small" class="mt-16rpx" @click="openLoanRow(-1)">
                  + 增加投放批次
                </wd-button>
              </view>
            </wd-tab>
            <wd-tab title="租金规则">
              <view class="p-24rpx">
                <view v-if="!form.rentRules.length" class="py-32rpx text-center text-26rpx text-[#999]">
                  暂无租金规则，至少需要一段
                </view>
                <view
                  v-for="(row, index) in form.rentRules"
                  :key="index"
                  class="row-card"
                  @click="openRentRow(index)"
                >
                  <view class="flex items-center justify-between">
                    <text class="text-28rpx text-[#333]">第 {{ row.startPeriod ?? '-' }} 期起</text>
                    <text class="text-28rpx text-[#333] font-500">
                      {{ row.rentCash != null ? formatMoney(toNum(row.rentCash)) : '按规则计算' }}
                    </text>
                  </view>
                  <view class="mt-4rpx flex items-center justify-between">
                    <text class="text-24rpx text-[#999]">
                      {{ labelOf(payFreqOpts, row.paymentFreq) || '-' }}付 · {{ labelOf(calMethodOpts, row.calMethod) || '-' }}
                    </text>
                    <text v-if="!locked" class="row-del" @click.stop="removeRow('rent', index)">删除</text>
                  </view>
                </view>
                <view class="mt-8rpx text-22rpx text-[#bbb]">
                  金额含义随计算方式变化：等差 = 每期递增额；指定租金 = 每期租金；指定本金 = 每期本金；等额方式无需填写。
                </view>
                <view class="mt-16rpx flex flex-col gap-16rpx">
                  <wd-button v-if="!locked" plain block size="small" @click="openRentRow(-1)">
                    + 增加规则段
                  </wd-button>
                  <wd-button
                    v-if="!locked && canPrefillEqualRent"

                    plain block
                    size="small"
                    @click="prefillEqualRent"
                  >
                    按等额租金预填金额
                  </wd-button>
                </view>
              </view>
            </wd-tab>
            <wd-tab title="手工收支">
              <view class="p-24rpx">
                <view v-if="!form.manualPlans?.length" class="py-32rpx text-center text-26rpx text-[#999]">
                  暂无手工收支（保证金 / 服务费方式为手工时在此维护）
                </view>
                <view
                  v-for="(row, index) in form.manualPlans"
                  :key="index"
                  class="row-card"
                  @click="openManualRow(index)"
                >
                  <view class="flex items-center justify-between">
                    <text class="text-28rpx text-[#333]">
                      {{ labelOf(manualKindOpts, row.kind) || '收支' }} · {{ row.planDate || '-' }}
                    </text>
                    <text class="text-28rpx font-500" :class="toNum(row.direction) === 1 ? 'text-[#52c41a]' : 'text-[#f5222d]'">
                      {{ toNum(row.direction) === 1 ? '+' : '-' }}{{ formatMoney(toNum(row.cash)) }}
                    </text>
                  </view>
                  <view class="mt-4rpx flex items-center justify-between">
                    <text class="line-clamp-1 flex-1 text-24rpx text-[#999]">{{ row.memo || '无备注' }}</text>
                    <text v-if="!locked" class="row-del" @click.stop="removeRow('manual', index)">删除</text>
                  </view>
                </view>
                <wd-button v-if="!locked" plain block size="small" class="mt-16rpx" @click="openManualRow(-1)">
                  + 增加明细
                </wd-button>
              </view>
            </wd-tab>
          </wd-tabs>
        </view>

        <!-- ==================== 测算结果（指标卡 + 收支计划 / 计提表） ==================== -->
        <view class="m-24rpx mt-0 overflow-hidden rounded-16rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view class="flex items-center gap-16rpx">
              <text class="text-28rpx text-[#333] font-500">测算结果</text>
              <text class="text-24rpx" :class="summaryColor">{{ summaryText }}</text>
            </view>
            <text v-if="quoteId" class="text-24rpx text-[#018d71]" @click="openHistory">历史版本</text>
          </view>

          <!-- 测算失败（后端勾稽不通过等，逐条展示失败步骤） -->
          <view v-if="failedTrace" class="m-24rpx rounded-12rpx bg-[#fff1f0] p-20rpx">
            <view class="text-26rpx text-[#f5222d] font-500">
              测算失败：{{ failedTrace.errorMsg || '未知原因' }}
            </view>
            <view
              v-for="step in failedSteps"
              :key="step.stepCode"
              class="mt-12rpx border-t border-t-[#ffe0dd] pt-12rpx text-24rpx"
              :class="step.status === 2 ? 'text-[#f5222d]' : 'text-[#d48806]'"
            >
              {{ step.status === 2 ? '✕' : '－' }} {{ step.stepName }}：{{ step.errorMsg || step.skipReason || '—' }}
            </view>
          </view>

          <!-- 指标卡 -->
          <view v-if="snapshot" class="p-24rpx">
            <view v-if="stale" class="mb-16rpx rounded-12rpx bg-[#fffbe6] px-16rpx py-12rpx text-24rpx text-[#d48806]">
              参数已修改，当前结果为旧版本，请重新测算
            </view>
            <view class="grid grid-cols-2 gap-y-20rpx">
              <view v-for="ind in indicatorItems" :key="ind.label">
                <view class="text-24rpx text-[#999]">
                  {{ ind.label }}
                </view>
                <view class="text-30rpx font-500" :class="stale ? 'text-[#bbb]' : 'text-[#018d71]'">
                  {{ ind.value }}
                </view>
              </view>
            </view>
          </view>
          <view v-else-if="!failedTrace" class="px-24rpx pb-24rpx pt-8rpx text-26rpx text-[#999]">
            填写参数后点击「测算预览」，IRR、净融资额与收支计划将在此展示
          </view>

          <!-- 收支计划 -->
          <template v-if="snapshot">
            <view class="flex items-center justify-between border-t border-t-[#f0f0f0] px-24rpx py-20rpx" @click="toggleSection('inout')">
              <text class="text-26rpx text-[#333] font-500">收支计划（{{ snapshot.rows?.length ?? 0 }} 行）</text>
              <wd-icon :name="openSections.includes('inout') ? 'arrow-up' : 'arrow-down'" size="24rpx" color="#999" />
            </view>
            <view v-if="openSections.includes('inout')" class="border-t border-t-[#f7f8f9] px-24rpx">
              <view
                v-for="(row, index) in snapshot.rows"
                :key="index"
                class="border-b border-b-[#f7f8f9] py-16rpx last:border-b-0"
              >
                <view class="flex items-center justify-between">
                  <text class="text-26rpx text-[#333]">
                    {{ row.period ? `第 ${row.period} 期` : '非租期' }} · {{ row.planDate || '-' }} · {{ row.eventName || '-' }}
                  </text>
                  <text class="text-26rpx font-500" :class="toNum(row.direction) > 0 ? 'text-[#52c41a]' : 'text-[#f5222d]'">
                    {{ toNum(row.direction) > 0 ? '+' : '-' }}{{ formatMoney(toNum(row.cash)) }}
                  </text>
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  本金 {{ formatMoney(row.corpus) }} · 利息 {{ formatMoney(row.interest) }} · 余额 {{ formatMoney(row.corpusBalance) }} · 税 {{ formatMoney(row.taxCash) }}
                </view>
              </view>
            </view>

            <!-- 计提表 -->
            <view class="flex items-center justify-between border-t border-t-[#f0f0f0] px-24rpx py-20rpx" @click="toggleSection('accrual')">
              <text class="text-26rpx text-[#333] font-500">计提表（{{ snapshot.accruals?.length ?? 0 }} 行）</text>
              <wd-icon :name="openSections.includes('accrual') ? 'arrow-up' : 'arrow-down'" size="24rpx" color="#999" />
            </view>
            <view v-if="openSections.includes('accrual')" class="border-t border-t-[#f7f8f9] px-24rpx">
              <view v-if="!snapshot.accruals?.length" class="py-24rpx text-center text-24rpx text-[#999]">
                无计提数据（会计 XIRR 无法求解或无利息）
              </view>
              <view
                v-for="(row, index) in snapshot.accruals"
                :key="index"
                class="flex items-center justify-between border-b border-b-[#f7f8f9] py-16rpx text-26rpx last:border-b-0"
              >
                <text class="text-[#333]">{{ row.month || '-' }} · {{ row.accrualType === 2 ? '手续费' : '租金利息' }}</text>
                <text class="text-[#333] font-500">{{ formatMoney(toNum(row.cash)) }}</text>
              </view>
            </view>
          </template>
          <view class="h-24rpx" />
        </view>

        <view class="h-180rpx" />
      </template>
    </scroll-view>

    <!-- ==================== 底部操作栏 ==================== -->
    <view
      v-if="!loading"
      class="fixed inset-x-0 bottom-0 z-10 flex gap-16rpx border-t border-t-[#f0f0f0] bg-white px-24rpx pb-[env(safe-area-inset-bottom)] pt-16rpx"
    >
      <template v-if="!locked">
        <wd-button class="flex-1" plain :loading="previewing" :disabled="saving" @click="handlePreview">
          测算预览
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="saving" :disabled="previewing" @click="handleSave">
          保存
        </wd-button>
        <wd-button v-if="quoteId" plain @click="showMore = true">
          更多
        </wd-button>
      </template>
      <template v-else>
        <wd-button class="flex-1" plain :loading="saving" @click="handleCancelConfirm">
          取消确认
        </wd-button>
        <wd-button plain @click="showMore = true">
          更多
        </wd-button>
      </template>
    </view>

    <!-- ==================== 更多操作弹层 ==================== -->
    <wd-popup v-model="showMore" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          更多操作
        </view>
        <view v-if="!locked && quoteId" class="more-item" @click="handleConfirm">
          <text class="text-30rpx text-[#333]">确认锁定</text>
          <text class="mt-4rpx text-22rpx text-[#999]">锁定参数与最新测算结果，修改需先取消确认</text>
        </view>
        <view v-if="!locked && quoteId" class="more-item" @click="handleRecalculate">
          <text class="text-30rpx text-[#333]">重新测算</text>
          <text class="mt-4rpx text-22rpx text-[#999]">用已保存的参数重算（未保存的修改不生效）</text>
        </view>
        <view v-if="quoteId" class="more-item" @click="handleCopy">
          <text class="text-30rpx text-[#333]">复制为新测算</text>
          <text class="mt-4rpx text-22rpx text-[#999]">基于最近一次保存的版本生成新草稿</text>
        </view>
        <view v-if="quoteId" class="more-item" @click="openHistory">
          <text class="text-30rpx text-[#333]">历史测算版本</text>
          <text class="mt-4rpx text-22rpx text-[#999]">查看历次测算记录与步骤明细（只读）</text>
        </view>
        <view v-if="quoteId" class="more-item" @click="handleDelete">
          <text class="text-30rpx text-[#f5222d]">删除方案</text>
          <text class="mt-4rpx text-22rpx text-[#999]">删除后不可恢复</text>
        </view>
        <wd-button plain block class="mt-16rpx" @click="showMore = false">
          取消
        </wd-button>
      </view>
    </wd-popup>

    <!-- ==================== 投放计划行编辑弹层 ==================== -->
    <wd-popup v-model="showLoanRow" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ loanRowIndex < 0 ? '增加投放批次' : '编辑投放批次' }}
        </view>
        <view class="form-item">
          <view class="form-label required">
            计划投放日期
          </view>
          <picker mode="date" :value="loanDraft.planDate" @change="loanDraft.planDate = $event.detail.value">
            <view class="picker-cell">
              <text :class="loanDraft.planDate ? 'text-[#333]' : 'text-[#999]'">
                {{ loanDraft.planDate || '请选择日期' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label required mb-0">
            投放金额（元）
          </view>
          <wd-input
            v-model="loanDraft.cash"
            class="w-320rpx text-right"
            type="digit"
            no-border
            placeholder="0.00"
          />
        </view>
        <view class="form-item">
          <view class="form-label">
            付款方式
          </view>
          <picker
            mode="selector"
            :range="labelsOf(payMethodOpts)"
            :value="indexOfValue(payMethodOpts, loanDraft.payMethod)"
            @change="loanDraft.payMethod = valueOfIndex(payMethodOpts, Number($event.detail.value))"
          >
            <view class="picker-cell">
              <text class="text-[#333]">{{ labelOf(payMethodOpts, loanDraft.payMethod) || '请选择' }}</text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="flex gap-16rpx">
          <wd-button class="flex-1" plain @click="showLoanRow = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="saveLoanRow">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- ==================== 租金规则行编辑弹层 ==================== -->
    <wd-popup v-model="showRentRow" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ rentRowIndex < 0 ? '增加规则段' : '编辑规则段' }}
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label required mb-0">
            起始期次
          </view>
          <wd-input
            v-model="rentDraft.startPeriod"
            class="w-320rpx text-right"
            type="number"
            no-border
            placeholder="如 1（首段必须为 1）"
          />
        </view>
        <view class="form-item">
          <view class="form-label required">
            支付频率
          </view>
          <picker
            mode="selector"
            :range="labelsOf(payFreqOpts)"
            :value="indexOfValue(payFreqOpts, rentDraft.paymentFreq)"
            @change="rentDraft.paymentFreq = valueOfIndex(payFreqOpts, Number($event.detail.value))"
          >
            <view class="picker-cell">
              <text class="text-[#333]">{{ labelOf(payFreqOpts, rentDraft.paymentFreq) || '请选择' }}</text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="form-item">
          <view class="form-label required">
            计算方式
          </view>
          <picker
            mode="selector"
            :range="labelsOf(calMethodOpts)"
            :value="indexOfValue(calMethodOpts, rentDraft.calMethod)"
            @change="rentDraft.calMethod = valueOfIndex(calMethodOpts, Number($event.detail.value))"
          >
            <view class="picker-cell">
              <text class="text-[#333]">{{ labelOf(calMethodOpts, rentDraft.calMethod) || '请选择' }}</text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label mb-0">
            金额（元）
          </view>
          <wd-input
            v-model="rentDraft.rentCash"
            class="w-320rpx text-right"
            :type="rentCashDisabled ? 'text' : 'digit'"
            :disabled="rentCashDisabled"
            no-border
            :placeholder="rentCashPlaceholder"
          />
        </view>
        <view class="flex gap-16rpx">
          <wd-button class="flex-1" plain @click="showRentRow = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="saveRentRow">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- ==================== 手工收支行编辑弹层 ==================== -->
    <wd-popup v-model="showManualRow" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ manualRowIndex < 0 ? '增加手工收支' : '编辑手工收支' }}
        </view>
        <view class="form-item">
          <view class="form-label required">
            类别
          </view>
          <picker
            mode="selector"
            :range="labelsOf(manualKindOpts)"
            :value="indexOfValue(manualKindOpts, manualDraft.kind)"
            @change="manualDraft.kind = valueOfIndex(manualKindOpts, Number($event.detail.value))"
          >
            <view class="picker-cell">
              <text class="text-[#333]">{{ labelOf(manualKindOpts, manualDraft.kind) || '请选择' }}</text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="form-item">
          <view class="form-label required">
            计划日期
          </view>
          <picker mode="date" :value="manualDraft.planDate" @change="manualDraft.planDate = $event.detail.value">
            <view class="picker-cell">
              <text :class="manualDraft.planDate ? 'text-[#333]' : 'text-[#999]'">
                {{ manualDraft.planDate || '请选择日期' }}
              </text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="form-item">
          <view class="form-label required">
            收支方向
          </view>
          <picker
            mode="selector"
            :range="directionLabels"
            :value="manualDraft.direction === 1 ? 0 : 1"
            @change="manualDraft.direction = Number($event.detail.value) === 0 ? 1 : -1"
          >
            <view class="picker-cell">
              <text class="text-[#333]">{{ manualDraft.direction === 1 ? '流入' : '流出' }}</text>
              <wd-icon name="arrow-down" size="24rpx" color="#999" />
            </view>
          </picker>
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label required mb-0">
            发生额（元）
          </view>
          <wd-input
            v-model="manualDraft.cash"
            class="w-320rpx text-right"
            type="digit"
            no-border
            placeholder="0.00"
          />
        </view>
        <view class="form-item flex items-center justify-between">
          <view class="form-label mb-0">
            税率
          </view>
          <view class="flex items-center">
            <input
              v-model="manualRateText"
              class="rate-input"
              type="digit"
              placeholder="0.00"
              @blur="onManualRateBlur"
            >
            <text class="text-28rpx text-[#333]">%</text>
          </view>
        </view>
        <view class="form-item">
          <view class="form-label">
            备注
          </view>
          <wd-textarea
            v-model="manualDraft.memo"
            :maxlength="255"
            clearable
            no-border
            placeholder="备注（选填）"
          />
        </view>
        <view class="flex gap-16rpx">
          <wd-button class="flex-1" plain @click="showManualRow = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="saveManualRow">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- ==================== 历史测算版本弹层（只读） ==================== -->
    <wd-popup v-model="showHistory" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="max-h-[75vh] flex flex-col px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          历史测算版本
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y>
          <view v-if="historyLoading" class="flex justify-center py-48rpx">
            <wd-loading color="#018d71" />
          </view>
          <view v-else-if="!historyRows.length" class="py-48rpx text-center text-26rpx text-[#999]">
            暂无测算记录
          </view>
          <view
            v-for="trace in historyRows"
            :key="trace.id"
            class="row-card"
            @click="openTraceDetail(trace)"
          >
            <view class="flex items-center justify-between">
              <text class="text-28rpx text-[#333]">
                {{ traceTypeLabel(trace.traceType) }} · {{ formatDateTime(trace.createTime) }}
              </text>
              <wd-tag :type="trace.status === 0 ? 'success' : 'danger'" plain>
                {{ trace.status === 0 ? '成功' : '失败' }}
              </wd-tag>
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ trace.stepCount ?? 0 }} 步骤 · 耗时 {{ ((trace.totalCostMs ?? 0) / 1000).toFixed(1) }} 秒
              <template v-if="trace.status !== 0">
                · {{ trace.errorMsg || '未知原因' }}
              </template>
            </view>
          </view>
        </scroll-view>
        <wd-button plain block class="mt-16rpx" @click="showHistory = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>

    <!-- ==================== 测算记录详情弹层（只读） ==================== -->
    <wd-popup v-model="showTraceDetail" position="bottom" custom-class="rounded-t-24rpx" safe-area-inset-bottom>
      <view class="max-h-[80vh] flex flex-col px-24rpx pb-24rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          测算记录详情
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y>
          <template v-if="traceDetail">
            <view class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-20rpx text-24rpx text-[#666]">
              <view>
                {{ traceTypeLabel(traceDetail.traceType) }} · {{ traceDetail.status === 0 ? '成功' : '失败' }} · 引擎 {{ traceDetail.engineVersion || '-' }}
              </view>
              <view v-if="traceDetail.errorMsg" class="mt-8rpx text-[#f5222d]">
                失败原因：{{ traceDetail.errorMsg }}
              </view>
            </view>
            <template v-if="traceIndicators.length">
              <view class="mb-8rpx text-26rpx text-[#333] font-500">
                结果指标
              </view>
              <view class="grid grid-cols-2 mb-24rpx gap-y-16rpx">
                <view v-for="ind in traceIndicators" :key="ind.label">
                  <view class="text-22rpx text-[#999]">
                    {{ ind.label }}
                  </view>
                  <view class="text-26rpx text-[#018d71] font-500">
                    {{ ind.value }}
                  </view>
                </view>
              </view>
            </template>
            <view class="mb-8rpx text-26rpx text-[#333] font-500">
              步骤明细
            </view>
            <view
              v-for="step in traceDetail.steps || []"
              :key="step.stepCode"
              class="border-b border-b-[#f7f8f9] py-16rpx last:border-b-0"
            >
              <view class="flex items-center justify-between">
                <text class="text-26rpx text-[#333]">{{ step.stepNo }}. {{ step.stepName }}</text>
                <text
                  class="text-24rpx"
                  :class="step.status === 0 ? 'text-[#52c41a]' : step.status === 1 ? 'text-[#999]' : 'text-[#f5222d]'"
                >
                  {{ step.status === 0 ? '成功' : step.status === 1 ? '跳过' : '失败' }}
                </text>
              </view>
              <view
                v-if="(step.status === 2 && step.errorMsg) || (step.status === 1 && step.skipReason)"
                class="mt-4rpx text-24rpx"
                :class="step.status === 2 ? 'text-[#f5222d]' : 'text-[#999]'"
              >
                {{ step.status === 2 ? step.errorMsg : step.skipReason }}
              </view>
            </view>
          </template>
        </scroll-view>
        <wd-button plain block class="mt-16rpx" @click="showTraceDetail = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { QuoteCalcVO, QuoteOutputSnapshotVO, QuoteTraceStepVO, QuoteTraceVO } from '@/api/fl/quoteCalc'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getIntDictOptions } from '@/hooks/useDict'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { computed, reactive, ref, watch } from 'vue'
import {
  cancelConfirmQuoteCalc,
  confirmQuoteCalc,
  copyQuoteCalc,
  createQuoteCalc,
  deleteQuoteCalc,
  getQuoteCalc,
  getQuoteCalcTrace,
  getQuoteCalcTracePage,
  previewQuoteCalc,
  recalculateQuoteCalc,
  updateQuoteCalc,
} from '@/api/fl/quoteCalc'
import { DICT_TYPE } from '@/utils/constants'

defineOptions({
  name: 'FlQuoteCalcEdit',
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()

function handleBack() {
  navigateBackPlus()
}

// ==================== 字典与静态选项 ====================

interface Opt {
  label: string
  value: number
}

/** 字典选项（每次渲染时从字典缓存取，保证字典异步加载后也能取到） */
function dictOpts(type: string): Opt[] {
  return getIntDictOptions(type) as Opt[]
}
const leaseMethodOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_LEASE_METHOD))
const payFreqOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_PAY_FREQ))
const payMethodOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_PAY_METHOD))
const calMethodOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_CAL_METHOD))
const manualKindOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_MANUAL_KIND))
const depositMethodOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_DEPOSIT_METHOD))
const depositReturnOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_DEPOSIT_RETURN))
const srvMethodOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_SRV_METHOD))
const srvBaseOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_SRV_BASE))
const ratioBaseOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_RATIO_BASE))
const taxModeOpts = computed(() => dictOpts(DICT_TYPE.FL_QUOTE_TAX_MODE))

const prepayOpts: Opt[] = [
  { label: '先付', value: 0 },
  { label: '后付', value: 1 },
]
const yesNoOpts: Opt[] = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
]
const floatMethodOpts: Opt[] = [
  { label: '百分比', value: 0 },
  { label: '绝对值', value: 1 },
]
const daysOpts: Opt[] = [
  { label: '360 天', value: 360 },
  { label: '365 天', value: 365 },
]
const digitOpts: Opt[] = [
  { label: '分（2 位）', value: 2 },
  { label: '元（0 位）', value: 0 },
]
const directionLabels = ['流入', '流出']

function labelsOf(opts: Opt[] | undefined): string[] {
  return (opts ?? []).map(o => o.label)
}
function indexOfValue(opts: Opt[] | undefined, value?: number): number {
  if (!opts) {
    return 0
  }
  const index = opts.findIndex(o => o.value === value)
  return index < 0 ? 0 : index
}
function valueOfIndex(opts: Opt[] | undefined, index: number): number | undefined {
  return opts?.[index]?.value
}
function labelOf(opts: Opt[] | undefined, value?: number): string {
  if (value === null || value === undefined) {
    return ''
  }
  return opts?.find(o => o.value === value)?.label ?? ''
}

// ==================== 表单数据 ====================

/** 新建时的默认值（与 PC 端 emptyForm 同口径） */
function emptyForm(): QuoteCalcVO {
  return {
    quotName: '',
    customerName: '',
    memo: '',
    planDateLoan: '',
    delayPeriod: 0,
    gracePeriod: 0,
    totalAmount: undefined as unknown as number,
    downPayment: 0,
    tradeDiscount: 0,
    finalRate: undefined as unknown as number,
    paymentFreq: 0,
    prepayFlag: 1,
    planLeaseDay: 10,
    leaseTimes: undefined as unknown as number,
    yearDays: 360,
    irrDays: 365,
    calDigit: 2,
    leaseMethod: 0,
    ratioBase: 0,
    depositMethod: 0,
    depositCash: 0,
    depositRate: 0,
    depositInterestFlag: 0,
    depositReturnMethod: 0,
    srvInMethod: 0,
    srvInBase: 0,
    srvInCash: 0,
    srvInTaxRate: 0.06,
    srvOutMethod: 0,
    srvOutBase: 0,
    srvOutCash: 0,
    srvOutTaxRate: 0.06,
    nominalPrice: 0,
    assetsMargin: 0,
    taxMode: 0,
    corpusInvoiceFlag: 1,
    quoteTaxRate: 0.13,
    status: 0,
    loanPlans: [],
    rentRules: [{ startPeriod: 1, paymentFreq: 0, calMethod: 0 }],
    manualPlans: [],
  }
}

const form = ref<QuoteCalcVO>(emptyForm())

/** 日期选择回写主表字段 */
function onDatePick(key: string, event: { detail: { value: string } }) {
  (form.value as any)[key] = event.detail.value
}

/** 字典下拉回写主表字段 */
function onDictPick(opts: Opt[] | undefined, key: string, event: { detail: { value: number } }) {
  (form.value as any)[key] = valueOfIndex(opts, Number(event.detail.value))
}
const loading = ref(false)
const quoteId = ref<number>()
const locked = computed(() => form.value.status === 1)
const pageTitle = computed(() => {
  if (locked.value) {
    return '方案详情（已锁定）'
  }
  return quoteId.value ? '编辑测算' : '新建测算'
})

/** 空值 / 字符串统一转数字（输入框 v-model 会带入字符串） */
function toNum(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

/** 支付频率 → 每期月数 */
const FREQ_MONTHS: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 6, 5: 12 }
const freqMonths = computed(() => FREQ_MONTHS[Number(form.value.paymentFreq)] ?? 1)

/** 实际投放金额 = 设备总金额 − 首付款（与后端投放合计校验同口径） */
const derivedLoanCash = computed(() =>
  (toNum(form.value.totalAmount) ?? 0) - (toNum(form.value.downPayment) ?? 0),
)

/** 比例分母（受计算比例基数影响） */
const ratioBaseAmount = computed(() =>
  Number(form.value.ratioBase) === 1
    ? (toNum(form.value.totalAmount) ?? 0) - (toNum(form.value.downPayment) ?? 0)
    : (toNum(form.value.totalAmount) ?? 0),
)

const srvInMethod = computed(() => Number(form.value.srvInMethod))
const srvOutMethod = computed(() => Number(form.value.srvOutMethod))
const hasRateFloat = computed(() => !!toNum(form.value.baseRate) && form.value.floatMethod !== null && form.value.floatMethod !== undefined)

// ==================== 利率百分数输入（底层存小数，0.07 ↔ 7%） ====================

/** 百分数输入框的显示值 */
const rateTexts = reactive<Record<string, string>>({
  finalRate: '',
  baseRate: '',
  floatValue: '',
  depositRate: '',
  srvInTaxRate: '',
  srvOutTaxRate: '',
  quoteTaxRate: '',
})
const RATE_KEYS = Object.keys(rateTexts)

/** 表单 → 百分数文本（外部加载 / 联动后调用） */
function syncRateTexts() {
  RATE_KEYS.forEach((key) => {
    const v = toNum((form.value as any)[key])
    rateTexts[key] = v === undefined ? '' : String(Number((v * 100).toFixed(6)))
  })
}

/** 百分数文本 → 表单（小数），非法输入置空 */
function onRateBlur(key: string) {
  const n = Number.parseFloat(String(rateTexts[key]).replaceAll('%', '').trim())
  ;(form.value as any)[key] = Number.isNaN(n) ? undefined : n / 100
}

// ==================== 金额 ↔ 比例双向联动 ====================

type RatioKey = 'down' | 'deposit' | 'srvIn' | 'srvOut'
/** 比例输入框显示值（百分数，如 10 = 10%） */
const ratioTexts = reactive<Record<RatioKey, string>>({ down: '', deposit: '', srvIn: '', srvOut: '' })
/** 用户最后编辑的一端：决定基数变化时保留哪一侧 */
const ratioEditedBy: Record<RatioKey, 'cash' | 'ratio'> = { down: 'cash', deposit: 'cash', srvIn: 'cash', srvOut: 'cash' }

function cashOf(key: RatioKey): number | undefined {
  switch (key) {
    case 'down': return toNum(form.value.downPayment)
    case 'deposit': return toNum(form.value.depositCash)
    case 'srvIn': return toNum(form.value.srvInCash)
    case 'srvOut': return toNum(form.value.srvOutCash)
  }
}
function setCashOf(key: RatioKey, value: number | undefined) {
  switch (key) {
    case 'down':
      form.value.downPayment = value as number
      break
    case 'deposit':
      form.value.depositCash = value as number
      break
    case 'srvIn':
      form.value.srvInCash = value as number
      break
    case 'srvOut':
      form.value.srvOutCash = value as number
      break
  }
}
/** 服务费按「剩余本金」计基数时，比例与主表无固定换算关系，隐藏比例输入 */
function ratioEditable(key: RatioKey): boolean {
  if (key === 'srvIn') {
    return Number(form.value.srvInBase) === 0
  }
  if (key === 'srvOut') {
    return Number(form.value.srvOutBase) === 0
  }
  return true
}
function syncRatioFromCash(key: RatioKey) {
  const cash = cashOf(key)
  ratioTexts[key] = cash === undefined || !ratioBaseAmount.value
    ? ''
    : String(Number(((cash / ratioBaseAmount.value) * 100).toFixed(4)))
}
/** 金额输入失焦：现金端为最新时同步比例显示 */
function onCashBlur(key: RatioKey) {
  if (ratioEditedBy[key] === 'cash') {
    syncRatioFromCash(key)
  }
}
/** 比例输入失焦：按比例反算金额 */
function onRatioBlur(key: RatioKey) {
  ratioEditedBy[key] = 'ratio'
  const ratio = Number.parseFloat(String(ratioTexts[key]).trim())
  if (!ratioBaseAmount.value || Number.isNaN(ratio)) {
    return
  }
  setCashOf(key, Number(((ratio / 100) * ratioBaseAmount.value).toFixed(2)))
}
/** 基数变化时重算联动：保留用户最后编辑的一侧（与 PC 同口径） */
watch(ratioBaseAmount, () => {
  (['down', 'deposit', 'srvIn', 'srvOut'] as RatioKey[]).forEach((key) => {
    if (ratioEditable(key)) {
      if (ratioEditedBy[key] === 'ratio') {
        onRatioBlur(key)
      } else {
        syncRatioFromCash(key)
      }
    }
  })
})
/** 比例提示文案（只读展示用） */
function ratioHint(key: RatioKey): string {
  const cash = cashOf(key)
  if (cash === undefined || !ratioBaseAmount.value) {
    return '未设置'
  }
  return `${Number(((cash / ratioBaseAmount.value) * 100).toFixed(4))}%`
}

// ==================== 联动规则（与 PC 端同口径） ====================

/** 基准利率 ± 浮动 → 租息年利率（加载后也同步执行一次，保证指纹基准与展示一致） */
function applyRateFloat() {
  const base = toNum(form.value.baseRate)
  if (!base || form.value.floatMethod === null || form.value.floatMethod === undefined) {
    return
  }
  const float = toNum(form.value.floatValue) ?? 0
  const finalRate = Number(form.value.floatMethod) === 1 ? base + float : base * (1 + float)
  form.value.finalRate = Number(finalRate.toFixed(6))
  syncRateTexts()
}
watch(
  () => [form.value.baseRate, form.value.floatMethod, form.value.floatValue],
  applyRateFloat,
)

/** 租赁方式切换 → 租金税率联动：直租 13%，回租 6% */
function onLeaseMethodPick(event: { detail: { value: number } }) {
  form.value.leaseMethod = valueOfIndex(leaseMethodOpts.value, Number(event.detail.value))
  form.value.quoteTaxRate = Number(form.value.leaseMethod) === 1 ? 0.06 : 0.13
  syncRateTexts()
}

// ==================== 投放计划自动联动 ====================

/** 自动生成的投放计划行引用：用户未手工接管前随主表投放要素联动 */
const autoLoanRow = ref<QuoteCalcVO['loanPlans'][number] | null>(null)

/** 投放日期与金额要素齐备且投放计划为空时，自动生成一笔投放计划 */
watch(
  () => [form.value.planDateLoan, form.value.totalAmount, form.value.downPayment],
  () => {
    if (locked.value) {
      return
    }
    const planDate = form.value.planDateLoan
    const cash = derivedLoanCash.value
    if (!planDate || cash <= 0) {
      return
    }
    if (form.value.loanPlans.length === 0) {
      const row = { planDate, cash, payMethod: 0 }
      form.value.loanPlans.push(row)
      autoLoanRow.value = row
      return
    }
    // 唯一一行且仍是自动行：持续同步，避免金额改后合计对不上
    const auto = autoLoanRow.value
    if (form.value.loanPlans.length === 1 && auto && form.value.loanPlans[0] === auto) {
      auto.planDate = planDate
      auto.cash = cash
    }
  },
)

// ==================== 渐进披露折叠区 ====================

const openSections = ref<string[]>(['inout'])

function toggleSection(key: string) {
  const list = openSections.value
  const index = list.indexOf(key)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.push(key)
  }
}

const hasDeposit = computed(() =>
  (toNum(form.value.depositCash) ?? 0) > 0
  || Number(form.value.depositMethod) === 3
  || (form.value.manualPlans ?? []).some(row => Number(row.kind) === 1),
)
const depositSummary = computed(() => {
  if (Number(form.value.depositMethod) === 3) {
    return `手工明细 ${(form.value.manualPlans ?? []).filter(row => Number(row.kind) === 1).length} 行`
  }
  const cash = toNum(form.value.depositCash) ?? 0
  return cash > 0 ? `${formatMoney(cash)} · ${labelOf(depositMethodOpts.value, form.value.depositMethod)}` : '未收取'
})

const hasSrvFee = computed(() =>
  (toNum(form.value.srvInCash) ?? 0) > 0
  || (toNum(form.value.srvOutCash) ?? 0) > 0
  || srvInMethod.value === 3
  || srvOutMethod.value === 3
  || (form.value.manualPlans ?? []).some(row => Number(row.kind) === 2 || Number(row.kind) === 3),
)
const srvSummary = computed(() => {
  const feeText = (method?: number, cash?: number) => {
    if (Number(method) === 3) {
      return '手工'
    }
    return (cash ?? 0) > 0 ? formatMoney(cash) : '无'
  }
  return `收入 ${feeText(form.value.srvInMethod, toNum(form.value.srvInCash))} / 支出 ${feeText(form.value.srvOutMethod, toNum(form.value.srvOutCash))}`
})

/** 高级参数是否偏离默认（决定折叠头提示与加载后自动展开） */
const advancedCustomized = computed(() => {
  if ((toNum(form.value.baseRate) ?? 0) > 0) {
    return true
  }
  if (form.value.floatMethod !== null && form.value.floatMethod !== undefined) {
    return true
  }
  if ((Number(form.value.ratioBase) ?? 0) !== 0) {
    return true
  }
  if ((toNum(form.value.nominalPrice) ?? 0) > 0) {
    return true
  }
  if ((toNum(form.value.assetsMargin) ?? 0) > 0) {
    return true
  }
  const expectedTax = Number(form.value.leaseMethod) === 1 ? 0.06 : 0.13
  const tax = toNum(form.value.quoteTaxRate)
  if (tax !== undefined && Math.abs(tax - expectedTax) > 1e-9) {
    return true
  }
  if ((Number(form.value.taxMode) ?? 0) !== 0) {
    return true
  }
  if ((Number(form.value.corpusInvoiceFlag) ?? 1) !== 1) {
    return true
  }
  if ((Number(form.value.yearDays) ?? 360) !== 360) {
    return true
  }
  if ((Number(form.value.irrDays) ?? 365) !== 365) {
    return true
  }
  return (Number(form.value.calDigit) ?? 2) !== 2
})

/** 加载后自动展开有内容的折叠区（仅视觉收纳，不改取值） */
function syncSectionsWithData() {
  const sections = new Set(openSections.value)
  if (hasDeposit.value) {
    sections.add('deposit')
  }
  if (hasSrvFee.value) {
    sections.add('srv')
  }
  if (advancedCustomized.value) {
    sections.add('advanced')
  }
  openSections.value = Array.from(sections)
}

// ==================== 即时勾稽提示（error 阻断测算/保存，warning 仅警示） ====================

const immediateIssues = computed<{ text: string, type: 'error' | 'warning' }[]>(() => {
  const issues: { text: string, type: 'error' | 'warning' }[] = []
  const leaseTimes = toNum(form.value.leaseTimes)
  if (leaseTimes && form.value.paymentFreq !== null && form.value.paymentFreq !== undefined) {
    if (leaseTimes % freqMonths.value !== 0) {
      issues.push({
        text: `租赁期限 ${leaseTimes} 月无法被支付频率（每 ${freqMonths.value} 个月 1 期）整除，测算将无法完成，请调整期限或频率`,
        type: 'error',
      })
    }
  }
  if (form.value.loanPlans.length > 0 && toNum(form.value.totalAmount)) {
    const sum = form.value.loanPlans.reduce((acc, row) => acc + (toNum(row.cash) ?? 0), 0)
    const target = derivedLoanCash.value
    if (Math.abs(sum - target) > 0.005) {
      issues.push({
        text: `投放计划合计 ${formatMoney(sum)} 与实际投放金额 ${formatMoney(target)} 不一致（差 ${formatMoney(sum - target)} 元）`,
        type: 'warning',
      })
    }
  }
  const ratioSum = (['down', 'deposit', 'srvIn', 'srvOut'] as RatioKey[]).reduce((acc, key) => {
    const cash = cashOf(key) ?? 0
    return acc + (ratioBaseAmount.value ? (cash / ratioBaseAmount.value) * 100 : 0)
  }, 0)
  if (ratioSum > 100) {
    issues.push({
      text: `首付款/保证金/服务费比例合计 ${Number(ratioSum.toFixed(4))}% 已超过 100%（系统允许负融资，请确认是否符合预期）`,
      type: 'warning',
    })
  }
  const margin = toNum(form.value.assetsMargin)
  if (margin && derivedLoanCash.value > 0 && margin > derivedLoanCash.value) {
    issues.push({ text: '资产余值超过实际投放金额，末期剩余本金将为负数，请检查', type: 'warning' })
  }
  return issues
})

// ==================== 子表行编辑 ====================

const activeTab = ref(0)

const showMore = ref(false)

const showLoanRow = ref(false)
const loanRowIndex = ref(-1)
const loanDraft = reactive({ planDate: '', cash: '' as number | string, payMethod: 0 as number | undefined })

const showRentRow = ref(false)
const rentRowIndex = ref(-1)
const rentDraft = reactive({
  startPeriod: 1 as number | string,
  paymentFreq: 0 as number | undefined,
  calMethod: 0 as number | undefined,
  rentCash: '' as number | string | undefined,
})

const showManualRow = ref(false)
const manualRowIndex = ref(-1)
const manualDraft = reactive({
  kind: 4 as number | undefined,
  planDate: '',
  direction: 1,
  cash: '' as number | string,
  taxRate: undefined as number | undefined,
  memo: '',
})

/** 手工收支行的税率文本 → 草稿（小数），非法输入置空 */
const manualRateText = ref('')
function onManualRateBlur() {
  const n = Number.parseFloat(String(manualRateText.value).replaceAll('%', '').trim())
  manualDraft.taxRate = Number.isNaN(n) ? undefined : n / 100
}
/** 租金金额列随计算方式的语义（与 PC 端同口径） */
const rentCashDisabled = computed(() => Number(rentDraft.calMethod) === 0 || Number(rentDraft.calMethod) === 1)
const rentCashPlaceholder = computed(() => {
  switch (Number(rentDraft.calMethod)) {
    case 0: return '无需填写（系统自动等额）'
    case 1: return '无需填写（本金自动均摊）'
    case 2: return '每期递增额'
    case 4: return '每期本金'
    default: return '每期租金'
  }
})

/** 单段「指定租金」时可按等额租金公式预填（估算值，以测算结果为准） */
const canPrefillEqualRent = computed(() => {
  const rule = form.value.rentRules[0]
  return form.value.rentRules.length === 1
    && Number(rule?.calMethod) === 3
    && !!toNum(form.value.totalAmount)
    && form.value.downPayment !== null
    && form.value.downPayment !== undefined
    && !!toNum(form.value.leaseTimes)
    && Number(form.value.leaseTimes) % freqMonths.value === 0
    && !!toNum(form.value.finalRate)
})
function prefillEqualRent() {
  const tax = toNum(form.value.quoteTaxRate) ?? 0
  const principal = ((toNum(form.value.totalAmount) ?? 0) - (toNum(form.value.downPayment) ?? 0)) / (1 + tax)
  const rate = ((toNum(form.value.finalRate) ?? 0) * freqMonths.value) / 12
  const periods = Math.round((toNum(form.value.leaseTimes) ?? 0) / freqMonths.value)
  let annuity: number
  if (rate === 0) {
    annuity = principal / periods
  } else {
    const pow = (1 + rate) ** periods
    annuity = Number(form.value.prepayFlag) === 0
      ? (principal * rate * (1 + rate) ** (periods - 1)) / (pow - 1)
      : (principal * rate * pow) / (pow - 1)
  }
  form.value.rentRules[0]!.rentCash = Number((annuity * (1 + tax)).toFixed(2))
  toast.success('已按等额租金预填，请以测算结果为准')
}

function openLoanRow(index: number) {
  if (locked.value) {
    return
  }
  loanRowIndex.value = index
  if (index < 0) {
    loanDraft.planDate = form.value.planDateLoan || ''
    loanDraft.cash = ''
    loanDraft.payMethod = 0
  } else {
    const row = form.value.loanPlans[index]
    loanDraft.planDate = row.planDate
    loanDraft.cash = row.cash as number | string
    loanDraft.payMethod = row.payMethod
  }
  showLoanRow.value = true
}

function saveLoanRow() {
  const planDate = String(loanDraft.planDate || '').trim()
  const cash = toNum(loanDraft.cash)
  if (!planDate) {
    toast.show('请选择计划投放日期')
    return
  }
  if (cash === undefined || cash <= 0) {
    toast.show('请填写大于 0 的投放金额')
    return
  }
  const row = { planDate, cash, payMethod: loanDraft.payMethod ?? 0 }
  if (loanRowIndex.value < 0) {
    form.value.loanPlans.push(row)
  } else {
    form.value.loanPlans[loanRowIndex.value] = row
  }
  autoLoanRow.value = null
  showLoanRow.value = false
}

function openRentRow(index: number) {
  if (locked.value) {
    return
  }
  rentRowIndex.value = index
  if (index < 0) {
    const last = form.value.rentRules[form.value.rentRules.length - 1]
    rentDraft.startPeriod = (Number(last?.startPeriod) || 0) + 1
    rentDraft.paymentFreq = form.value.paymentFreq
    rentDraft.calMethod = 0
    rentDraft.rentCash = ''
  } else {
    const row = form.value.rentRules[index]
    rentDraft.startPeriod = row.startPeriod
    rentDraft.paymentFreq = row.paymentFreq
    rentDraft.calMethod = row.calMethod
    rentDraft.rentCash = row.rentCash ?? ''
  }
  showRentRow.value = true
}

function saveRentRow() {
  const startPeriod = toNum(rentDraft.startPeriod)
  if (startPeriod === undefined || startPeriod < 1) {
    toast.show('起始期次必须为不小于 1 的整数')
    return
  }
  if (rentDraft.paymentFreq === undefined || rentDraft.calMethod === undefined) {
    toast.show('请选择支付频率与计算方式')
    return
  }
  const rentCash = rentCashDisabled.value ? undefined : toNum(rentDraft.rentCash)
  if (!rentCashDisabled.value && (rentCash === undefined || rentCash < 0)) {
    toast.show('请填写该计算方式对应的金额')
    return
  }
  const row = { startPeriod: Math.round(startPeriod), paymentFreq: rentDraft.paymentFreq, calMethod: rentDraft.calMethod, rentCash }
  if (rentRowIndex.value < 0) {
    form.value.rentRules.push(row)
  } else {
    form.value.rentRules[rentRowIndex.value] = row
  }
  showRentRow.value = false
}

function openManualRow(index: number) {
  if (locked.value) {
    return
  }
  manualRowIndex.value = index
  if (index < 0) {
    manualDraft.kind = 4
    manualDraft.planDate = form.value.planDateLoan || ''
    manualDraft.direction = 1
    manualDraft.cash = ''
    manualDraft.memo = ''
    manualRateText.value = ''
  } else {
    const row = form.value.manualPlans![index]
    manualDraft.kind = row.kind
    manualDraft.planDate = row.planDate
    manualDraft.direction = row.direction
    manualDraft.cash = row.cash as number | string
    manualDraft.memo = row.memo ?? ''
    manualRateText.value = row.taxRate != null ? String(Number(((Number(row.taxRate)) * 100).toFixed(4))) : ''
  }
  showManualRow.value = true
}

function saveManualRow() {
  const kind = manualDraft.kind
  const planDate = String(manualDraft.planDate || '').trim()
  const cash = toNum(manualDraft.cash)
  const taxRate = Number.parseFloat(String(manualRateText.value).trim())
  if (kind === undefined) {
    toast.show('请选择收支类别')
    return
  }
  if (!planDate) {
    toast.show('请选择计划日期')
    return
  }
  if (cash === undefined || cash <= 0) {
    toast.show('请填写大于 0 的发生额')
    return
  }
  const row = {
    kind,
    planDate,
    direction: manualDraft.direction,
    cash,
    taxRate: Number.isNaN(taxRate) ? undefined : taxRate / 100,
    memo: manualDraft.memo || undefined,
  }
  if (manualRowIndex.value < 0) {
    if (!form.value.manualPlans) {
      form.value.manualPlans = []
    }
    form.value.manualPlans.push(row)
  } else {
    form.value.manualPlans![manualRowIndex.value] = row
  }
  showManualRow.value = false
}

/** 删除子表行（确认后删除） */
function removeRow(type: 'loan' | 'rent' | 'manual', index: number) {
  dialog.confirm({
    title: '删除该行？',
    msg: '删除后需保存才会生效',
  }).then(() => {
    if (type === 'loan') {
      form.value.loanPlans.splice(index, 1)
      if (form.value.loanPlans.length === 0) {
        autoLoanRow.value = null
      }
    } else if (type === 'rent') {
      form.value.rentRules.splice(index, 1)
    } else {
      form.value.manualPlans?.splice(index, 1)
    }
  }).catch(() => {})
}

// ==================== 测算结果与历史版本 ====================

const previewing = ref(false)
const saving = ref(false)
const failedTrace = ref<QuoteTraceVO | null>(null)
const snapshot = ref<QuoteOutputSnapshotVO | null>(null)

/** 结果快照里失败/跳过的步骤（勾稽错误逐条展示） */
const failedSteps = computed<QuoteTraceStepVO[]>(() =>
  (failedTrace.value?.steps ?? []).filter(step => Number(step.status) !== 0),
)

/** 测算参数指纹：与基准不一致即「结果已过期」 */
function pickCalcParams(data: QuoteCalcVO) {
  return {
    assetsMargin: data.assetsMargin,
    baseRate: data.baseRate,
    calDigit: data.calDigit,
    corpusInvoiceFlag: data.corpusInvoiceFlag,
    delayPeriod: data.delayPeriod,
    depositCash: data.depositCash,
    depositInterestFlag: data.depositInterestFlag,
    depositMethod: data.depositMethod,
    depositRate: data.depositRate,
    depositReturnMethod: data.depositReturnMethod,
    depositStartDate: data.depositStartDate,
    downPayment: data.downPayment,
    finalRate: data.finalRate,
    floatMethod: data.floatMethod,
    floatValue: data.floatValue,
    gracePeriod: data.gracePeriod,
    interestMethod: data.interestMethod,
    irrDays: data.irrDays,
    leaseCommencementDate: data.leaseCommencementDate,
    leaseMethod: data.leaseMethod,
    leaseTimes: data.leaseTimes,
    loanPlans: data.loanPlans,
    manualPlans: data.manualPlans,
    nominalPrice: data.nominalPrice,
    paymentFreq: data.paymentFreq,
    planDateLoan: data.planDateLoan,
    planLeaseDay: data.planLeaseDay,
    prepayFlag: data.prepayFlag,
    quoteTaxRate: data.quoteTaxRate,
    ratioBase: data.ratioBase,
    rentRules: data.rentRules,
    srvInBase: data.srvInBase,
    srvInCash: data.srvInCash,
    srvInMethod: data.srvInMethod,
    srvInTaxRate: data.srvInTaxRate,
    srvOutBase: data.srvOutBase,
    srvOutCash: data.srvOutCash,
    srvOutFirstDate: data.srvOutFirstDate,
    srvOutMethod: data.srvOutMethod,
    srvOutTaxRate: data.srvOutTaxRate,
    taxMode: data.taxMode,
    totalAmount: data.totalAmount,
    tradeDiscount: data.tradeDiscount,
    yearDays: data.yearDays,
  }
}
const baselineCalcFingerprint = ref('')
const stale = computed(() =>
  !!snapshot.value && JSON.stringify(pickCalcParams(form.value)) !== baselineCalcFingerprint.value,
)

const summaryText = computed(() => {
  if (failedTrace.value) {
    return '测算失败'
  }
  if (snapshot.value) {
    return stale.value ? '结果已过期' : '结果最新'
  }
  return '待测算'
})
const summaryColor = computed(() => {
  if (failedTrace.value) {
    return 'text-[#f5222d]'
  }
  if (snapshot.value) {
    return stale.value ? 'text-[#d48806]' : 'text-[#018d71]'
  }
  return 'text-[#999]'
})

/** 指标展示定义（顺序即展示顺序，与 PC 端指标口径一致） */
const INDICATOR_DEFS: { key: string, label: string, kind: 'percent' | 'money' | 'int' }[] = [
  { key: 'projectIrr', label: '项目 IRR', kind: 'percent' },
  { key: 'projectNotaxIrr', label: '项目去税 IRR', kind: 'percent' },
  { key: 'rentIrr', label: '租金 IRR', kind: 'percent' },
  { key: 'financeXirr', label: '会计 XIRR', kind: 'percent' },
  { key: 'averageInterrate', label: '项目平息率', kind: 'percent' },
  { key: 'netFinanceCash', label: '净融资额', kind: 'money' },
  { key: 'netFinanceRatio', label: '净融资比例', kind: 'percent' },
  { key: 'leaseCashSum', label: '租金合计', kind: 'money' },
  { key: 'interestSum', label: '利息合计', kind: 'money' },
  { key: 'srvInTotal', label: '服务费收入合计', kind: 'money' },
  { key: 'srvOutTotal', label: '服务费支出合计', kind: 'money' },
  { key: 'depositInTotal', label: '保证金收取合计', kind: 'money' },
  { key: 'depositInterest', label: '保证金利息', kind: 'money' },
  { key: 'totalDebt', label: '债务总额', kind: 'money' },
  { key: 'planCashLoan', label: '计划投放金额', kind: 'money' },
  { key: 'factCashLoan', label: '实际投放金额', kind: 'money' },
  { key: 'totalPeriods', label: '总期数', kind: 'int' },
  { key: 'yearTimes', label: '年还款次数', kind: 'int' },
]

/** 利率（小数）→ 百分数文本；App 全局 formatPercent 不做 ×100，此处按 PC 口径本地换算 */
function fmtRate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const n = Number(value)
  return Number.isNaN(n) ? '-' : `${(n * 100).toFixed(4)}%`
}

/** 当前结果指标卡数据 */
const indicatorItems = computed(() => {
  const ind = snapshot.value?.indicators ?? {}
  const irrNotApplicable = Number(form.value.finalRate) === 0
  return INDICATOR_DEFS.map(({ key, label, kind }) => {
    let value: string
    if (kind === 'percent') {
      value = irrNotApplicable && key !== 'averageInterrate' && key !== 'netFinanceRatio' ? '—' : fmtRate(ind[key])
    } else if (kind === 'money') {
      value = ind[key] === null || ind[key] === undefined ? '-' : formatMoney(ind[key])
    } else {
      value = ind[key] === null || ind[key] === undefined ? '-' : String(ind[key])
    }
    return { label, value }
  })
})

/** 解析结果快照 JSON（兼容脏数据） */
function parseSnapshot(outputSnapshot?: string): QuoteOutputSnapshotVO | null {
  if (!outputSnapshot) {
    return null
  }
  try {
    return JSON.parse(outputSnapshot) as QuoteOutputSnapshotVO
  } catch {
    return null
  }
}

// ==================== 数据加载 ====================

onLoad(async (query) => {
  if (query?.id) {
    quoteId.value = Number(query.id)
    await loadDetail()
  } else {
    syncRateTexts()
  }
})

async function loadDetail() {
  if (!quoteId.value) {
    return
  }
  loading.value = true
  try {
    const data = await getQuoteCalc(quoteId.value)
    form.value = { ...emptyForm(), ...data }
    autoLoanRow.value = null
    failedTrace.value = null
    snapshot.value = null
    applyRateFloat()
    baselineCalcFingerprint.value = JSON.stringify(pickCalcParams(form.value))
    syncRateTexts()
    ;(['down', 'deposit', 'srvIn', 'srvOut'] as RatioKey[]).forEach((key) => {
      ratioEditedBy[key] = 'cash'
      syncRatioFromCash(key)
    })
    syncSectionsWithData()
    // 加载最近一次测算记录的成功快照作为结果展示
    if (data.latestTraceId) {
      const trace = await getQuoteCalcTrace(data.latestTraceId)
      if (Number(trace.status) === 0) {
        snapshot.value = parseSnapshot(trace.outputSnapshot)
      } else {
        failedTrace.value = trace
      }
    }
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    loading.value = false
  }
}

// ==================== 校验与提交 ====================

/** 数字字段统一归一化（输入框 v-model 会带入字符串） */
function normalizeForm() {
  const numericKeys = [
    'totalAmount',
    'downPayment',
    'tradeDiscount',
    'finalRate',
    'baseRate',
    'floatValue',
    'delayPeriod',
    'gracePeriod',
    'leaseTimes',
    'planLeaseDay',
    'depositCash',
    'depositRate',
    'srvInCash',
    'srvInTaxRate',
    'srvOutCash',
    'srvOutTaxRate',
    'nominalPrice',
    'assetsMargin',
    'quoteTaxRate',
    'paymentFreq',
    'prepayFlag',
    'leaseMethod',
    'floatMethod',
    'ratioBase',
    'depositMethod',
    'depositReturnMethod',
    'depositInterestFlag',
    'srvInBase',
    'srvInMethod',
    'srvOutBase',
    'srvOutMethod',
    'taxMode',
    'corpusInvoiceFlag',
    'yearDays',
    'irrDays',
    'calDigit',
  ]
  numericKeys.forEach((key) => {
    (form.value as any)[key] = toNum((form.value as any)[key])
  })
  // 百分数文本未失焦时兜底同步
  RATE_KEYS.forEach((key) => {
    const text = String(rateTexts[key] ?? '').replaceAll('%', '').trim()
    if (text !== '') {
      const n = Number.parseFloat(text)
      if (!Number.isNaN(n)) {
        (form.value as any)[key] = n / 100
      }
    }
  })
  form.value.loanPlans.forEach((row) => {
    row.cash = toNum(row.cash) as number
  })
  form.value.rentRules.forEach((row) => {
    row.startPeriod = Number(toNum(row.startPeriod))
    row.rentCash = toNum(row.rentCash)
  })
  form.value.manualPlans?.forEach((row) => {
    row.cash = toNum(row.cash) as number
    row.taxRate = toNum(row.taxRate)
  })
}

/** 前端校验：必填 + 阻断性勾稽，失败 toast 提示 */
function validateForm(): boolean {
  if (!form.value.planDateLoan) {
    toast.show('请选择投放日期')
    return false
  }
  if (!toNum(form.value.totalAmount) || toNum(form.value.totalAmount)! <= 0) {
    toast.show('请填写大于 0 的设备总金额')
    return false
  }
  if (toNum(form.value.finalRate) === undefined || toNum(form.value.finalRate)! < 0) {
    toast.show('请填写租息年利率（0-100%）')
    return false
  }
  if (toNum(form.value.finalRate)! > 1) {
    toast.show('租息年利率不能超过 100%')
    return false
  }
  if (toNum(form.value.paymentFreq) === undefined) {
    toast.show('请选择支付频率')
    return false
  }
  if (toNum(form.value.prepayFlag) === undefined) {
    toast.show('请选择先付/后付')
    return false
  }
  const leaseTimes = toNum(form.value.leaseTimes)
  if (leaseTimes === undefined || leaseTimes < 1) {
    toast.show('请填写不小于 1 的租赁期限（月）')
    return false
  }
  if (!form.value.loanPlans.length) {
    toast.show('请至少添加一笔投放计划')
    return false
  }
  if (!form.value.rentRules.length) {
    toast.show('请至少添加一段租金规则')
    return false
  }
  if (leaseTimes % freqMonths.value !== 0) {
    toast.show(`租赁期限 ${leaseTimes} 月无法被支付频率（每 ${freqMonths.value} 个月 1 期）整除`)
    return false
  }
  return true
}

/** 组装整体提交参数（主表 + 子表） */
function buildPayload(): QuoteCalcVO {
  return {
    ...form.value,
    id: quoteId.value,
    status: form.value.status,
    loanPlans: form.value.loanPlans.map((row, index) => ({ ...row, sort: index + 1 })),
    rentRules: form.value.rentRules.map((row, index) => ({ ...row, sort: index + 1 })),
    manualPlans: (form.value.manualPlans ?? []).map((row, index) => ({ ...row, sort: index + 1 })),
  }
}

/** 保存即测算：新建/更新均由后端自动测算，成功才落库 */
async function handleSave() {
  normalizeForm()
  if (!validateForm()) {
    return
  }
  saving.value = true
  try {
    if (!quoteId.value) {
      const id = await createQuoteCalc(buildPayload())
      toast.success('保存成功，已自动测算')
      // 替换当前页为带 id 的编辑页，避免再次保存重复创建
      setTimeout(() => {
        uni.redirectTo({ url: `/pages-fl/quotecalc/edit?id=${id}` })
      }, 600)
    } else {
      await updateQuoteCalc(buildPayload())
      toast.success('保存成功，已重新测算')
      await loadDetail()
    }
  } catch {
    // 业务错误（含勾稽失败原因）已由 http 层 toast 提示
  } finally {
    saving.value = false
  }
}

/** 测算预览：不落业务表，结果在指标卡展示；失败时逐条展示步骤错误 */
async function handlePreview() {
  normalizeForm()
  if (!validateForm()) {
    return
  }
  previewing.value = true
  failedTrace.value = null
  try {
    const trace = await previewQuoteCalc(buildPayload())
    if (Number(trace.status) === 0) {
      snapshot.value = parseSnapshot(trace.outputSnapshot)
      baselineCalcFingerprint.value = JSON.stringify(pickCalcParams(form.value))
      toggleSection('inout')
      toast.success(`测算完成（${((trace.totalCostMs ?? 0) / 1000).toFixed(1)} 秒）`)
    } else {
      failedTrace.value = trace
      snapshot.value = null
      toast.error(`测算失败：${trace.errorMsg || '未知原因'}`)
    }
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    previewing.value = false
  }
}

// ==================== 确认锁定 / 复制 / 删除 / 重算 ====================

/** 确认锁定：结果非最新时先提示重算（与 PC 端口径一致） */
function handleConfirm() {
  showMore.value = false
  if (stale.value || !snapshot.value) {
    toast.show('当前结果不是最新测算版本，请先完成「测算预览」再确认')
    return
  }
  dialog.confirm({
    title: '确认锁定方案？',
    msg: '确认后将锁定参数与当前最新测算结果，修改需先取消确认。',
  }).then(async () => {
    try {
      await confirmQuoteCalc(quoteId.value!)
      toast.success('已确认锁定')
      await loadDetail()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

function handleCancelConfirm() {
  dialog.confirm({
    title: '取消确认？',
    msg: '取消确认后方案回到草稿态，参数可再次修改。',
  }).then(async () => {
    try {
      await cancelConfirmQuoteCalc(quoteId.value!)
      toast.success('已取消确认')
      await loadDetail()
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

/** 重新测算：用已保存参数重算（未保存的修改不生效） */
function handleRecalculate() {
  showMore.value = false
  dialog.confirm({
    title: '重新测算？',
    msg: '将使用最近一次保存的参数重新测算，未保存的修改不生效。',
  }).then(async () => {
    try {
      saving.value = true
      await recalculateQuoteCalc(quoteId.value!)
      toast.success('重新测算完成')
      await loadDetail()
    } catch {
      // 业务错误 toast 已由 http 层提示
    } finally {
      saving.value = false
    }
  }).catch(() => {})
}

/** 复制为新测算：基于最近一次保存的版本生成新草稿 */
function handleCopy() {
  showMore.value = false
  dialog.confirm({
    title: '复制为新测算？',
    msg: '将基于最近一次保存的版本复制生成新草稿（新方案编号）。',
  }).then(async () => {
    try {
      const id = await copyQuoteCalc(quoteId.value!)
      toast.success('复制成功，已生成新草稿')
      setTimeout(() => {
        uni.redirectTo({ url: `/pages-fl/quotecalc/edit?id=${id}` })
      }, 600)
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

function handleDelete() {
  showMore.value = false
  dialog.confirm({
    title: '删除方案？',
    msg: '删除后不可恢复，确定删除该报价测算方案吗？',
  }).then(async () => {
    try {
      await deleteQuoteCalc(quoteId.value!)
      toast.success('已删除')
      setTimeout(() => navigateBackPlus(), 600)
    } catch {
      // 业务错误 toast 已由 http 层提示
    }
  }).catch(() => {})
}

// ==================== 历史测算版本（只读） ====================

const showHistory = ref(false)
const showTraceDetail = ref(false)
const historyLoading = ref(false)
const historyRows = ref<QuoteTraceVO[]>([])
const traceDetail = ref<QuoteTraceVO>()
const traceIndicators = computed(() => {
  const snap = parseSnapshot(traceDetail.value?.outputSnapshot)
  if (!snap?.indicators) {
    return []
  }
  return INDICATOR_DEFS.map(({ key, label, kind }) => {
    const raw = snap.indicators![key]
    const value = kind === 'percent'
      ? fmtRate(raw)
      : kind === 'money'
        ? (raw === null || raw === undefined ? '-' : formatMoney(raw))
        : (raw === null || raw === undefined ? '-' : String(raw))
    return { label, value }
  })
})

function traceTypeLabel(type?: number): string {
  switch (Number(type)) {
    case 0: return '预览'
    case 1: return '保存生效'
    case 2: return '重算'
    default: return '测算'
  }
}

async function openHistory() {
  showMore.value = false
  showHistory.value = true
  if (!quoteId.value) {
    return
  }
  historyLoading.value = true
  try {
    const page = await getQuoteCalcTracePage({ pageNo: 1, pageSize: 50, quoteId: quoteId.value })
    historyRows.value = page.list
  } catch {
    // 业务错误 toast 已由 http 层提示
  } finally {
    historyLoading.value = false
  }
}

async function openTraceDetail(trace: QuoteTraceVO) {
  if (!trace.id) {
    return
  }
  try {
    traceDetail.value = await getQuoteCalcTrace(trace.id)
    showTraceDetail.value = true
  } catch {
    // 业务错误 toast 已由 http 层提示
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  margin-bottom: 24rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.form-item {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #333;

  &.required::before {
    content: '*';
    margin-right: 4rpx;
    color: #f5222d;
  }
}

// 下拉/日期选择器统一单元格样式
.picker-cell {
  display: flex;
  min-height: 72rpx;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #f7f8fa;
  border-radius: 8rpx;
}

// 利率/比例小输入框（内嵌在表单行右侧）
.rate-input,
.ratio-input {
  width: 180rpx;
  height: 64rpx;
  margin-right: 4rpx;
  padding: 0 16rpx;
  font-size: 28rpx;
  color: #333;
  text-align: right;
  background: #f7f8fa;
  border-radius: 8rpx;
}

.ratio-input {
  width: 140rpx;
}

// 子表行卡片
.row-card {
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: #f9fafb;
  border-radius: 12rpx;

  &:active {
    background: #f0f2f5;
  }
}

.row-del {
  font-size: 24rpx;
  color: #f5222d;
}

// 更多操作弹层条目
.more-item {
  display: flex;
  flex-direction: column;
  padding: 20rpx 8rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-of-type {
    border-bottom: none;
  }
}
</style>
