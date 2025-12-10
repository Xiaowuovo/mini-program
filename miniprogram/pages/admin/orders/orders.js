// pages/admin/orders/orders.js
const { getAllOrders, updateOrderStatus } = require('../../../api/order.js')

Page({
  data: {
    orders: [],
    filteredOrders: [],
    statusFilter: 'all', // all, pending, confirmed, in_progress, completed, cancelled
    isLoading: false,
    statusMap: {
      'pending': '待确认',
      'confirmed': '已确认',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  onLoad() {
    this.loadOrders()
  },

  loadOrders() {
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...' })

    getAllOrders()
      .then(res => {
        const orders = res.orders || res || []
        // 按创建时间倒序排列
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        this.setData({
          orders,
          filteredOrders: orders
        })
      })
      .catch(err => {
        console.error('加载订单失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ isLoading: false })
        wx.hideLoading()
      })
  },

  onFilterChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ statusFilter: status })
    this.filterOrders(status)
  },

  filterOrders(status) {
    const { orders } = this.data
    if (status === 'all') {
      this.setData({ filteredOrders: orders })
    } else {
      const filtered = orders.filter(o => o.status === status)
      this.setData({ filteredOrders: filtered })
    }
  },

  onStatusChange(e) {
    const { id, currentStatus } = e.currentTarget.dataset

    // 根据当前状态提供可选的下一步状态
    const nextStatuses = this.getNextStatuses(currentStatus)

    if (nextStatuses.length === 0) {
      wx.showToast({
        title: '该订单状态不可更改',
        icon: 'none'
      })
      return
    }

    const itemList = nextStatuses.map(s => this.data.statusMap[s])

    wx.showActionSheet({
      itemList,
      success: (res) => {
        const newStatus = nextStatuses[res.tapIndex]
        this.updateStatus(id, newStatus)
      }
    })
  },

  getNextStatuses(currentStatus) {
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    }
    return transitions[currentStatus] || []
  },

  updateStatus(id, status) {
    wx.showLoading({ title: '更新中...' })

    updateOrderStatus(id, status)
      .then(() => {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        this.loadOrders()
      })
      .catch(err => {
        console.error('更新失败:', err)
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  onViewDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  },

  onRefresh() {
    this.loadOrders()
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
})
