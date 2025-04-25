import { Context } from 'koa';
import { Article } from '../models/Article';
import mongoose from 'mongoose';

export class ArticleController {
  // 创建新文章
  static async createArticle(ctx: Context): Promise<void> {
    try {
      const { title, content, images } = ctx.request.body as {
        title: string;
        content: string;
        images?: string[];
      };
      const userId = ctx.user?._id;

      if (!title || !content) {
        ctx.status = 400;
        ctx.body = { message: '标题和内容不能为空' };
        return;
      }

      const article = new Article({
        title,
        content,
        images: images || [],
        userId,
      });

      await article.save();

      ctx.status = 201;
      ctx.body = {
        message: '文章创建成功',
        data: article,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: '创建文章失败', error: (error as Error).message };
    }
  }

  // 软删除文章
  static async deleteArticle(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      const userId = ctx.user?._id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        ctx.status = 400;
        ctx.body = { message: '无效的文章ID' };
        return;
      }

      const article = await Article.findById(id);

      if (!article) {
        ctx.status = 404;
        ctx.body = { message: '文章不存在' };
        return;
      }

      if (article.userId.toString() !== userId?.toString()) {
        ctx.status = 403;
        ctx.body = { message: '您没有权限删除此文章' };
        return;
      }

      article.isDeleted = true;
      await article.save();

      ctx.status = 200;
      ctx.body = {
        message: '文章删除成功',
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: '删除文章失败', error: (error as Error).message };
    }
  }

  // 获取所有未删除的文章（分页）
  static async getArticles(ctx: Context): Promise<void> {
    try {
      const page = parseInt(ctx.query.page as string) || 1;
      const limit = parseInt(ctx.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const articles = await Article.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email'); // 关联用户信息，获取username

      const total = await Article.countDocuments({ isDeleted: false });

      ctx.status = 200;
      ctx.body = {
        message: '获取文章列表成功',
        data: {
          articles,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: '获取文章列表失败', error: (error as Error).message };
    }
  }

  // 获取我的文章列表（分页，需登录）
  static async getMyArticles(ctx: Context): Promise<void> {
    try {
      const userId = ctx.user?._id;
      const page = parseInt(ctx.query.page as string) || 1;
      const limit = parseInt(ctx.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 只查询当前登录用户的文章（包括已删除的文章，可以通过查询参数控制）
      const showDeleted = ctx.query.showDeleted === 'true';
      const query = { userId };
      
      if (!showDeleted) {
        Object.assign(query, { isDeleted: false });
      }

      const articles = await Article.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email'); // 关联用户信息

      const total = await Article.countDocuments(query);

      ctx.status = 200;
      ctx.body = {
        message: '获取我的文章列表成功',
        data: {
          articles,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: '获取我的文章列表失败', error: (error as Error).message };
    }
  }

  static async getUserArticles(ctx: Context): Promise<void> {
    try {
      const {userId} = ctx.params;
      const page = parseInt(ctx.query.page as string) || 1;
      const limit = parseInt(ctx.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 只查询当前登录用户的文章（包括已删除的文章，可以通过查询参数控制）
      const showDeleted = ctx.query.showDeleted === 'true';
      const query = { userId };
      
      if (!showDeleted) {
        Object.assign(query, { isDeleted: false });
      }

      const articles = await Article.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email'); // 关联用户信息

      const total = await Article.countDocuments(query);

      ctx.status = 200;
      ctx.body = {
        message: '获取用户的文章列表成功',
        data: {
          articles,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: '获取用户的文章列表失败', error: (error as Error).message };
    }
  }

  // 获取单篇文章详情
  static async getArticleById(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        ctx.status = 400;
        ctx.body = { message: '无效的文章ID' };
        return;
      }

      const article = await Article.findOne({ _id: id, isDeleted: false })
        .populate('userId', 'username email'); // 关联用户信息，获取username

      if (!article) {
        ctx.status = 404;
        ctx.body = { message: '文章不存在或已被删除' };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        message: '获取文章详情成功',
        data: article,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: '获取文章详情失败', error: (error as Error).message };
    }
  }
} 