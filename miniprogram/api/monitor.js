// api/monitor.js - 视频监控相关接口
const { request } = require('../utils/request.js')

/**
 * 获取监控点列表
 * @param {number} gardenId - 菜地ID
 */
function getMonitorList(gardenId) {
  return request({
    url: `/monitors/garden/${gardenId}`,
    method: 'GET'
  })
}

/**
 * 获取监控点详情
 * @param {number} monitorId - 监控点ID
 */
function getMonitorDetail(monitorId) {
  return request({
    url: `/monitors/${monitorId}`,
    method: 'GET'
  })
}

/**
 * 获取实时流地址
 * @param {number} monitorId - 监控点ID
 * @param {string} protocol - 协议类型 (rtmp/hls/webrtc)
 */
function getMonitorStream(monitorId, protocol = 'webrtc') {
  return request({
    url: `/monitors/${monitorId}/stream`,
    method: 'GET',
    data: { protocol }
  })
}

/**
 * 获取快照历史
 * @param {number} monitorId - 监控点ID
 * @param {object} params - 查询参数
 */
function getSnapshotHistory(monitorId, params = {}) {
  return request({
    url: `/monitors/${monitorId}/snapshots`,
    method: 'GET',
    data: params
  })
}

/**
 * 拍摄快照
 * @param {number} monitorId - 监控点ID
 */
function captureSnapshot(monitorId) {
  return request({
    url: `/monitors/${monitorId}/capture`,
    method: 'POST'
  })
}

/**
 * 控制云台（如果设备支持）
 * @param {number} monitorId - 监控点ID
 * @param {object} command - 控制命令 {direction, speed}
 */
function controlPTZ(monitorId, command) {
  return request({
    url: `/monitors/${monitorId}/ptz`,
    method: 'POST',
    data: command
  })
}

module.exports = {
  getMonitorList,
  getMonitorDetail,
  getMonitorStream,
  getSnapshotHistory,
  captureSnapshot,
  controlPTZ
}
