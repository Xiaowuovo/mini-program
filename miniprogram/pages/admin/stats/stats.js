// pages/admin/stats/stats.js
Page({
  data: {
    // 总览统计
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
    // 菜地统计
    gardenStats: {
      available: 0,
      rented: 0,
      maintenance: 0
    },
    // 订单统计
    orderStats: {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    },
    // 收入趋势（最近7天）
    revenueTrend: [],
    // 热门菜地Top5
    topGardens: []
  },

  onLoad() {
    this.loadStats()
  },

  loadStats() {
    wx.showLoading({ title: '加载中...' })

    // 这里应该调用后端统计API
    // 暂时使用模拟数据
    this.loadMockData()
  },

  loadMockData() {
    setTimeout(() => {
      this.setData({
        overview: {
          totalGardens: 20,
          rentedGardens: 15,
          rentRate: 75,
          totalOrders: 45,
          completedOrders: 32,
          totalRevenue: 38500,
          monthRevenue: 12800,
          totalUsers: 120,
          activeUsers: 68
        },
        gardenStats: {
          available: 5,
          rented: 15,
          maintenance: 0
        },
        orderStats: {
          pending: 3,
          confirmed: 5,
          in_progress: 5,
          completed: 32,
          cancelled: 0
        },
        revenueTrend: [
          { date: '12/04', amount: 1200 },
          { date: '12/05', amount: 1800 },
          { date: '12/06', amount: 1500 },
          { date: '12/07', amount: 2200 },
          { date: '12/08', amount: 1900 },
          { date: '12/09', amount: 2400 },
          { date: '12/10', amount: 1800 }
        ],
        topGardens: [
          { name: 'A区1号地', orders: 12, revenue: 7200 },
          { name: 'B区3号地', orders: 10, revenue: 6000 },
          { name: 'A区5号地', orders: 9, revenue: 5400 },
          { name: 'C区2号地', orders: 8, revenue: 4800 },
          { name: 'B区7号地', orders: 7, revenue: 4200 }
        ]
      })
      wx.hideLoading()
    }, 500)
  },

  onRefresh() {
    this.loadStats()
  },

  onExportData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  }
})
