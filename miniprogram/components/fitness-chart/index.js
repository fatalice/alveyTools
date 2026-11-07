// components/fitness-chart/index.js — 体重折线图（canvas 2d）
// 支持：平滑曲线、渐变填充、目标虚线、网格、末点高亮、迷你模式
Component({
  properties: {
    // [{ date, weight }]，weight 为 null 表示当天无记录（折线跳过）
    data: { type: Array, value: [], observer: 'onDataChange' },
    goal: { type: Number, value: 0 },
    mini: { type: Boolean, value: false },
    // light：深色底上的白色线条（首页 Hero 卡）
    light: { type: Boolean, value: false },
    height: { type: Number, value: 152 },
  },
  lifetimes: {
    attached() {
      this._ctx = null
      this._ready = false
    },
    ready() {
      this.initCanvas()
    },
    detached() {
      try {
        if (this._raf && this._canvas) this._canvas.cancelAnimationFrame(this._raf)
      } catch (e) {}
    },
  },
  pageLifetimes: {
    show() {
      this.scheduleDraw()
    },
  },
  methods: {
    initCanvas() {
      this.createSelectorQuery()
        .in(this)
        .select('#fc')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return
          const node = res[0].node
          const width = res[0].width
          const height = res[0].height
          const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2
          node.width = width * dpr
          node.height = height * dpr
          const ctx = node.getContext('2d')
          ctx.scale(dpr, dpr)
          this._canvas = node
          this._ctx = ctx
          this._w = width
          this._h = height
          this._ready = true
          this.scheduleDraw()
        })
    },

    onDataChange() {
      this.scheduleDraw()
    },

    scheduleDraw() {
      if (!this._ready) return
      this._prog = 0
      this.animate()
    },

    animate() {
      const node = this._canvas
      if (!node) return
      const t0 = Date.now()
      const dur = this.data.mini ? 320 : 480
      const step = () => {
        const e = Math.min(1, (Date.now() - t0) / dur)
        this._prog = 1 - Math.pow(1 - e, 3)
        this.draw()
        if (e < 1) this._raf = node.requestAnimationFrame(step)
      }
      try {
        if (this._raf) node.cancelAnimationFrame(this._raf)
      } catch (e) {}
      this._raf = node.requestAnimationFrame(step)
    },

    draw() {
      const ctx = this._ctx
      const w = this._w
      const h = this._h
      const mini = this.data.mini
      const light = this.data.light
      const goal = this.data.goal || 0
      const lineColor = light ? '#FFFFFF' : '#0B9A7A'
      ctx.clearRect(0, 0, w, h)

      const raw = this.data.data || []
      // 过滤无记录的点，但保留它们在横轴上的位置
      const pts = []
      raw.forEach((d, i) => {
        if (d.weight !== null && d.weight !== undefined) pts.push({ i, v: Number(d.weight) })
      })
      if (!pts.length) return

      const vals = pts.map((p) => p.v)
      let min = Math.min.apply(null, vals)
      let max = Math.max.apply(null, vals)
      if (goal > 0) {
        min = Math.min(min, goal)
        max = Math.max(max, goal)
      }
      if (max - min < 1) max = min + 1
      const padY = (max - min) * 0.18
      const lo = min - padY
      const hi = max + padY

      const pad = mini ? 8 : 16
      const X = (i) => pad + (w - 2 * pad) * (raw.length > 1 ? i / (raw.length - 1) : 0.5)
      const Y = (v) => pad + (h - 2 * pad) * (1 - (v - lo) / (hi - lo))

      // 网格
      if (!mini) {
        ctx.strokeStyle = '#E4E9F1'
        ctx.lineWidth = 1
        const g1 = pad + (h - 2 * pad) * 0.34
        const g2 = pad + (h - 2 * pad) * 0.68
        ;[g1, g2].forEach((gy) => {
          ctx.beginPath()
          ctx.moveTo(pad, gy)
          ctx.lineTo(w - pad, gy)
          ctx.stroke()
        })
      }

      // 目标虚线
      if (goal > 0) {
        const gy = Y(goal)
        ctx.save()
        ctx.setLineDash([3, 4])
        ctx.strokeStyle = '#93A0AD'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pad, gy)
        ctx.lineTo(w - pad, gy)
        ctx.stroke()
        ctx.restore()
        if (!mini) {
          ctx.fillStyle = '#93A0AD'
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'bottom'
          ctx.fillText('目标 ' + goal.toFixed(1), w - pad, gy - 3)
        }
      }

      // 采样平滑曲线（Catmull-Rom 转 Bezier）
      const n = pts.length
      const px = pts.map((p) => X(p.i))
      const py = pts.map((p) => Y(p.v))
      let d = 'M' + px[0].toFixed(2) + ',' + py[0].toFixed(2)
      for (let i = 0; i < n - 1; i += 1) {
        const p0 = { x: px[i - 1], y: py[i - 1] } || { x: px[i], y: py[i] }
        const p1 = { x: px[i], y: py[i] }
        const p2 = { x: px[i + 1], y: py[i + 1] }
        const p3 = { x: px[i + 2] || p2.x, y: py[i + 2] || p2.y }
        const t = 0.18
        const c1x = p1.x + (p2.x - p0.x) * t
        const c1y = p1.y + (p2.y - p0.y) * t
        const c2x = p2.x - (p3.x - p1.x) * t
        const c2y = p2.y - (p3.y - p1.y) * t
        d +=
          ' C' + c1x.toFixed(2) + ',' + c1y.toFixed(2) + ' ' +
          c2x.toFixed(2) + ',' + c2y.toFixed(2) + ' ' +
          p2.x.toFixed(2) + ',' + p2.y.toFixed(2)
      }

      // 渐变填充
      if (!mini) {
        const base = h - pad + 8
        const grad = ctx.createLinearGradient(0, pad, 0, base)
        grad.addColorStop(0, light ? 'rgba(255, 255, 255, 0.22)' : 'rgba(11, 154, 122, 0.20)')
        grad.addColorStop(1, light ? 'rgba(255, 255, 255, 0)' : 'rgba(11, 154, 122, 0)')
        ctx.beginPath()
        ctx.moveTo(px[0], base)
        ctx.lineTo(px[0], py[0])
        for (let i = 0; i < n - 1; i += 1) {
          const p0 = { x: px[i - 1], y: py[i - 1] } || { x: px[i], y: py[i] }
          const p1 = { x: px[i], y: py[i] }
          const p2 = { x: px[i + 1], y: py[i + 1] }
          const p3 = { x: px[i + 2] || p2.x, y: py[i + 2] || p2.y }
          const t = 0.18
          const c1x = p1.x + (p2.x - p0.x) * t
          const c1y = p1.y + (p2.y - p0.y) * t
          const c2x = p2.x - (p3.x - p1.x) * t
          const c2y = p2.y - (p3.y - p1.y) * t
          ctx.bezierCurveTo(
            c1x, c1y, c2x, c2y, p2.x, p2.y,
          )
        }
        ctx.lineTo(px[n - 1], base)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()
      }

      // 折线（按绘制进度截断）
      const prog = this._prog || 1
      ctx.beginPath()
      const cut = Math.max(1, Math.round((n - 1) * prog))
      ctx.moveTo(px[0], py[0])
      for (let i = 0; i < cut; i += 1) {
        const p0 = { x: px[i - 1], y: py[i - 1] } || { x: px[i], y: py[i] }
        const p1 = { x: px[i], y: py[i] }
        const p2 = { x: px[i + 1], y: py[i + 1] }
        const p3 = { x: px[i + 2] || p2.x, y: py[i + 2] || p2.y }
        const t = 0.18
        const c1x = p1.x + (p2.x - p0.x) * t
        const c1y = p1.y + (p2.y - p0.y) * t
        const c2x = p2.x - (p3.x - p1.x) * t
        const c2y = p2.y - (p3.y - p1.y) * t
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y)
      }
      ctx.strokeStyle = lineColor
      ctx.lineWidth = mini ? 2 : 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // 末点高亮
      const li = Math.min(cut, n - 1)
      const lx = px[li]
      const ly = py[li]
      ctx.beginPath()
      ctx.arc(lx, ly, mini ? 4 : 8, 0, Math.PI * 2)
      ctx.fillStyle = light ? 'rgba(255, 255, 255, 0.22)' : 'rgba(11, 154, 122, 0.16)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(lx, ly, mini ? 2.5 : 4, 0, Math.PI * 2)
      ctx.fillStyle = lineColor
      ctx.strokeStyle = light ? 'rgba(11, 154, 122, 0.9)' : '#FFFFFF'
      ctx.lineWidth = mini ? 1.5 : 2.5
      ctx.stroke()
    },
  },
})
