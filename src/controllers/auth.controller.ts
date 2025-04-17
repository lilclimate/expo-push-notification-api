import { Context } from 'koa';
import { User, UserRole } from '../models/User';
import { registerValidation, loginValidation } from '../utils/validation';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';

// 用户注册
export const register = async (ctx: Context): Promise<void> => {
  // 验证请求数据
  const { error } = registerValidation(ctx.request.body as any);
  if (error) {
    ctx.status = 400;
    ctx.body = { message: error.details[0].message };
    return;
  }

  try {
    const { username, email, password } = ctx.request.body as any;

    // 检查邮箱是否已存在
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      ctx.status = 400;
      ctx.body = { message: '邮箱已被注册' };
      return;
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      role: UserRole.USER,
    });

    // 保存用户
    const savedUser = await user.save();

    // 生成令牌
    const accessTokenData = generateAccessToken(savedUser);
    const refreshTokenData = generateRefreshToken(savedUser);

    // 更新用户的刷新令牌
    savedUser.refreshToken = refreshTokenData.token;
    await savedUser.save();

    ctx.status = 201;
    ctx.body = {
      message: '注册成功',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
      },
      accessToken: accessTokenData.token,
      accessTokenExpiresAt: accessTokenData.expiresAt,
      refreshToken: refreshTokenData.token,
      refreshTokenExpiresAt: refreshTokenData.expiresAt,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '注册过程中发生错误' };
  }
};

// 用户登录
export const login = async (ctx: Context): Promise<void> => {
  // 验证请求数据
  const { error } = loginValidation(ctx.request.body as any);
  if (error) {
    ctx.status = 400;
    ctx.body = { message: error.details[0].message };
    return;
  }

  try {
    const { email, password, rememberMe } = ctx.request.body as any;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      ctx.status = 400;
      ctx.body = { message: '邮箱或密码不正确' };
      return;
    }

    // 检查用户状态
    if (!user.isActive) {
      ctx.status = 403;
      ctx.body = { message: '账号已被禁用' };
      return;
    }

    // 验证密码
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      ctx.status = 400;
      ctx.body = { message: '邮箱或密码不正确' };
      return;
    }

    // 生成令牌
    const accessTokenData = generateAccessToken(user);
    const refreshTokenData = generateRefreshToken(user);

    // 更新用户的刷新令牌
    user.refreshToken = refreshTokenData.token;
    await user.save();

    ctx.status = 200;
    ctx.body = {
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken: accessTokenData.token,
      accessTokenExpiresAt: accessTokenData.expiresAt,
      refreshToken: refreshTokenData.token,
      refreshTokenExpiresAt: refreshTokenData.expiresAt,
      rememberMe: !!rememberMe,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '登录过程中发生错误' };
  }
};

// 刷新令牌
export const refreshToken = async (ctx: Context): Promise<void> => {
  try {
    const { refreshToken: requestRefreshToken } = ctx.request.body as { refreshToken: string };

    if (!requestRefreshToken) {
      ctx.status = 400;
      ctx.body = { message: '刷新令牌不能为空' };
      return;
    }

    // 验证刷新令牌
    const decoded = verifyToken(requestRefreshToken);
    if (!decoded) {
      ctx.status = 401;
      ctx.body = { message: '无效或过期的刷新令牌' };
      return;
    }

    // 查找用户并验证刷新令牌
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: requestRefreshToken,
    });

    if (!user || !user.isActive) {
      ctx.status = 401;
      ctx.body = { message: '无效的刷新令牌或用户已被禁用' };
      return;
    }

    // 生成新的令牌
    const newAccessTokenData = generateAccessToken(user);
    const newRefreshTokenData = generateRefreshToken(user);

    // 更新用户的刷新令牌
    user.refreshToken = newRefreshTokenData.token;
    await user.save();

    ctx.status = 200;
    ctx.body = {
      accessToken: newAccessTokenData.token,
      accessTokenExpiresAt: newAccessTokenData.expiresAt,
      refreshToken: newRefreshTokenData.token,
      refreshTokenExpiresAt: newRefreshTokenData.expiresAt,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '刷新令牌过程中发生错误' };
  }
};

// 登出
export const logout = async (ctx: Context): Promise<void> => {
  try {
    const { refreshToken } = ctx.request.body as { refreshToken: string };

    if (!refreshToken) {
      ctx.status = 400;
      ctx.body = { message: '刷新令牌不能为空' };
      return;
    }

    // 查找并更新用户的刷新令牌
    const user = await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } },
      { new: true }
    );

    if (!user) {
      ctx.status = 400;
      ctx.body = { message: '无效的刷新令牌' };
      return;
    }

    ctx.status = 200;
    ctx.body = { message: '登出成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '登出过程中发生错误' };
  }
}; 