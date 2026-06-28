const { NOTEBOOKS } = require('../../data/notebooks')

Page({
  data: {
    id: '',
    cells: [],
  },

  onLoad(options) {
    const id = options.id
    const cells = NOTEBOOKS[id] || []
    this.setData({ id, cells })
    wx.setNavigationBarTitle({ title: id })
  },
})
