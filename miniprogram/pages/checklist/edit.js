const storage = require('../../utils/checklist-storage')

Page({
  data: {
    checklist: null,
    totalItems: 0,
    hasChanges: false,
  },

  _originalJSON: '',

  onLoad(options) {
    this._id = options.id
    const checklist = storage.getChecklist(this._id)
    if (!checklist) {
      wx.showToast({ title: '清单不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    // Deep copy as working copy
    const workingCopy = JSON.parse(JSON.stringify(checklist))
    this._originalJSON = JSON.stringify(checklist)
    const totalItems = workingCopy.groups.reduce((sum, g) => sum + g.items.length, 0)
    this.setData({ checklist: workingCopy, totalItems })
  },

  _genId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
  },

  _updateTotalAndChanges() {
    const checklist = this.data.checklist
    const totalItems = checklist.groups.reduce((sum, g) => sum + g.items.length, 0)
    const hasChanges = JSON.stringify(checklist) !== this._originalJSON
    this.setData({ totalItems, hasChanges })
  },

  onTitleChange(e) {
    this.setData({ 'checklist.title': e.detail.value })
    this._updateTotalAndChanges()
  },

  onDescChange(e) {
    this.setData({ 'checklist.description': e.detail.value })
    this._updateTotalAndChanges()
  },

  onAddItem(e) {
    const groupId = e.currentTarget.dataset.groupId
    wx.showModal({
      title: '添加事项',
      editable: true,
      placeholderText: '输入事项名称',
      confirmColor: '#1a6b4a',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const checklist = this.data.checklist
          const group = checklist.groups.find(g => g.id === groupId)
          if (group) {
            group.items.push({
              id: this._genId('i'),
              title: res.content.trim(),
              note: '',
              completed: false,
              sortOrder: group.items.length,
            })
            this.setData({ checklist })
            this._updateTotalAndChanges()
          }
        }
      }
    })
  },

  onDeleteItem(e) {
    const { groupId, itemId } = e.currentTarget.dataset
    wx.showModal({
      title: '删除事项',
      content: '确定删除该事项？',
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          const checklist = this.data.checklist
          const group = checklist.groups.find(g => g.id === groupId)
          if (group) {
            group.items = group.items.filter(i => i.id !== itemId)
            this.setData({ checklist })
            this._updateTotalAndChanges()
          }
        }
      }
    })
  },

  onAddGroup() {
    const checklist = this.data.checklist
    checklist.groups.push({
      id: this._genId('g'),
      name: '新分组',
      items: []
    })
    this.setData({ checklist })
    this._updateTotalAndChanges()
  },

  onGroupMenu(e) {
    const { groupId, groupIdx } = e.currentTarget.dataset
    const checklist = this.data.checklist

    // Don't allow deleting the last group
    const canDelete = checklist.groups.length > 1
    const itemList = canDelete ? ['重命名分组', '删除分组'] : ['重命名分组']

    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (res.tapIndex === 0) {
          this._renameGroup(groupId, groupIdx)
        } else if (res.tapIndex === 1 && canDelete) {
          this._deleteGroup(groupId, groupIdx)
        }
      }
    })
  },

  _renameGroup(groupId, groupIdx) {
    const checklist = this.data.checklist
    const group = checklist.groups.find(g => g.id === groupId)
    if (!group) return

    wx.showModal({
      title: '重命名分组',
      editable: true,
      placeholderText: '输入分组名称',
      confirmColor: '#1a6b4a',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          group.name = res.content.trim()
          this.setData({ checklist })
          this._updateTotalAndChanges()
        }
      }
    })
  },

  _deleteGroup(groupId, groupIdx) {
    const checklist = this.data.checklist
    const group = checklist.groups.find(g => g.id === groupId)
    if (!group) return

    const itemCount = group.items.length
    const message = itemCount > 0
      ? `该分组有${itemCount}个事项，删除后事项将移至第一个分组。确定删除？`
      : '确定删除该分组？'

    wx.showModal({
      title: '删除分组',
      content: message,
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          // Move items to first group (that isn't the one being deleted)
          if (itemCount > 0) {
            const targetGroup = checklist.groups.find(g => g.id !== groupId)
            if (targetGroup) {
              targetGroup.items = targetGroup.items.concat(group.items)
            }
          }
          checklist.groups = checklist.groups.filter(g => g.id !== groupId)
          this.setData({ checklist })
          this._updateTotalAndChanges()
        }
      }
    })
  },

  onRestoreDefaults() {
    wx.showModal({
      title: '恢复默认',
      content: '将恢复清单为模板初始状态，您的修改将丢失。确定恢复？',
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          const restored = storage.restoreDefaults(this._id)
          if (restored) {
            const workingCopy = JSON.parse(JSON.stringify(restored))
            this._originalJSON = JSON.stringify(restored)
            const totalItems = workingCopy.groups.reduce((sum, g) => sum + g.items.length, 0)
            this.setData({ checklist: workingCopy, totalItems, hasChanges: false })
            wx.showToast({ title: '已恢复默认', icon: 'success' })
          }
        }
      }
    })
  },

  onSave() {
    const checklist = this.data.checklist
    if (!checklist.title || !checklist.title.trim()) {
      wx.showToast({ title: '请输入清单标题', icon: 'none' })
      return
    }
    checklist.isEdited = true
    storage.saveChecklist(checklist)
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 500)
  },

  onCancel() {
    if (this.data.hasChanges) {
      wx.showModal({
        title: '放弃修改',
        content: '您有未保存的修改，确定放弃？',
        confirmColor: '#e53935',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
    } else {
      wx.navigateBack()
    }
  },
})
