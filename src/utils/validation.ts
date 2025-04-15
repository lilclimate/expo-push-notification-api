import Joi from 'joi';

// 用户注册验证
export const registerValidation = (data: any) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

// 用户登录验证
export const loginValidation = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    rememberMe: Joi.boolean(),
  });
  return schema.validate(data);
};

// 用户更新验证
export const userUpdateValidation = (data: any) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string(),
    isActive: Joi.boolean(),
  });
  return schema.validate(data);
};

// 角色创建验证
export const roleValidation = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    permissions: Joi.array().items(Joi.string()),
    isDefault: Joi.boolean(),
  });
  return schema.validate(data);
};

// 权限创建验证
export const permissionValidation = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    code: Joi.string().required(),
  });
  return schema.validate(data);
}; 