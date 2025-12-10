// pages/orders/orders.js - 优化版本
const { getOrderList, cancelOrder: cancelOrderAPI, payOrder: payOrderAPI } = require('../../api/order.js')
const { showLoading, hideLoading } = require('../../utils/util.js')
const {
  formatOrderNo,
  getStatusText,
  calculateRemainingTime,
  formatRemainingTime,
  getOrderActions,
  formatDateTime
} = require('../../utils/order-utils.js')

Page({
  data: {
    orders: [],
    currentStatus: '', // 当前筛选状态
    statusTabs: [
      { key: '', label: '全部' },
      { key: 'pending', label: '待支付' },
      { key: 'paid', label: '已支付' },
      { key: 'active', label: '进行中' },
      { key: 'completed', label: '已完成' },
      { key: 'cancelled', label: '已取消' }
    ],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true,
    countdownTimers: {} // 存储倒计时定时器
  },

  onLoad(options) {
    // 从其他页面传入的状态筛选
    if (options.status) {
      this.setData({ currentStatus: options.status })
    }
    this.loadOrders()
  },

  onShow() {
    // 页面显示时刷新列表
    if (this.data.orders.length > 0) {
      this.setData({ page: 1, orders: [] })
      this.loadOrders()
    }
  },

  onUnload() {
    // 清除所有倒计时定时器
    this.clearAllCountdowns()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      orders: [],
      hasMore: true
    })
    this.loadOrders(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  /**
   * 加载订单列表
   */
  loadOrders(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    const params = {
      skip: (this.data.page - 1) * this.data.pageSize,
      limit: this.data.pageSize
    }

    if (this.data.currentStatus) {
      params.status = this.data.currentStatus
    }

    getOrderList(params)
      .then(res => {
        const newOrders = (res.items || []).map(order => this.formatOrder(order))
        const orders = this.data.page === 1 ? newOrders : [...this.data.orders, ...newOrders]

        this.setData({
          orders,
          total: res.total,
          hasMore: orders.length < res.total,
          loading: false
        })

        // 启动倒计时
        this.startCountdowns()

        callback && callback()
      })
      .catch(err => {
        console.error('加载订单失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        callback && callback()
      })
  },

  /**
   * 格式化订单数据
   */
  formatOrder(order) {
    // 基本信息格式化
    const orderNo = formatOrderNo(order.id)
    const statusText = getStatusText(order.status)

    // 菜地信息
    let garden_image = '/images/default-garden.png'
    if (order.garden && order.garden.images && order.garden.images.length > 0) {
      garden_image = order.garden.images[0]
    }
    const garden_area = order.garden ? order.garden.area : 0

    // 倒计时（仅待支付订单）
    let remainingTime = null
    let countdownText = null
    if (order.status === 'pending') {
      const remaining = calculateRemainingTime(order.created_at)
      if (remaining > 0) {
        remainingTime = remaining
        countdownText = formatRemainingTime(remaining)
      } else {
        countdownText = '已过期'
      }
    }

    // 操作按钮
    const actions = getOrderActions(order)

    return {
      ...order,
      orderNo,
      statusText,
      garden_image,
      garden_area,
      remainingTime,
      countdownText,
      actions
    }
  },

  /**
   * 启动所有倒计时
   */
  startCountdowns() {
    // 清除旧的定时器
    this.clearAllCountdowns()

    const timers = {}

    this.data.orders.forEach((order, index) => {
      if (order.status === 'pending' && order.remainingTime > 0) {
        timers[order.id] = setInterval(() => {
          this.updateCountdown(index)
        }, 1000)
      }
    })

    this.setData({ countdownTimers: timers })
  },

  /**
   * 更新单个订单倒计时
   */
  updateCountdown(index) {
    const order = this.data.orders[index]
    if (!order) return

    const remaining = calculateRemainingTime(order.created_at)

    if (remaining <= 0) {
      // 倒计时结束
      this.clearCountdown(order.id)
      this.setData({
        [`orders[${index}].countdownText`]: '已过期',
        [`orders[${index}].remainingTime`]: 0
      })

      // 可选：自动取消订单
      // this.autoCancelOrder(order.id)
    } else {
      // 更新倒计时文本
      this.setData({
        [`orders[${index}].countdownText`]: formatRemainingTime(remaining),
        [`orders[${index}].remainingTime`]: remaining
      })
    }
  },

  /**
   * 清除单个倒计时
   */
  clearCountdown(orderId) {
    const timers = this.data.countdownTimers
    if (timers[orderId]) {
      clearInterval(timers[orderId])
      delete timers[orderId]
      this.setData({ countdownTimers: timers })
    }
  },

  /**
   * 清除所有倒计时
   */
  clearAllCountdowns() {
    Object.values(this.data.countdownTimers).forEach(timer => {
      clearInterval(timer)
    })
    this.setData({ countdownTimers: {} })
  },

  /**
   * 切换状态筛选
   */
  onTabChange(e) {
    const status = e.currentTarget.dataset.status

    this.setData({
      currentStatus: status,
      page: 1,
      orders: [],
      hasMore: true
    })
    this.loadOrders()
  },

  /**
   * 加载更多
   */
  loadMore() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadOrders()
  },

  /**
   * 跳转到订单详情
   */
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  },

  /**
   * 处理订单操作
   */
  handleAction(e) {
    const { action, id } = e.currentTarget.dataset

    switch (action) {
      case 'pay':
        this.payOrder(id)
        break
      case 'cancel':
        this.cancelOrder(id)
        break
      case 'detail':
        this.navigateToDetail(e)
        break
      case 'garden':
        this.viewGarden(e)
        break
      case 'rent-again':
        this.rentAgain(e)
        break
      case 'delete':
        this.deleteOrder(id)
        break
    }
  },

  /**
   * 立即支付
   */
  payOrder(id) {
    const order = this.data.orders.find(o => o.id === id)

    if (!order) return

    // 检查是否过期
    if (order.remainingTime <= 0) {
      wx.showToast({
        title: '订单已过期',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认支付',
      content: `支付金额：¥${order.total_price}`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          this.processPayment(id)
        }
      }
    })
  },

  /**
   * 处理支付
   */
  processPayment(orderId) {
    showLoading('支付中...')

    payOrderAPI(orderId, {})
      .then(() => {
        hideLoading()
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000
        })

        // 刷新列表
        setTimeout(() => {
          this.setData({ page: 1, orders: [] })
          this.loadOrders()
        }, 2000)
      })
      .catch(err => {
        hideLoading()
        wx.showToast({
          title: err.message || '支付失败',
          icon: 'none'
        })
      })
  },

  /**
   * 取消订单
   */
  cancelOrder(id) {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.processCancelOrder(id)
        }
      }
    })
  },

  /**
   * 处理取消订单
   */
  processCancelOrder(orderId) {
    showLoading('取消中...')

    cancelOrderAPI(orderId)
      .then(() => {
        hideLoading()
        wx.showToast({
          title: '订单已取消',
          icon: 'success'
        })

        // 刷新列表
        setTimeout(() => {
          this.setData({ page: 1, orders: [] })
          this.loadOrders()
        }, 1500)
      })
      .catch(err => {
        hideLoading()
        wx.showToast({
          title: err.message || '取消失败',
          icon: 'none'
        })
      })
  },

  /**
   * 查看菜地
   */
  viewGarden(e) {
    const gardenId = e.currentTarget.dataset.gardenid
    if (gardenId) {
      wx.navigateTo({
        url: `/pages/garden-detail/garden-detail?id=${gardenId}`
      })
    }
  },

  /**
   * 再次租用
   */
  rentAgain(e) {
    const gardenId = e.currentTarget.dataset.gardenid
    if (gardenId) {
      wx.navigateTo({
        url: `/pages/create-order/create-order?gardenId=${gardenId}`
      })
    }
  },

  /**
   * 删除订单
   */
  deleteOrder(id) {
    wx.showModal({
      title: '删除订单',
      content: '确定要删除该订单吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          // TODO: 实现删除订单API
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        }
      }
    })
  }
})
