// pages/help/help.js
Page({
  data: {
    faqList: [
      {
        id: 1,
        question: '如何租用菜地？',
        answer: '在"菜地"页面浏览可用菜地，点击进入详情页，选择租期后提交订单即可。',
        expanded: false
      },
      {
        id: 2,
        question: '租金如何计算？',
        answer: '租金按月计算，您可以选择1、2、3、6、12个月的租期。租期越长，优惠越多。',
        expanded: false
      },
      {
        id: 3,
        question: '可以远程查看菜地吗？',
        answer: '可以！我们提供视频监控服务，您可以通过"视频监控"页面实时查看您的菜地。',
        expanded: false
      },
      {
        id: 4,
        question: '提供哪些增值服务？',
        answer: '我们提供托管服务、植保服务、采摘配送等多种增值服务，详见"增值服务"页面。',
        expanded: false
      },
      {
        id: 5,
        question: '如何设置任务提醒？',
        answer: '在"任务提醒"页面点击添加按钮，选择提醒类型、时间和关联菜地即可。',
        expanded: false
      },
      {
        id: 6,
        question: '订单可以取消吗？',
        answer: '开始日期前7天可以免费取消，7天内取消需要支付10%违约金。',
        expanded: false
      }
    ],
    feedbackTypes: ['功能建议', 'Bug反馈', '使用问题', '其他'],
    feedbackType: 0,
    feedbackContent: '',
    contact: ''
  },

  /**
   * 展开/折叠FAQ
   */
  toggleFaq(e) {
    const { id } = e.currentTarget.dataset
    const faqList = this.data.faqList.map(item => {
      if (item.id === id) {
        return { ...item, expanded: !item.expanded }
      }
      return item
    })
    this.setData({ faqList })
  },

  /**
   * 拨打客服电话
   */
  callService() {
    wx.showModal({
      title: '客服热线',
      content: '400-123-4567',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4001234567'
          })
        }
      }
    })
  },

  /**
   * 发送邮件
   */
  sendEmail() {
    wx.setClipboardData({
      data: 'support@example.com',
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 选择反馈类型
   */
  onTypeChange(e) {
    this.setData({
      feedbackType: parseInt(e.detail.value)
    })
  },

  /**
   * 输入反馈内容
   */
  onContentInput(e) {
    this.setData({
      feedbackContent: e.detail.value
    })
  },

  /**
   * 输入联系方式
   */
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    })
  },

  /**
   * 提交反馈
   */
  submitFeedback() {
    const { feedbackContent, feedbackType, feedbackTypes } = this.data

    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '提交中...' })

    // 模拟提交
    setTimeout(() => {
      wx.hideLoading()

      wx.showModal({
        title: '提交成功',
        content: '感谢您的反馈，我们会尽快处理！',
        showCancel: false,
        success: () => {
          this.setData({
            feedbackContent: '',
            contact: '',
            feedbackType: 0
          })
        }
      })
    }, 1000)
  },

  /**
   * 查看使用指南
   */
  viewGuide(e) {
    const { type } = e.currentTarget.dataset
    const guides = {
      rent: '1. 浏览菜地列表\n2. 选择心仪的菜地\n3. 查看详情信息\n4. 选择租期并提交订单\n5. 完成支付即可',
      service: '我们提供以下服务：\n• 托管服务：专业人员代为管理\n• 植保服务：病虫害防治\n• 采摘配送：成熟后送货上门',
      monitor: '1. 进入"视频监控"页面\n2. 选择要查看的监控点\n3. 切换快照/实时模式\n4. 可以保存快照到相册',
      community: '在社区可以：\n• 分享种植经验\n• 查看其他用户动态\n• 互相点赞评论\n• 学习种植技巧'
    }

    wx.showModal({
      title: '使用指南',
      content: guides[type] || '正在完善中...',
      showCancel: false
    })
  }
})
