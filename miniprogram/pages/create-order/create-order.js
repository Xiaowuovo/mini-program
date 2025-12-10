// pages/create-order/create-order.js
const { getGardenDetail } = require('../../api/garden.js')
const { createOrder } = require('../../api/order.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    gardenId: null,
    garden: null,
    startDate: '',
    endDate: '',
    minDate: '',
    maxDate: '',
    months: 1,
    totalPrice: 0,
    notes: ''
  },

  onLoad(options) {
    if (!options.gardenId) {
      wx.showToast({
        title: '菜地ID缺失',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    // 设置日期范围
    const today = new Date()
    const minDate = new Date(today)
    const maxDate = new Date(today)
    maxDate.setFullYear(maxDate.getFullYear() + 1) // 最多提前一年预订

    const startDate = this.formatDate(today)

    this.setData({
      gardenId: parseInt(options.gardenId), // 转为数字
      minDate: this.formatDate(minDate),
      maxDate: this.formatDate(maxDate),
      startDate: startDate
    })

    // 初始化结束日期
    this.calculateEndDate()

    this.loadGardenInfo()
  },

  /**
   * 加载菜地信息
   */
  loadGardenInfo() {
    showLoading('加载中...')

    getGardenDetail(this.data.gardenId)
      .then(garden => {
        hideLoading()
        this.setData({ garden })
        this.calculatePrice()
      })
      .catch(err => {
        hideLoading()
        console.error('加载菜地信息失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  /**
   * 选择开始日期
   */
  onStartDateChange(e) {
    const startDate = e.detail.value
    this.setData({ startDate })
    this.calculateEndDate()
    this.calculatePrice()
  },

  /**
   * 选择月数
   */
  onMonthsChange(e) {
    const months = parseInt(e.detail.value)
    this.setData({ months })
    this.calculateEndDate()
    this.calculatePrice()
  },

  /**
   * 输入备注
   */
  onNotesInput(e) {
    this.setData({
      notes: e.detail.value
    })
  },

  /**
   * 计算结束日期
   */
  calculateEndDate() {
    const { startDate, months } = this.data
    if (!startDate) return

    const start = new Date(startDate)
    const end = new Date(start)
    end.setMonth(end.getMonth() + months)

    this.setData({
      endDate: this.formatDate(end)
    })
  },

  /**
   * 计算总价
   */
  calculatePrice() {
    const { garden, months } = this.data
    if (!garden || !months) return

    const totalPrice = (garden.price * months).toFixed(2)
    this.setData({ totalPrice })
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  /**
   * 提交订单
   */
  submitOrder() {
    const { garden, startDate, endDate, totalPrice, notes } = this.data

    if (!startDate) {
      wx.showToast({
        title: '请选择开始日期',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认租用',
      content: `确认租用${garden.name}，租期${this.data.months}个月，总计¥${totalPrice}？`,
      success: (res) => {
        if (res.confirm) {
          this.createOrderRequest()
        }
      }
    })
  },

  /**
   * 创建订单请求
   */
  createOrderRequest() {
    showLoading('创建订单中...')

    const orderData = {
      garden_id: this.data.gardenId,
      start_date: this.data.startDate,
      end_date: this.data.endDate
    }

    console.log('创建订单数据:', orderData)

    createOrder(orderData)
      .then(order => {
        hideLoading()

        // 显示成功提示并跳转
        wx.showModal({
          title: '订单创建成功',
          content: '订单已创建，请在15分钟内完成支付',
          confirmText: '去支付',
          cancelText: '稍后支付',
          success: (res) => {
            if (res.confirm) {
              // 跳转到订单详情页并自动触发支付
              wx.redirectTo({
                url: `/pages/order-detail/order-detail?id=${order.id}&autoPay=1`
              })
            } else {
              // 跳转到订单详情页
              wx.redirectTo({
                url: `/pages/order-detail/order-detail?id=${order.id}`
              })
            }
          }
        })
      })
      .catch(err => {
        hideLoading()
        console.error('创建订单失败:', err)
        wx.showToast({
          title: err.message || '创建订单失败',
          icon: 'none'
        })
      })
  }
})
