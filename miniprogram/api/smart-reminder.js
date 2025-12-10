/**
 * 智能提醒API
 */
const { request } = require('../utils/request.js')

/**
 * 生成智能提醒
 */
function generateSmartReminders() {
  return request({
    url: '/smart-reminders/generate',
    method: 'GET'
  })
}

/**
 * 获取智能提醒列表
 */
function getSmartReminderList(params = {}) {
  return request({
    url: '/smart-reminders/list',
    method: 'GET',
    data: params
  })
}

/**
 * 完成提醒
 */
function completeSmartReminder(reminderId) {
  return request({
    url: '/smart-reminders/complete',
    method: 'POST',
    data: {
      reminder_id: reminderId
    }
  })
}

/**
 * 忽略提醒
 */
function ignoreSmartReminder(reminderId) {
  return request({
    url: `/smart-reminders/ignore/${reminderId}`,
    method: 'POST'
  })
}

/**
 * 获取物联网状态
 */
function getIoTStatus(gardenId) {
  return request({
    url: `/smart-reminders/iot/status/${gardenId}`,
    method: 'GET'
  })
}

/**
 * 获取物联网历史数据
 */
function getIoTHistory(gardenId, hours = 24) {
  return request({
    url: `/smart-reminders/iot/history/${gardenId}`,
    method: 'GET',
    data: { hours }
  })
}

/**
 * 模拟物联网数据
 */
function simulateIoTData(gardenId) {
  return request({
    url: `/smart-reminders/iot/simulate/${gardenId}`,
    method: 'POST'
  })
}

/**
 * 获取提醒统计
 */
function getReminderStatistics() {
  return request({
    url: '/smart-reminders/statistics',
    method: 'GET'
  })
}

module.exports = {
  generateSmartReminders,
  getSmartReminderList,
  completeSmartReminder,
  ignoreSmartReminder,
  getIoTStatus,
  getIoTHistory,
  simulateIoTData,
  getReminderStatistics
}
