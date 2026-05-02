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
      totalServices: 0,
      totalOrders: 0
    },
    loading: false,
    sortType: 'default', // default, price_asc, price_desc, popular
    showSortMenu: false,
    searchKeyword: ''
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
          services,
          'stats.totalServices': services.length,
          loading: false
        })
        this.filterServices()
        if (typeof callback === 'function') callback()
      })
      .catch(err => {
        console.error('加载服务失败:', err)
        this.setData({ loading: false })
        if (typeof callback === 'function') callback()
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
    wx.showModal({
      title: '预约服务',
      content: `预约【${service.name}】需要关联已租菜地订单。请在“我的菜地”中选择对应菜地进行服务预约。`,
      showCancel: false,
      confirmText: '我知道了'
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
