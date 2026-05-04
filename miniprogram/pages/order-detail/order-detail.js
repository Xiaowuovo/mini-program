// pages/order-detail/order-detail.js
const { getOrderDetail, cancelOrder, payOrder } = require('../../api/order.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    orderId: null,
    order: null,
    loading: true,
    statusSteps: [
      { key: 'pending', label: '待支付' },
      { key: 'paid', label: '已支付' },
      { key: 'active', label: '进行中' },
      { key: 'completed', label: '已完成' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        orderId: options.id,
        autoPay: options.autoPay === '1' // 是否自动触发支付
      })
      this.loadOrderDetail()
    } else {
      wx.showToast({
        title: '订单ID缺失',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onShow() {
    // 从支付页面返回时刷新订单状态
    if (this.data.order) {
      this.loadOrderDetail()
    }
  },

  /**
   * 加载订单详情
   */
  loadOrderDetail() {
    showLoading('加载中...')

    getOrderDetail(this.data.orderId)
      .then(order => {
        hideLoading()

        // 格式化订单编号（补零到10位）
        const orderNo = String(order.id).padStart(10, '0')

        // 格式化时间
        const createdAt = this.formatDateTime(order.created_at)
        const paymentDeadline = this.calculatePaymentDeadline(order.created_at)

        // 添加步骤条 active 标记
        const statusOrder = ['pending', 'paid', 'active', 'completed']
        const currentIndex = statusOrder.indexOf(order.status)
        const statusSteps = [
          { key: 'pending', label: '待支付', active: 0 <= currentIndex },
          { key: 'paid',    label: '已支付', active: 1 <= currentIndex },
          { key: 'active',  label: '进行中', active: 2 <= currentIndex },
          { key: 'completed', label: '已完成', active: 3 <= currentIndex }
        ]

        this.setData({
          order: {
            ...order,
            orderNo: orderNo,
            created_at_formatted: createdAt,
            payment_deadline: paymentDeadline
          },
          statusSteps,
          loading: false
        })

        // 标题不带编号
        wx.setNavigationBarTitle({
          title: '订单详情'
        })

        // 如果需要自动支付且订单状态为待支付
        if (this.data.autoPay && order.status === 'pending') {
          this.setData({ autoPay: false }) // 只触发一次
          setTimeout(() => {
            this.handlePay()
          }, 500)
        }
      })
      .catch(err => {
        hideLoading()
        console.error('加载订单详情失败:', err)
        wx.showModal({
          title: '加载失败',
          content: '无法加载订单详情',
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack()
            }
          }
        })
      })
  },

  /**
   * 查看菜地详情
   */
  viewGarden() {
    const { order } = this.data
    if (order && order.garden_id) {
      wx.navigateTo({
        url: `/pages/garden-detail/garden-detail?id=${order.garden_id}`
      })
    }
  },

  /**
   * 立即支付
   */
  handlePay() {
    const { order } = this.data

    if (order.status !== 'pending') {
      wx.showToast({
        title: '订单状态不可支付',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认支付',
      content: `支付金额：¥${order.total_price}`,
      success: (res) => {
        if (res.confirm) {
          this.processPayment()
        }
      }
    })
  },

  /**
   * 处理支付
   */
  processPayment() {
    showLoading('支付中...')

    payOrder(this.data.orderId, {})
      .then(() => {
        hideLoading()

        // 显示支付成功弹窗
        wx.showModal({
          title: '支付成功',
          content: '订单支付成功，是否查看订单列表？',
          confirmText: '查看订单',
          cancelText: '留在此页',
          success: (res) => {
            if (res.confirm) {
              // 跳转到订单列表
              wx.redirectTo({
                url: '/pages/orders/orders'
              })
            } else {
              // 刷新当前页面
              this.loadOrderDetail()
            }
          }
        })
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
  handleCancel() {
    const { order } = this.data

    if (order.status !== 'pending') {
      wx.showToast({
        title: '该订单不可取消',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.processCancelOrder()
        }
      }
    })
  },

  /**
   * 处理取消订单
   */
  processCancelOrder() {
    showLoading('取消中...')

    cancelOrder(this.data.orderId)
      .then(() => {
        hideLoading()
        wx.showToast({
          title: '订单已取消',
          icon: 'success'
        })

        setTimeout(() => {
          this.loadOrderDetail()
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
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '是否拨打客服电话？',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          })
        }
      }
    })
  },

  /**
   * 复制订单号
   */
  copyOrderNo() {
    wx.setClipboardData({
      data: this.data.order.orderNo,
      success: () => {
        wx.showToast({
          title: '已复制订单号',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return ''
    const date = new Date(dateTimeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  /**
   * 计算支付截止时间（创建后15分钟）
   */
  calculatePaymentDeadline(createdAtStr) {
    if (!createdAtStr) return ''
    const createdAt = new Date(createdAtStr)
    const deadline = new Date(createdAt.getTime() + 15 * 60 * 1000) // 加15分钟
    return this.formatDateTime(deadline.toISOString())
  }
})