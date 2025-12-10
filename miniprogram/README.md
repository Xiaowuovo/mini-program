# 共享菜园"云端小筑"小程序

## 项目结构

```
miniprogram/
├── pages/                  # 页面
│   ├── index/             # 首页
│   ├── login/             # 登录页
│   ├── gardens/           # 菜地列表
│   ├── garden-detail/     # 菜地详情
│   ├── orders/            # 订单列表
│   ├── order-detail/      # 订单详情
│   ├── community/         # 社区
│   ├── post-detail/       # 帖子详情
│   ├── publish-post/      # 发布帖子
│   ├── services/          # 增值服务
│   ├── reminders/         # 任务提醒
│   └── profile/           # 个人中心
├── components/            # 组件
├── api/                   # API接口
│   ├── auth.js           # 认证接口
│   ├── garden.js         # 菜地接口
│   ├── order.js          # 订单接口
│   └── user.js           # 用户接口
├── utils/                 # 工具函数
│   ├── request.js        # HTTP请求封装
│   └── util.js           # 通用工具函数
├── images/                # 图片资源
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
└── app.wxss               # 全局样式

```

## 已完成功能

### ✅ 基础框架
- [x] 项目结构搭建
- [x] HTTP请求封装
- [x] 工具函数库
- [x] 全局样式
- [x] API接口模块

### ✅ 登录功能
- [x] 微信一键登录
- [x] Token管理
- [x] 登录状态检查

### ✅ 首页
- [x] 轮播图展示
- [x] 功能入口
- [x] 热门菜地
- [x] 社区动态

## 待完成功能

### ⏳ 菜地模块
- [ ] 菜地列表页面
- [ ] 菜地详情页面
- [ ] 菜地筛选功能

### ⏳ 订单模块
- [ ] 订单列表页面
- [ ] 订单详情页面
- [ ] 创建订单流程
- [ ] 支付功能

### ⏳ 社区模块
- [ ] 社区首页
- [ ] 帖子详情
- [ ] 发布帖子
- [ ] 点赞评论功能

### ⏳ 其他模块
- [ ] 增值服务页面
- [ ] 任务提醒页面
- [ ] 个人中心页面

## 开发指南

### 1. 配置后端API地址

在 `app.js` 中修改 `apiBase`：

```javascript
globalData: {
  apiBase: 'http://localhost:8000/api',  // 开发环境
  // apiBase: 'https://your-domain.com/api'  // 生产环境
}
```

### 2. 配置小程序AppID

1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram` 目录
3. 填写你的AppID（测试号或正式AppID）

### 3. 配置后端微信配置

在后端 `.env` 文件中配置：

```env
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret
```

### 4. 运行项目

1. 启动后端服务
2. 打开微信开发者工具
3. 编译运行

## API接口使用

### 认证接口

```javascript
const { wechatLogin } = require('../../api/auth.js')

// 微信登录
wechatLogin(code).then(res => {
  console.log(res.access_token)
  console.log(res.user)
})
```

### 菜地接口

```javascript
const { getGardenList, getGardenDetail } = require('../../api/garden.js')

// 获取菜地列表
getGardenList({ status: 'available', limit: 10 }).then(res => {
  console.log(res.items)
})

// 获取菜地详情
getGardenDetail(1).then(res => {
  console.log(res)
})
```

### 订单接口

```javascript
const { getOrderList, createOrder, payOrder } = require('../../api/order.js')

// 获取订单列表
getOrderList().then(res => {
  console.log(res.items)
})

// 创建订单
createOrder({
  garden_id: 1,
  start_date: '2024-12-01',
  end_date: '2025-02-28'
}).then(res => {
  console.log(res)
})

// 支付订单
payOrder(1).then(res => {
  console.log(res)
})
```

## 工具函数使用

### 时间格式化

```javascript
const { formatTime, formatDate, timeAgo } = require('../../utils/util.js')

formatTime(new Date())  // 2024-12-03 15:30:00
formatDate(new Date())  // 2024-12-03
timeAgo('2024-12-01')   // 2天前
```

### 提示框

```javascript
const { showSuccess, showError, showConfirm } = require('../../utils/util.js')

showSuccess('操作成功')
showError('操作失败')

showConfirm('确定要删除吗？').then(confirmed => {
  if (confirmed) {
    // 用户点击确定
  }
})
```

### 价格格式化

```javascript
const { formatPrice } = require('../../utils/util.js')

formatPrice(150)  // ¥150.00
```

## 页面开发规范

### 1. 页面结构

每个页面包含4个文件：
- `.wxml` - 页面结构
- `.wxss` - 页面样式
- `.js` - 页面逻辑
- `.json` - 页面配置

### 2. 页面生命周期

```javascript
Page({
  data: {
    // 页面数据
  },

  onLoad(options) {
    // 页面加载
  },

  onShow() {
    // 页面显示
  },

  onReady() {
    // 页面初次渲染完成
  },

  onPullDownRefresh() {
    // 下拉刷新
  },

  onReachBottom() {
    // 上拉加载更多
  }
})
```

### 3. 样式规范

- 使用 `rpx` 单位（750rpx = 屏幕宽度）
- 复用 `app.wxss` 中的通用样式
- 遵循命名规范：kebab-case

### 4. 数据请求

```javascript
const { showLoading, hideLoading } = require('../../utils/util.js')
const { getGardenList } = require('../../api/garden.js')

Page({
  loadData() {
    showLoading('加载中...')

    getGardenList().then(res => {
      hideLoading()
      this.setData({
        list: res.items
      })
    }).catch(err => {
      hideLoading()
      console.error(err)
    })
  }
})
```

## 注意事项

1. **请求域名配置**：在小程序后台配置服务器域名白名单
2. **HTTPS要求**：生产环境必须使用HTTPS
3. **登录流程**：使用微信登录，不支持其他登录方式
4. **Token存储**：Token存储在本地，定期检查有效性
5. **错误处理**：所有网络请求都要做错误处理

## 调试技巧

1. **查看网络请求**：开发者工具 - Network标签
2. **查看Storage**：开发者工具 - Storage标签
3. **真机调试**：使用真机调试功能测试
4. **Console输出**：使用 `console.log` 调试

## 下一步开发计划

1. **完成菜地模块**：菜地列表、详情、筛选
2. **完成订单模块**：订单创建、支付、管理
3. **完成社区模块**：帖子发布、点赞、评论
4. **完成个人中心**：用户信息、设置
5. **完成增值服务**：服务预约、工单管理
6. **完成任务提醒**：提醒列表、标记完成
7. **视频监控功能**：集成腾讯云TRTC
8. **测试与优化**：功能测试、性能优化

## 许可证

本项目仅用于学习和毕业设计，未经授权不得用于商业用途。
