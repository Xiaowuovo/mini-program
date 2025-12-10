// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    // 后端API地址 - 开发环境
    apiBase: 'http://localhost:8000/api',
    // 生产环境请修改为实际域名
    // apiBase: 'https://your-domain.com/api'
  },

  onLaunch() {
    console.log('小程序启动')

    // 检查登录状态
    this.checkLoginStatus()

    // 检查更新
    this.checkUpdate()
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      console.log('已登录:', userInfo.nickname)
    } else {
      console.log('未登录')
    }
  },

  /**
   * 检查小程序更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本')
        }
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        wx.showModal({
          title: '更新失败',
          content: '新版本下载失败，请删除小程序后重新搜索打开',
          showCancel: false
        })
      })
    }
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return this.globalData.userInfo
  },

  /**
   * 获取Token
   */
  getToken() {
    return this.globalData.token
  },

  /**
   * 保存登录信息
   */
  saveLoginInfo(token, userInfo) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo

    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
  },

  /**
   * 清除登录信息
   */
  clearLoginInfo() {
    this.globalData.token = null
    this.globalData.userInfo = null

    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  /**
   * 检查是否登录
   */
  checkIsLogin() {
    return !!this.globalData.token
  },

  /**
   * 跳转到登录页
   */
  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  }
})
