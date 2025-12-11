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
      totalServices: 6,
      totalOrders: 128,
      satisfaction: 98
    },
    loading: false,
    sortType: 'default', // default, price_asc, price_desc, popular
    showSortMenu: false,
    searchKeyword: ''
  },

  onLoad() {
    this.loadServices()
    // 确保统计数据正确
    this.setData({
      'stats.totalServices': 6
    })
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

    // 先立即显示模拟数据，避免空白界面
    const mockServices = this.getMockServices()
    this.setData({
      services: mockServices,
      loading: false
    })
    this.filterServices()

    // 然后尝试从API加载真实数据
    getServiceList()
      .then(res => {
        const services = res.items || []
        if (services.length > 0) {
          this.setData({
            services: services
          })
          this.filterServices()
        }
        // 如果API返回空数据，保持使用模拟数据
        if (typeof callback === 'function') {
          callback()
        }
      })
      .catch(err => {
        console.error('加载服务失败:', err)
        // 出错时已经有模拟数据了，不需要额外处理
        if (typeof callback === 'function') {
          callback()
        }
      })
  },

  /**
   * 筛选服务
   */
  filterServices() {
    let { services, currentCategory, searchKeyword, sortType } = this.data
    let filtered = [...services]

    // 分类筛选
    if (currentCategory !== 'all') {
      filtered = filtered.filter(item => item.service_type === currentCategory)
    }

    // 搜索筛选
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      )
    }

    // 排序
    filtered = this.sortServices(filtered, sortType)

    this.setData({ filteredServices: filtered })
  },

  /**
   * 排序服务
   */
  sortServices(services, sortType) {
    const sorted = [...services]

    switch (sortType) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        sorted.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
        break
      default:
        // 保持原始顺序
        break
    }

    return sorted
  },

  /**
   * 搜索服务
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    this.filterServices()
  },

  /**
   * 清空搜索
   */
  clearSearch() {
    this.setData({
      searchKeyword: ''
    })
    this.filterServices()
  },

  /**
   * 切换排序菜单
   */
  toggleSortMenu() {
    this.setData({
      showSortMenu: !this.data.showSortMenu
    })
  },

  /**
   * 选择排序方式
   */
  selectSort(e) {
    const { type } = e.currentTarget.dataset
    this.setData({
      sortType: type,
      showSortMenu: false
    })
    this.filterServices()
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
        rating: 4.8,
        orderCount: 156,
        isFavorite: false,
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
        rating: 4.9,
        orderCount: 203,
        isFavorite: false,
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
        rating: 4.6,
        orderCount: 89,
        isFavorite: false,
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
        rating: 4.7,
        orderCount: 178,
        isFavorite: false,
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
        rating: 5.0,
        orderCount: 45,
        isFavorite: false,
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
        rating: 4.5,
        orderCount: 67,
        isFavorite: false,
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
    // 阻止事件冒泡
    if (e.detail && e.detail.errMsg) return

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

    // 获取服务信息
    const service = this.data.services.find(item => item.id === id)
    if (!service) {
      wx.showToast({
        title: '服务不存在',
        icon: 'none'
      })
      return
    }

    // 显示服务预约对话框
    this.showBookingDialog(service)
  },

  /**
   * 显示预约对话框
   */
  showBookingDialog(service) {
    wx.showModal({
      title: '预约确认',
      content: `确认预约【${service.name}】服务吗？\n\n价格：¥${service.price}/${service.unit}\n时长：${service.duration}\n\n预约成功后，我们会尽快安排服务人员与您联系。`,
      confirmText: '确认预约',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmBooking(service)
        }
      }
    })
  },

  /**
   * 确认预约
   */
  confirmBooking(service) {
    wx.showLoading({
      title: '预约中...',
      mask: true
    })

    // 模拟预约成功
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '预约成功',
        content: `您已成功预约【${service.name}】服务！\n\n订单编号：${this.generateOrderNo()}\n服务人员将在24小时内与您联系。\n\n您可以在"订单"页面查看详情。`,
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          // 可以跳转到订单页面
          wx.switchTab({
            url: '/pages/orders/orders',
            fail: () => {
              console.log('跳转订单页面失败')
            }
          })
        }
      })
    }, 1000)
  },

  /**
   * 生成订单编号
   */
  generateOrderNo() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `SVC${year}${month}${day}${random}`
  },

  /**
   * 切换收藏
   */
  toggleFavorite(e) {
    const { id } = e.currentTarget.dataset
    const services = this.data.services.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite }
      }
      return item
    })

    this.setData({ services })
    this.filterServices()

    const service = services.find(item => item.id === id)
    wx.showToast({
      title: service.isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success',
      duration: 1500
    })
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n\n是否拨打客服电话？',
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
   * 查看全部订单
   */
  viewAllOrders() {
    wx.switchTab({
      url: '/pages/orders/orders',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
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
