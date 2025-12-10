// pages/publish-post/publish-post.js
const { createPost } = require('../../api/community.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    title: '',
    content: '',
    images: [],
    maxImages: 9,
    submitting: false
  },

  /**
   * 输入标题
   */
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  /**
   * 输入内容
   */
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const { images, maxImages } = this.data
    const count = maxImages - images.length

    if (count <= 0) {
      wx.showToast({
        title: `最多上传${maxImages}张图片`,
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...this.data.images, ...res.tempFilePaths]
        this.setData({
          images: newImages
        })
      }
    })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      urls: this.data.images,
      current: this.data.images[index]
    })
  },

  /**
   * 删除图片
   */
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  /**
   * 发布帖子
   */
  publishPost() {
    const { title, content, images, submitting } = this.data

    // 验证
    if (!content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    if (submitting) return

    wx.showModal({
      title: '确认发布',
      content: '确定要发布这条动态吗？',
      success: (res) => {
        if (res.confirm) {
          this.submitPost()
        }
      }
    })
  },

  /**
   * 提交发布
   */
  submitPost() {
    this.setData({ submitting: true })
    showLoading('发布中...')

    const { title, content, images } = this.data

    // 如果有图片，先上传图片
    if (images.length > 0) {
      this.uploadImages(images)
        .then(uploadedUrls => {
          return this.createPostRequest(title, content, uploadedUrls)
        })
        .catch(err => {
          hideLoading()
          this.setData({ submitting: false })
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          })
        })
    } else {
      this.createPostRequest(title, content, [])
    }
  },

  /**
   * 上传图片
   */
  uploadImages(imagePaths) {
    return new Promise((resolve, reject) => {
      // 这里应该调用实际的图片上传接口
      // 现在使用本地路径模拟
      setTimeout(() => {
        resolve(imagePaths)
      }, 1000)
    })
  },

  /**
   * 创建帖子请求
   */
  createPostRequest(title, content, images) {
    const postData = {
      title: title || null,
      content,
      images: images.length > 0 ? images : null
    }

    createPost(postData)
      .then(() => {
        hideLoading()
        this.setData({ submitting: false })

        wx.showToast({
          title: '发布成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        hideLoading()
        this.setData({ submitting: false })

        wx.showToast({
          title: err.message || '发布失败',
          icon: 'none'
        })
      })
  },

  /**
   * 保存草稿
   */
  saveDraft() {
    const { title, content, images } = this.data

    if (!title && !content && images.length === 0) {
      wx.showToast({
        title: '没有内容需要保存',
        icon: 'none'
      })
      return
    }

    // 保存到本地存储
    wx.setStorageSync('postDraft', {
      title,
      content,
      images,
      savedAt: new Date().toISOString()
    })

    wx.showToast({
      title: '草稿已保存',
      icon: 'success'
    })
  },

  /**
   * 页面加载
   */
  onLoad() {
    // 尝试恢复草稿
    const draft = wx.getStorageSync('postDraft')
    if (draft) {
      wx.showModal({
        title: '发现草稿',
        content: '是否恢复上次编辑的内容？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              title: draft.title || '',
              content: draft.content || '',
              images: draft.images || []
            })
            // 清除草稿
            wx.removeStorageSync('postDraft')
          }
        }
      })
    }
  },

  /**
   * 页面卸载
   */
  onUnload() {
    const { title, content, images } = this.data

    // 如果有未发布的内容，提示保存
    if ((title || content || images.length > 0) && !this.data.submitting) {
      this.saveDraft()
    }
  }
})