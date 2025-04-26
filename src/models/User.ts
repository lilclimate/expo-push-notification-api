import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserPlatform {
  NORMAL = 1,
  GOOGLE = 2,
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshToken?: string;
  platform: UserPlatform;
  openId?: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请提供有效的邮箱地址'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
    },
    platform: {
      type: Number,
      enum: [UserPlatform.NORMAL, UserPlatform.GOOGLE],
      default: UserPlatform.NORMAL,
    },
    openId: {
      type: String,
      default: '',
    },
    picture: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// 保存前加密密码
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// 比较密码方法
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema); 