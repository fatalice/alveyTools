// components/login-sheet/index.js — 登录弹层（我的页 / 体重管理页共用）
// 自绘遮罩，不依赖 popup 组件的受控 visible 行为，任何页面都能就地唤起
const api = require('../../utils/api')

Component({
  properties: {
    visible: { type: Boolean, value: false },
  },
  data: {
    pendingAvatar: '',
    pendingNickname: '',
    submitting: false,
  },
  methods: {
    onClose() {
      if (this.data.submitting) return
      this.triggerEvent('close')
    },

    onMaskTap() {
      this.onClose()
    },

    onSheetTap() {},

    onChooseAvatar(e) {
      this.setData({ pendingAvatar: e.detail.avatarUrl })
    },

    onNicknameInput(e) {
      this.setData({ pendingNickname: e.detail.value })
    },

    async onConfirm() {
      const { pendingAvatar, pendingNickname, submitting } = this.data
      if (submitting) return
      if (!pendingAvatar) {
        wx.showToast({ title: '请选择头像', icon: 'none' })
        return
      }
      if (!pendingNickname || !pendingNickname.trim()) {
        wx.showToast({ title: '请填写昵称', icon: 'none' })
        return
      }

      this.setData({ submitting: true })
      wx.showLoading({ title: '登录中...', mask: true })

      try {
        const userId = api.ensureUserId()

        // 头像传到云存储；失败则退回临时路径，不阻塞登录
        let avatarUrl = pendingAvatar
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: `avatars/${userId}_${Date.now()}.png`,
            filePath: pendingAvatar,
          })
          avatarUrl = uploadRes.fileID
        } catch (e) {
          console.warn('avatar upload failed, using temp path', e)
        }

        const res = await api.savePersonalInfo({
          userId,
          name: pendingNickname.trim(),
          avatarFileID: avatarUrl,
        })

        wx.setStorageSync(api.TOKEN_KEY, true)
        const info = res.data || res
        wx.hideLoading()
        this.setData({ submitting: false, pendingAvatar: '', pendingNickname: '' })
        this.triggerEvent('success', {
          name: pendingNickname.trim(),
          avatar: avatarUrl,
          info: { ...info, image: avatarUrl, name: pendingNickname.trim() },
        })
        wx.showToast({ title: '登录成功', icon: 'success' })
      } catch (err) {
        console.error('login failed:', err)
        wx.hideLoading()
        this.setData({ submitting: false })
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    },
  },
})
