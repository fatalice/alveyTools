// pages/example/index.js
const api = require('../../utils/api')

Page({
  data: {
    type: '',
    showTip: false,
    title: '',
    content: '',

    // getUserInfo
    haveGetOpenId: false,
    openId: '',
    appid: '',
    getUserInfoCode: '',

    // cloudbaserun
    haveGetCallContainerRes: false,
    callContainerResStr: '',
    callcbrCode: '',

    // home-cards
    haveGetRecord: false,
    cards: [],

    // uploadFile
    haveGetImgSrc: false,
    imgSrc: '',
    callUploadFileCode: '',
    callContainerUploadCode: '',

    // release
    showReleaseModal: false,
    releaseDesc: '',
    releaseTags: '',
    haveReleaseResult: false,
    releaseResultStr: '',

    // mj-create
    mjCreateName: '',
    mjCreateRule: 'sichuan',
    mjCreateBaseScore: '1',
    mjCreateMaxRounds: '8',
    haveMjCreateResult: false,
    mjCreateResultStr: '',

    // mj-join
    mjJoinRoomId: '',
    mjJoinName: '',
    haveMjJoinResult: false,
    mjJoinResultStr: '',

    // mj-game
    mjGameUserId: '',
    haveMjGameResult: false,
    mjGameResultStr: '',

    // AI config (保留原样)
    modelConfig: {
      modelProvider: 'deepseek',
      quickResponseModel: 'deepseek-v3',
      logo: 'https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/2339414f-2c0d-4537-9618-1812bd14f4af.svg',
      welcomeMsg: '我是deepseek-v3，很高兴见到你！',
    },

    ai_page_config: `{
  "usingComponents": {
    "agent-ui":"/components/agent-ui/index"
  },
}`,
    ai_wxml_config: `&lt;agent-ui agentConfig="{{agentConfig}}" showBotAvatar="{{showBotAvatar}}" chatMode="{{chatMode}}" modelConfig="{{modelConfig}}""&gt;&lt;/agent-ui&gt;`,
    ai_data_config: `data: {
  chatMode: "bot",
  showBotAvatar: true,
  agentConfig: {
    botId: "your agent id",
    allowWebSearch: true,
    allowUploadFile: true,
    allowPullRefresh: true,
    allowUploadImage: true,
    allowMultiConversation: true,
    showToolCallDetail: true,
    allowVoice: true,
    showBotName: true,
  },
  modelConfig: {
    modelProvider: "hunyuan-open",
    quickResponseModel: "hunyuan-lite",
    logo: "",
    welcomeMsg: "欢迎语",
  },
}`,
  },

  onLoad(options) {
    const type = options?.type || ''
    this.setData({ type })

    if (type === 'cloudbaserun') this.getCallcbrCode()
    if (type === 'getUserInfo') this.getUserInfoCode()
    if (type === 'uploadFile') this.getUploadFileCode()
  },

  // ---- 通用工具 ----
  handleError(err) {
    wx.hideLoading()
    if (err.code === 'ENV_NOT_FOUND') {
      this.setData({ showTip: true, title: '云开发环境未找到', content: '请检查 envId 配置是否正确' })
    } else if (err.code === 'SERVICE_NOT_FOUND') {
      this.setData({ showTip: true, title: '云托管服务未部署', content: '请确认 CloudRun 服务 fataliceenv 已部署并正常运行' })
    } else {
      this.setData({ showTip: true, title: '请求失败', content: err.message || '未知错误' })
    }
  },

  // ---- getUserInfo: callContainer 获取用户标识 ----
  async getOpenId() {
    wx.showLoading({ title: '' })
    try {
      const res = await api.getWxContext()
      this.setData({
        haveGetOpenId: true,
        openId: res.data?.openid || res.openid || '',
        appid: res.data?.appid || res.appid || '',
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearOpenId() {
    this.setData({ haveGetOpenId: false, openId: '', appid: '' })
  },

  getUserInfoCode() {
    this.setData({
      getUserInfoCode: `// callContainer 方式获取用户标识
// CloudRun 网关自动注入 X-WX-OPENID header
const c1 = new wx.cloud.Cloud({ resourceEnv: '${api.ENV_ID}' })
await c1.init()
const res = await c1.callContainer({
  path: '/api/getWxContext',
  header: { 'X-WX-SERVICE': '${api.SERVICE_NAME}' },
  method: 'GET',
})
// res.data.openid 即为当前用户的 openId`,
    })
  },

  // ---- cloudbaserun: callContainer 调用演示 ----
  async runCallContainer() {
    wx.showLoading({ title: '' })
    try {
      const res = await api.echo()
      this.setData({
        haveGetCallContainerRes: true,
        callContainerResStr: JSON.stringify(res, null, 2),
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearCallContainerRes() {
    this.setData({ haveGetCallContainerRes: false, callContainerResStr: '' })
  },

  getCallcbrCode() {
    this.setData({
      callcbrCode: `const c1 = new wx.cloud.Cloud({ resourceEnv: '${api.ENV_ID}' })
await c1.init()
const res = await c1.callContainer({
  path: '/echo',             // 业务路径
  header: {
    'X-WX-SERVICE': '${api.SERVICE_NAME}',  // 云托管服务名
  },
  method: 'GET',
})
console.log(res.data)`,
    })
  },

  // ---- home-cards: 首页卡片 ----
  async getCards() {
    wx.showLoading({ title: '' })
    try {
      const res = await api.getHomeCards()
      const cards = res.data || res || []
      this.setData({ haveGetRecord: true, cards })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearCards() {
    this.setData({ haveGetRecord: false, cards: [] })
  },

  // ---- uploadFile: 双路径文件上传 ----
  // 路径1: wx.cloud.uploadFile（客户端直传云存储）
  uploadImg() {
    wx.showLoading({ title: '' })
    wx.chooseMedia({
      count: 1,
      success: (chooseResult) => {
        wx.cloud
          .uploadFile({
            cloudPath: `my-photo-${new Date().getTime()}.png`,
            filePath: chooseResult.tempFiles[0].tempFilePath,
          })
          .then((res) => {
            this.setData({ haveGetImgSrc: true, imgSrc: res.fileID })
            wx.hideLoading()
          })
          .catch((e) => {
            console.log('e', e)
            wx.hideLoading()
          })
      },
      fail: () => { wx.hideLoading() },
    })
  },

  // 路径2: callContainer 上传（服务端处理）
  async uploadViaContainer() {
    wx.chooseMedia({
      count: 1,
      success: async (chooseResult) => {
        wx.showLoading({ title: '上传中...' })
        try {
          const filePath = chooseResult.tempFiles[0].tempFilePath
          const fs = wx.getFileSystemManager()
          const base64 = fs.readFileSync(filePath, 'base64')
          const filename = filePath.split('/').pop() || 'photo.png'
          const res = await api.uploadFile({ filename, data: base64 })
          const url = res.data?.url || res.url || ''
          this.setData({ haveGetImgSrc: true, imgSrc: url })
        } catch (err) {
          this.handleError(err)
        } finally {
          wx.hideLoading()
        }
      },
    })
  },

  clearImgSrc() {
    this.setData({ haveGetImgSrc: false, imgSrc: '' })
  },

  getUploadFileCode() {
    this.setData({
      callUploadFileCode: `// 方式1: 客户端直传云存储
wx.chooseMedia({ count: 1,
  success: (chooseResult) => {
    wx.cloud.uploadFile({
      cloudPath: 'my-photo.png',
      filePath: chooseResult.tempFiles[0].tempFilePath,
    })
  }
})`,
      callContainerUploadCode: `// 方式2: callContainer 服务端上传
const fs = wx.getFileSystemManager()
const base64 = fs.readFileSync(filePath, 'base64')
const res = await api.uploadFile({ filename, data: base64 })
// res.data.url 为临时访问链接`,
    })
  },

  // ---- release: 发布动态 ----
  onReleaseDescInput(e) { this.setData({ releaseDesc: e.detail.value }) },
  onReleaseTagsInput(e) { this.setData({ releaseTags: e.detail.value }) },
  showReleaseModal() { this.setData({ showReleaseModal: true }) },
  onReleaseCancel() { this.setData({ showReleaseModal: false }) },

  async onReleaseConfirm() {
    const { releaseDesc, releaseTags } = this.data
    if (!releaseDesc) {
      wx.showToast({ title: '请填写描述', icon: 'none' })
      return
    }
    wx.showLoading({ title: '发布中...' })
    try {
      const tags = releaseTags ? releaseTags.split(',').map(t => t.trim()) : []
      const res = await api.release({ desc: releaseDesc, tags })
      this.setData({
        showReleaseModal: false,
        haveReleaseResult: true,
        releaseResultStr: JSON.stringify(res, null, 2),
      })
      wx.showToast({ title: '发布成功' })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearReleaseResult() {
    this.setData({ haveReleaseResult: false, releaseResultStr: '' })
  },

  // ---- mj-create: 创建麻将房间 ----
  onMjCreateNameInput(e) { this.setData({ mjCreateName: e.detail.value }) },
  onMjCreateRuleInput(e) { this.setData({ mjCreateRule: e.detail.value }) },
  onMjCreateBaseScoreInput(e) { this.setData({ mjCreateBaseScore: e.detail.value }) },
  onMjCreateMaxRoundsInput(e) { this.setData({ mjCreateMaxRounds: e.detail.value }) },

  async mjCreate() {
    const name = this.data.mjCreateName
    if (!name) {
      wx.showToast({ title: '请输入玩家名称', icon: 'none' })
      return
    }
    wx.showLoading({ title: '创建房间...' })
    try {
      // 用 openId 作为 userId，如果没有则用临时值
      const userId = this.data.openId || 'demo_user_' + Date.now()
      const res = await api.mjCreateRoom({
        userId,
        name,
        rule: this.data.mjCreateRule || 'sichuan',
        baseScore: Number(this.data.mjCreateBaseScore) || 1,
        maxRounds: Number(this.data.mjCreateMaxRounds) || 8,
      })
      this.setData({
        haveMjCreateResult: true,
        mjCreateResultStr: JSON.stringify(res.data || res, null, 2),
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearMjCreateResult() {
    this.setData({ haveMjCreateResult: false, mjCreateResultStr: '' })
  },

  // ---- mj-join: 加入麻将房间 ----
  onMjJoinRoomIdInput(e) { this.setData({ mjJoinRoomId: e.detail.value }) },
  onMjJoinNameInput(e) { this.setData({ mjJoinName: e.detail.value }) },

  async mjJoin() {
    const { mjJoinRoomId, mjJoinName } = this.data
    if (!mjJoinRoomId || !mjJoinName) {
      wx.showToast({ title: '请填写房间号和名称', icon: 'none' })
      return
    }
    wx.showLoading({ title: '加入房间...' })
    try {
      const userId = this.data.openId || 'demo_user_' + Date.now()
      const res = await api.mjJoinRoom({
        userId,
        roomId: mjJoinRoomId,
        name: mjJoinName,
      })
      this.setData({
        haveMjJoinResult: true,
        mjJoinResultStr: JSON.stringify(res.data || res, null, 2),
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearMjJoinResult() {
    this.setData({ haveMjJoinResult: false, mjJoinResultStr: '' })
  },

  // ---- mj-game: 查询房间状态 ----
  onMjGameUserIdInput(e) { this.setData({ mjGameUserId: e.detail.value }) },

  async mjFindMyRoom() {
    wx.showLoading({ title: '' })
    try {
      const userId = this.data.mjGameUserId || this.data.openId || 'demo_user'
      const res = await api.mjFindMyRoom(userId)
      this.setData({
        haveMjGameResult: true,
        mjGameResultStr: JSON.stringify(res.data || res, null, 2),
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      wx.hideLoading()
    }
  },

  clearMjGameResult() {
    this.setData({ haveMjGameResult: false, mjGameResultStr: '' })
  },

  // ---- AI (保留原样) ----
  copyUrl() {
    wx.setClipboardData({
      data: 'https://gitee.com/TencentCloudBase/cloudbase-agent-ui/tree/main/apps/miniprogram-agent-ui/miniprogram/components/agent-ui',
      success: () => { wx.showToast({ title: '复制成功', icon: 'success' }) },
    })
  },

  copyPluginName() {
    wx.setClipboardData({
      data: '微信云开发 AI ToolKit',
      success: () => { wx.showToast({ title: '复制成功', icon: 'success' }) },
    })
  },

  copyPrompt(e) {
    const prompt = e.currentTarget.dataset.prompt
    wx.setClipboardData({
      data: prompt,
      success: () => { wx.showToast({ title: '复制成功', icon: 'success' }) },
    })
  },
})
