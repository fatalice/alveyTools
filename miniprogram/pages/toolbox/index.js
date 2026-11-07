// pages/toolbox/index.js
Page({
  data: {
    tools: [
      { id: 'ai-exam', name: '理论考试', icon: '📝', desc: '按科目选择题库练习', color: '#e3f2fd' },
      { id: 'exchange-rate', name: '汇率查询', icon: '💱', desc: '实时汇率 每日更新', color: '#e8f5e9' },
      { id: 'gold-price', name: '金价查询', icon: '🪙', desc: '实时金价 走势一览', color: '#fff8e1' },
      { id: 'placeholder-1', name: '更多工具', icon: '🔧', desc: '敬请期待', color: '#fff3e0' },
    ],
  },

  onToolTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'ai-exam') {
      wx.navigateTo({ url: '/pages/exam-list/index' })
    } else if (id === 'exchange-rate') {
      wx.navigateTo({ url: '/pages/toolbox/exchange-rate/index' })
    } else if (id === 'gold-price') {
      wx.navigateTo({ url: '/pages/toolbox/gold-price/index' })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },
})
