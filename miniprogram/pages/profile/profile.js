// pages/profile/profile.js
const app = getApp()
const { get } = require('../../utils/request.js')

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '测试用户',
      phone: ''
    },
    stats: {
      orderCount: 0,
      gardenCount: 0,
      postCount: 0,
      likeCount: 0
    },
    menuList: [
      {
        id: 'orders',
        icon: 'https://img.icons8.com/fluency/96/purchase-order.png',
        title: '我的订单',
        url: '/pages/orders/orders',
        badge: null
      },
      {
        id: 'gardens',
        icon: 'https://img.icons8.com/fluency/96/garden.png',
        title: '我的菜地',
        url: '/pages/my-gardens/my-gardens',
        badge: null
      },
      {
        id: 'services',
        icon: 'https://img.icons8.com/fluency/96/customer-support.png',
        title: '增值服务',
        url: '/pages/services/services',
        badge: null
      },
      {
        id: 'reminders',
        icon: 'https://img.icons8.com/fluency/96/alarm-clock.png',
        title: '任务提醒',
        url: '/pages/reminders/reminders',
        badge: null
      },
      {
        id: 'posts',
        icon: 'https://img.icons8.com/fluency/96/communication.png',
        title: '我的动态',
        url: '/pages/community/community?mine=true',
        badge: null
      },
      {
        id: 'favorites',
        icon: 'https://img.icons8.com/fluency/96/star.png',
        title: '我的收藏',
        url: '/pages/community/community?favorite=true',
        badge: null
      }
    ]
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }

    // 从服务器获取最新用户信息
    this.fetchUserInfo()
  },

  /**
   * 从服务器获取用户信息
   */
  fetchUserInfo() {
    const token = wx.getStorageSync('token')
    if (!token) return

    get('/users/me')
      .then(res => {
        const userInfo = {
          avatar: res.avatar || 'https://img.icons8.com/fluency/96/user-male-circle.png',
          nickname: res.nickname || res.username,
          phone: res.phone || ''
        }
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
      })
      .catch(err => {
        console.error('获取用户信息失败:', err)
      })
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    const token = wx.getStorageSync('token')
    if (!token) {
      // 未登录显示默认数据
      this.setData({
        stats: {
          orderCount: 5,
          gardenCount: 2,
          postCount: 8,
          likeCount: 32
        }
      })
      return
    }

    // 获取订单数量
    get('/orders/my')
      .then(res => {
        this.setData({
          'stats.orderCount': res.total || 0
        })
      })
      .catch(err => {
        console.error('获取订单统计失败:', err)
      })

    // 获取菜地数量
    get('/gardens/my')
      .then(res => {
        const gardenCount = res.total || 0
        this.setData({
          'stats.gardenCount': gardenCount
        })

        // 更新菜单徽章
        if (gardenCount > 0) {
          const menuList = this.data.menuList
          const gardenMenu = menuList.find(item => item.id === 'gardens')
          if (gardenMenu) {
            gardenMenu.badge = gardenCount
            this.setData({ menuList })
          }
        }
      })
      .catch(err => {
        console.error('获取菜地统计失败:', err)
      })

    // 获取动态数量
    this.setData({
      'stats.postCount': 8,
      'stats.likeCount': 32
    })
  },

  /**
   * 编辑个人资料
   */
  editProfile() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
      return
    }

    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    })
  },

  /**
   * 页面导航
   */
  navigateTo(e) {
    const { url } = e.currentTarget.dataset

    // 检查是否需要登录
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
      return
    }

    wx.navigateTo({
      url,
      fail: (err) => {
        console.error('页面跳转失败:', err)
        wx.showToast({
          title: '页面不存在',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '云端小筑 - 共享菜园',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.jpg'
    }
  }
})