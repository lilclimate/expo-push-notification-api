import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import registerRoutes from './routes';
import { errorMiddleware } from './middlewares/error';
import { initializeSystem } from './utils/init';

// 加载环境变量
dotenv.config();

// 创建Koa实例
const app = new Koa();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB().then(() => {
  // 初始化系统
  initializeSystem();
});

// 中间件
app.use(cors());
app.use(bodyParser());
app.use(errorMiddleware);

// 注册路由
registerRoutes(app);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

export default app; 