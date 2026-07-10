Component({
  properties: {
    active: {
      type: Number,
      value: 0
    }
  },

  data: {
    tabs: [
      { name: '首页', icon: '🏠', page: '/pages/checklist/index' },
      { name: '场景库', icon: '📚', page: '/pages/checklist/scenarios' },
      { name: '我的', icon: '👤', page: '/pages/checklist/mine' }
    ]
  },

  methods: {
    onTabTap(e) {
      const index = Number(e.currentTarget.dataset.index);
      if (index !== this.data.active) {
        wx.redirectTo({
          url: this.data.tabs[index].page
        });
      }
    }
  }
});
