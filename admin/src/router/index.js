import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Notices from '../views/Notices.vue'
import Scores from '../views/Scores.vue'
import QuestionBanks from '../views/QuestionBanks.vue'
import MockExam from '../views/MockExam.vue'
import Notes from '../views/Notes.vue'
import Prizes from '../views/Prizes.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/qb',
      children: [
        { path: 'qb', name: 'qb', component: QuestionBanks, meta: { title: '题库管理' } },
        { path: 'mock-exam', name: 'mock-exam', component: MockExam, meta: { title: '模拟考试' } },
        { path: 'notes', name: 'notes', component: Notes, meta: { title: '学习笔记' } },
        { path: 'notices', name: 'notices', component: Notices, meta: { title: '社区公告' } },
        { path: 'prizes', name: 'prizes', component: Prizes, meta: { title: '积分奖品' } },
        { path: 'scores', name: 'scores', component: Scores, meta: { title: '用户积分' } },
        { path: 'settings', name: 'settings', component: Settings, meta: { title: '账号设置' } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = sessionStorage.getItem('admin_token')
  if (!to.meta.public && !token) return { name: 'login' }
  if (to.name === 'login' && token) return { name: 'qb' }
  return true
})

export default router
