const STORAGE_KEY = 'yangyang_checklists_v1'

function _read() {
  return wx.getStorageSync(STORAGE_KEY) || { checklists: [], customTemplates: [], favorites: [] }
}

function _write(data) {
  wx.setStorageSync(STORAGE_KEY, data)
}

function _generateId(prefix) {
  const ts = Date.now()
  const rand = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${ts}_${rand}`
}

function getAll() {
  return _read()
}

function getChecklists() {
  return _read().checklists
}

function getChecklist(id) {
  return _read().checklists.find(c => c.id === id) || null
}

function saveChecklist(checklist) {
  const data = _read()
  const idx = data.checklists.findIndex(c => c.id === checklist.id)
  checklist.updatedAt = Date.now()
  if (idx >= 0) {
    data.checklists[idx] = checklist
  } else {
    data.checklists.push(checklist)
  }
  _write(data)
  return checklist
}

function deleteChecklist(id) {
  const data = _read()
  data.checklists = data.checklists.filter(c => c.id !== id)
  _write(data)
}

function createFromTemplate(template) {
  const now = Date.now()
  const checklist = {
    id: _generateId('cl'),
    title: template.title + '（我的）',
    description: template.description || '',
    category: template.category || '',
    sourceScenarioId: template.id,
    isEdited: false,
    defaultSnapshot: {
      title: template.title + '（我的）',
      description: template.description || '',
      category: template.category || '',
      groups: template.groups.map(g => ({
        name: g.name,
        items: g.items.map(item => ({ title: item.title, note: item.note || '' }))
      }))
    },
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    groups: template.groups.map((g, gi) => ({
      id: _generateId('g'),
      name: g.name,
      items: g.items.map((item, ii) => ({
        id: _generateId('i'),
        title: item.title,
        note: item.note || '',
        completed: false,
        sortOrder: ii,
      }))
    }))
  }
  saveChecklist(checklist)
  return checklist
}

function createBlankChecklist() {
  const now = Date.now()
  const checklist = {
    id: _generateId('cl'),
    title: '自定义清单',
    description: '',
    category: '',
    sourceScenarioId: null,
    isEdited: false,
    defaultSnapshot: null,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    groups: [{
      id: _generateId('g'),
      name: '默认分组',
      items: []
    }]
  }
  saveChecklist(checklist)
  return checklist
}

function toggleItem(checklistId, groupId, itemId) {
  const data = _read()
  const checklist = data.checklists.find(c => c.id === checklistId)
  if (!checklist) return null
  for (const group of checklist.groups) {
    if (group.id === groupId) {
      const item = group.items.find(i => i.id === itemId)
      if (item) {
        item.completed = !item.completed
        checklist.lastUsedAt = Date.now()
        checklist.updatedAt = Date.now()
        _write(data)
        return checklist
      }
    }
  }
  return null
}

function resetProgress(checklistId) {
  const data = _read()
  const checklist = data.checklists.find(c => c.id === checklistId)
  if (!checklist) return null
  for (const group of checklist.groups) {
    for (const item of group.items) {
      item.completed = false
    }
  }
  checklist.updatedAt = Date.now()
  checklist.lastUsedAt = Date.now()
  _write(data)
  return checklist
}

function restoreDefaults(checklistId) {
  const data = _read()
  const checklist = data.checklists.find(c => c.id === checklistId)
  if (!checklist || !checklist.defaultSnapshot) return null
  const snapshot = checklist.defaultSnapshot
  checklist.title = snapshot.title
  checklist.description = snapshot.description
  checklist.category = snapshot.category
  checklist.groups = snapshot.groups.map(g => ({
    id: _generateId('g'),
    name: g.name,
    items: g.items.map((item, ii) => ({
      id: _generateId('i'),
      title: item.title,
      note: item.note || '',
      completed: false,
      sortOrder: ii,
    }))
  }))
  checklist.isEdited = false
  checklist.updatedAt = Date.now()
  checklist.lastUsedAt = Date.now()
  _write(data)
  return checklist
}

function getIncompleteChecklists(limit) {
  const checklists = _read().checklists
  return checklists
    .filter(c => {
      const total = c.groups.reduce((sum, g) => sum + g.items.length, 0)
      const done = c.groups.reduce((sum, g) => sum + g.items.filter(i => i.completed).length, 0)
      return total > 0 && done < total
    })
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit || 3)
}

function getCustomTemplates() {
  return _read().customTemplates
}

function saveCustomTemplate(template) {
  const data = _read()
  if (!template.id) {
    template.id = _generateId('ct')
    template.createdAt = Date.now()
  }
  const idx = data.customTemplates.findIndex(t => t.id === template.id)
  if (idx >= 0) {
    data.customTemplates[idx] = template
  } else {
    data.customTemplates.push(template)
  }
  _write(data)
  return template
}

function deleteCustomTemplate(id) {
  const data = _read()
  data.customTemplates = data.customTemplates.filter(t => t.id !== id)
  _write(data)
}

function getFavorites() {
  return _read().favorites
}

function toggleFavorite(scenarioId) {
  const data = _read()
  const idx = data.favorites.indexOf(scenarioId)
  if (idx >= 0) {
    data.favorites.splice(idx, 1)
  } else {
    data.favorites.push(scenarioId)
  }
  _write(data)
  return data.favorites
}

function isFavorite(scenarioId) {
  return _read().favorites.includes(scenarioId)
}

module.exports = {
  getAll,
  getChecklists,
  getChecklist,
  saveChecklist,
  deleteChecklist,
  createFromTemplate,
  createBlankChecklist,
  toggleItem,
  resetProgress,
  restoreDefaults,
  getIncompleteChecklists,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  getFavorites,
  toggleFavorite,
  isFavorite,
}
