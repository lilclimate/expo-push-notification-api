import { Context, Next } from 'koa';

export const errorMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || '服务器内部错误';

    ctx.status = status;
    ctx.body = {
      status: 'error',
      message,
    };

    // 记录服务器错误
    if (status === 500) {
      console.error(`服务器错误: ${err.message}`);
      console.error(err.stack);
    }
  }
}; 