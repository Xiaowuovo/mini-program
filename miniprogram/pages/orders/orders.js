// pages/orders/orders.js
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
    hasMore: true
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ currentStatus: options.status })
    }
  },

  onShow() {
    this.setData({ page: 1, orders: [], hasMore: true })
    this.loadOrders()
  },

  onUnload() {
    if (this._countdownTimer) clearInterval(this._countdownTimer)
  },

  onHide() {
    if (this._countdownTimer) clearInterval(this._countdownTimer)
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

    console.log('加载订单，参数:', params)

    getOrderList(params)
      .then(res => {
        console.log('订单列表响应:', res)
        console.log('订单数量:', res.items ? res.items.length : 0)
        console.log('订单状态统计:', res.items ? res.items.map(o => o.status) : [])

        const newOrders = (res.items || []).map(order => this.formatOrder(order))
        const orders = this.data.page === 1 ? newOrders : [...this.data.orders, ...newOrders]

        this.setData({
          orders,
          total: res.total,
          hasMore: orders.length < res.total,
          loading: false
        })
        this.startCountdownTimer()
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
    const orderNo = String(order.id).padStart(10, '0')

    const statusMap = {
      'pending': '待支付',
      'paid': '已支付',
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }

    let garden_image = '/images/default-garden.png'
    if (order.garden && order.garden.images && order.garden.images.length > 0) {
      garden_image = order.garden.images[0]
    }

    const garden_area = order.garden ? order.garden.area : 0

    // 剩余天数（进行中订单）
    let daysRemaining = null
    let daysRemainingText = ''
    if (order.status === 'active' && order.end_date) {
      const end = new Date(order.end_date)
      const now = new Date()
      daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
      daysRemainingText = daysRemaining > 0 ? `剩${daysRemaining}天` : '已到期'
    }

    // 待支付倒计时（创建后15分钟内支付）
    let payCountdown = ''
    let payExpired = false
    if (order.status === 'pending' && order.created_at) {
      const deadline = new Date(new Date(order.created_at).getTime() + 30 * 60 * 1000)
      const diff = Math.max(0, deadline - new Date())
      if (diff === 0) {
        payExpired = true
        payCountdown = '已超时'
      } else {
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        payCountdown = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      }
    }

    return {
      ...order,
      orderNo,
      statusText: statusMap[order.status] || '未知',
      garden_image,
      garden_area,
      daysRemaining,
      daysRemainingText,
      payCountdown,
      payExpired
    }
  },

  /**
   * 启动待支付订单倒计时
   */
  startCountdownTimer() {
    if (this._countdownTimer) clearInterval(this._countdownTimer)
    const hasPending = this.data.orders.some(o => o.status === 'pending')
    if (!hasPending) return

    this._countdownTimer = setInterval(() => {
      const orders = this.data.orders.map(order => {
        if (order.status !== 'pending' || !order.created_at) return order
        const deadline = new Date(new Date(order.created_at).getTime() + 30 * 60 * 1000)
        const diff = Math.max(0, deadline - new Date())
        const payExpired = diff === 0
        let payCountdown
        if (payExpired) {
          payCountdown = '已超时'
        } else {
          const m = Math.floor(diff / 60000)
          const s = Math.floor((diff % 60000) / 1000)
          payCountdown = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        }
        return { ...order, payCountdown, payExpired }
      })
      this.setData({ orders })
    }, 1000)
  },

  /**
   * 切换状态筛选
   */
  onTabChange(e) {
    const status = e.currentTarget.dataset.status
    console.log('切换Tab，状态:', status)

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
   * 立即支付
   */
  payOrder(e) {
    const id = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o.id === id)

    if (!order) return

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

    const { payOrder } = require('../../api/order.js')

    payOrder(orderId, {})
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
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
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

    const { cancelOrder } = require('../../api/order.js')

    cancelOrder(orderId)
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
  }
})