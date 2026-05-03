// pages/index/index.js
const { getGardenList } = require('../../api/garden.js')
const { getPublicStats } = require('../../api/admin.js')
const { getOrderList } = require('../../api/order.js')
const { getReminderStatistics } = require('../../api/smart-reminder.js')
const { getPostList } = require('../../api/community.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    // 轮播图
    banners: [
      {
        id: 1,
        image: '/images/banner1.jpg',
        title: '智慧农场',
        desc: '科技助力，轻松种菜'
      },
      {
        id: 2,
        image: '/images/banner2.jpg',
        title: '绿色生活',
        desc: '健康有机，品质保证'
      },
      {
        id: 3,
        image: '/images/banner3.jpg',
        title: '共享菜园',
        desc: '租地种菜，享受田园'
      }
    ],
    currentBanner: 0,

    // 用户信息
    greeting: '你好',
    userName: '租户',

    // 统计数据（从API加载）
    totalGardens: 0,
    totalUsers: 0,
    availableCount: 0,
    myGardenCount: 0,
    pendingTasks: 0,

    // 热门菜地
    hotGardens: [],

    // 种植知识
    knowledgeList: [
      { id: 1, icon: '🌱', title: '种植指南', desc: '新手必看' },
      { id: 2, icon: '💧', title: '浇水技巧', desc: '科学灌溉' },
      { id: 3, icon: '🌿', title: '施肥方法', desc: '营养均衡' },
      { id: 4, icon: '🐛', title: '病虫害防治', desc: '绿色防控' }
    ],

    // 社区帖子
    communityPosts: [],
    communityLoading: false
  },

  onLoad() {
    this.initPage()
  },

  /**
   * 初始化页面
   */
  initPage() {
    this.setGreeting()
    this.loadUserInfo()
    this.loadHotGardens()
    this.loadPublicStats()
    this.loadCommunityPosts()
  },

  onPullDownRefresh() {
    this.initPage()
    this.loadUserRelatedStats()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1500)
  },

  onShow() {
    this.loadUserInfo()
    this.loadPublicStats()
    this.loadUserRelatedStats()
  },

  /**
   * 设置问候语
   */
  setGreeting() {
    const hour = new Date().getHours()
    let greeting = '你好'

    if (hour < 6) {
      greeting = '夜深了'
    } else if (hour < 9) {
      greeting = '早上好'
    } else if (hour < 12) {
      greeting = '上午好'
    } else if (hour < 14) {
      greeting = '中午好'
    } else if (hour < 18) {
      greeting = '下午好'
    } else if (hour < 22) {
      greeting = '晚上好'
    } else {
      greeting = '夜深了'
    }

    this.setData({ greeting })
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userName: userInfo.nickname || userInfo.username || '租户'
      })
    }
  },

  /**
   * 轮播图切换
   */
  onBannerChange(e) {
    this.setData({
      currentBanner: e.detail.current
    })
  },

  /**
   * 加载公开统计数据
   */
  loadPublicStats() {
    getPublicStats()
      .then(res => {
        this.setData({
          totalGardens: res.totalGardens || 0,
          totalUsers: res.totalUsers || 0,
          availableCount: res.availableGardens || 0
        })
      })
      .catch(err => {
        console.error('加载统计数据失败:', err)
      })
  },

  /**
   * 加载用户相关实时统计（需要登录）
   */
  loadUserRelatedStats() {
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('token')
    if (!userInfo || !token) return

    // 活跃菜地数
    getOrderList({ status: 'active', limit: 1 })
      .then(res => {
        this.setData({ myGardenCount: res.total || 0 })
      })
      .catch(() => {})

    // 待处理提醒数
    getReminderStatistics()
      .then(res => {
        this.setData({ pendingTasks: res.pending || 0 })
      })
      .catch(() => {})
  },

  /**
   * 加载社区最新帖子
   */
  loadCommunityPosts() {
    this.setData({ communityLoading: true })
    getPostList({ limit: 3, skip: 0 })
      .then(res => {
        const posts = (res.items || []).map(p => ({
          ...p,
          timeAgo: this._timeAgo(p.created_at)
        }))
        this.setData({ communityPosts: posts, communityLoading: false })
      })
      .catch(() => {
        this.setData({ communityLoading: false })
      })
  },

  /**
   * 时间格式化：X分钟前 / X小时前 / X天前
   */
  _timeAgo(isoStr) {
    if (!isoStr) return ''
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`
    return new Date(isoStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  },

  /**
   * 加载热门菜地
   */
  loadHotGardens() {
    showLoading()
    getGardenList({ limit: 4, status: 'available' }).then(res => {
      hideLoading()
      this.setData({
        hotGardens: res.items || []
      })
    }).catch(err => {
      hideLoading()
      console.error('加载菜地失败:', err)
    })
  },

  /**
   * 跳转到菜地列表
   */
  navigateToGardens() {
    wx.switchTab({
      url: '/pages/gardens/gardens'
    })
  },

  /**
   * 跳转到菜地详情
   */
  navigateToGardenDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/garden-detail/garden-detail?id=${id}`
    })
  },

  /**
   * 跳转到我的菜地
   */
  navigateToMyGardens() {
    wx.navigateTo({
      url: '/pages/my-gardens/my-gardens'
    })
  },

  /**
   * 跳转到增值服务
   */
  navigateToServices() {
    wx.navigateTo({
      url: '/pages/services/services'
    })
  },

  /**
   * 跳转到任务提醒
   */
  navigateToReminders() {
    wx.navigateTo({
      url: '/pages/reminders/reminders'
    })
  },

  /**
   * 轮播图加载失败
   */
  onBannerError(e) {
    const index = e.currentTarget.dataset.index
    const banners = this.data.banners
    banners[index].image = '/images/default-garden.png'
    this.setData({ banners })
  },

  /**
   * 热门菜地图片加载失败
   */
  onGardenImageError(e) {
    const index = e.currentTarget.dataset.index
    const hotGardens = this.data.hotGardens
    if (hotGardens[index]) {
      hotGardens[index].image_url = '/images/default-garden.png'
      this.setData({ hotGardens })
    }
  },

  /**
   * 查看知识详情
   */
  viewKnowledge(e) {
    const { id, title } = e.currentTarget.dataset
    const knowledgeMap = {
      1: '🌱 种植指南\n\n1. 选择合适的季节和作物\n2. 准备好土壤和工具\n3. 按照间距种植\n4. 定期浇水和施肥\n5. 注意病虫害防治',
      2: '💧 浇水技巧\n\n1. 早晚浇水最佳\n2. 避免中午浇水\n3. 根据天气调整频率\n4. 浇透不浇半截水\n5. 注意排水防涝',
      3: '🌿 施肥方法\n\n1. 使用有机肥为主\n2. 薄肥勤施原则\n3. 避免烧苗\n4. 注意氮磷钾平衡\n5. 根据生长期调整',
      4: '🐛 病虫害防治\n\n1. 以预防为主\n2. 及时清除病叶\n3. 使用生物防治\n4. 合理使用农药\n5. 保持通风良好'
    }

    wx.showModal({
      title: title,
      content: knowledgeMap[id] || '更多知识正在整理中...',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 跳转到社区
   */
  navigateToCommunity() {
    wx.switchTab({
      url: '/pages/community/community'
    })
  },

  /**
   * 跳转到帖子详情
   */
  navigateToPost(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    })
  },

  /**
   * 跳转到知识库
   */
  navigateToKnowledge() {
    wx.showModal({
      title: '种植知识库',
      content: '更多种植知识请查看：\n\n• 增值服务中的专家指导\n• 帮助中心的使用指南\n• 任务提醒的种植建议',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
