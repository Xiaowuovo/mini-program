// pages/admin/dashboard/dashboard.js
const { getAdminStats } = require('../../../api/admin.js')

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

  onShow() {
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

    getAdminStats()
      .then(res => {
        const overview = res.overview || {}
        const orderStats = res.orderStats || {}
        this.setData({
          stats: {
            totalGardens: overview.totalGardens || 0,
            rentedGardens: overview.rentedGardens || 0,
            totalOrders: overview.totalOrders || 0,
            pendingOrders: (orderStats.pending || 0) + (orderStats.paid || 0),
            totalUsers: overview.totalUsers || 0,
            totalRevenue: overview.totalRevenue || 0
          }
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

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({ url })
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
