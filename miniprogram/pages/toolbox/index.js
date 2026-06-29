// pages/toolbox/index.js
Page({
  data: {
    tools: [
      { id: 'ai-exam', name: 'AI理论考', icon: '📝', desc: '人工智能训练师题库', color: '#e3f2fd' },
      { id: 'exchange-rate', name: '汇率查询', icon: '💱', desc: '实时汇率 每日更新', color: '#e8f5e9' },
      { id: 'placeholder-1', name: '更多工具', icon: '🔧', desc: '敬请期待', color: '#fff3e0' },
    ],
  },

  onToolTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'ai-exam') {
      wx.navigateTo({ url: '/pages/ai-exam/index' })
    } else if (id === 'exchange-rate') {
      wx.navigateTo({ url: '/pages/toolbox/exchange-rate/index' })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },
})
