// pages/about/about.js
Page({
  data: {},

  /**
   * 拨打电话
   */
  callPhone() {
    wx.showModal({
      title: '拨打电话',
      content: '400-123-4567',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4001234567',
            fail: () => {
              wx.showToast({
                title: '拨号失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  /**
   * 复制邮箱
   */
  copyEmail() {
    wx.setClipboardData({
      data: 'support@example.com',
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 显示隐私政策
   */
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '云端小筑重视用户隐私保护...\n\n1. 信息收集\n我们会收集您的基本信息用于提供服务。\n\n2. 信息使用\n您的信息仅用于改善服务体验。\n\n3. 信息保护\n我们采用加密技术保护您的数据安全。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 显示用户协议
   */
  showTerms() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用云端小筑！\n\n1. 服务条款\n使用本服务即表示您同意本协议。\n\n2. 用户责任\n请合理使用平台资源。\n\n3. 平台责任\n我们将尽力提供优质服务。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
