// index.js
Page({
  data: {
    gridItems: [
      { name: '工具箱', icon: '🔧' },
      { name: '占位2', icon: '📋' },
      { name: '占位3', icon: '📊' },
      { name: '占位4', icon: '⚙️' },
    ],
  },

  onGridTap(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.gridItems[index]
    // 暂时只跳转工具箱，其余占位提示
    if (index === 0) {
      wx.navigateTo({
        url: '/pages/toolbox/index',
      })
    } else {
      wx.showToast({ title: `${item.name} 功能开发中`, icon: 'none' })
    }
  },
})
