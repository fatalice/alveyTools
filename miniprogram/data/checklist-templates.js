const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'travel', name: '出行' },
  { id: 'growth', name: '成长' },
  { id: 'family', name: '家庭' },
  { id: 'baby', name: '母婴' },
  { id: 'errands', name: '办事' },
]

const TEMPLATES = [
  {
    id: 'scenario_short_trip',
    title: '短途旅行',
    description: '周末或 1-3 天短途出门，不漏随身物品。',
    category: 'travel',
    icon: 'suitcase',
    itemCount: 30,
    groups: [
      {
        name: '证件资料',
        items: [
          { title: '身份证' },
          { title: '驾驶证' },
          { title: '车票或订单截图' },
          { title: '酒店预订信息' },
          { title: '少量现金' },
        ]
      },
      {
        name: '衣物',
        items: [
          { title: '换洗内衣' },
          { title: '袜子' },
          { title: '薄外套' },
          { title: '睡衣' },
          { title: '舒适鞋' },
        ]
      },
      {
        name: '洗护',
        items: [
          { title: '牙刷牙膏' },
          { title: '洗面奶' },
          { title: '护肤品小样' },
          { title: '毛巾' },
          { title: '纸巾湿巾' },
        ]
      },
      {
        name: '电子设备',
        items: [
          { title: '手机' },
          { title: '充电器' },
          { title: '充电宝' },
          { title: '耳机' },
          { title: '数据线' },
        ]
      },
      {
        name: '食品药品',
        items: [
          { title: '常用药' },
          { title: '晕车药' },
          { title: '水杯' },
          { title: '小零食' },
          { title: '创可贴' },
        ]
      },
      {
        name: '工具其他',
        items: [
          { title: '雨伞' },
          { title: '背包' },
          { title: '垃圾袋' },
          { title: '口罩' },
          { title: '备用袋子' },
        ]
      },
    ]
  }
]

function getTemplateById(id) {
  return TEMPLATES.find(t => t.id === id) || null
}

function getTemplatesByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return TEMPLATES
  return TEMPLATES.filter(t => t.category === categoryId)
}

function searchTemplates(keyword) {
  if (!keyword) return []
  const kw = keyword.toLowerCase()
  return TEMPLATES.filter(t => {
    if (t.title.toLowerCase().includes(kw)) return true
    if (t.description.toLowerCase().includes(kw)) return true
    return t.groups.some(g =>
      g.items.some(item => item.title.toLowerCase().includes(kw))
    )
  })
}

module.exports = {
  CATEGORIES,
  TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates,
}
