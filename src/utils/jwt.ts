import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  token: string;
  expiresAt: number; // 过期时间的时间戳（毫秒）
}

// 将时间字符串转换为毫秒数
const parseExpiryToMs = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhdw])$/);
  if (!match) return 24 * 60 * 60 * 1000; // 默认24小时

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000; // 秒
    case 'm': return value * 60 * 1000; // 分钟
    case 'h': return value * 60 * 60 * 1000; // 小时
    case 'd': return value * 24 * 60 * 60 * 1000; // 天
    case 'w': return value * 7 * 24 * 60 * 60 * 1000; // 周
    default: return 24 * 60 * 60 * 1000; // 默认24小时
  }
};

// 生成访问令牌
export const generateAccessToken = (user: IUser): TokenResponse => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  // 计算过期时间（当前时间 + 过期时间）
  const expiryMs = parseExpiryToMs(JWT_EXPIRY);
  const expiresAt = Date.now() + expiryMs;

  // 使用any临时解决类型问题
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as any);
  
  return {
    token,
    expiresAt
  };
};

// 生成刷新令牌
export const generateRefreshToken = (user: IUser): TokenResponse => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  // 计算过期时间（当前时间 + 过期时间）
  const expiryMs = parseExpiryToMs(JWT_REFRESH_EXPIRY);
  const expiresAt = Date.now() + expiryMs;

  // 使用any临时解决类型问题
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY } as any);
  
  return {
    token,
    expiresAt
  };
};

// 验证令牌
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}; 