// pages/services/services.js
const { getServiceList } = require('../../api/service.js')

Page({
  data: {
    services: [],
    filteredServices: [],
    categories: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'watering', name: '浇水', icon: '💧' },
      { id: 'fertilizing', name: '施肥', icon: '🌿' },
      { id: 'weeding', name: '除草', icon: '🌾' },
      { id: 'harvesting', name: '收获', icon: '🥬' },
      { id: 'guidance', name: '指导', icon: '👨‍🌾' }
    ],
    currentCategory: 'all',
    stats: {
      totalServices: 5,
      totalOrders: 128,
      satisfaction: 98
    },
    loading: false
  },

  onLoad() {
    this.loadServices()
  },

  onShow() {
    // 返回时刷新数据
    this.loadServices()
  },

  onPullDownRefresh() {
    this.loadServices(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载服务列表
   */
  loadServices(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    getServiceList()
      .then(res => {
        const services = res.items || []
        this.setData({
          services: services,
          loading: false
        })
        this.filterServices()
        callback && callback()
      })
      .catch(err => {
        console.error('加载服务失败:', err)

        // 使用模拟数据
        const mockServices = this.getMockServices()
        this.setData({
          services: mockServices,
          loading: false
        })
        this.filterServices()
        callback && callback()
      })
  },

  /**
   * 筛选服务
   */
  filterServices() {
    const { services, currentCategory } = this.data

    if (currentCategory === 'all') {
      this.setData({ filteredServices: services })
    } else {
      const filtered = services.filter(item => item.service_type === currentCategory)
      this.setData({ filteredServices: filtered })
    }
  },

  /**
   * 获取模拟服务数据
   */
  getMockServices() {
    return [
      {
        id: 1,
        name: '代浇水服务',
        service_type: 'watering',
        description: '专业人员定期为您的菜地浇水，确保蔬菜健康成长',
        price: 20.00,
        unit: '次',
        icon: '💧',
        duration: '30分钟',
        isPopular: true,
        features: ['专业浇水', '定时服务', '水量充足', '科学灌溉']
      },
      {
        id: 2,
        name: '代施肥服务',
        service_type: 'fertilizing',
        description: '使用有机肥料，科学施肥，促进蔬菜生长',
        price: 30.00,
        unit: '次',
        icon: '🌿',
        duration: '45分钟',
        isPopular: true,
        features: ['有机肥料', '科学配比', '环保健康', '促进生长']
      },
      {
        id: 3,
        name: '除草服务',
        service_type: 'weeding',
        description: '清除菜地杂草，保持菜地整洁美观',
        price: 25.00,
        unit: '次',
        icon: '🌾',
        duration: '40分钟',
        isPopular: false,
        features: ['彻底除草', '不伤蔬菜', '保持整洁', '定期维护']
      },
      {
        id: 4,
        name: '收获配送服务',
        service_type: 'harvesting',
        description: '专业收获，快递到家，新鲜送达',
        price: 50.00,
        unit: '次',
        icon: '🥬',
        duration: '1小时',
        isPopular: true,
        features: ['新鲜采摘', '快递配送', '保鲜包装', '当日送达']
      },
      {
        id: 5,
        name: '种植指导服务',
        service_type: 'guidance',
        description: '农业专家一对一指导，解答种植疑问',
        price: 100.00,
        unit: '小时',
        icon: '👨‍🌾',
        duration: '1小时',
        isPopular: false,
        features: ['专家指导', '在线咨询', '视频教学', '定制方案']
      },
      {
        id: 6,
        name: '病虫害防治',
        service_type: 'weeding',
        description: '专业识别和防治各类病虫害，保护作物健康',
        price: 35.00,
        unit: '次',
        icon: '🐛',
        duration: '50分钟',
        isPopular: false,
        features: ['专业诊断', '绿色防治', '安全环保', '效果保证']
      }
    ]
  },

  /**
   * 切换分类
   */
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category
    })
    this.filterServices()
  },

  /**
   * 查看服务详情
   */
  viewServiceDetail(e) {
    const { id } = e.currentTarget.dataset
    const service = this.data.services.find(item => item.id === id)

    wx.showModal({
      title: service.name,
      content: service.description + '\n\n价格：¥' + service.price + '/' + service.unit,
      confirmText: '立即预约',
      success: (res) => {
        if (res.confirm) {
          this.bookService(e)
        }
      }
    })
  },

  /**
   * 预约服务
   */
  bookService(e) {
    const { id } = e.currentTarget.dataset

    // 检查登录状态
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

    // 跳转到服务预约页面
    wx.navigateTo({
      url: `/pages/service-booking/service-booking?serviceId=${id}`,
      fail: (err) => {
        console.error('页面跳转失败:', err)
        // 如果页面不存在，显示开发中提示
        wx.showToast({
          title: '功能开发中',
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
      title: '专业增值服务 - 让种菜更轻松',
      path: '/pages/services/services',
      imageUrl: '/images/share-service.jpg'
    }
  }
})
