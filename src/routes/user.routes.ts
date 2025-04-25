import Router from 'koa-router';
import * as userController from '../controllers/user.controller';
import { FollowController } from '../controllers/follow.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth';

const router = new Router({
  prefix: '/api/users',
});

const followController = new FollowController();

// 用户管理路由 - 管理员权限
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

// 关注功能路由
// 关注用户
router.post('/:id/follow', authMiddleware, followController.followUser);

// 取消关注
router.delete('/:id/follow', authMiddleware, followController.unfollowUser);

// 获取用户关注列表（查看任意用户的关注列表）
router.get('/:id/following', followController.getFollowing);

// 获取用户粉丝列表（查看任意用户的粉丝列表）
router.get('/:id/followers', followController.getFollowers);

// 检查关注状态（需要登录）
router.get('/:id/follow/status', authMiddleware, followController.checkFollowStatus);

// 获取关注和粉丝数统计
router.get('/:id/follow/count', followController.getFollowCounts);

export default router; 