// pages/admin/stats/stats.js
const { getAdminStats } = require('../../../api/admin.js')

Page({
  data: {
    overview: {
      totalGardens: 0,
      rentedGardens: 0,
      rentRate: 0,
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      monthRevenue: 0,
      totalUsers: 0,
      activeUsers: 0
    },
    gardenStats: {
      available: 0,
      rented: 0,
      maintenance: 0
    },
    orderStats: {
      pending: 0,
      paid: 0,
      active: 0,
      completed: 0,
      cancelled: 0
    },
    revenueTrend: [],
    topGardens: []
  },

  onLoad() {
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  loadStats() {
    wx.showLoading({ title: '加载中...' })

    getAdminStats()
      .then(res => {
        this.setData({
          overview: res.overview || {},
          gardenStats: res.gardenStats || {},
          orderStats: res.orderStats || {},
          revenueTrend: res.revenueTrend || [],
          topGardens: res.topGardens || []
        })
      })
      .catch(err => {
        console.error('加载统计数据失败:', err)
        wx.showToast({ title: '数据加载失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  onRefresh() {
    this.loadStats()
  }
})
