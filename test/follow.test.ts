import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import supertest from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { Follow } from '../src/models/Follow';
import * as jwtUtil from '../src/utils/jwt';

const request = supertest(app.callback());

describe('关注功能测试', () => {
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let authToken: string;

  // 模拟用户数据
  const user1 = {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser1',
    email: 'test1@example.com',
    role: 'user',
  };

  const user2 = {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser2',
    email: 'test2@example.com',
    role: 'user',
  };

  const user3 = {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser3',
    email: 'test3@example.com',
    role: 'user',
  };

  beforeAll(async () => {
    // 保存用户IDs
    user1Id = user1._id.toString();
    user2Id = user2._id.toString();
    user3Id = user3._id.toString();

    // 模拟 JWT 验证
    jest.spyOn(jwtUtil, 'verifyToken').mockImplementation(() => ({
      userId: user1Id,
    }));

    // 模拟认证中间件
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      if (id === user1Id) return Promise.resolve(user1 as any);
      if (id === user2Id) return Promise.resolve(user2 as any);
      if (id === user3Id) return Promise.resolve(user3 as any);
      return Promise.resolve(null);
    });

    // 生成测试用的认证令牌
    authToken = 'test-auth-token';
  });

  afterEach(() => {
    // 清除所有模拟数据
    jest.clearAllMocks();
  });

  describe('关注用户', () => {
    it('应该成功关注用户', async () => {
      // 模拟 Follow.create
      jest.spyOn(Follow, 'create').mockImplementationOnce(() => 
        Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          follower: user1Id,
          following: user2Id,
          createdAt: new Date()
        } as any)
      );

      const response = await request
        .post(`/api/user/${user2Id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.message).toBe('关注成功');
      expect(response.body.data).toBeDefined();
      expect(Follow.create).toHaveBeenCalledWith({
        follower: user1Id,
        following: user2Id
      });
    });

    it('不应该允许关注自己', async () => {
      const response = await request
        .post(`/api/user/${user1Id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBeDefined();
      expect(response.body.message).toContain('不能关注自己');
    });

    it('尝试关注不存在的用户应返回错误', async () => {
      const nonExistingUserId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.resolve(null));

      const response = await request
        .post(`/api/user/${nonExistingUserId}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('用户不存在');
    });

    it('重复关注应返回错误', async () => {
      // 模拟重复关注错误
      jest.spyOn(Follow, 'create').mockImplementationOnce(() => {
        const error: any = new Error('E11000 duplicate key error');
        error.code = 11000;
        return Promise.reject(error);
      });

      const response = await request
        .post(`/api/user/${user2Id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('已经关注该用户');
    });
  });

  describe('取消关注', () => {
    it('应该成功取消关注', async () => {
      // 模拟 Follow.deleteOne
      jest.spyOn(Follow, 'deleteOne').mockImplementationOnce(() => 
        Promise.resolve({ deletedCount: 1 } as any)
      );

      const response = await request
        .delete(`/api/user/${user2Id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.message).toBe('已取消关注');
      expect(Follow.deleteOne).toHaveBeenCalledWith({
        follower: user1Id,
        following: user2Id
      });
    });

    it('取消未关注的用户应返回成功但提示未关注', async () => {
      // 模拟未找到要取消的关注
      jest.spyOn(Follow, 'deleteOne').mockImplementationOnce(() => 
        Promise.resolve({ deletedCount: 0 } as any)
      );

      const response = await request
        .delete(`/api/user/${user3Id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.message).toBe('未关注该用户');
    });
  });

  describe('获取关注列表', () => {
    it('应该成功获取用户的关注列表', async () => {
      // 模拟用户关注了user2和user3
      const mockFollows = [
        {
          following: {
            _id: user2Id,
            username: user2.username,
            email: user2.email,
            toObject: () => ({
              _id: user2Id,
              username: user2.username,
              email: user2.email
            })
          }
        },
        {
          following: {
            _id: user3Id,
            username: user3.username,
            email: user3.email,
            toObject: () => ({
              _id: user3Id,
              username: user3.username,
              email: user3.email
            })
          }
        }
      ];

      // 模拟关注列表查询
      jest.spyOn(Follow, 'find').mockImplementation(() => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              sort: () => Promise.resolve(mockFollows)
            })
          })
        })
      } as any));

      // 模拟关注数量查询
      jest.spyOn(Follow, 'countDocuments').mockImplementationOnce(() => Promise.resolve(2));

      const response = await request
        .get(`/api/user/${user1Id}/following`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('获取粉丝列表', () => {
    it('应该成功获取用户的粉丝列表', async () => {
      // 模拟user2和user3关注了用户
      const mockFollowers = [
        {
          follower: {
            _id: user2Id,
            username: user2.username,
            email: user2.email,
            toObject: () => ({
              _id: user2Id,
              username: user2.username,
              email: user2.email
            })
          }
        },
        {
          follower: {
            _id: user3Id,
            username: user3.username,
            email: user3.email,
            toObject: () => ({
              _id: user3Id,
              username: user3.username,
              email: user3.email
            })
          }
        }
      ];

      // 模拟粉丝列表查询
      jest.spyOn(Follow, 'find').mockImplementation(() => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              sort: () => Promise.resolve(mockFollowers)
            })
          })
        })
      } as any));

      // 模拟粉丝数量查询
      jest.spyOn(Follow, 'countDocuments').mockImplementationOnce(() => Promise.resolve(2));

      const response = await request
        .get(`/api/user/${user1Id}/followers`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('关注状态检查', () => {
    it('应该正确检查用户是否已关注目标用户', async () => {
      // 模拟关注状态查询 - 已关注
      jest.spyOn(Follow, 'countDocuments').mockImplementationOnce(() => Promise.resolve(1));

      const response = await request
        .get(`/api/user/${user1Id}/follow/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ target: user2Id });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.isFollowing).toBe(true);
    });

    it('应该正确检查用户是否未关注目标用户', async () => {
      // 模拟关注状态查询 - 未关注
      jest.spyOn(Follow, 'countDocuments').mockImplementationOnce(() => Promise.resolve(0));

      const response = await request
        .get(`/api/user/${user1Id}/follow/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ target: user3Id });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.isFollowing).toBe(false);
    });
  });

  describe('关注统计', () => {
    it('应该正确获取用户的关注和粉丝数量', async () => {
      // 模拟关注数量查询
      jest.spyOn(Follow, 'countDocuments')
        .mockImplementationOnce(() => Promise.resolve(5)) // 关注数
        .mockImplementationOnce(() => Promise.resolve(10)); // 粉丝数

      const response = await request
        .get(`/api/user/${user1Id}/follow/count`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.following).toBe(5);
      expect(response.body.data.followers).toBe(10);
    });
  });
}); 