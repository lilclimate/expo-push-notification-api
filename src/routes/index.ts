import { Context } from 'koa';
import Router from 'koa-router';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = new Router();

// 健康检查路由
router.get('/health', async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = {
    status: 'success',
    message: 'API 运行正常',
    timestamp: new Date(),
  };
});

// 注册所有路由
const registerRoutes = (app: any) => {
  app.use(router.routes()).use(router.allowedMethods());
  app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
  app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
};

export default registerRoutes; 