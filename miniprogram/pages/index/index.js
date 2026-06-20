// index.js
Page({
  data: {
    gridItems: [
      { name: '工具箱', icon: '🔧', desc: '实用小工具', color: '#e8f5e9' },
      { name: '理论考试', icon: '📝', desc: '在线刷题练习', color: '#e3f2fd' },
      { name: '占位3', icon: '📊', desc: '敬请期待', color: '#fff3e0' },
      { name: '开心羊圈', icon: '🐑', desc: '社区互动', color: '#fce4ec' },
    ],
  },

  onGridTap(e) {
    const index = e.currentTarget.dataset.index
    if (index === 0) {
      wx.navigateTo({ url: '/pages/toolbox/index' })
    } else if (index === 1) {
      wx.navigateTo({ url: '/pages/exam-list/index' })
    } else if (index === 3) {
      wx.navigateTo({ url: '/pages/sheep-circle/index' })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },
})
