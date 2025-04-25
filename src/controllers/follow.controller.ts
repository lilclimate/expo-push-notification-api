import { Context } from 'koa';
import { FollowService } from '../services/follow.service';
import { BadRequestError } from '../utils/errors';

const followService = new FollowService();

export class FollowController {
  /**
   * 关注用户
   * @param ctx Koa上下文
   */
  async followUser(ctx: Context): Promise<void> {
    const { id: followingId } = ctx.params;
    const followerId = ctx.user!._id!.toString();

    if (!followingId) {
      throw new BadRequestError('被关注用户ID是必须的');
    }

    const follow = await followService.followUser(followerId, followingId);

    ctx.body = {
      code: 0,
      message: '关注成功',
      data: {
        id: follow._id,
        following: follow.following
      }
    };
  }

  /**
   * 取消关注
   * @param ctx Koa上下文
   */
  async unfollowUser(ctx: Context): Promise<void> {
    const { id: followingId } = ctx.params;
    const followerId = ctx.user!._id!.toString();

    if (!followingId) {
      throw new BadRequestError('被关注用户ID是必须的');
    }

    const result = await followService.unfollowUser(followerId, followingId);

    ctx.body = {
      code: 0,
      message: result ? '已取消关注' : '未关注该用户',
      data: null
    };
  }

  /**
   * 获取用户关注列表
   * @param ctx Koa上下文
   */
  async getFollowing(ctx: Context): Promise<void> {
    const { id: userId } = ctx.params;
    const { page = 1, limit = 20 } = ctx.query;
    
    // 当前登录用户ID（可选）
    const currentUserId =  ctx.user?._id?.toString() || '';

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const { users, total } = await followService.getFollowing(
      userId,
      pageNum,
      limitNum,
      currentUserId
    );

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        users,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    };
  }

  /**
   * 获取用户粉丝列表
   * @param ctx Koa上下文
   */
  async getFollowers(ctx: Context): Promise<void> {
    const { id: userId } = ctx.params;
    const { page = 1, limit = 20 } = ctx.query;
    
    // 当前登录用户ID（可选）
    const currentUserId = ctx.user?._id?.toString() || "";

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const { users, total } = await followService.getFollowers(
      userId,
      pageNum,
      limitNum,
      currentUserId
    );

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        users,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    };
  }

  /**
   * 检查关注状态
   * @param ctx Koa上下文
   */
  async checkFollowStatus(ctx: Context): Promise<void> {
    const { target } = ctx.query;
    const followerId = ctx.state.user._id;

    if (!target) {
      throw new BadRequestError('目标用户ID是必须的');
    }

    const isFollowing = await followService.checkFollowStatus(
      followerId,
      target as string
    );

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        isFollowing
      }
    };
  }

  /**
   * 获取关注和粉丝数统计
   * @param ctx Koa上下文
   */
  async getFollowCounts(ctx: Context): Promise<void> {
    const { id: userId } = ctx.params;

    const counts = await followService.getFollowCounts(userId);

    ctx.body = {
      code: 0,
      message: 'success',
      data: counts
    };
  }
} 