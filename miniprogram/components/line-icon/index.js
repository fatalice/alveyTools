// components/line-icon/index.js — 内联 SVG 图标（小程序无 SVG，用 base64 data URI 渲染）
const { ICONS } = require('../../utils/icons')

Component({
  properties: {
    // weight | weightWhite | smoke | tool | food | sheep | chev
    name: { type: String, value: 'weight' },
    size: { type: Number, value: 40 }, // px
  },
  data: {
    src: '',
    box: 40,
  },
  observers: {
    name(v) {
      this.setData({ src: ICONS[v] || ICONS.weight })
    },
  },
  lifetimes: {
    attached() {
      this.setData({ src: ICONS[this.properties.name] || ICONS.weight })
    },
  },
})
