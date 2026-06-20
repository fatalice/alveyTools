// pages/exam-list/index.js
Page({
  data: {
    examList: [
      {
        id: 'ai-trainer',
        title: '人工智能训练师',
        subtitle: '三级理论复习',
        totalScore: 100,
        questionCount: 900,
        icon: '🤖',
        color: '#e3f2fd',
        status: '',
      },
    ],
  },

  onExamTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'ai-trainer') {
      wx.navigateTo({ url: '/pages/ai-exam/index' })
    }
  },
})
