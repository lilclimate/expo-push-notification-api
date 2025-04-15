import { Context, Next } from 'koa';
import { verifyToken } from '../utils/jwt';
import { User, UserRole } from '../models/User';

// 验证用户是否登录
export const authMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  try {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = { message: '未提供访问令牌' };
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      ctx.status = 401;
      ctx.body = { message: '无效或过期的令牌' };
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      ctx.status = 401;
      ctx.body = { message: '用户不存在或已被禁用' };
      return;
    }

    ctx.user = user;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: '认证失败' };
  }
};

// 检查是否为管理员
export const adminMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  try {
    if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
      ctx.status = 403;
      ctx.body = { message: '需要管理员权限' };
      return;
    }
    await next();
  } catch (error) {
    ctx.status = 403;
    ctx.body = { message: '权限验证失败' };
  }
}; 