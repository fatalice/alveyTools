// recipe-detail/index.js
const recipe = require('../../utils/recipe')

Page({
  data: {
    id: '',
    recipe: null,
    servings: 2,
    liked: false,
    error: false,
  },

  onLoad(query) {
    const id = query.id
    this.setData({ id })
    this.loadRecipe(id)
  },

  async loadRecipe(id) {
    try {
      const r = await recipe.getRecipe(id)
      if (!r) {
        this.setData({ error: true })
        return
      }
      const servings = r.servings || 2
      this.setData({ recipe: r, servings }, () => {
        this.applyServings()
      })
      // 查收藏态
      recipe.isLiked(id).then((liked) => this.setData({ liked })).catch(() => {})
    } catch (e) {
      console.warn('loadRecipe fail', e)
      this.setData({ error: true })
    }
  },

  // 人数变化：按 per 字段重新算每项 qty
  applyServings() {
    const { recipe, servings } = this.data
    if (!recipe || !recipe.ingredients) return
    const base = recipe.servings || 2
    const ratio = servings / base
    const ingredients = recipe.ingredients.map((ing) => {
      let displayQty = ing.unit
      if (ing.per && ing.per > 0) {
        const total = ing.per * servings
        const v = Number.isInteger(total) ? total : Math.round(total * 10) / 10
        displayQty = `${v} ${ing.unit}`
      } else if (ing.qty && ing.qty > 0) {
        // 无 per 字段时按比例缩放 qty
        const total = ing.qty * ratio
        const v = Number.isInteger(total) ? total : Math.round(total * 10) / 10
        displayQty = `${v} ${ing.unit}`
      }
      return { ...ing, displayQty }
    })
    this.setData({ 'recipe.ingredients': ingredients })
  },

  onServingsStep(e) {
    const step = Number(e.currentTarget.dataset.step)
    const next = Math.max(1, Math.min(8, this.data.servings + step))
    if (next === this.data.servings) return
    this.setData({ servings: next }, () => this.applyServings())
  },

  async onSaveTap() {
    const { id, liked } = this.data
    try {
      const nowLiked = await recipe.toggleLike(id, liked)
      this.setData({ liked: nowLiked })
      wx.showToast({ title: nowLiked ? '已收藏' : '已取消收藏', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  },

  onCookTap() {
    wx.showToast({ title: '烹饪模式开发中', icon: 'none' })
  },
})
