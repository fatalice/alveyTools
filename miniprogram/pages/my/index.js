const api = require('../../utils/api')

const USERID_KEY = 'alvey_user_id'
const TOKEN_KEY = 'alvey_logged_in'

function generateUserId() {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function ensureUserId() {
  let uid = wx.getStorageSync(USERID_KEY)
  if (!uid) {
    uid = generateUserId()
    wx.setStorageSync(USERID_KEY, uid)
  }
  return uid
}

function isLoggedIn() {
  return !!wx.getStorageSync(TOKEN_KEY)
}

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
    pendingAvatar: '',
    pendingNickname: '',
    submitting: false,

    totalScore: 0,
    scoreRecords: [],
    learningDays: 0,
    showRecords: false,

    settingList: [
      { name: '消息通知', icon: 'notification', type: 'notification', badge: true },
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '关于我们', icon: 'info-circle', type: 'about' },
      { name: '设置', icon: 'setting', type: 'setting' },
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
    this.setData({ loginVisible: true, pendingAvatar: '', pendingNickname: '' })
  },

  onLoginClose() {
    this.setData({ loginVisible: false })
  },

  onLoginPopupChange(e) {
    this.setData({ loginVisible: e.detail.visible })
  },

  onChooseAvatar(e) {
    this.setData({ pendingAvatar: e.detail.avatarUrl })
  },

  onNicknameInput(e) {
    this.setData({ pendingNickname: e.detail.value })
  },

  async onConfirmLogin() {
    const { pendingAvatar, pendingNickname, submitting } = this.data
    if (submitting) return
    if (!pendingAvatar) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }
    if (!pendingNickname || !pendingNickname.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      const userId = ensureUserId()

      let avatarUrl = pendingAvatar
      try {
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: `avatars/${userId}_${Date.now()}.png`,
          filePath: pendingAvatar,
        })
        avatarUrl = uploadRes.fileID
      } catch (e) {
        console.warn('avatar upload failed, using temp path', e)
      }

      const res = await api.savePersonalInfo({
        userId,
        name: pendingNickname.trim(),
        avatarFileID: avatarUrl,
      })

      wx.setStorageSync(TOKEN_KEY, true)
      const info = res.data || res
      wx.hideLoading()
      this.setData({
        loginVisible: false,
        isLoggedIn: true,
        userInfo: { ...info, image: avatarUrl, name: pendingNickname.trim() },
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      console.error('login failed:', err)
      wx.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  onLogout() {
    wx.removeStorageSync(TOKEN_KEY)
    this.setData({ isLoggedIn: false, userInfo: {}, totalScore: 0, scoreRecords: [] })
    wx.showToast({ title: '已退出', icon: 'success' })
  },

  onSettingClick(e) {
    const { type, name } = e.currentTarget.dataset.item
    if (type === 'service') {
      return
    }
    wx.showToast({ title: `${name}开发中`, icon: 'none' })
  },
})
