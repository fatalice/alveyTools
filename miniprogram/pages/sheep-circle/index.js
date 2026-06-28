const TOKEN_KEY = 'alvey_logged_in'

function isLoggedIn() {
  return !!wx.getStorageSync(TOKEN_KEY)
}

Page({
  data: {
    features: [
      { name: '留言板', emoji: '📝', desc: '便签墙留言互动', type: 'message', color: 'green' },
      { name: '每日签到', emoji: '✅', desc: '打卡赢积分', type: 'checkin', color: 'blue' },
      { name: '积分兑换', emoji: '🎁', desc: '兑换超值奖品', type: 'exchange', color: 'orange' },
      { name: '牙套日记', emoji: '🦷', desc: '记录正畸每一天', type: 'brace-diary', color: 'blue' },
      { name: '排行榜', emoji: '🏆', desc: '成就与荣耀', type: 'rank', color: 'pink' },
      { name: '社区公告', emoji: '📢', desc: '最新消息', type: 'notice', color: 'purple' },
      { name: '虚拟点菜', emoji: '🍜', desc: '今天吃什么', type: 'menu', color: 'green' },
    ],
  },

  onFeatureTap(e) {
    const { type, name } = e.currentTarget.dataset.item

    if (type === 'message') {
      if (!isLoggedIn()) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      wx.navigateTo({ url: '/pages/sheep-circle/message-board/index' })
      return
    }

    if (type === 'exchange') {
      if (!isLoggedIn()) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      wx.navigateTo({ url: '/pages/sheep-circle/exchange/index' })
      return
    }

    if (type === 'checkin') {
      if (!isLoggedIn()) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      this.doCheckin()
      return
    }

    if (type === 'notice') {
      wx.navigateTo({ url: '/pages/sheep-circle/notices/index' })
      return
    }

    if (type === 'brace-diary') {
      if (!isLoggedIn()) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      wx.navigateTo({ url: '/pages/sheep-circle/brace-diary/index' })
      return
    }

    wx.showToast({ title: `${name}开发中`, icon: 'none' })
  },

  async doCheckin() {
    try {
      const api = require('../../utils/api')
      const res = await api.scoreCheckin()
      const data = res.data || res
      if (data.alreadyChecked) {
        wx.showToast({ title: '今天已签到', icon: 'none' })
      } else {
        wx.showToast({ title: '签到成功 +1', icon: 'success' })
      }
    } catch (err) {
      wx.showToast({ title: '签到失败', icon: 'none' })
    }
  },
})
