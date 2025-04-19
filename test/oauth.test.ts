import request from 'supertest';
import app from '../src/app';
import { UserPlatform } from '../src/models/User';
import * as oauthService from '../src/services/oauth.service';

// 定义 UserMock
const mockSave = jest.fn();
type UserInstance = {
  save: typeof mockSave;
  [key: string]: any;
};
interface UserStatic extends jest.Mock {
  findOne: jest.Mock;
  findById: jest.Mock;
  findOneAndUpdate: jest.Mock;
  deleteMany: jest.Mock;
}
const UserMock: UserStatic = Object.assign(
  jest.fn(function (this: UserInstance, data: any) {
    Object.assign(this, data);
    this.save = mockSave;
  }),
  {
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
  }
) as any;

// 使用 doMock 而不是 mock
jest.doMock('../src/models/User', () => {
  const actual = jest.requireActual('../src/models/User');
  return {
    ...actual,
    User: UserMock,
  };
});

// 确保在 doMock 后再 require
const { User } = require('../src/models/User');

// 模拟OAuth服务
jest.mock('../src/services/oauth.service', () => ({
  getGoogleAuthUrl: jest.fn(),
  getTokenFromCode: jest.fn(),
  getGoogleUserInfo: jest.fn(),
}));

describe('OAuth Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockReset();
  });

  describe('GET /api/auth/google', () => {
    it('应该返回Google授权URL', async () => {
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/auth?client_id=...';
      (oauthService.getGoogleAuthUrl as jest.Mock).mockReturnValue(mockAuthUrl);
      
      const response = await request(app.callback())
        .get('/api/auth/google')
        .expect(200);
      
      expect(response.body).toHaveProperty('url', mockAuthUrl);
      expect(oauthService.getGoogleAuthUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('应该处理Google回调并创建新用户', async () => {
      (oauthService.getTokenFromCode as jest.Mock).mockResolvedValue('mock-access-token');
      (oauthService.getGoogleUserInfo as jest.Mock).mockResolvedValue({
        id: 'google-user-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
      });
      // 用户不存在，邮箱也不存在
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockSave.mockResolvedValue({
        _id: 'mock-id',
        username: 'Test User',
        email: 'test@example.com',
        platform: UserPlatform.GOOGLE,
        openId: 'google-user-id',
        save: jest.fn(),
      });
      
      const response = await request(app.callback())
        .get('/api/auth/google/callback')
        .query({ code: 'mock-authorization-code', redirectUri: 'myapp://auth/callback' });
      
      expect(oauthService.getTokenFromCode).toHaveBeenCalledWith('mock-authorization-code');
      expect(oauthService.getGoogleUserInfo).toHaveBeenCalledWith('mock-access-token');
      expect(User.findOne).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('myapp://auth/callback');
      expect(response.headers.location).toContain('accessToken=');
      expect(response.headers.location).toContain('refreshToken=');
    });

    it('应该处理Google回调，如果用户已存在则关联账号', async () => {
      const existingUser = {
        _id: 'mock-id',
        username: 'Existing User',
        email: 'test@example.com',
        platform: UserPlatform.NORMAL,
        openId: '',
        save: jest.fn().mockResolvedValue({
          _id: 'mock-id',
          username: 'Existing User',
          email: 'test@example.com',
          platform: UserPlatform.GOOGLE,
          openId: 'google-user-id',
        }),
      };
      (oauthService.getTokenFromCode as jest.Mock).mockResolvedValue('mock-access-token');
      (oauthService.getGoogleUserInfo as jest.Mock).mockResolvedValue({
        id: 'google-user-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
      });
      // 用户不存在，邮箱存在
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existingUser);
      
      await request(app.callback())
        .get('/api/auth/google/callback')
        .query({ code: 'mock-authorization-code', redirectUri: 'myapp://auth/callback' });
      
      expect(existingUser.save).toHaveBeenCalled();
    });

    it('应该返回400，如果没有提供授权码', async () => {
      const response = await request(app.callback())
        .get('/api/auth/google/callback')
        .expect(400);
      
      expect(response.body).toHaveProperty('message', '无效的授权码');
    });
  });
}); 