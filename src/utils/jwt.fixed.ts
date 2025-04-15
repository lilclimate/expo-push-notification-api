import jwt, { SignOptions } from 'jsonwebtoken';
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

// 生成访问令牌
export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRY
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// 生成刷新令牌
export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// 验证令牌
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}; 