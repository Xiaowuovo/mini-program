// pages/garden-detail/garden-detail.js
const { getGardenDetail } = require('../../api/garden.js')
const { showLoading, hideLoading } = require('../../utils/util.js')
const { getVideoUrl, isVideoAvailable } = require('../../config/video.js')

Page({
  data: {
    gardenId: null,
    garden: null,
    currentImageIndex: 0,
    loading: true,

    // 视频监控相关
    showVideo: false,
    videoMuted: false,
    videoLoading: false,
    videoError: false,
    videoErrorMsg: '',
    videoStatus: 'stopped',
    videoStatusText: '离线',
    livePlayerContext: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ gardenId: options.id })
      this.loadGardenDetail()
    } else {
      wx.showToast({
        title: '菜地ID缺失',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onReady() {
    // 创建live-player上下文
    if (this.data.showVideo) {
      this.livePlayerContext = wx.createLivePlayerContext('live-player', this)
    }
  },

  onUnload() {
    // 页面卸载时停止播放
    if (this.livePlayerContext && this.data.showVideo) {
      this.livePlayerContext.stop()
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.garden ? `${this.data.garden.name} - 云端小筑` : '云端小筑',
      path: `/pages/garden-detail/garden-detail?id=${this.data.gardenId}`
    }
  },

  /**
   * 加载菜地详情
   */
  loadGardenDetail() {
    showLoading('加载中...')

    getGardenDetail(this.data.gardenId)
      .then(garden => {
        hideLoading()

        // 预处理图片
        if (!garden.images || garden.images.length === 0 ||
            (garden.images[0] && garden.images[0].includes('example.com'))) {
          garden.images = ['/images/default-garden.png']
        }

        // 使用统一的视频源
        if (!garden.video_stream_url || garden.video_stream_url.includes('example.com')) {
          // 检查是否有视频可用
          if (isVideoAvailable(this.data.gardenId)) {
            garden.video_stream_url = getVideoUrl(this.data.gardenId, 'live')
          }
        }

        this.setData({
          garden,
          loading: false
        })

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: garden.name
        })
      })
      .catch(err => {
        hideLoading()
        console.error('加载菜地详情失败:', err)
        wx.showModal({
          title: '加载失败',
          content: '无法加载菜地详情，是否返回？',
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack()
            }
          }
        })
      })
  },

  /**
   * 轮播图切换
   */
  onSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.garden.images || []

    if (images.length > 0) {
      wx.previewImage({
        urls: images,
        current: images[index]
      })
    }
  },

  /**
   * 查看视频监控
   */
  viewVideoMonitor() {
    // 直接跳转到 WebRTC 摄像头页面
    wx.navigateTo({
      url: '/pages/camera/camera',
      success: () => {
        wx.showToast({
          title: '正在连接摄像头',
          icon: 'loading',
          duration: 1000
        })
      },
      fail: (err) => {
        console.error('跳转失败', err)
        wx.showToast({
          title: '无法打开监控',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 立即租用
   */
  rentGarden() {
    const { garden } = this.data

    if (!garden) return

    if (garden.status !== 'available') {
      wx.showToast({
        title: '该菜地暂不可租用',
        icon: 'none'
      })
      return
    }

    // 跳转到订单创建页面
    wx.navigateTo({
      url: `/pages/create-order/create-order?gardenId=${this.data.gardenId}`
    })
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '是否拨打客服电话？',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          })
        }
      }
    })
  },

  /**
   * 图片加载失败
   */
  onImageError(e) {
    const index = e.currentTarget.dataset.index
    const garden = this.data.garden
    if (garden && garden.images) {
      garden.images[index] = '/images/default-garden.png'
      this.setData({ garden })
    }
  },

  /**
   * 切换视频显示
   */
  toggleVideo() {
    const showVideo = !this.data.showVideo
    this.setData({ showVideo })

    if (showVideo && this.data.garden && this.data.garden.video_stream_url) {
      setTimeout(() => {
        this.livePlayerContext = wx.createLivePlayerContext('live-player', this)
        this.startVideo()
      }, 100)
    }
  },

  /**
   * 开始播放视频
   */
  startVideo() {
    this.setData({
      videoLoading: true,
      videoError: false,
      videoStatus: 'loading',
      videoStatusText: '连接中...'
    })
  },

  /**
   * 视频状态改变
   */
  onVideoStateChange(e) {
    const { code } = e.detail

    const stateMap = {
      2001: { status: 'loading', text: '连接中...' },
      2002: { status: 'playing', text: '直播中' },
      2003: { status: 'playing', text: '直播中' },
      2004: { status: 'loading', text: '重连中...' },
      2007: { status: 'stopped', text: '已断开' },
      '-2301': { status: 'error', text: '连接失败' },
      '-2302': { status: 'error', text: '连接超时' }
    }

    const state = stateMap[code] || { status: 'stopped', text: '离线' }

    this.setData({
      videoStatus: state.status,
      videoStatusText: state.text,
      videoLoading: state.status === 'loading',
      videoError: state.status === 'error'
    })

    if (code === 2002 || code === 2003) {
      this.setData({ videoLoading: false })
    }
  },

  /**
   * 视频错误
   */
  onVideoError(e) {
    const errorMap = {
      '-2301': '网络连接失败',
      '-2302': '连接超时',
      'default': '播放出错'
    }

    const errorMsg = errorMap[String(e.detail.errCode)] || errorMap['default']

    this.setData({
      videoError: true,
      videoErrorMsg: errorMsg,
      videoLoading: false
    })
  },

  /**
   * 切换静音
   */
  toggleMute() {
    this.setData({ videoMuted: !this.data.videoMuted })
    wx.showToast({
      title: this.data.videoMuted ? '已静音' : '已开启声音',
      icon: 'none',
      duration: 1000
    })
  },

  /**
   * 截图
   */
  takeSnapshot() {
    if (!this.livePlayerContext) return

    this.livePlayerContext.snapshot({
      quality: 'raw',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempImagePath,
          success: () => {
            wx.showToast({ title: '截图已保存', icon: 'success' })
          }
        })
      }
    })
  },

  /**
   * 重试播放
   */
  retryVideo() {
    this.setData({ videoError: false, videoLoading: true })
    this.startVideo()
  }
})