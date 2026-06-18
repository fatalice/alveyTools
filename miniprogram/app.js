// app.js
App({
  onLaunch: function () {
    this.globalData = {
      envId: 'cloudenv1-d4gkp36fb4243e78c',
      serviceName: 'fataliceenv',
    };
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true,
      });
    }
  },
});
