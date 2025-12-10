// pages/login/login.js
const app = getApp()
const { testLogin } = require('../../api/auth.js')

Page({
  data: {
    isLoading: false
  },

  onLogin() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })
    wx.showLoading({ title: '登录中...' })

    // 调用后端测试登录接口
    testLogin('测试用户')
      .then(res => {
        this.handleLoginSuccess(res)
      })
      .catch(err => {
        console.error('后端登录失败:', err)
        wx.hideLoading()
        this.setData({ isLoading: false })

        // 详细提示错误，不再降级到模拟登录
        wx.showModal({
          title: '登录失败',
          content: '无法连接到后端服务，请确保：\n1. 后端服务已启动\n2. 接口地址正确\n\n错误: ' + (err.message || '未知错误'),
          showCancel: false
        })
      })
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