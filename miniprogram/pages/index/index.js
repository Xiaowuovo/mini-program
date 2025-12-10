// pages/index/index.js
const { getGardenList } = require('../../api/garden.js')
const { showLoading, hideLoading, timeAgo } = require('../../utils/util.js')

Page({
  data: {
    banners: [
      { id: 1, image: '/images/banner1.jpg' },
      { id: 2, image: '/images/banner2.jpg' },
      { id: 3, image: '/images/banner3.jpg' }
    ],
    hotGardens: [],
    latestPosts: []
  },

  onLoad() {
    this.loadHotGardens()
    // this.loadLatestPosts() // 暂时注释，等社区功能完善
  },

  onPullDownRefresh() {
    this.loadHotGardens()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
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
  }
})
