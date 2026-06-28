const api = require('../../../utils/api')

const MOODS = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'normal', emoji: '😐', label: '一般' },
  { key: 'uncomfortable', emoji: '😣', label: '不适' },
  { key: 'tired', emoji: '😴', label: '疲惫' },
  { key: 'excited', emoji: '🤩', label: '期待' },
  { key: 'annoyed', emoji: '😤', label: '烦躁' },
]

function padTwo(n) { return String(n).padStart(2, '0') }

function nowDatetime() {
  const d = new Date()
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())} ${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`
}

Page({
  data: {
    id: '',
    moods: MOODS,
    mood: '',
    content: '',
    images: [],
    date: '',
    time: '',
    submitting: false,
  },

  onLoad(options) {
    const now = nowDatetime()
    this.setData({
      date: now.split(' ')[0],
      time: now.split(' ')[1],
    })
    if (options.id) {
      this.setData({ id: options.id })
      this.loadDetail(options.id)
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await api.getBraceDiaryDetail(id)
      const data = (res && res.data) || res
      const et = new Date(data.eventTime)
      this.setData({
        mood: data.mood,
        content: data.content || '',
        images: (data.images || []).map(url => ({ url, isRemote: true })),
        date: `${et.getFullYear()}-${padTwo(et.getMonth() + 1)}-${padTwo(et.getDate())}`,
        time: `${padTwo(et.getHours())}:${padTwo(et.getMinutes())}`,
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  onMoodTap(e) {
    this.setData({ mood: e.currentTarget.dataset.key })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value })
  },

  onChooseImage() {
    const remain = 9 - this.data.images.length
    if (remain <= 0) {
      wx.showToast({ title: '最多9张', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImgs = res.tempFiles.map(f => ({ url: f.tempFilePath, isRemote: false, size: f.size }))
        this.setData({ images: [...this.data.images, ...newImgs] })
      },
    })
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.idx
    const images = this.data.images.filter((_, i) => i !== idx)
    this.setData({ images })
  },

  async onSubmit() {
    const { mood, content, images, date, time, id, submitting } = this.data
    if (submitting) return
    if (!mood) {
      wx.showToast({ title: '请选择心情', icon: 'none' })
      return
    }
    if (!content.trim() && images.length === 0) {
      wx.showToast({ title: '请填写文字或添加图片', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中...', mask: true })

    try {
      const uploadedImages = []
      for (const img of images) {
        if (img.isRemote) {
          uploadedImages.push(img.url)
        } else {
          const fileData = wx.getFileSystemManager().readFileSync(img.url, 'base64')
          const ext = img.url.split('.').pop() || 'jpg'
          const uploadRes = await api.uploadFile({
            filename: `diary_${Date.now()}.${ext}`,
            data: fileData,
            scene: 'brace-diary',
          })
          const uploaded = uploadRes.data || uploadRes
          uploadedImages.push(uploaded.url || uploaded.fileID)
        }
      }

      const eventTime = new Date(`${date}T${time}:00`).toISOString()
      const payload = { eventTime, mood, content: content.trim(), images: uploadedImages }

      if (id) {
        payload._id = id
        await api.updateBraceDiary(payload)
      } else {
        await api.createBraceDiary(payload)
      }

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      wx.hideLoading()
      console.error('submit failed:', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
    this.setData({ submitting: false })
  },
})
