import Router from 'koa-router';
import * as authController from '../controllers/auth.controller';

const router = new Router({
  prefix: '/api/auth',
});

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 登出
router.post('/logout', authController.logout);

// Google OAuth路由
router.get('/google', authController.googleAuthUrl);
router.get('/google/callback', authController.googleCallback);

export default router; 