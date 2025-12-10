/**
 * 任务提醒相关API
 */
const { request } = require('../utils/request.js')

/**
 * 获取提醒列表
 */
function getReminderList(params = {}) {
  return request({
    url: '/reminders',
    method: 'GET',
    data: params
  })
}

/**
 * 获取提醒详情
 */
function getReminderDetail(id) {
  return request({
    url: `/reminders/${id}`,
    method: 'GET'
  })
}

/**
 * 创建提醒
 */
function createReminder(data) {
  return request({
    url: '/reminders',
    method: 'POST',
    data
  })
}

/**
 * 标记完成
 */
function completeReminder(id) {
  return request({
    url: `/reminders/${id}/complete`,
    method: 'PUT'
  })
}

/**
 * 删除提醒
 */
function deleteReminder(id) {
  return request({
    url: `/reminders/${id}`,
    method: 'DELETE'
  })
}

module.exports = {
  getReminderList,
  getReminderDetail,
  createReminder,
  completeReminder,
  deleteReminder
}