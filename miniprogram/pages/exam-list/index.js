// pages/exam-list/index.js
const api = require('../../utils/api')

const COURSE_COLORS = ['#e3f2fd', '#e8f5e9', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f7fa']

Page({
  data: {
    loading: true,
    view: 'courses', // courses | banks
    courses: [],
    banks: [],
    currentCourse: null,
    error: '',
  },

  onLoad() {
    this.loadTree()
  },

  onPullDownRefresh() {
    this.loadTree().finally(() => wx.stopPullDownRefresh())
  },

  async loadTree() {
    this.setData({ loading: true, error: '' })
    try {
      const res = await api.getQbTree()
      const data = res.data || {}
      const tree = data.tree || []
      const courses = []
      tree.forEach((cat) => {
        ;(cat.courses || []).forEach((course, idx) => {
          const bankCount = (course.banks || []).length
          if (!bankCount) return
          courses.push({
            _id: course._id,
            name: course.name,
            description: course.description || cat.name || '',
            categoryName: cat.name || '',
            bankCount,
            banks: course.banks || [],
            color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
            icon: (course.name || '题').slice(0, 1),
          })
        })
      })
      this.setData({
        loading: false,
        courses,
        view: 'courses',
        currentCourse: null,
        banks: [],
      })
    } catch (err) {
      console.error(err)
      this.setData({
        loading: false,
        error: (err && err.message) || '加载失败，请下拉重试',
      })
    }
  },

  onCourseTap(e) {
    const id = e.currentTarget.dataset.id
    const course = (this.data.courses || []).find((c) => c._id === id)
    if (!course) return
    const banks = (course.banks || []).map((b, i) => ({
      ...b,
      color: COURSE_COLORS[i % COURSE_COLORS.length],
      icon: (b.name || '库').slice(0, 1),
    }))
    this.setData({
      view: 'banks',
      currentCourse: course,
      banks,
    })
    wx.setNavigationBarTitle({ title: course.name || '选择题库' })
  },

  onBackCourses() {
    this.setData({ view: 'courses', currentCourse: null, banks: [] })
    wx.setNavigationBarTitle({ title: '理论考试' })
  },

  onBankTap(e) {
    const id = e.currentTarget.dataset.id
    const bank = (this.data.banks || []).find((b) => b._id === id)
    if (!bank) return
    const title = encodeURIComponent(bank.name || '理论考试')
    const course = encodeURIComponent((this.data.currentCourse && this.data.currentCourse.name) || '')
    wx.navigateTo({
      url: `/pages/ai-exam/index?bankId=${bank._id}&title=${title}&course=${course}`,
    })
  },

  onPracticeTap() {
    wx.navigateTo({ url: '/pages/notebook-list/index' })
  },
})
