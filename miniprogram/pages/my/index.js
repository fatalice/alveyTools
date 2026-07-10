const api = require('../../utils/api')

const TOKEN_KEY = 'alvey_logged_in'

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
    editMode: false,

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
      const res = await api.genPersonalInfo()
      const info = res.data || res
      this.setData({ isLoggedIn: true, userInfo: info })
    } catch (err) {
      console.error('fetchProfile failed:', err)
    }
  },

  async fetchScore() {
    try {
      const res = await api.getScoreInfo()
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
      const res = await api.scoreCheckin()
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
    this.setData({ loginVisible: true, pendingAvatar: '', pendingNickname: '', editMode: false })
  },

  onEditProfile() {
    const { userInfo } = this.data
    this.setData({
      loginVisible: true,
      pendingAvatar: userInfo.image || userInfo.avatarUrl || '',
      pendingNickname: userInfo.name || '',
      editMode: true,
    })
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
      let avatarUrl = pendingAvatar
      try {
        const fs = wx.getFileSystemManager()
        const base64 = fs.readFileSync(pendingAvatar, 'base64')
        const uploadRes = await api.request({
          path: '/api/upload',
          method: 'POST',
          data: { filename: 'avatar.png', data: base64, scene: 'avatar' },
        })
        avatarUrl = (uploadRes.data && uploadRes.data.url) || avatarUrl
      } catch (e) {
        console.warn('avatar upload failed, using temp path', e)
      }

      const res = await api.savePersonalInfo({
        name: pendingNickname.trim(),
        avatarUrl: avatarUrl,
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
