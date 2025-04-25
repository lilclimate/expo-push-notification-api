# 用户系统 API

基于 Koa + MongoDB 的用户系统 API，提供用户注册登录、权限管理和用户管理功能。

## 功能特性

- **用户注册与登录**
  - 邮箱+密码注册
  - 登录返回JWT令牌
  - 支持令牌刷新和过期机制
  - 记住密码功能

- **权限管理**
  - 基于RBAC模型的权限系统
  - 超级管理员和普通用户角色
  - 接口级权限控制

- **用户管理**
  - 用户列表查询（分页、搜索、筛选）
  - 用户信息编辑
  - 用户启用/禁用
  - 用户角色分配
  - 用户删除（软删除）

## 用户关注/粉丝功能

该项目实现了完整的用户关注/粉丝系统，支持以下功能：

### 主要功能

- 用户关注：用户可以关注其他用户
- 取消关注：用户可以取消对已关注用户的关注
- 关注列表：用户可以查看自己或其他用户的关注列表
- 粉丝列表：用户可以查看自己或其他用户的粉丝列表
- 关注状态：检查用户是否已关注特定用户
- 统计数据：获取用户的关注数和粉丝数

### API 端点

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST   | /api/user/:id/follow     | 关注用户 | 需要登录 |
| DELETE | /api/user/:id/follow     | 取消关注 | 需要登录 |
| GET    | /api/user/:id/following  | 获取关注列表 | 公开 |
| GET    | /api/user/:id/followers  | 获取粉丝列表 | 公开 |
| GET    | /api/user/:id/follow/status?target=xxx | 查询是否关注 | 需要登录 |
| GET    | /api/user/:id/follow/count | 获取关注/粉丝数 | 公开 |

所有返回的列表数据均支持分页查询。

## 技术栈

- **后端框架**: Koa2
- **数据库**: MongoDB
- **鉴权**: JWT (JSON Web Token)
- **测试**: Jest + Supertest
- **开发语言**: TypeScript

## 开始使用

### 环境要求

- Node.js 14+
- MongoDB 4.2+

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd <project-folder>

# 安装依赖
yarn install
```

### 配置

创建 `.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/user-system
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 开发

```bash
# 开发模式启动
yarn dev

# 构建
yarn build

# 生产环境启动
yarn start

# 运行测试
yarn test
```

## API 接口文档

### 认证接口

| 方法   | 路径                      | 描述         | 权限   |
|--------|---------------------------|-------------|--------|
| POST   | /api/auth/register        | 用户注册     | 公开   |
| POST   | /api/auth/login           | 用户登录     | 公开   |
| POST   | /api/auth/refresh-token   | 刷新令牌     | 公开   |
| POST   | /api/auth/logout          | 用户登出     | 公开   |

### 用户管理接口

| 方法   | 路径                      | 描述           | 权限   |
|--------|---------------------------|---------------|--------|
| GET    | /api/users                | 获取用户列表   | 管理员 |
| GET    | /api/users/:id            | 获取单个用户   | 管理员 |
| PUT    | /api/users/:id            | 更新用户信息   | 管理员 |
| PATCH  | /api/users/:id/status     | 切换用户状态   | 管理员 |
| PATCH  | /api/users/:id/role       | 更改用户角色   | 管理员 |
| DELETE | /api/users/:id            | 删除用户      | 管理员 |

## 系统初始化

系统首次启动时会自动初始化超级管理员账号，初始化信息在 `.env` 文件中配置。 