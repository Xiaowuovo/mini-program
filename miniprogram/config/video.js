// miniprogram/config/video.js

// 统一的HLS视频流
const UNIFIED_HLS_URL = 'https://sf1-hscdn-tos.pstatp.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8'

// 统一的快照URL
const UNIFIED_VIDEO_URL = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800'

module.exports = {
  // 获取视频配置
  getVideoConfig: function(gardenId) {
    return {
      snapshotUrl: UNIFIED_VIDEO_URL,    // 快照模式URL
      liveUrl: UNIFIED_HLS_URL,          // 实时模式URL (HLS/m3u8)
      rtmpUrl: UNIFIED_HLS_URL,          // RTMP流URL
      available: true,                    // 是否可用
      monitors: [
        {
          id: 1,
          name: '菜地全景',
          position: '北侧',
          type: 'panorama',
          status: 'online',
          snapshotUrl: UNIFIED_VIDEO_URL,
          liveUrl: UNIFIED_HLS_URL
        },
        {
          id: 2,
          name: '作物特写',
          position: '中央',
          type: 'closeup',
          status: 'online',
          snapshotUrl: UNIFIED_VIDEO_URL,
          liveUrl: UNIFIED_HLS_URL
        }
      ]
    }
  },

  // 检查视频可用性
  isVideoAvailable: function(gardenId) {
    return true  // 目前所有菜地都可用
  },

  // 获取指定类型的视频URL
  getVideoUrl: function(gardenId, type) {
    // type: 'snapshot' | 'live' | 'rtmp'
    if (type === 'snapshot') return UNIFIED_VIDEO_URL
    if (type === 'live') return UNIFIED_HLS_URL
    if (type === 'rtmp') return UNIFIED_HLS_URL
    return UNIFIED_HLS_URL
  }
}
