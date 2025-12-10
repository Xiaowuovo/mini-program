// pages/admin/users/users.js
Page({
  data: {
    users: [],
    filteredUsers: [],
    roleFilter: 'all', // all, tenant, admin
    searchKeyword: '',
    isLoading: false
  },

  onLoad() {
    this.loadUsers()
  },

  loadUsers() {
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...' })

    // 这里应该调用后端API获取用户列表
    // 暂时使用模拟数据
    this.loadMockUsers()
  },

  loadMockUsers() {
    setTimeout(() => {
      const users = [
        {
          id: 1,
          nickname: '管理员',
          role: 'admin',
          phone: '13800138000',
          created_at: '2024-01-01',
          total_orders: 0
        },
        {
          id: 2,
          nickname: '张三',
          role: 'tenant',
          phone: '13900139001',
          created_at: '2024-02-15',
          total_orders: 5
        },
        {
          id: 3,
          nickname: '李四',
          role: 'tenant',
          phone: '13900139002',
          created_at: '2024-03-10',
          total_orders: 3
        },
        {
          id: 4,
          nickname: '王五',
          role: 'tenant',
          phone: '13900139003',
          created_at: '2024-04-05',
          total_orders: 8
        }
      ]

      this.setData({
        users,
        filteredUsers: users,
        isLoading: false
      })
      wx.hideLoading()
    }, 500)
  },

  onFilterChange(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ roleFilter: role })
    this.filterUsers()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.filterUsers()
  },

  filterUsers() {
    const { users, roleFilter, searchKeyword } = this.data

    let filtered = users

    // 角色筛选
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    // 搜索筛选
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(u =>
        u.nickname.toLowerCase().includes(keyword) ||
        (u.phone && u.phone.includes(keyword))
      )
    }

    this.setData({ filteredUsers: filtered })
  },

  onViewDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.showToast({
      title: '用户详情功能开发中',
      icon: 'none'
    })
  },

  onRefresh() {
    this.loadUsers()
  }
})
