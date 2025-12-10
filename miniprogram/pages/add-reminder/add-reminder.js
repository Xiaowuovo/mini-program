// pages/add-reminder/add-reminder.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    gardenId: null,

    // 任务类型列表
    taskTypes: [
      { value: 'watering', label: '浇水', icon: '💧', color: '#2196F3' },
      { value: 'fertilizing', label: '施肥', icon: '🌿', color: '#4CAF50' },
      { value: 'weeding', label: '除草', icon: '🌾', color: '#8BC34A' },
      { value: 'pest_check', label: '病虫害检查', icon: '🐛', color: '#FF9800' },
      { value: 'harvest', label: '收获', icon: '🥬', color: '#F44336' },
      { value: 'other', label: '其他', icon: '📝', color: '#9E9E9E' }
    ],

    selectedType: null,

    // 表单数据
    formData: {
      title: '',
      description: '',
      remindDate: '',
      remindTime: '09:00'
    },

    submitting: false
  },

  onLoad(options) {
    if (options.gardenId) {
      this.setData({
        gardenId: parseInt(options.gardenId)
      })
    }

    // 设置默认日期为明天
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = this.formatDate(tomorrow)

    this.setData({
      'formData.remindDate': dateStr
    })
  },

  /**
   * 选择任务类型
   */
  selectTaskType(e) {
    const type = e.currentTarget.dataset.type
    const taskType = this.data.taskTypes.find(t => t.value === type)

    this.setData({
      selectedType: type,
      'formData.title': taskType ? `${taskType.label}提醒` : ''
    })
  },

  /**
   * 标题输入
   */
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    })
  },

  /**
   * 描述输入
   */
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    this.setData({
      'formData.remindDate': e.detail.value
    })
  },

  /**
   * 时间选择
   */
  onTimeChange(e) {
    this.setData({
      'formData.remindTime': e.detail.value
    })
  },

  /**
   * 表单验证
   */
  validateForm() {
    if (!this.data.selectedType) {
      wx.showToast({
        title: '请选择任务类型',
        icon: 'none'
      })
      return false
    }

    if (!this.data.formData.title) {
      wx.showToast({
        title: '请输入提醒标题',
        icon: 'none'
      })
      return false
    }

    if (!this.data.formData.remindDate) {
      wx.showToast({
        title: '请选择提醒日期',
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

    // 合并日期和时间
    const remindTime = `${this.data.formData.remindDate} ${this.data.formData.remindTime}:00`

    const data = {
      garden_id: this.data.gardenId,
      reminder_type: this.data.selectedType,
      title: this.data.formData.title,
      description: this.data.formData.description || '',
      remind_time: remindTime,
      priority: this.getPriority(this.data.selectedType),
      source: 'manual'
    }

    request({
      url: '/smart-reminders/create',
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
   * 根据任务类型获取默认优先级
   */
  getPriority(type) {
    const priorityMap = {
      'watering': 4,
      'fertilizing': 3,
      'weeding': 2,
      'pest_check': 3,
      'harvest': 5,
      'other': 2
    }
    return priorityMap[type] || 3
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
