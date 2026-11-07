// pages/about-author/index.js
// 关于作者 · 自我介绍单页
// 文案为占位内容，改 profile / aboutText / skills / works 即可
// 二维码：默认用本地图片 images/qrcode.jpg；换成云存储 fileID 也可直接填这里

Page({
  data: {
    // 头像留空显示姓名首字；填云存储 fileID 或网络图则显示头像
    profile: {
      name: 'Alvey',
      slogan: '写代码的，也贪吃',
      miniTags: ['📍 上海', '☕ 咖啡续命', '🌙 夜猫子'],
      avatar: '',
      initial: 'A',
    },

    aboutText:
      '嗨～我是上面这位。白天敲代码，晚上琢磨吃的。喜欢把脑子里冒出来的小想法，直接做成能用的东西，顺便学点新玩意儿。',

    skills: [
      '小程序',
      '云开发',
      'Node.js',
      'UI 设计',
      '做饭',
      '咖啡',
      '拍照',
      '追剧',
    ],

    // 本地图片路径；换成云存储 fileID 同样生效
    qrcode: '/images/qrcode.jpg',
  },

  // 返回：栈里有上一页就退回，没有（分享链接直接进入）就回「我的」
  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.switchTab({ url: '/pages/my/index' })
    }
  },
})
