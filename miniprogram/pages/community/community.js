// pages/community/community.js
const { getPostList, getMyPosts, likePost, unlikePost } = require('../../api/community.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    posts: [],
    currentTab: 'hot',
    tabs: [
      { key: 'hot', label: '热门' },
      { key: 'latest', label: '最新' }
    ],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true,
    filterType: null,
    _firstLoad: true
  },

  onLoad(options) {
    // 支持从profile页面跳转的参数
    const { mine, favorite } = options

    if (mine === 'true') {
      wx.setNavigationBarTitle({ title: '我的动态' })
      this.setData({
        filterType: 'mine',
        currentTab: 'latest' // 我的动态默认按时间排序
      })
    } else if (favorite === 'true') {
      wx.setNavigationBarTitle({ title: '我的收藏' })
      this.setData({
        filterType: 'favorite',
        currentTab: 'latest' // 收藏默认按时间排序
      })
    }

    this.loadPosts()
  },

  onShow() {
    if (this.data._firstLoad) {
      this.setData({ _firstLoad: false })
      return
    }
    // 从发帖页面返回时刷新列表
    this.setData({ page: 1, posts: [], hasMore: true })
    this.loadPosts()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      posts: [],
      hasMore: true
    })
    this.loadPosts(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  /**
   * 加载帖子列表
   */
  loadPosts(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    const { filterType, currentTab, page, pageSize } = this.data
    const params = {
      skip: (page - 1) * pageSize,
      limit: pageSize,
      sort: currentTab === 'hot' ? 'likes' : 'created_at'
    }

    const fetchFn = filterType === 'mine' ? getMyPosts : getPostList

    fetchFn(params)
      .then(res => {
        const newPosts = (res.items || []).map(item => ({
          ...item,
          created_at: this._formatTime(item.created_at)
        }))
        const posts = page === 1 ? newPosts : [...this.data.posts, ...newPosts]

        this.setData({
          posts,
          total: res.total || 0,
          hasMore: posts.length < (res.total || 0),
          loading: false
        })

        callback && callback()
      })
      .catch(err => {
        console.error('加载帖子失败:', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
        callback && callback()
      })
  },

  /**
   * 格式化时间为相对时间
   */
  _formatTime(isoStr) {
    if (!isoStr) return ''
    const date = new Date(isoStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 30) return `${diffDays}天前`
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${m}-${d}`
  },

  /**
   * 切换标签
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return

    this.setData({
      currentTab: tab,
      page: 1,
      posts: [],
      hasMore: true
    })
    this.loadPosts()
  },

  /**
   * 加载更多
   */
  loadMore() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadPosts()
  },

  /**
   * 点赞/取消点赞
   */
  handleLike(e) {
    const app = getApp()
    if (!app.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => app.navigateToLogin(), 1200)
      return
    }

    const { id, liked } = e.currentTarget.dataset
    const numId = parseInt(id)
    const posts = this.data.posts
    const postIndex = posts.findIndex(p => p.id === numId)
    if (postIndex === -1) return

    const action = liked ? unlikePost : likePost
    action(numId)
      .then(() => {
        posts[postIndex].liked = !liked
        posts[postIndex].like_count = (posts[postIndex].like_count || 0) + (liked ? -1 : 1)
        this.setData({ posts })
      })
      .catch(err => {
        console.error('点赞失败:', err)
        wx.showToast({ title: err.message || '操作失败', icon: 'none' })
      })
  },

  /**
   * 跳转到帖子详情
   */
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    })
  },

  /**
   * 跳转到发帖页面
   */
  navigateToPublish() {
    wx.navigateTo({
      url: '/pages/publish-post/publish-post'
    })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({
      urls,
      current
    })
  }
})