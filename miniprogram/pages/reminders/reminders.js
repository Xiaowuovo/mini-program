// pages/reminders/reminders.js
const { getReminderList, completeReminder, deleteReminder } = require('../../api/reminder.js')
const {
  getSmartReminderList,
  generateSmartReminders,
  completeSmartReminder,
  ignoreSmartReminder
} = require('../../api/smart-reminder.js')

Page({
  data: {
    // 来源菜地模式
    fromGarden: false,     // 是否从菜地详情跳来
    gardenId: null,        // 锁定菜地 ID
    gardenName: '',        // 锁定菜地名称

    // 全园模式下的菜地 Tab
    gardenTabs: [],        // [{id, name, pendingCount}]
    selectedGardenId: null, // null = 全部

    // 提醒列表（已过滤）
    allReminders: [],      // 原始全量列表（全园模式用）
    reminders: [],         // 当前展示列表

    statusFilter: 'pending', // all, pending, completed
    loading: false,
    useSmartReminders: true,
    statistics: { total: 0, pending: 0, completed: 0 }
  },

  onLoad(options) {
    const useSmartReminders = wx.getStorageSync('useSmartReminders')
    if (useSmartReminders !== undefined) {
      this.setData({ useSmartReminders })
    }

    if (options.gardenId) {
      const gardenId = parseInt(options.gardenId)
      const gardenName = decodeURIComponent(options.gardenName || '')
      this.setData({
        fromGarden: true,
        gardenId,
        gardenName,
        selectedGardenId: gardenId
      })
      wx.setNavigationBarTitle({ title: gardenName ? `${gardenName} · 提醒` : '菜地提醒' })
    }

    this.loadReminders()
  },

  onShow() {
    this.loadReminders()
  },

  onPullDownRefresh() {
    this.loadReminders(() => wx.stopPullDownRefresh())
  },

  /**
   * 加载提醒（智能或手动）
   */
  loadReminders(callback) {
    if (this.data.loading) return
    this.setData({ loading: true })

    if (this.data.useSmartReminders) {
      this._loadSmartReminders(callback)
    } else {
      this._loadManualReminders(callback)
    }
  },

  /**
   * 加载智能提醒（先 generate，再 list）
   */
  _loadSmartReminders(callback) {
    const { fromGarden, gardenId, statusFilter } = this.data

    // 生成提醒（忽略失败）
    generateSmartReminders().catch(() => {})
      .finally(() => {
        // 拉取全量（全园模式下不加 garden_id，以便构建菜地 tabs）
        const params = {}
        if (statusFilter !== 'all') params.status = statusFilter

        getSmartReminderList(params)
          .then(res => {
            const raw = (res || []).map(item => ({
              id: item.id,
              task_type: item.reminder_type,
              title: item.title,
              description: item.description,
              remind_time: this._formatTime(item.remind_time),
              status: item.status,
              priority: item.priority,
              source: item.source,
              metadata: item.extra_data,
              garden_id: item.garden_id || null,
              garden_name: item.garden_name || '未关联菜地'
            }))

            if (fromGarden) {
              // 单园模式：直接过滤
              const filtered = raw.filter(r => r.garden_id === gardenId)
              this.setData({
                allReminders: raw,
                reminders: filtered,
                loading: false,
                statistics: this._calcStats(filtered)
              })
            } else {
              // 全园模式：构建菜地 tabs + 默认展示全部
              const tabs = this._buildGardenTabs(raw)
              const selectedGardenId = this.data.selectedGardenId
              const filtered = selectedGardenId
                ? raw.filter(r => r.garden_id === selectedGardenId)
                : raw
              this.setData({
                allReminders: raw,
                gardenTabs: tabs,
                reminders: filtered,
                loading: false,
                statistics: this._calcStats(filtered)
              })
            }

            callback && callback()
          })
          .catch(err => {
            console.error('加载提醒列表失败:', err)
            this.setData({ loading: false })
            callback && callback()
          })
      })
  },

  /**
   * 加载手动提醒（旧版）
   */
  _loadManualReminders(callback) {
    const params = {}
    if (this.data.statusFilter !== 'all') params.status = this.data.statusFilter
    if (this.data.gardenId) params.garden_id = this.data.gardenId

    getReminderList(params)
      .then(res => {
        const reminders = res.items || []
        this.setData({
          reminders,
          allReminders: reminders,
          loading: false,
          statistics: this._calcStats(reminders)
        })
        callback && callback()
      })
      .catch(err => {
        console.error('加载提醒失败:', err)
        this.setData({ loading: false })
        callback && callback()
      })
  },

  /**
   * 从提醒列表构建菜地 Tabs
   */
  _buildGardenTabs(reminders) {
    const map = {}
    reminders.forEach(r => {
      const gid = r.garden_id || 0
      const gname = r.garden_name || '未关联菜地'
      if (!map[gid]) map[gid] = { id: gid, name: gname, total: 0, pending: 0 }
      map[gid].total++
      if (r.status === 'pending') map[gid].pending++
    })
    return Object.values(map).sort((a, b) => b.pending - a.pending)
  },

  /**
   * 计算统计数据
   */
  _calcStats(list) {
    return {
      total: list.length,
      pending: list.filter(r => r.status === 'pending').length,
      completed: list.filter(r => r.status === 'completed').length
    }
  },

  /**
   * 格式化时间
   */
  _formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    if (date.getDate() === now.getDate()) {
      return `今天 ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    }
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      return `昨天 ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    }
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${m}-${d} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
  },

  /**
   * 切换菜地 Tab（全园模式）
   */
  onGardenTabChange(e) {
    const gid = e.currentTarget.dataset.id // null 或 number
    const selectedGardenId = gid === null ? null : parseInt(gid)
    const filtered = selectedGardenId
      ? this.data.allReminders.filter(r => r.garden_id === selectedGardenId)
      : this.data.allReminders
    this.setData({
      selectedGardenId,
      reminders: filtered,
      statistics: this._calcStats(filtered)
    })
  },

  /**
   * 切换状态筛选
   */
  onFilterChange(e) {
    this.setData({ statusFilter: e.currentTarget.dataset.status })
    this.loadReminders()
  },

  /**
   * 切换智能提醒
   */
  toggleSmartReminders(e) {
    const useSmartReminders = e.detail.value
    this.setData({ useSmartReminders })
    wx.setStorageSync('useSmartReminders', useSmartReminders)
    wx.showToast({ title: useSmartReminders ? '已启用智能提醒' : '已关闭智能提醒', icon: 'success' })
    this.loadReminders()
  },

  /**
   * 完成提醒
   */
  handleComplete(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认完成',
      content: '确认已完成此任务？',
      success: (res) => {
        if (!res.confirm) return
        const fn = this.data.useSmartReminders ? completeSmartReminder : completeReminder
        fn(parseInt(id))
          .then(() => {
            wx.showToast({ title: '已完成', icon: 'success' })
            this.loadReminders()
          })
          .catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
      }
    })
  },

  /**
   * 忽略/删除提醒
   */
  handleIgnore(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: this.data.useSmartReminders ? '确认忽略' : '确认删除',
      content: this.data.useSmartReminders ? '确认忽略此提醒？' : '确认删除此提醒？',
      confirmColor: '#F44336',
      success: (res) => {
        if (!res.confirm) return
        const fn = this.data.useSmartReminders ? ignoreSmartReminder : deleteReminder
        fn(parseInt(id))
          .then(() => {
            wx.showToast({ title: this.data.useSmartReminders ? '已忽略' : '已删除', icon: 'success' })
            this.loadReminders()
          })
          .catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
      }
    })
  },

  /**
   * 添加提醒（传当前菜地 ID）
   */
  addReminder() {
    const { gardenId, selectedGardenId } = this.data
    const targetGardenId = gardenId || selectedGardenId || ''
    const url = targetGardenId
      ? `/pages/add-reminder/add-reminder?gardenId=${targetGardenId}`
      : '/pages/add-reminder/add-reminder'
    wx.navigateTo({ url })
  },

  onShareAppMessage() {
    return {
      title: '智能任务提醒 - 科学管理菜地',
      path: '/pages/reminders/reminders'
    }
  }
})
