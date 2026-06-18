// index.js
const api = require('../../utils/api')

Page({
  data: {
    showTip: false,
    powerList: [
      {
        title: '云托管 API',
        tip: 'CloudRun 容器后端 REST 接口',
        showItem: false,
        item: [
          { type: 'cloudbaserun', title: 'callContainer 调用演示' },
          { type: 'getUserInfo', title: '获取用户标识' },
        ],
      },
      {
        title: '麻将计分',
        tip: '多人房间、实时计分、自动结算',
        showItem: false,
        item: [
          { type: 'mj-create', title: '创建房间' },
          { type: 'mj-join', title: '加入房间' },
          { type: 'mj-game', title: '游戏与结算' },
        ],
      },
      {
        title: '内容发布',
        tip: '图片上传、发布动态、首页卡片',
        showItem: false,
        item: [
          { type: 'home-cards', title: '首页卡片' },
          { type: 'uploadFile', title: '文件上传' },
          { type: 'release', title: '发布动态' },
        ],
      },
      {
        title: 'AI 接入能力',
        tip: '云开发 AI 接入能力',
        showItem: false,
        item: [
          { type: 'model-guide', title: '大模型对话指引' },
        ],
      },
      {
        title: 'AI 智能开发小程序',
        tip: '连接 AI 开发工具与 MCP 开发小程序',
        type: 'ai-assistant',
        skipEnvCheck: true,
        showItem: false,
        item: [],
      },
    ],
    title: '',
    content: '',
  },

  onClickPowerInfo(e) {
    const index = e.currentTarget.dataset.index
    const powerList = this.data.powerList
    const selectedItem = powerList[index]

    if (selectedItem.link) {
      wx.navigateTo({
        url: `../web/index?url=${selectedItem.link}&title=${selectedItem.title}`,
      })
    } else if (selectedItem.type === 'ai-assistant') {
      selectedItem.showItem = !selectedItem.showItem
      this.setData({ powerList })
    } else if (selectedItem.type) {
      wx.navigateTo({
        url: `/pages/example/index?type=${selectedItem.type}`,
      })
    } else {
      selectedItem.showItem = !selectedItem.showItem
      this.setData({ powerList })
    }
  },

  jumpPage(e) {
    const { type, page } = e.currentTarget.dataset
    if (type) {
      wx.navigateTo({
        url: `/pages/example/index?type=${type}`,
      })
    } else if (page) {
      wx.navigateTo({
        url: `/pages/${page}/index`,
      })
    }
  },
})
