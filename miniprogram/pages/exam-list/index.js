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
      {
        id: 'ai-trainer-practice',
        title: '人工智能训练师实操',
        subtitle: '实操代码练习',
        totalScore: 0,
        questionCount: 20,
        icon: '💻',
        color: '#f3e5f5',
        status: '新',
      },
    ],
  },

  onExamTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'ai-trainer') {
      wx.navigateTo({ url: '/pages/ai-exam/index' })
    } else if (id === 'ai-trainer-practice') {
      wx.navigateTo({ url: '/pages/notebook-list/index' })
    }
  },
})
