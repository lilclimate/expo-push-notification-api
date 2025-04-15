import Router from 'koa-router';
import * as userController from '../controllers/user.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth';

const router = new Router({
  prefix: '/api/users',
});

// 需要管理员权限的路由
// 获取用户列表
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);

// 获取单个用户
router.get('/:id', authMiddleware, adminMiddleware, userController.getUserById);

// 更新用户
router.put('/:id', authMiddleware, adminMiddleware, userController.updateUser);

// 切换用户状态（启用/禁用）
router.patch('/:id/status', authMiddleware, adminMiddleware, userController.toggleUserStatus);

// 更改用户角色
router.patch('/:id/role', authMiddleware, adminMiddleware, userController.changeUserRole);

// 删除用户
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

export default router; 