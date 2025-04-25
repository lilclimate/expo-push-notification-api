import mongoose from 'mongoose';
import { Follow, IFollow } from '../models/Follow';
import { User, IUser } from '../models/User';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class FollowService {
  /**
   * 关注用户
   * @param followerId 关注者ID
   * @param followingId 被关注者ID
   * @returns 关注记录
   */
  async followUser(followerId: string, followingId: string): Promise<IFollow> {
    // 验证用户IDs格式
    if (!mongoose.isValidObjectId(followerId) || !mongoose.isValidObjectId(followingId)) {
      throw new BadRequestError('无效的用户ID');
    }

    // 检查自关注
    if (followerId === followingId) {
      throw new BadRequestError('不能关注自己');
    }

    // 检查用户是否存在
    const [follower, following] = await Promise.all([
      User.findById(followerId),
      User.findById(followingId)
    ]);

    if (!follower || !following) {
      throw new NotFoundError('用户不存在');
    }

    try {
      // 创建关注关系
      const follow = await Follow.create({
        follower: followerId,
        following: followingId
      });

      return follow;
    } catch (error: any) {
      // 处理重复关注错误
      if (error.code === 11000) {
        throw new BadRequestError('已经关注该用户');
      }
      throw error;
    }
  }

  /**
   * 取消关注
   * @param followerId 关注者ID
   * @param followingId 被关注者ID
   * @returns 是否成功取消
   */
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    // 验证用户IDs格式
    if (!mongoose.isValidObjectId(followerId) || !mongoose.isValidObjectId(followingId)) {
      throw new BadRequestError('无效的用户ID');
    }

    const result = await Follow.deleteOne({
      follower: followerId,
      following: followingId
    });

    return result.deletedCount > 0;
  }

  /**
   * 获取用户关注列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @param currentUserId 当前登录用户ID（可选，用于标记是否已关注）
   * @returns 关注用户列表及总数
   */
  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string
  ): Promise<{ users: any[], total: number }> {
    // 验证用户ID格式
    if (!mongoose.isValidObjectId(userId)) {
      throw new BadRequestError('无效的用户ID');
    }

    const skip = (page - 1) * limit;
    
    // 查询关注列表
    const follows = await Follow.find({ follower: userId })
      .skip(skip)
      .limit(limit)
      .populate('following', 'username email')
      .sort({ createdAt: -1 });

    // 查询总数
    const total = await Follow.countDocuments({ follower: userId });

    let users = follows.map(follow => follow.following);

    // 如果提供了当前用户ID，标记是否已关注
    if (currentUserId && mongoose.isValidObjectId(currentUserId)) {
      // 查询当前用户关注的用户ID列表
      const currentUserFollowing = await Follow.find(
        { follower: currentUserId },
        { following: 1, _id: 0 }
      );
      
      const followingSet = new Set(
        currentUserFollowing.map(f => f.following.toString())
      );

      users = users.map((user: any) => {
        const userObj = user.toObject();
        userObj.isFollowing = followingSet.has(user._id.toString());
        return userObj;
      });
    }

    return { users, total };
  }

  /**
   * 获取用户粉丝列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @param currentUserId 当前登录用户ID（可选，用于标记是否已关注）
   * @returns 粉丝用户列表及总数
   */
  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string
  ): Promise<{ users: any[], total: number }> {
    // 验证用户ID格式
    if (!mongoose.isValidObjectId(userId)) {
      throw new BadRequestError('无效的用户ID');
    }

    const skip = (page - 1) * limit;
    
    // 查询粉丝列表
    const follows = await Follow.find({ following: userId })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'username email')
      .sort({ createdAt: -1 });

    // 查询总数
    const total = await Follow.countDocuments({ following: userId });

    let users = follows.map(follow => follow.follower);

    // 如果提供了当前用户ID，标记是否已关注
    if (currentUserId && mongoose.isValidObjectId(currentUserId)) {
      // 查询当前用户关注的用户ID列表
      const currentUserFollowing = await Follow.find(
        { follower: currentUserId },
        { following: 1, _id: 0 }
      );
      
      const followingSet = new Set(
        currentUserFollowing.map(f => f.following.toString())
      );

      users = users.map((user: any) => {
        const userObj = user.toObject();
        userObj.isFollowing = followingSet.has(user._id.toString());
        return userObj;
      });
    }

    return { users, total };
  }

  /**
   * 检查关注状态
   * @param id 查询用户id
   * @param targetId 目标用户id
   * @returns 是否已关注
   */
  async checkFollowStatus(id: string, targetId: string): Promise<{ isFollowing: boolean, isFollower: boolean }> {
    // 验证用户IDs格式
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(targetId)) {
      throw new BadRequestError('无效的用户ID');
    }

    const isFollowing = await Follow.countDocuments({
      follower: id,
      following:targetId 
    }) > 0;

    const isFollower = await Follow.countDocuments({
      follower: targetId,
      following: id, 
    }) > 0;

    return {
      isFollowing,
      isFollower
    };
  }

  /**
   * 获取用户关注和粉丝数
   * @param userId 用户ID
   * @returns 关注数和粉丝数
   */
  async getFollowCounts(userId: string): Promise<{ following: number, followers: number }> {
    // 验证用户ID格式
    if (!mongoose.isValidObjectId(userId)) {
      throw new BadRequestError('无效的用户ID');
    }

    const [followingCount, followersCount] = await Promise.all([
      Follow.countDocuments({ follower: userId }),
      Follow.countDocuments({ following: userId })
    ]);

    return {
      following: followingCount,
      followers: followersCount
    };
  }
} 