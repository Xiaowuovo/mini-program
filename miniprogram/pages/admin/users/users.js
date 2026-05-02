// pages/admin/users/users.js
const { getAdminUsers } = require('../../../api/admin.js')

Page({
  data: {
    users: [],
    total: 0,
    roleFilter: 'all',
    searchKeyword: '',
    isLoading: false
  },

  onLoad() {
    this.loadUsers()
  },

  onShow() {
    this.loadUsers()
  },

  loadUsers() {
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...' })

    const params = {}
    if (this.data.roleFilter !== 'all') {
      params.role = this.data.roleFilter
    }
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword
    }

    getAdminUsers(params)
      .then(res => {
        this.setData({
          users: res.items || [],
          total: res.total || 0,
          isLoading: false
        })
      })
      .catch(err => {
        console.error('加载用户列表失败:', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ isLoading: false })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  onFilterChange(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ roleFilter: role })
    this.loadUsers()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearchConfirm() {
    this.loadUsers()
  },

  onViewDetail(e) {
    const { id } = e.currentTarget.dataset
    const user = this.data.users.find(u => u.id === id)
    if (!user) return

    wx.showModal({
      title: user.nickname || '用户详情',
      content: `角色：${user.role === 'admin' ? '管理员' : '租户'}\n手机：${user.phone || '未绑定'}\n注册时间：${user.created_at || '未知'}\n订单数：${user.total_orders || 0}`,
      showCancel: false,
      confirmText: '关闭'
    })
  },

  onRefresh() {
    this.loadUsers()
  }
})
