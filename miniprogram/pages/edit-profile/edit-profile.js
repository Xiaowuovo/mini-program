// pages/edit-profile/edit-profile.js
const app = getApp()

Page({
  data: {
    form: {
      avatar: '',
      nickname: '',
      gender: 0,
      phone: '',
      address: '',
      bio: ''
    },
    genderOptions: ['保密', '男', '女']
  },

  onLoad() {
    this.loadUserInfo()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        form: {
          avatar: userInfo.avatar || '',
          nickname: userInfo.nickname || '',
          gender: userInfo.gender || 0,
          phone: userInfo.phone || '',
          address: userInfo.address || '',
          bio: userInfo.bio || ''
        }
      })
    }
  },

  /**
   * 选择头像
   */
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          'form.avatar': tempFilePath
        })

        // 这里应该上传到服务器
        // wx.uploadFile({...})
      }
    })
  },

  /**
   * 输入昵称
   */
  onNicknameInput(e) {
    this.setData({
      'form.nickname': e.detail.value
    })
  },

  /**
   * 选择性别
   */
  onGenderChange(e) {
    this.setData({
      'form.gender': parseInt(e.detail.value)
    })
  },

  /**
   * 输入手机号
   */
  onPhoneInput(e) {
    this.setData({
      'form.phone': e.detail.value
    })
  },

  /**
   * 输入地址
   */
  onAddressInput(e) {
    this.setData({
      'form.address': e.detail.value
    })
  },

  /**
   * 输入简介
   */
  onBioInput(e) {
    this.setData({
      'form.bio': e.detail.value
    })
  },

  /**
   * 保存资料
   */
  saveProfile() {
    const { nickname, phone } = this.data.form

    // 验证
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 这里应该调用API保存
    setTimeout(() => {
      wx.hideLoading()

      // 更新本地存储
      const userInfo = wx.getStorageSync('userInfo') || {}
      const updatedUserInfo = { ...userInfo, ...this.data.form }
      wx.setStorageSync('userInfo', updatedUserInfo)

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})
