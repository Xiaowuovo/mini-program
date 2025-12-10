// pages/login/login.js
const app = getApp()
const { testLogin } = require('../../api/auth.js')

Page({
  data: {
    isLoading: false,
    recentLogins: [], // 最近登录的用户列表
    showLoginHistory: false // 是否显示登录历史
  },

  onLoad() {
    // 加载最近登录历史
    this.loadRecentLogins()
  },

  /**
   * 加载最近登录历史
   */
  loadRecentLogins() {
    const recentLogins = wx.getStorageSync('recentLogins') || []
    this.setData({
      recentLogins,
      showLoginHistory: recentLogins.length > 0
    })
  },

  /**
   * 保存登录历史
   */
  saveLoginHistory(nickname, role) {
    let recentLogins = wx.getStorageSync('recentLogins') || []

    // 检查是否已存在
    const existingIndex = recentLogins.findIndex(
      item => item.nickname === nickname && item.role === role
    )

    if (existingIndex !== -1) {
      // 已存在，移到最前面
      const existing = recentLogins.splice(existingIndex, 1)[0]
      existing.lastLoginTime = new Date().toISOString()
      recentLogins.unshift(existing)
    } else {
      // 新用户，添加到最前面
      recentLogins.unshift({
        nickname,
        role,
        lastLoginTime: new Date().toISOString()
      })
    }

    // 只保留最近5个
    recentLogins = recentLogins.slice(0, 5)

    wx.setStorageSync('recentLogins', recentLogins)
    this.setData({
      recentLogins,
      showLoginHistory: true
    })
  },

  /**
   * 选择历史用户登录
   */
  selectHistoryLogin(e) {
    const { nickname, role } = e.currentTarget.dataset
    this.doLogin(nickname, role)
  },

  /**
   * 清除登录历史
   */
  clearLoginHistory() {
    wx.showModal({
      title: '确认清除',
      content: '是否清除所有登录历史？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('recentLogins')
          this.setData({
            recentLogins: [],
            showLoginHistory: false
          })
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 创建新用户登录
   */
  onLogin() {
    wx.showModal({
      title: '创建新用户',
      content: '请输入用户昵称',
      editable: true,
      placeholderText: '例如：张三',
      success: (res) => {
        if (res.confirm && res.content) {
          const nickname = res.content.trim()
          if (nickname) {
            this.doLogin(nickname, 'tenant')
          } else {
            wx.showToast({
              title: '昵称不能为空',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 创建管理员登录
   */
  onAdminLogin() {
    wx.showModal({
      title: '管理员登录',
      content: '请输入管理员昵称',
      editable: true,
      placeholderText: '例如：管理员',
      success: (res) => {
        if (res.confirm && res.content) {
          const nickname = res.content.trim()
          if (nickname) {
            this.doLogin(nickname, 'admin')
          } else {
            wx.showToast({
              title: '昵称不能为空',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 执行登录
   */
  doLogin(nickname, role = 'tenant') {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    // 显示加载动画
    this.showLoadingAnimation(role)

    // 调用后端测试登录接口
    testLogin(nickname, role)
      .then(res => {
        // 清除加载定时器
        if (this.loadingTimer) {
          clearInterval(this.loadingTimer)
        }

        // 保存登录历史
        this.saveLoginHistory(nickname, role)

        if (role === 'admin') {
          this.handleAdminLoginSuccess(res)
        } else {
          this.handleLoginSuccess(res)
        }
      })
      .catch(err => {
        console.error('登录失败:', err)
        if (this.loadingTimer) {
          clearInterval(this.loadingTimer)
        }
        wx.hideLoading()
        this.setData({ isLoading: false })
        wx.showModal({
          title: '登录失败',
          content: '无法连接到后端服务，请确保：\n1. 后端服务已启动\n2. 接口地址正确\n\n错误: ' + (err.message || '未知错误'),
          showCancel: false
        })
      })
  },

  /**
   * 显示加载动画
   */
  showLoadingAnimation(role) {
    const isAdmin = role === 'admin'
    const messages = isAdmin ? [
      '正在登录...',
      '验证管理员权限...',
      '加载管理数据...'
    ] : [
      '正在登录...',
      '检查附近菜地...',
      '准备您的专属菜园...',
      '加载菜地信息...'
    ]

    let currentIndex = 0

    wx.showLoading({
      title: messages[0],
      mask: true
    })

    // 每800ms切换一次提示文字
    this.loadingTimer = setInterval(() => {
      currentIndex++
      if (currentIndex < messages.length) {
        wx.showLoading({
          title: messages[currentIndex],
          mask: true
        })
      }
    }, 800)
  },

  handleLoginSuccess(res) {
    wx.hideLoading()
    this.setData({ isLoading: false })

    // 保存真实的后端Token和用户信息
    if (app && app.saveLoginInfo) {
      app.saveLoginInfo(res.access_token, res.user)
    } else {
      wx.setStorageSync('token', res.access_token)
      wx.setStorageSync('userInfo', res.user)
    }

    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      this.navigateToHome()
    }, 1500)
  },

  handleAdminLoginSuccess(res) {
    wx.hideLoading()
    this.setData({ isLoading: false })

    // 保存管理员Token和用户信息
    if (app && app.saveLoginInfo) {
      app.saveLoginInfo(res.access_token, res.user)
    } else {
      wx.setStorageSync('token', res.access_token)
      wx.setStorageSync('userInfo', res.user)
    }

    wx.showToast({
      title: '管理员登录成功',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      // 跳转到管理端首页
      wx.redirectTo({
        url: '/pages/admin/dashboard/dashboard'
      })
    }, 1500)
  },

  navigateToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onViewAgreement() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  onViewPrivacy() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})