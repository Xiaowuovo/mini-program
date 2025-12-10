// pages/garden-status/garden-status.js
const { get } = require('../../utils/request.js')
const { isVideoAvailable } = require('../../config/video.js')

Page({
  data: {
    gardenId: null,
    loading: true,

    // 菜地基本信息
    garden: null,

    // 租赁信息
    rental: null,

    // 种植信息
    planting: null,

    // 环境信息
    environment: null,

    // 提醒信息
    reminders: null,

    // Tab切换
    currentTab: 0,
    tabs: ['概览', '种植', '环境', '数据']
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ gardenId: parseInt(options.id) })
      this.loadGardenStatus()
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

  onPullDownRefresh() {
    this.loadGardenStatus(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载菜地状态
   */
  loadGardenStatus(callback) {
    this.setData({ loading: true })

    get(`/gardens/${this.data.gardenId}/status`)
      .then(res => {
        console.log('菜地状态:', res)

        this.setData({
          garden: res.garden,
          rental: res.rental_info,
          planting: res.planting,
          environment: res.environment,
          reminders: res.reminders,
          loading: false
        })

        callback && callback()
      })
      .catch(err => {
        console.error('加载失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        callback && callback()
      })
  },

  /**
   * 切换Tab
   */
  onTabChange(e) {
    this.setData({
      currentTab: e.currentTarget.dataset.index
    })
  },

  /**
   * 获取环境状态文本
   */
  getEnvironmentStatusText(status) {
    const statusMap = {
      'excellent': '优秀',
      'good': '良好',
      'warning': '警告',
      'critical': '危险'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取环境状态颜色
   */
  getEnvironmentStatusColor(status) {
    const colorMap = {
      'excellent': '#4CAF50',
      'good': '#8BC34A',
      'warning': '#FF9800',
      'critical': '#F44336'
    }
    return colorMap[status] || '#999'
  },

  /**
   * 获取生长阶段文本
   */
  getStageText(stage) {
    const stageMap = {
      'seedling': '育苗期',
      'growth': '生长期',
      'flowering': '开花期',
      'fruiting': '结果期',
      'harvest': '收获期'
    }
    return stageMap[stage] || stage
  },

  /**
   * 跳转到提醒页面
   */
  goToReminders() {
    wx.navigateTo({
      url: '/pages/reminders/reminders'
    })
  },

  /**
   * 跳转到视频监控
   */
  goToMonitor() {
    // 直接跳转到摄像头页面（和garden-detail一致）
    wx.navigateTo({
      url: '/pages/camera/camera',
      success: () => {
        wx.showToast({
          title: '正在连接摄像头',
          icon: 'loading',
          duration: 1000
        })
      },
      fail: (err) => {
        console.error('跳转失败', err)
        wx.showToast({
          title: '无法打开监控',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 查看传感器详情
   */
  viewSensorDetail(e) {
    const sensor = e.currentTarget.dataset.sensor
    wx.showModal({
      title: sensor.sensor_type === 'temperature' ? '温度传感器' :
             sensor.sensor_type === 'humidity' ? '湿度传感器' :
             sensor.sensor_type === 'soil_moisture' ? '土壤湿度' : '传感器',
      content: `当前读数: ${sensor.current_value}${sensor.unit}\n${sensor.is_abnormal ? '⚠️ ' + sensor.abnormal_reason : '✓ 正常'}`,
      showCancel: false
    })
  },

  /**
   * 查看作物详情
   */
  viewCropDetail(e) {
    const crop = e.currentTarget.dataset.crop
    const content = `种植日期: ${crop.planting_date || '未知'}\n` +
                   `当前阶段: ${this.getStageText(crop.current_stage)}\n` +
                   `已生长: ${crop.days_since_planting}天\n` +
                   `预计收获: ${crop.days_to_harvest}天后\n` +
                   `种植数量: ${crop.quantity || 0}\n` +
                   `占地面积: ${crop.area || 0}㎡`

    wx.showModal({
      title: crop.crop_name,
      content: content,
      showCancel: false
    })
  }
})
