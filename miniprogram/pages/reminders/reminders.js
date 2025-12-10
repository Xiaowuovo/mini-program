// pages/reminders/reminders.js
const { getReminderList, completeReminder, deleteReminder } = require('../../api/reminder.js')
const {
  getSmartReminderList,
  generateSmartReminders,
  completeSmartReminder,
  ignoreSmartReminder,
  getReminderStatistics
} = require('../../api/smart-reminder.js')

Page({
  data: {
    reminders: [],
    statusFilter: 'all', // all, pending, completed
    loading: false,
    useSmartReminders: true, // 使用智能提醒系统
    statistics: {
      total: 0,
      pending: 0,
      completed: 0
    }
  },

  onLoad() {
    // 检查是否使用智能提醒
    const useSmartReminders = wx.getStorageSync('useSmartReminders')
    if (useSmartReminders !== undefined) {
      this.setData({ useSmartReminders })
    }

    this.loadStatistics()
    this.loadReminders()
  },

  onShow() {
    // 每次显示页面时刷新
    this.loadStatistics()
    this.loadReminders()
  },

  onPullDownRefresh() {
    this.loadStatistics()
    this.loadReminders(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 切换智能提醒系统
   */
  toggleSmartReminders(e) {
    const useSmartReminders = e.detail.value
    this.setData({ useSmartReminders })
    wx.setStorageSync('useSmartReminders', useSmartReminders)

    wx.showToast({
      title: useSmartReminders ? '已启用智能提醒' : '已关闭智能提醒',
      icon: 'success'
    })

    // 重新加载数据
    this.loadStatistics()
    this.loadReminders()
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    if (!this.data.useSmartReminders) {
      // 手动统计
      const { reminders } = this.data
      this.setData({
        statistics: {
          total: reminders.length,
          pending: reminders.filter(r => r.status === 'pending').length,
          completed: reminders.filter(r => r.status === 'completed').length
        }
      })
      return
    }

    getReminderStatistics()
      .then(res => {
        this.setData({
          statistics: res
        })
      })
      .catch(err => {
        console.error('加载统计失败:', err)
      })
  },

  /**
   * 加载提醒列表
   */
  loadReminders(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    // 使用智能提醒系统
    if (this.data.useSmartReminders) {
      this.loadSmartReminders(callback)
      return
    }

    // 使用旧版提醒API
    const params = {}
    if (this.data.statusFilter !== 'all') {
      params.status = this.data.statusFilter
    }

    getReminderList(params)
      .then(res => {
        this.setData({
          reminders: res.items || [],
          loading: false
        })
        this.loadStatistics()
        callback && callback()
      })
      .catch(err => {
        console.error('加载提醒失败:', err)
        this.setData({ loading: false })

        // 使用模拟数据
        this.setData({
          reminders: this.getMockReminders()
        })
        this.loadStatistics()
        callback && callback()
      })
  },

  /**
   * 加载智能提醒
   */
  loadSmartReminders(callback) {
    // 1. 先生成智能提醒
    generateSmartReminders()
      .then(() => {
        // 2. 获取提醒列表
        const params = {}
        if (this.data.statusFilter !== 'all') {
          params.status = this.data.statusFilter
        }

        return getSmartReminderList(params)
      })
      .then(res => {
        // 3. 格式化数据
        const reminders = (res || []).map(item => ({
          id: item.id,
          task_type: item.reminder_type,
          title: item.title,
          description: item.description,
          remind_time: this.formatTime(item.remind_time),
          status: item.status,
          priority: item.priority,
          source: item.source,
          metadata: item.metadata,
          garden_name: item.garden_name || '我的菜地'
        }))

        this.setData({
          reminders: reminders,
          loading: false
        })

        this.loadStatistics()
        callback && callback()
      })
      .catch(err => {
        console.error('加载智能提醒失败:', err)
        this.setData({ loading: false })

        // 使用模拟数据
        this.setData({
          reminders: this.getMockSmartReminders()
        })
        this.loadStatistics()
        callback && callback()
      })
  },

  /**
   * 格式化时间
   */
  formatTime(time) {
    if (!time) return ''

    const date = new Date(time)
    const now = new Date()
    const diff = now - date

    // 今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `今天 ${hours}:${minutes}`
    }

    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `昨天 ${hours}:${minutes}`
    }

    // 其他日期
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  },

  /**
   * 获取模拟提醒数据
   */
  getMockReminders() {
    return [
      {
        id: 1,
        task_type: 'watering',
        title: '浇水提醒',
        description: '请给菜地浇水，保持土壤湿润',
        remind_time: '今天 10:00',
        status: 'pending',
        garden_name: '阳光菜地A-01'
      },
      {
        id: 2,
        task_type: 'fertilizing',
        title: '施肥提醒',
        description: '建议施有机肥，促进作物生长',
        remind_time: '今天 15:00',
        status: 'pending',
        garden_name: '阳光菜地A-01'
      }
    ]
  },

  /**
   * 获取模拟智能提醒数据
   */
  getMockSmartReminders() {
    return [
      {
        id: 1,
        task_type: 'watering',
        title: '该给番茄浇水了',
        description: '当前处于结果期，需要充足水分',
        remind_time: '今天 10:00',
        status: 'pending',
        priority: 4,
        source: 'rule_based',
        garden_name: '阳光菜地A-01',
        metadata: {
          crop_name: '番茄',
          growth_stage: 'fruiting',
          watering_amount: 2.5,
          frequency: 2
        }
      },
      {
        id: 2,
        task_type: 'environment_alert',
        title: '温度异常警告',
        description: '菜地温度过低，注意保温',
        remind_time: '今天 09:30',
        status: 'pending',
        priority: 5,
        source: 'iot_triggered',
        garden_name: '阳光菜地A-01',
        metadata: {
          sensor_type: 'temperature',
          value: 12.5,
          unit: '°C',
          abnormal_reason: '温度过低，低于15°C'
        }
      },
      {
        id: 3,
        task_type: 'fertilizing',
        title: '该给番茄施肥了',
        description: '建议使用有机复合肥',
        remind_time: '今天 15:00',
        status: 'pending',
        priority: 3,
        source: 'rule_based',
        garden_name: '阳光菜地A-01',
        metadata: {
          crop_name: '番茄',
          growth_stage: 'fruiting',
          fertilizer_type: '有机复合肥',
          frequency: 7
        }
      }
    ]
  },

  /**
   * 切换筛选状态
   */
  onFilterChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      statusFilter: status
    })
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
        if (res.confirm) {
          this.completeTask(id)
        }
      }
    })
  },

  /**
   * 完成任务
   */
  completeTask(id) {
    const completeFunc = this.data.useSmartReminders ? completeSmartReminder : completeReminder

    completeFunc(id)
      .then(() => {
        wx.showToast({
          title: '已完成',
          icon: 'success'
        })

        // 刷新列表
        this.loadStatistics()
        this.loadReminders()
      })
      .catch(err => {
        console.error('完成任务失败:', err)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
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
        if (res.confirm) {
          this.ignoreTask(id)
        }
      }
    })
  },

  /**
   * 忽略/删除任务
   */
  ignoreTask(id) {
    const ignoreFunc = this.data.useSmartReminders ? ignoreSmartReminder : deleteReminder

    ignoreFunc(id)
      .then(() => {
        wx.showToast({
          title: this.data.useSmartReminders ? '已忽略' : '已删除',
          icon: 'success'
        })

        // 刷新列表
        this.loadStatistics()
        this.loadReminders()
      })
      .catch(err => {
        console.error('操作失败:', err)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      })
  },

  /**
   * 添加提醒
   */
  addReminder() {
    wx.navigateTo({
      url: '/pages/add-reminder/add-reminder',
      fail: (err) => {
        console.error('页面跳转失败:', err)
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '智能任务提醒 - 科学管理菜地',
      path: '/pages/reminders/reminders',
      imageUrl: '/images/share-reminder.jpg'
    }
  }
})
