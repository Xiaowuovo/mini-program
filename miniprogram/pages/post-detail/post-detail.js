// pages/post-detail/post-detail.js
const { getPostDetail, likePost, unlikePost, getComments, addComment, deletePost } = require('../../api/community.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    postId: null,
    post: null,
    comments: [],
    commentInput: '',
    loading: true,
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ postId: options.id })
      this.loadPostDetail()
      this.loadComments()
    } else {
      wx.showToast({
        title: '帖子ID缺失',
        icon: 'none'
      })
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
        this.setData({
          post,
          loading: false
        })

        wx.setNavigationBarTitle({
          title: '动态详情'
        })
      })
      .catch(err => {
        hideLoading()
        console.error('加载失败:', err)
        wx.showModal({
          title: '加载失败',
          content: '无法加载帖子详情',
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack()
            }
          }
        })
      })
  },

  /**
   * 加载评论列表
   */
  loadComments() {
    getComments(this.data.postId)
      .then(comments => {
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
    const { post } = this.data
    if (!post) return

    const action = post.liked ? unlikePost : likePost

    action(post.id)
      .then(() => {
        post.liked = !post.liked
        post.like_count += post.liked ? 1 : -1
        this.setData({ post })
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
    this.setData({
      commentInput: e.detail.value
    })
  },

  /**
   * 发送评论
   */
  sendComment() {
    const { commentInput, submitting } = this.data

    if (!commentInput.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    if (submitting) return

    this.setData({ submitting: true })

    addComment(this.data.postId, { content: commentInput })
      .then(() => {
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        })

        this.setData({
          commentInput: '',
          submitting: false
        })

        // 刷新评论列表
        this.loadComments()

        // 更新评论数
        const post = this.data.post
        if (post) {
          post.comment_count += 1
          this.setData({ post })
        }
      })
      .catch(err => {
        console.error('评论失败:', err)
        this.setData({ submitting: false })
        wx.showToast({
          title: err.message || '评论失败',
          icon: 'none'
        })
      })
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