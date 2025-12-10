// pages/admin/dashboard/dashboard.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    stats: {
      totalGardens: 0,
      rentedGardens: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalUsers: 0,
      totalRevenue: 0
    },
    menuItems: [
      {
        id: 'gardens',
        icon: '🌱',
        title: '菜地管理',
        desc: '管理菜地资源',
        url: '/pages/admin/gardens/gardens'
      },
      {
        id: 'orders',
        icon: '📋',
        title: '订单管理',
        desc: '处理用户订单',
        url: '/pages/admin/orders/orders'
      },
      {
        id: 'stats',
        icon: '📊',
        title: '数据统计',
        desc: '查看运营数据',
        url: '/pages/admin/stats/stats'
      },
      {
        id: 'users',
        icon: '👥',
        title: '用户管理',
        desc: '管理用户信息',
        url: '/pages/admin/users/users'
      }
    ]
  },

  onLoad() {
    this.checkAdminPermission()
    this.loadUserInfo()
    this.loadStats()
  },

  checkAdminPermission() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'admin') {
      wx.showModal({
        title: '权限不足',
        content: '您没有管理员权限',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      })
    }
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ userInfo })
  },

  loadStats() {
    wx.showLoading({ title: '加载中...' })

    // 这里应该调用后端API获取统计数据
    // 暂时使用模拟数据
    setTimeout(() => {
      this.setData({
        stats: {
          totalGardens: 20,
          rentedGardens: 15,
          totalOrders: 45,
          pendingOrders: 8,
          totalUsers: 120,
          totalRevenue: 38500
        }
      })
      wx.hideLoading()
    }, 500)
  },

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({ url })
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    }
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理端吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})
