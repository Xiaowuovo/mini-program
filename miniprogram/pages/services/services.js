// pages/services/services.js
const { getServicePrices, getMyServiceOrders, bookService, cancelServiceOrder } = require('../../api/service.js')
const { getOrderList } = require('../../api/order.js')

// 服务目录（静态定义，价格从后端获取）
const SERVICE_CATALOG = [
  {
    type: '代浇水',
    name: '代浇水',
    icon: '💧',
    desc: '专业人员上门为您的菜地浇水，保持土壤适宜湿度',
    duration: '30分钟',
    unit: '次',
    features: ['按需浇灌', '避免涝根', '记录反馈'],
    price: 10
  },
  {
    type: '代施肥',
    name: '代施肥',
    icon: '🌿',
    desc: '根据作物生长阶段配比有机肥，促进健壮生长',
    duration: '45分钟',
    unit: '次',
    features: ['有机肥料', '阶段配比', '营养均衡'],
    price: 20
  },
  {
    type: '代除草',
    name: '代除草',
    icon: '🌾',
    desc: '人工清除杂草，为作物创造良好的生长环境',
    duration: '60分钟',
    unit: '次',
    features: ['人工除草', '不伤作物', '根除处理'],
    price: 15
  },
  {
    type: '代除虫',
    name: '代除虫',
    icon: '🐛',
    desc: '绿色无公害方式防治病虫害，保障蔬菜安全',
    duration: '45分钟',
    unit: '次',
    features: ['绿色防控', '无公害', '专业诊断'],
    price: 25
  },
  {
    type: '代收获',
    name: '代收获',
    icon: '🥬',
    desc: '专业采收，按时送达，让您享受新鲜蔬菜',
    duration: '60分钟',
    unit: '次',
    features: ['专业采摘', '分类打包', '新鲜配送'],
    price: 30
  }
]

// 服务状态中文
const STATUS_MAP = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消'
}

