// pages/my-gardens/my-gardens.js
const { getMyGardens } = require('../../api/garden.js')

Page({
  data: {
    gardens: [], // 我的菜地列表
    statusTabs: [
      { key: 'all', label: '全部' },
      { key: 'active', label: '使用中' },
      { key: 'expired', label: '已过期' }
    ],
    currentStatus: 'all',
    loading: false,
    skip: 0,
    limit: 10,
    total: 0,
    hasMore: true
  },

  onLoad(options) {
    this.loadMyGardens()
  },

  onShow() {
    // 从其他页面返回时刷新
    if (this.data.gardens.length > 0) {
      this.refreshGardens()
    }
  },

  onPullDownRefresh() {
    this.refreshGardens(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  /**
   * 刷新菜地列表
   */
  refreshGardens(callback) {
    this.setData({
      skip: 0,
      gardens: [],
      hasMore: true
    })
    this.loadMyGardens(callback)
  },

  /**
   * 加载我的菜地
   */
  loadMyGardens(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    const params = {
      status_filter: this.data.currentStatus,
      skip: this.data.skip,
      limit: this.data.limit
    }

    getMyGardens(params)
      .then(res => {
        const newGardens = this.data.skip === 0 ? res.items : [...this.data.gardens, ...res.items]

        this.setData({
          gardens: newGardens,
          total: res.total,
          hasMore: newGardens.length < res.total,
          loading: false
        })

        callback && callback()
      })
      .catch(err => {
        console.error('加载我的菜地失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        callback && callback()
      })
  },

  /**
   * 获取状态文本
   */
  getStatusText(garden) {
    if (!garden.current_order) return '未知'

    const order = garden.current_order
    if (!order.is_active) {
      return '已过期'
    }
    if (order.status === 'active') {
      return '使用中'
    }
    if (order.status === 'paid') {
      return '待启用'
    }
    return '未知'
  },

  /**
   * 获取第一张图片
   */
  getGardenImage(garden) {
    if (garden.images && garden.images.length > 0) {
      return garden.images[0]
    }
    return '/images/default-garden.png'
  },

  /**
   * 切换状态Tab
   */
  onTabChange(e) {
    const status = e.currentTarget.dataset.status

    this.setData({
      currentStatus: status,
      skip: 0,
      gardens: [],
      hasMore: true
    })
    this.loadMyGardens()
  },

  /**
   * 加载更多
   */
  loadMore() {
    this.setData({
      skip: this.data.skip + this.data.limit
    })
    this.loadMyGardens()
  },

  /**
   * 查看菜地状态详情
   */
  viewGardenDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/garden-status/garden-status?id=${id}`
    })
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail(e) {
    const garden = this.data.gardens.find(g => g.id === e.currentTarget.dataset.id)
    if (garden && garden.current_order) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${garden.current_order.order_id}`
      })
    }
  },

  /**
   * 续租菜地
   */
  renewGarden(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/create-order/create-order?gardenId=${id}`
    })
  },

  /**
   * 添加种植记录
   */
  addPlanting(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/add-planting/add-planting?gardenId=${id}&gardenName=${name}`
    })
  },

  /**
   * 查看视频监控
   */
  viewMonitor(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/camera/camera?gardenId=${id}&gardenName=${name}`
    })
  }
})
