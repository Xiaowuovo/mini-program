// pages/community/community.js
const { getPostList, likePost, unlikePost } = require('../../api/community.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    posts: [],
    currentTab: 'hot', // hot: 热门, latest: 最新
    tabs: [
      { key: 'hot', label: '热门' },
      { key: 'latest', label: '最新' }
    ],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true
  },

  onLoad(options) {
    this.loadPosts()
  },

  onShow() {
    // 从发帖页面返回时刷新列表
    if (this.data.posts.length > 0) {
      this.setData({ page: 1, posts: [] })
      this.loadPosts()
    }
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

    const params = {
      skip: (this.data.page - 1) * this.data.pageSize,
      limit: this.data.pageSize,
      sort: this.data.currentTab === 'hot' ? 'likes' : 'created_at'
    }

    getPostList(params)
      .then(res => {
        const newPosts = res.items || []
        const posts = this.data.page === 1 ? newPosts : [...this.data.posts, ...newPosts]

        this.setData({
          posts,
          total: res.total,
          hasMore: posts.length < res.total,
          loading: false
        })

        callback && callback()
      })
      .catch(err => {
        console.error('加载帖子失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        callback && callback()
      })
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
    const { id, liked } = e.currentTarget.dataset
    const posts = this.data.posts
    const postIndex = posts.findIndex(p => p.id === id)

    if (postIndex === -1) return

    const action = liked ? unlikePost : likePost

    action(id)
      .then(() => {
        posts[postIndex].liked = !liked
        posts[postIndex].like_count += liked ? -1 : 1
        this.setData({ posts })
      })
      .catch(err => {
        console.error('操作失败:', err)
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        })
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