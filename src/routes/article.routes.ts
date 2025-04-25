import Router from 'koa-router';
import { ArticleController } from '../controllers/article.controller';
import { authMiddleware } from '../middlewares/auth';

const router = new Router({ prefix: '/api/articles' });

// 获取文章列表（分页，公开）
router.get('/', ArticleController.getArticles);

// 获取我的文章列表（分页，需登录）
router.get('/my', authMiddleware, ArticleController.getMyArticles);


// 获取文章详情（公开）
router.get('/:id', ArticleController.getArticleById);

// 创建文章（需要登录）
router.post('/', authMiddleware, ArticleController.createArticle);

// 删除文章（需要登录，只能删除自己的文章）
router.delete('/:id', authMiddleware, ArticleController.deleteArticle);

export default router; 