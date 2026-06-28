const api = require('../../../utils/api')

const MOOD_MAP = {
  happy: { emoji: '😊', label: '开心' },
  normal: { emoji: '😐', label: '一般' },
  uncomfortable: { emoji: '😣', label: '不适' },
  tired: { emoji: '😴', label: '疲惫' },
  excited: { emoji: '🤩', label: '期待' },
  annoyed: { emoji: '😤', label: '烦躁' },
}

function formatEventTime(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

Page({
  data: {
    list: [],
    loading: true,
  },

  onShow() {
    this.loadList()
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh())
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await api.getBraceDiaryList()
      const data = (res && res.data) || res || []
      const list = (Array.isArray(data) ? data : data.list || []).map(item => {
        const mood = MOOD_MAP[item.mood] || { emoji: '😐', label: item.mood }
        return {
          ...item,
          moodEmoji: mood.emoji,
          moodLabel: mood.label,
          timeText: formatEventTime(item.eventTime),
          contentPreview: (item.content || '').slice(0, 60),
        }
      })
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('loadList failed:', err)
      this.setData({ list: [], loading: false })
    }
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/sheep-circle/brace-diary/edit' })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/sheep-circle/brace-diary/detail?id=${id}` })
  },
})
