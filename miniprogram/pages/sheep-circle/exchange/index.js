const api = require('../../../utils/api')

const USERID_KEY = 'alvey_user_id'

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
    totalScore: 0,
    records: [],
    prizes: [
      { id: 'ticket', name: '1000公里机票', emoji: '✈️', cost: 100 },
      { id: 'camera', name: '富士XT50套机', emoji: '📷', cost: 300 },
      { id: 'cash', name: '1000元现金', emoji: '💰', cost: 200 },
    ],
  },

  onShow() {
    this.fetchScore()
    this.fetchRecords()
  },

  async fetchScore() {
    try {
      const userId = wx.getStorageSync(USERID_KEY)
      const res = await api.getScoreInfo({ userId })
      const data = res.data || res
      this.setData({ totalScore: data.total || 0 })
    } catch (err) {
      console.error('fetchScore failed:', err)
    }
  },

  async fetchRecords() {
    try {
      const userId = wx.getStorageSync(USERID_KEY)
      const res = await api.request({ path: '/api/score/exchange/records', method: 'POST', data: { userId } })
      const data = res.data || res
      const records = (data.records || []).map(r => ({
        ...r,
        timeText: formatTime(r.createdAt),
      }))
      this.setData({ records })
    } catch (err) {
      console.error('fetchRecords failed:', err)
    }
  },

  onExchange(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '确认兑换',
      content: `确定花费 ${item.cost} 积分兑换「${item.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doExchange(item)
        }
      },
    })
  },

  async doExchange(item) {
    wx.showLoading({ title: '兑换中...', mask: true })
    try {
      const userId = wx.getStorageSync(USERID_KEY)
      const res = await api.request({
        path: '/api/score/exchange',
        method: 'POST',
        data: { userId, prizeId: item.id, prizeName: item.name, cost: item.cost },
      })
      wx.hideLoading()
      const data = res.data || res
      if (data.success === false) {
        wx.showToast({ title: data.reason || '兑换失败', icon: 'none' })
      } else {
        wx.showToast({ title: '兑换成功！', icon: 'success' })
        this.fetchScore()
        this.fetchRecords()
      }
    } catch (err) {
      wx.hideLoading()
      console.error('exchange failed:', err)
      wx.showToast({ title: '兑换失败', icon: 'none' })
    }
  },
})