Page({
  data: {
    // 服务目录
    catalog: SERVICE_CATALOG,
    catalogLoading: false,

    // 我的服务订单
    myOrders: [],
    myOrdersLoading: false,
    myOrdersTab: 'pending', // pending | processing | completed | cancelled

    // 当前激活 tab: catalog | myorders
    activeTab: 'catalog',

    // 预约弹窗
    showBookingModal: false,
    bookingService: null,      // 正在预约的服务
    activeGardens: [],         // 用户进行中的菜地订单
    selectedOrderId: null,     // 选中的菜地订单ID
    selectedGardenIndex: 0,    // picker 索引
    bookingNote: '',           // 备注

    // 统计
    stats: {
      totalOrders: 0,
      pendingOrders: 0
    }
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadMyOrders()
    this.loadPrices()
  },

  onPullDownRefresh() {
    this.initPage()
    setTimeout(() => wx.stopPullDownRefresh(), 1500)
  },

  /**
   * 初始化页面
   */
  initPage() {
    this.loadPrices()
    this.loadMyOrders()
  },

  /**
   * 从后端加载服务价格，更新目录
   */
  loadPrices() {
    this.setData({ catalogLoading: true })
    getServicePrices()
      .then(prices => {
        const catalog = SERVICE_CATALOG.map(item => ({
          ...item,
          price: prices[item.type] !== undefined ? Number(prices[item.type]) : item.price
        }))
        this.setData({ catalog, catalogLoading: false })
      })
      .catch(() => {
        this.setData({ catalogLoading: false })
      })
  },

  /**
   * 加载我的服务订单
   */
  loadMyOrders() {
    const token = wx.getStorageSync('token')
    if (!token) return

    this.setData({ myOrdersLoading: true })
    getMyServiceOrders({ limit: 50 })
      .then(res => {
        const items = (res.items || []).map(o => ({
          ...o,
          statusText: STATUS_MAP[o.status] || o.status,
          priceNum: Number(o.price),
          createdAtFmt: this._fmtDate(o.created_at)
        }))
        const totalOrders = res.total || 0
        const pendingOrders = items.filter(o => o.status === 'pending' || o.status === 'processing').length
        this.setData({
          myOrders: items,
          myOrdersLoading: false,
          'stats.totalOrders': totalOrders,
          'stats.pendingOrders': pendingOrders
        })
      })
      .catch(() => {
        this.setData({ myOrdersLoading: false })
      })
  },

  /**
   * 切换主 Tab（服务目录 / 我的订单）
   */
  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  /**
   * 切换我的订单状态筛选
   */
  switchMyOrdersTab(e) {
    this.setData({ myOrdersTab: e.currentTarget.dataset.status })
  },

  /**
   * 点击立即预约
   */
  openBookingModal(e) {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '请先登录',
        content: '预约服务需要登录账号',
        confirmText: '去登录',
        success: res => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }

    const { type } = e.currentTarget.dataset
    const service = this.data.catalog.find(c => c.type === type)
    if (!service) return

    // 加载用户进行中的菜地订单
    wx.showLoading({ title: '加载中...' })
    getOrderList({ status: 'active', limit: 20 })
      .then(res => {
        wx.hideLoading()
        const activeGardens = (res.items || []).map(o => ({
          id: o.id,
          label: `${o.garden_name || '菜地'} (${o.start_date}~${o.end_date})`
        }))
        if (activeGardens.length === 0) {
          wx.showModal({
            title: '暂无可用菜地',
            content: '预约服务需要有进行中的菜地订单，请先租用菜地',
            confirmText: '去租菜地',
            success: r => {
              if (r.confirm) wx.switchTab({ url: '/pages/gardens/gardens' })
            }
          })
          return
        }
        this.setData({
          showBookingModal: true,
          bookingService: service,
          activeGardens,
          selectedOrderId: activeGardens[0].id,
          selectedGardenIndex: 0,
          bookingNote: ''
        })
      })
      .catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  /**
   * 弹窗：选择菜地
   */
  onGardenSelect(e) {
    const idx = Number(e.detail.value)
    this.setData({
      selectedGardenIndex: idx,
      selectedOrderId: this.data.activeGardens[idx].id
    })
  },

  /**
   * 弹窗：备注输入
   */
  onNoteInput(e) {
    this.setData({ bookingNote: e.detail.value })
  },

  /**
   * 关闭弹窗
   */
  closeBookingModal() {
    this.setData({ showBookingModal: false })
  },

  /**
   * 确认预约
   */
  confirmBooking() {
    const { bookingService, selectedOrderId, bookingNote } = this.data
    if (!selectedOrderId) {
      wx.showToast({ title: '请选择菜地', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })
    bookService({
      order_id: selectedOrderId,
      service_type: bookingService.type,
      notes: bookingNote || undefined
    })
      .then(() => {
        wx.hideLoading()
        this.setData({ showBookingModal: false })
        wx.showToast({ title: '预约成功', icon: 'success' })
        setTimeout(() => {
          this.setData({ activeTab: 'myorders', myOrdersTab: 'pending' })
          this.loadMyOrders()
        }, 1500)
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: err.message || '预约失败', icon: 'none' })
      })
  },

  /**
   * 取消服务订单
   */
  cancelMyOrder(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '取消服务',
      content: '确定要取消该服务预约吗？',
      confirmColor: '#F44336',
      success: res => {
        if (!res.confirm) return
        wx.showLoading({ title: '取消中...' })
        cancelServiceOrder(id)
          .then(() => {
            wx.hideLoading()
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadMyOrders()
          })
          .catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '取消失败', icon: 'none' })
          })
      }
    })
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '拨打',
      success: res => {
        if (res.confirm) {
          wx.makePhoneCall({ phoneNumber: '4001234567' })
        }
      }
    })
  },

  /**
   * 日期格式化
   */
  _fmtDate(isoStr) {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  },

  onShareAppMessage() {
    return {
      title: '专业增值服务 - 让种菜更轻松',
      path: '/pages/services/services'
    }
  }
})
