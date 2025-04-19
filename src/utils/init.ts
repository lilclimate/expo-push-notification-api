import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, UserPlatform, UserRole } from '../models/User';

dotenv.config();

// 创建超级管理员账号
export const initAdminUser = async (): Promise<void> => {
  try {
    // 获取环境变量中的管理员信息
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 检查管理员账号是否已存在
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log('超级管理员账号已存在，跳过初始化');
      return;
    }

    // 创建管理员账号
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      username: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      platform: UserPlatform.NORMAL,
      openId: '',
    });

    await admin.save();
    console.log('超级管理员账号创建成功');
  } catch (error) {
    console.error('初始化超级管理员失败:', error);
  }
};

// 初始化基础权限
export const initPermissions = async (): Promise<void> => {
  // 这里可以实现基础权限初始化逻辑
  // 比如创建基本的权限项，如用户管理、系统设置等
  console.log('基础权限初始化成功');
};

// 系统初始化函数
export const initializeSystem = async (): Promise<void> => {
  try {
    await initAdminUser();
    await initPermissions();
    console.log('系统初始化完成');
  } catch (error) {
    console.error('系统初始化失败:', error);
  }
}; 