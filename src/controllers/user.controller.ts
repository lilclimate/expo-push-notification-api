import { Context } from 'koa';
import { User, UserRole } from '../models/User';
import { userUpdateValidation } from '../utils/validation';
import bcrypt from 'bcryptjs';

// 获取所有用户
export const getAllUsers = async (ctx: Context): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '', role = '', isActive } = ctx.query;
    
    const query: any = {};
    
    // 搜索条件
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // 角色过滤
    if (role) {
      query.role = role;
    }
    
    // 状态过滤
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    ctx.status = 200;
    ctx.body = {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取用户列表失败' };
  }
};

// 获取单个用户
export const getUserById = async (ctx: Context): Promise<void> => {
  try {
    const userId = ctx.params.id;
    
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    ctx.status = 200;
    ctx.body = { user };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取用户信息失败' };
  }
};

// 更新用户
export const updateUser = async (ctx: Context): Promise<void> => {
  try {
    const userId = ctx.params.id;
    const { error } = userUpdateValidation(ctx.request.body as any);
    
    if (error) {
      ctx.status = 400;
      ctx.body = { message: error.details[0].message };
      return;
    }
    
    const updateData: any = { ...(ctx.request.body as any) };
    
    // 如果更新包含密码，需要加密
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // 查找并更新用户
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password -refreshToken');
    
    if (!updatedUser) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    ctx.status = 200;
    ctx.body = {
      message: '用户信息更新成功',
      user: updatedUser,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '更新用户信息失败' };
  }
};

// 启用/禁用用户
export const toggleUserStatus = async (ctx: Context): Promise<void> => {
  try {
    const userId = ctx.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    // 不允许禁用最后一个管理员账号
    if (user.role === UserRole.ADMIN && user.isActive) {
      const adminCount = await User.countDocuments({
        role: UserRole.ADMIN,
        isActive: true,
      });
      
      if (adminCount <= 1) {
        ctx.status = 400;
        ctx.body = { message: '至少需要保留一个活跃的管理员账号' };
        return;
      }
    }
    
    // 切换用户状态
    user.isActive = !user.isActive;
    await user.save();
    
    ctx.status = 200;
    ctx.body = {
      message: user.isActive ? '用户已启用' : '用户已禁用',
      isActive: user.isActive,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '更改用户状态失败' };
  }
};

// 删除用户 (软删除)
export const deleteUser = async (ctx: Context): Promise<void> => {
  try {
    const userId = ctx.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    // 不允许删除最后一个管理员账号
    if (user.role === UserRole.ADMIN) {
      const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
      
      if (adminCount <= 1) {
        ctx.status = 400;
        ctx.body = { message: '不能删除最后一个管理员账号' };
        return;
      }
    }
    
    // 软删除用户 (将状态设为禁用并重命名邮箱防止重新注册)
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      email: `deleted_${Date.now()}_${user.email}`,
    });
    
    ctx.status = 200;
    ctx.body = { message: '用户已成功删除' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除用户失败' };
  }
};

// 更改用户角色
export const changeUserRole = async (ctx: Context): Promise<void> => {
  try {
    const userId = ctx.params.id;
    const { role } = ctx.request.body as { role: string };
    
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      ctx.status = 400;
      ctx.body = { message: '无效的角色类型' };
      return;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    // 如果是从管理员降级，确保至少有一个管理员
    if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
      
      if (adminCount <= 1) {
        ctx.status = 400;
        ctx.body = { message: '必须至少保留一个管理员' };
        return;
      }
    }
    
    // 更新用户角色
    user.role = role as UserRole;
    await user.save();
    
    ctx.status = 200;
    ctx.body = {
      message: '用户角色已更新',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '更改用户角色失败' };
  }
}; 