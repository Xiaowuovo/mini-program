// pages/add-planting/add-planting.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    gardenId: null,
    gardenName: '',

    // 可选作物列表
    cropList: [
      { id: 1, name: '番茄', icon: '🍅', growthDays: 90 },
      { id: 2, name: '黄瓜', icon: '🥒', growthDays: 65 },
      { id: 3, name: '生菜', icon: '🥬', growthDays: 45 },
      { id: 4, name: '草莓', icon: '🍓', growthDays: 120 },
      { id: 5, name: '小白菜', icon: '🥬', growthDays: 35 }
    ],

    selectedCropId: null,
    selectedCropName: '',
    selectedCropGrowthDays: 0,

    // 表单数据
    formData: {
      quantity: 10,
      area: 2.0,
      plantingDate: '',
      notes: ''
    },

    submitting: false
  },

  onLoad(options) {
    if (options.gardenId) {
      this.setData({
        gardenId: parseInt(options.gardenId),
        gardenName: options.gardenName || '我的菜地'
      })

      // 设置默认种植日期为今天
      const today = new Date()
      const dateStr = this.formatDate(today)
      this.setData({
        'formData.plantingDate': dateStr
      })
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 选择作物
   */
  selectCrop(e) {
    const crop = e.currentTarget.dataset.crop
    this.setData({
      selectedCropId: crop.id,
      selectedCropName: crop.name,
      selectedCropGrowthDays: crop.growthDays
    })
  },

  /**
   * 数量输入
   */
  onQuantityInput(e) {
    this.setData({
      'formData.quantity': parseInt(e.detail.value) || 1
    })
  },

  /**
   * 面积输入
   */
  onAreaInput(e) {
    this.setData({
      'formData.area': parseFloat(e.detail.value) || 0
    })
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    this.setData({
      'formData.plantingDate': e.detail.value
    })
  },

  /**
   * 备注输入
   */
  onNotesInput(e) {
    this.setData({
      'formData.notes': e.detail.value
    })
  },

  /**
   * 表单验证
   */
  validateForm() {
    if (!this.data.selectedCropId) {
      wx.showToast({
        title: '请选择作物',
        icon: 'none'
      })
      return false
    }

    if (!this.data.formData.plantingDate) {
      wx.showToast({
        title: '请选择种植日期',
        icon: 'none'
      })
      return false
    }

    if (this.data.formData.quantity <= 0) {
      wx.showToast({
        title: '种植数量必须大于0',
        icon: 'none'
      })
      return false
    }

    if (this.data.formData.area <= 0) {
      wx.showToast({
        title: '占地面积必须大于0',
        icon: 'none'
      })
      return false
    }

    return true
  },

  /**
   * 提交表单
   */
  submitForm() {
    if (!this.validateForm()) {
      return
    }

    if (this.data.submitting) {
      return
    }

    this.setData({ submitting: true })

    const data = {
      garden_id: this.data.gardenId,
      crop_id: this.data.selectedCropId,
      planting_date: this.data.formData.plantingDate,
      quantity: this.data.formData.quantity,
      area: this.data.formData.area,
      notes: this.data.formData.notes
    }

    request({
      url: '/gardens/planting-records',
      method: 'POST',
      data: data
    })
      .then(res => {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        console.error('添加失败:', err)
        wx.showToast({
          title: err.message || '添加失败',
          icon: 'none'
        })
        this.setData({ submitting: false })
      })
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
