const api = require('../../utils/api')

const { USERID_KEY, TOKEN_KEY, ensureUserId, isLoggedIn } = api

function formatTime(ts) {
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${h}:${m}`
}

Page({
  data: {
    isLoggedIn: false,
    userInfo: {},
    loginVisible: false,

    totalScore: 0,
    scoreRecords: [],
    learningDays: 0,
    showRecords: false,

    settingList: [
      { name: '消息通知', icon: 'notification', type: 'notification', badge: true },
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '关于作者', icon: 'info-circle', type: 'about' },
    ],
  },

  onShow() {
    if (isLoggedIn()) {
      this.fetchProfile()
      this.fetchScore()
    } else {
      this.setData({ isLoggedIn: false, userInfo: {}, totalScore: 0, scoreRecords: [] })
    }
  },

  async fetchProfile() {
    try {
      const userId = ensureUserId()
      const res = await api.genPersonalInfo(userId)
      const info = res.data || res
      this.setData({ isLoggedIn: true, userInfo: info })
    } catch (err) {
      console.error('fetchProfile failed:', err)
    }
  },

  async fetchScore() {
    try {
      const userId = ensureUserId()
      const res = await api.getScoreInfo({ userId })
      const data = res.data || res
      const records = (data.records || []).map(r => ({
        ...r,
        timeText: formatTime(r.createdAt),
      }))
      // 计算签到天数（去重日期）
      const days = new Set(records.filter(r => r.type === 'checkin').map(r => {
        const d = new Date(r.createdAt)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      }))
      this.setData({ totalScore: data.total || 0, scoreRecords: records, learningDays: days.size })
    } catch (err) {
      console.error('fetchScore failed:', err)
    }
  },

  onToggleRecords() {
    this.setData({ showRecords: !this.data.showRecords })
  },

  async onCheckin() {
    if (!isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      const userId = ensureUserId()
      const res = await api.scoreCheckin({ userId })
      const data = res.data || res
      if (data.alreadyChecked) {
        wx.showToast({ title: '今天已签到', icon: 'none' })
      } else {
        wx.showToast({ title: '签到成功 +1', icon: 'success' })
        this.fetchScore()
      }
    } catch (err) {
      console.error('checkin failed:', err)
      wx.showToast({ title: '签到失败', icon: 'none' })
    }
  },

  onLogin() {
    ensureUserId()
    this.setData({ loginVisible: true })
  },

  onLoginClose() {
    this.setData({ loginVisible: false })
  },

  // 登录弹层回调：组件内部完成上传与保存
  onLoginSuccess(e) {
    const detail = (e && e.detail) || {}
    this.setData({
      loginVisible: false,
      isLoggedIn: true,
      userInfo: detail.info || {},
    })
    this.fetchProfile()
    this.fetchScore()
  },

  onLogout() {
    wx.removeStorageSync(TOKEN_KEY)
    this.setData({ isLoggedIn: false, userInfo: {}, totalScore: 0, scoreRecords: [] })
    wx.showToast({ title: '已退出', icon: 'success' })
  },

  onSettingClick(e) {
    const { type, name } = e.currentTarget.dataset.item
    if (type === 'about') {
      wx.navigateTo({ url: '/pages/about-author/index' })
      return
    }
    if (type === 'service') {
      return
    }
    wx.showToast({ title: `${name}开发中`, icon: 'none' })
  },
})
