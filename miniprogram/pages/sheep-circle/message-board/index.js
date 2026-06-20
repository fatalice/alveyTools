const api = require('../../../utils/api')

const USERID_KEY = 'alvey_user_id'
const TOKEN_KEY = 'alvey_logged_in'

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}/${day}`
}

Page({
  data: {
    messages: [],
    postVisible: false,
    postContent: '',
    postColor: 'yellow',
    submitting: false,
    colorOptions: ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'],
  },

  onShow() {
    this.loadMessages()
  },

  async loadMessages() {
    try {
      const res = await api.getMessages()
      const list = ((res && res.data) || []).map(item => ({
        ...item,
        timeText: formatTime(item.createdAt),
      }))
      this.setData({ messages: list.length ? list : this.getMockMessages() })
    } catch (err) {
      console.error('loadMessages failed:', err)
      this.setData({ messages: this.getMockMessages() })
    }
  },

  getMockMessages() {
    const colors = this.data.colorOptions
    return [
      { _id: '1', content: '欢迎来到开心羊圈！🐑', nickname: '小羊', avatar: '', color: 'green', createdAt: Date.now() - 3600000, timeText: '1小时前' },
      { _id: '2', content: '今天天气真好，适合出去走走~', nickname: '阳光', avatar: '', color: 'yellow', createdAt: Date.now() - 7200000, timeText: '2小时前' },
      { _id: '3', content: '这个留言板好可爱啊！便签墙的感觉', nickname: '路人甲', avatar: '', color: 'blue', createdAt: Date.now() - 86400000, timeText: '1天前' },
      { _id: '4', content: '大家好，我是新来的，请多多关照', nickname: '新人', avatar: '', color: 'pink', createdAt: Date.now() - 172800000, timeText: '2天前' },
    ]
  },

  onShowPost() {
    if (!wx.getStorageSync(TOKEN_KEY)) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.setData({ postVisible: true, postContent: '', postColor: 'yellow' })
  },

  onCancelPost() {
    this.setData({ postVisible: false })
  },

  onPostInput(e) {
    this.setData({ postContent: e.detail.value })
  },

  onPickColor(e) {
    this.setData({ postColor: e.currentTarget.dataset.color })
  },

  async onSubmitPost() {
    const { postContent, postColor, submitting } = this.data
    if (submitting) return
    if (!postContent.trim()) {
      wx.showToast({ title: '请写点什么吧', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const userId = wx.getStorageSync(USERID_KEY)
      const res = await api.postMessage({
        userId,
        content: postContent.trim(),
        color: postColor,
      })
      const data = res.data || res
      const msg = data.scoreAdded ? '发布成功 +1积分' : '发布成功'
      wx.showToast({ title: msg, icon: 'success' })
      this.setData({ postVisible: false })
      this.loadMessages()
    } catch (err) {
      console.error('post message failed:', err)
      // 本地模拟添加
      const { messages } = this.data
      const userId = wx.getStorageSync(USERID_KEY)
      messages.unshift({
        _id: 'local_' + Date.now(),
        content: postContent.trim(),
        color: postColor,
        nickname: '我',
        avatar: '',
        createdAt: Date.now(),
        timeText: '刚刚',
      })
      this.setData({ messages, postVisible: false })
      wx.showToast({ title: '已发布（本地）', icon: 'success' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
