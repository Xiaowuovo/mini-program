// pages/admin/gardens/gardens.js
const { getGardens, updateGarden, createGarden } = require('../../../api/garden.js')

Page({
  data: {
    gardens: [],
    filteredGardens: [],
    statusFilter: 'all', // all, available, rented, maintenance
    isLoading: false,
    showAddDialog: false,
    newGarden: {
      name: '',
      location: '',
      area: '',
      price: ''
    }
  },

  onLoad() {
    this.loadGardens()
  },

  loadGardens() {
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...' })

    getGardens()
      .then(res => {
        const gardens = res.gardens || res || []
        this.setData({
          gardens,
          filteredGardens: gardens
        })
      })
      .catch(err => {
        console.error('加载菜地失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ isLoading: false })
        wx.hideLoading()
      })
  },

  onFilterChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ statusFilter: status })
    this.filterGardens(status)
  },

  filterGardens(status) {
    const { gardens } = this.data
    if (status === 'all') {
      this.setData({ filteredGardens: gardens })
    } else {
      const filtered = gardens.filter(g => g.status === status)
      this.setData({ filteredGardens: filtered })
    }
  },

  onStatusChange(e) {
    const { id } = e.currentTarget.dataset
    const garden = this.data.gardens.find(g => g.id === id)

    wx.showActionSheet({
      itemList: ['可用', '已出租', '维护中'],
      success: (res) => {
        const statusMap = ['available', 'rented', 'maintenance']
        const newStatus = statusMap[res.tapIndex]
        this.updateGardenStatus(id, newStatus)
      }
    })
  },

  updateGardenStatus(id, status) {
    wx.showLoading({ title: '更新中...' })

    updateGarden(id, { status })
      .then(() => {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        this.loadGardens()
      })
      .catch(err => {
        console.error('更新失败:', err)
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '编辑菜地',
      content: '菜地编辑功能正在开发中。\n\n如需修改菜地信息，请联系系统管理员。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  onShowAddDialog() {
    this.setData({ showAddDialog: true })
  },

  onHideAddDialog() {
    this.setData({
      showAddDialog: false,
      newGarden: {
        name: '',
        location: '',
        area: '',
        price: ''
      }
    })
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`newGarden.${field}`]: e.detail.value
    })
  },

  onConfirmAdd() {
    const { newGarden } = this.data

    if (!newGarden.name || !newGarden.location || !newGarden.area || !newGarden.price) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '添加中...' })

    createGarden({
      ...newGarden,
      area: parseFloat(newGarden.area),
      price: parseFloat(newGarden.price),
      status: 'available'
    })
      .then(() => {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        this.onHideAddDialog()
        this.loadGardens()
      })
      .catch(err => {
        console.error('添加失败:', err)
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  onRefresh() {
    this.loadGardens()
  }
})
