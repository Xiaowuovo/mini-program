// pages/gardens/gardens.js
const { getGardenList } = require('../../api/garden.js')
const { showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    gardens: [],
    keyword: '',
    currentStatus: '',
    sortField: '',
    sortOrder: 'asc',
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true
  },

  onLoad(options) {
    // 如果从其他页面传入筛选条件
    if (options.status) {
      this.setData({ currentStatus: options.status })
    }
    this.loadGardens()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      gardens: [],
      hasMore: true
    })
    this.loadGardens(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  /**
   * 加载菜地列表
   */
  loadGardens(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    const params = {
      skip: (this.data.page - 1) * this.data.pageSize,
      limit: this.data.pageSize
    }

    // 添加筛选条件
    if (this.data.currentStatus) {
      params.status = this.data.currentStatus
    }

    // 添加搜索关键词
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }

    // 添加排序
    if (this.data.sortField) {
      params.sort_field = this.data.sortField
      params.sort_order = this.data.sortOrder
    }

    getGardenList(params)
      .then(res => {
        let newGardens = res.items || []
        // 预处理图片
        newGardens = this.processGardens(newGardens)

        const gardens = this.data.page === 1 ? newGardens : [...this.data.gardens, ...newGardens]

        this.setData({
          gardens,
          total: res.total,
          hasMore: gardens.length < res.total,
          loading: false
        })

        callback && callback()
      })
      .catch(err => {
        console.error('加载菜地失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        callback && callback()
      })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.setData({
      page: 1,
      gardens: [],
      hasMore: true
    })
    this.loadGardens()
  },

  /**
   * 筛选状态
   */
  onFilterStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      page: 1,
      gardens: [],
      hasMore: true
    })
    this.loadGardens()
  },

  /**
   * 排序
   */
  onSort(e) {
    const field = e.currentTarget.dataset.field
    let sortOrder = 'asc'

    // 如果点击的是当前排序字段，切换排序顺序
    if (this.data.sortField === field) {
      sortOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc'
    }

    this.setData({
      sortField: field,
      sortOrder,
      page: 1,
      gardens: [],
      hasMore: true
    })
    this.loadGardens()
  },

  /**
   * 加载更多
   */
  loadMore() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadGardens()
  },

  /**
   * 跳转到菜地详情
   */
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/garden-detail/garden-detail?id=${id}`
    })
  },

  /**
   * 图片加载失败处理
   */
  onImageError(e) {
    const index = e.currentTarget.dataset.index
    const gardens = this.data.gardens

    // 仅当索引有效且当前不是默认图时才替换，防止死循环
    if (gardens[index] && gardens[index].image_url !== '/images/default-garden.png') {
      console.log(`图片加载失败，替换为默认图: 索引 ${index}`)
      const up = `gardens[${index}].image_url` // 使用路径更新，性能更好
      this.setData({
        [up]: '/images/default-garden.png'
      })
    }
  },

  /**
   * 处理菜地数据（预处理图片URL）
   */
  processGardens(list) {
    return list.map(item => {
      // 如果是示例图片或无效URL，直接使用默认图
      if (!item.images || item.images.length === 0 ||
          (item.images[0] && item.images[0].includes('example.com'))) {
        item.image_url = '/images/default-garden.png'
      } else {
        item.image_url = item.images[0]
      }
      return item
    })
  }
})