// pages/post-detail/post-detail.js
const { getPostDetail, likePost, unlikePost, getComments, addComment, deletePost, deleteComment } = require('../../api/community.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    postId: null,
    post: null,
    comments: [],
    commentInput: '',
    commentImages: [],
    replyTo: null,       // { commentId, userId, nickname }
    loading: true,
    submitting: false,
    currentUserId: null
  },

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ currentUserId: userInfo && userInfo.id ? userInfo.id : null })

    if (options.id) {
      this.setData({ postId: parseInt(options.id) })
      this.loadPostDetail()
      this.loadComments()
    } else {
      wx.showToast({ title: '帖子ID缺失', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  /**
   * 加载帖子详情
   */
  loadPostDetail() {
    showLoading('加载中...')

    getPostDetail(this.data.postId)
      .then(post => {
        hideLoading()

        // 检查是否是作者
        const userInfo = wx.getStorageSync('userInfo')
        post.is_author = userInfo && userInfo.id && post.user_id === userInfo.id

        // 格式化时间
        post.created_at = this._formatTime(post.created_at)

        // 统一点赞字段名
        post.liked = post.is_liked || false

        this.setData({ post, loading: false })
        wx.setNavigationBarTitle({ title: post.title || '动态详情' })
      })
      .catch(err => {
        hideLoading()
        console.error('加载失败:', err)
        wx.showModal({
          title: '加载失败',
          content: '无法加载帖子详情',
          showCancel: false,
          success: () => wx.navigateBack()
        })
      })
  },

  /**
   * 格式化时间
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
   * 加载评论列表
   */
  loadComments() {
    getComments(this.data.postId)
      .then(res => {
        const comments = (res.items || []).map(c => ({
          ...c,
          created_at: this._formatTime(c.created_at)
        }))
        this.setData({ comments })
      })
      .catch(err => {
        console.error('加载评论失败:', err)
      })
  },

  /**
   * 点赞/取消点赞
   */
  handleLike() {
    const app = getApp()
    if (!app.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => app.navigateToLogin(), 1200)
      return
    }

    const { post } = this.data
    if (!post) return

    const action = post.liked ? unlikePost : likePost
    action(post.id)
      .then(() => {
        post.liked = !post.liked
        post.like_count = (post.like_count || 0) + (post.liked ? 1 : -1)
        this.setData({ post })
      })
      .catch(err => {
        console.error('点赞失败:', err)
        wx.showToast({ title: err.message || '操作失败', icon: 'none' })
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
  },

  /**
   * 输入评论
   */
  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value })
  },

  /**
   * 选择评论图片
   */
  chooseCommentImage() {
    const remaining = 3 - this.data.commentImages.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' })
      return
    }
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          commentImages: [...this.data.commentImages, ...res.tempFilePaths]
        })
      }
    })
  },

  /**
   * 删除已选图片
   */
  removeCommentImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = this.data.commentImages.filter((_, i) => i !== idx)
    this.setData({ commentImages: images })
  },

  /**
   * 设置回复对象
   */
  setReplyTo(e) {
    const app = getApp()
    if (!app.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const { commentId, userId, nickname } = e.currentTarget.dataset
    this.setData({ replyTo: { commentId: parseInt(commentId), userId: parseInt(userId), nickname } })
  },

  /**
   * 取消回复
   */
  cancelReply() {
    this.setData({ replyTo: null })
  },

  /**
   * 发送评论（支持回复 + 图片）
   */
  sendComment() {
    const { commentInput, commentImages, replyTo, submitting, postId } = this.data

    if (!commentInput.trim() && commentImages.length === 0) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }
    if (submitting) return

    const app = getApp()
    if (!app.getToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => app.navigateToLogin(), 1200)
      return
    }

    this.setData({ submitting: true })

    const payload = {
      content: commentInput.trim() || '【图片】',
      images: commentImages.length > 0 ? commentImages : null,
      parent_id: replyTo ? replyTo.commentId : null,
      reply_to_user_id: replyTo ? replyTo.userId : null
    }

    addComment(postId, payload)
      .then(() => {
        wx.showToast({ title: '发表成功', icon: 'success' })
        this.setData({ commentInput: '', commentImages: [], replyTo: null, submitting: false })
        this.loadComments()
        // 顶层评论才加 count
        if (!payload.parent_id) {
          const post = this.data.post
          if (post) {
            post.comment_count = (post.comment_count || 0) + 1
            this.setData({ post })
          }
        }
      })
      .catch(err => {
        console.error('评论失败:', err)
        this.setData({ submitting: false })
        wx.showToast({ title: err.message || '评论失败', icon: 'none' })
      })
  },

  /**
   * 删除评论
   */
  handleDeleteComment(e) {
    const commentId = parseInt(e.currentTarget.dataset.id)
    wx.showModal({
      title: '删除评论',
      content: '确定删除这条评论？',
      confirmColor: '#F44336',
      success: (res) => {
        if (!res.confirm) return
        deleteComment(this.data.postId, commentId)
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadComments()
            // 评论数在顶层评论删除时已由后端处理，重载详情以同步
            this.loadPostDetail()
          })
          .catch(err => {
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          })
      }
    })
  },

  /**
   * 预览评论图片
   */
  previewCommentImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ urls, current })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { post } = this.data
    return {
      title: post ? post.title || post.content.substr(0, 30) : '分享动态',
      path: `/pages/post-detail/post-detail?id=${this.data.postId}`
    }
  },

  /**
   * 删除帖子
   */
  handleDelete() {
    wx.showModal({
      title: '删除帖子',
      content: '确定要删除这条动态吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.deletePostRequest()
        }
      }
    })
  },

  /**
   * 删除帖子请求
   */
  deletePostRequest() {
    showLoading('删除中...')

    deletePost(this.data.postId)
      .then(() => {
        hideLoading()
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        hideLoading()
        wx.showToast({
          title: err.message || '删除失败',
          icon: 'none'
        })
      })
  }
})