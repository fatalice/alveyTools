const { NOTEBOOK_SECTIONS, NOTEBOOKS } = require('../../data/notebooks')

Page({
  data: {
    sections: [],
  },

  onLoad() {
    const sections = NOTEBOOK_SECTIONS.map(s => ({
      ...s,
      notebooks: Object.keys(NOTEBOOKS)
        .filter(id => id.startsWith(s.id + '.'))
        .sort()
        .map(id => ({ id, title: id }))
    }))
    this.setData({ sections })
  },

  onNotebookTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/notebook-view/index?id=' + id })
  },
})
