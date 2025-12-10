// pages/settings/settings.js
Page({
  data: {
    phoneNumber: '',
    cacheSize: '12.5MB',
    settings: {
      notification: true,
      taskReminder: true,
      commentNotice: true,
      publicPost: true,
      showLocation: false
    }
  },

  onLoad() {
    this.loadSettings()
    this.loadUserInfo()
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const settings = wx.getStorageSync('settings')
    if (settings) {
      this.setData({ settings })
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.phone) {
      // 隐藏中间4位
      const phone = userInfo.phone
      const masked = phone.substring(0, 3) + '****' + phone.substring(7)
      this.setData({ phoneNumber: masked })
    }
  },

  /**
   * 修改密码
   */
  changePassword() {
    wx.showModal({
      title: '修改密码',
      content: '该功能正在开发中',
      showCancel: false
    })
  },

  /**
   * 绑定手机
   */
  bindPhone() {
    wx.showModal({
      title: '手机绑定',
      content: '该功能正在开发中',
      showCancel: false
    })
  },

  /**
   * 通知开关
   */
  onNotificationChange(e) {
    this.updateSetting('notification', e.detail.value)
  },

  /**
   * 任务提醒开关
   */
  onTaskReminderChange(e) {
    this.updateSetting('taskReminder', e.detail.value)
  },

  /**
   * 评论通知开关
   */
  onCommentNoticeChange(e) {
    this.updateSetting('commentNotice', e.detail.value)
  },

  /**
   * 公开动态开关
   */
  onPublicPostChange(e) {
    this.updateSetting('publicPost', e.detail.value)
  },

  /**
   * 显示位置开关
   */
  onShowLocationChange(e) {
    this.updateSetting('showLocation', e.detail.value)
  },

  /**
   * 更新设置
   */
  updateSetting(key, value) {
    const settings = { ...this.data.settings, [key]: value }
    this.setData({ settings })
    wx.setStorageSync('settings', settings)

    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1000
    })
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' })

          setTimeout(() => {
            wx.hideLoading()
            this.setData({ cacheSize: '0MB' })
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          }, 1000)
        }
      }
    })
  },

  /**
   * 检查更新
   */
  checkUpdate() {
    wx.showLoading({ title: '检查中...' })

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '已是最新版本',
        icon: 'success'
      })
    }, 1000)
  },

  /**
   * 隐私政策
   */
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护...',
      showCancel: false
    })
  },

  /**
   * 用户协议
   */
  showTerms() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用云端小筑...',
      showCancel: false
    })
  }
})
