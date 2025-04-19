import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// 从环境变量中获取Google OAuth配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

// Google OAuth2 客户端
const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// Google用户信息接口
interface GoogleApiUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

/**
 * 获取Google OAuth授权URL
 * @returns 授权URL
 */
export const getGoogleAuthUrl = (): string => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

/**
 * 通过授权码获取访问令牌
 * @param code 授权码
 * @returns 访问令牌
 */
export const getTokenFromCode = async (code: string): Promise<string> => {
  const { tokens } = await oAuth2Client.getToken(code);
  const accessToken = tokens.access_token;
  
  if (!accessToken) {
    throw new Error('获取访问令牌失败');
  }

  return accessToken;
};

/**
 * 获取Google用户信息
 * @param accessToken 访问令牌
 * @returns 用户信息
 */
export const getGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  try {
    oAuth2Client.setCredentials({ access_token: accessToken });
    
    const response = await axios.get<GoogleApiUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userInfo = response.data;
    
    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name || userInfo.email.split('@')[0],
      picture: userInfo.picture || '',
    };
  } catch (error) {
    console.error('获取Google用户信息出错:', error);
    throw new Error('获取Google用户信息失败');
  }
}; 