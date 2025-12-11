// pages/index/index.js
const { getGardenList } = require('../../api/garden.js')
const { showLoading, hideLoading, timeAgo } = require('../../utils/util.js')

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
    weather: null,

    // 统计数据
    totalGardens: 50,
    totalUsers: 1200,
    satisfactionRate: 98,
    availableCount: 12,
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

    // 社区动态
    latestPosts: []
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
    this.loadMockPosts()
    // this.loadWeather()
  },

  onPullDownRefresh() {
    this.initPage()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  onShow() {
    // 刷新用户数据
    this.loadUserInfo()
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
   * 加载模拟动态
   */
  loadMockPosts() {
    const mockPosts = [
      {
        id: 1,
        user_nickname: '种菜达人',
        user_avatar: '/images/default-avatar.png',
        title: '今年的番茄大丰收啦！',
        content: '经过3个月的精心照料，今天终于收获了满满一篮子新鲜的番茄，感谢云端小筑提供的优质菜地！',
        created_at: '2小时前',
        comment_count: 15,
        like_count: 32
      },
      {
        id: 2,
        user_nickname: '绿手指',
        user_avatar: '/images/default-avatar.png',
        title: '分享我的种菜经验',
        content: '经过一年的实践，总结了一些种菜心得，希望能帮到新手朋友们...',
        created_at: '5小时前',
        comment_count: 8,
        like_count: 21
      }
    ]

    this.setData({ latestPosts: mockPosts })
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
  navigateToPostDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
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
   * 跳转到知识库
   */
  navigateToKnowledge() {
    wx.showModal({
      title: '种植知识库',
      content: '更多种植知识请查看：\n\n• 社区动态中的经验分享\n• 增值服务中的专家指导\n• 帮助中心的使用指南',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
