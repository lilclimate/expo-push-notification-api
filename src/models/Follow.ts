import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower: Types.ObjectId; // 关注者ID
  following: Types.ObjectId; // 被关注者ID
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    follower: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    following: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  },
  {
    timestamps: true
  }
);

// 创建复合唯一索引，确保不会重复关注
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// 创建索引以加速查询
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export const Follow = mongoose.model<IFollow>('Follow', followSchema); 