// pages/toolbox/index.js
Page({
  data: {
    gridItems: [
      { name: 'AI理论考', icon: '📝' },
      { name: '占位', icon: '📋' },
      { name: '占位', icon: '📊' },
      { name: '占位', icon: '⚙️' },
    ],
  },

  onGridTap(e) {
    const index = e.currentTarget.dataset.index
    if (index === 0) {
      wx.navigateTo({
        url: '/pages/ai-exam/index',
      })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },
})
