# SalesPilot · AI 销售 CRM SaaS

## 详细设计文档（Low-Level Design Document）

---

| 项目       | 内容                                              |
| ---------- | ------------------------------------------------- |
| 文档编号   | SP-LLD-001                                        |
| 文档版本   | v1.0                                              |
| 关联文档   | SP-HLD-001 / SP-SRS-001                           |
| 项目名称   | SalesPilot · AI 销售 CRM                          |
| 技术栈     | Vue3 / TypeScript / Node.js / MongoDB / AI API    |
| 文档状态   | 草稿（Draft）                                     |
| 创建日期   | 2026-03-19                                        |

---

## 修订历史

| 版本  | 日期       | 修改内容           | 修改人     |
| ----- | ---------- | ------------------ | ---------- |
| v0.1  | 2026-03-19 | 初稿创建，覆盖全部模块 | 项目负责人 |
| v1.0  | 2026-03-19 | 全文审核，正式发布 | 项目负责人 |

---

## 目录

1. [引言](#1-引言)
2. [公共类型系统（TypeScript）](#2-公共类型系统typescript)
3. [数据库详细设计（Mongoose Schema）](#3-数据库详细设计mongoose-schema)
4. [后端模块详细设计](#4-后端模块详细设计)
5. [AI 模块详细设计](#5-ai-模块详细设计)
6. [前端模块详细设计](#6-前端模块详细设计)
7. [错误码与异常规范](#7-错误码与异常规范)
8. [测试设计](#8-测试设计)
9. [附录](#9-附录)

---

## 1. 引言

### 1.1 文档目的

本文档（LLD）在概要设计文档（HLD v1.0）基础上，对 SalesPilot 系统各模块进行逐类、逐函数级别的详细设计，包括：数据模型完整字段与索引定义、TypeScript 接口与类型声明、各层函数签名与职责说明、核心算法与业务逻辑伪代码、错误码规范、测试策略。

本文档是编码实现的直接依据，目标读者为项目开发者、代码评审者和开源贡献者。

### 1.2 文档范围

覆盖 SRS P0 和 P1 全部功能模块。各章节对应关系如下：

| 章节  | 设计内容                    | 对应 SRS 章节    |
| ----- | --------------------------- | ---------------- |
| 第2章 | TypeScript 公共类型系统     | 1.4 术语         |
| 第3章 | 数据库 Schema 完整设计      | 5. 数据库设计    |
| 第4章 | 后端各模块详细设计          | 3. 功能需求      |
| 第5章 | AI 模块详细设计             | 3.4 AI 功能      |
| 第6章 | 前端各模块详细设计          | 3. 功能需求      |
| 第7章 | 错误码与异常规范            | 4.1 非功能需求   |
| 第8章 | 测试设计                    | 4. 非功能需求    |

### 1.3 阅读约定

- 代码块中 `// ✅` 表示推荐写法，`// ❌` 表示禁止写法
- 接口签名使用 TypeScript 语法，返回类型均为 `Promise<T>` 除非特别说明
- 字段标注 `[idx]` 表示建有索引，`[unique]` 表示唯一索引
- 函数描述中「前置条件」为调用前必须满足的状态，「后置条件」为调用后的系统状态变化

---

## 2. 公共类型系统（TypeScript）

所有类型定义集中在 `types/` 目录，前后端共享。**禁止在业务代码中使用 `any` 类型。**

### 2.1 API 响应类型

```typescript
// types/api.d.ts

/** 统一 API 响应包装 */
export interface ApiResponse<T = unknown> {
  code:      number;       // HTTP 状态码
  message:   string;       // 人可读信息
  data:      T | null;     // 业务数据，错误时为 null
  timestamp: number;       // Unix 毫秒时间戳
}

/** 分页响应 data 字段结构 */
export interface PaginatedData<T> {
  list:  T[];
  total: number;
  page:  number;
  limit: number;
}

/** 分页查询参数 */
export interface PaginationQuery {
  page?:  number;   // 默认 1
  limit?: number;   // 默认 20，最大 100
}
```

### 2.2 认证相关类型

```typescript
// types/auth.d.ts

export type UserRole = 'admin' | 'manager' | 'sales';

export interface JwtPayload {
  userId:    string;
  companyId: string;
  role:      UserRole;
  iat:       number;
  exp:       number;
}

export interface AuthUser {
  id:        string;
  name:      string;
  email:     string;
  role:      UserRole;
  companyId: string;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;   // Access Token 有效秒数
}
```

### 2.3 客户相关类型

```typescript
// types/customer.d.ts

export type CustomerStatus =
  | 'potential' | 'following' | 'intent'
  | 'negotiating' | 'won' | 'lost';

export type CustomerSource =
  | 'website' | 'referral' | 'ad' | 'exhibition' | 'other';

export type FollowupMethod =
  | 'phone' | 'email' | 'visit' | 'wechat' | 'meeting';

export type ChurnRisk = 'high' | 'medium' | 'low' | 'none';

export interface Customer {
  id:           string;
  companyId:    string;
  name:         string;
  contact:      string;
  phone?:       string;
  email?:       string;
  industry:     string;
  status:       CustomerStatus;
  source:       CustomerSource;
  assignedTo:   string;         // User ID
  dealValue?:   number;
  aiScore:      number;         // -1 = 未分析，0-100 = AI 评分
  churnRisk:    ChurnRisk;
  lastFollowup: string | null;  // ISO date string
  tags:         string[];
  notes?:       string;
  createdAt:    string;
  updatedAt:    string;
}

export interface CreateCustomerDTO {
  name:       string;
  contact:    string;
  phone?:     string;
  email?:     string;
  industry:   string;
  source:     CustomerSource;
  dealValue?: number;
  tags?:      string[];
  notes?:     string;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  assignedTo?: string;
}

export interface FollowupRecord {
  id:           string;
  customerId:   string;
  companyId:    string;
  createdBy:    string;
  method:       FollowupMethod;
  content:      string;
  nextFollowup: string | null;
  createdAt:    string;
}

export interface CreateFollowupDTO {
  method:        FollowupMethod;
  content:       string;
  nextFollowup?: string;
}

export interface CustomerListQuery extends PaginationQuery {
  status?:     CustomerStatus | CustomerStatus[];
  assignedTo?: string;
  keyword?:    string;
  sortBy?:     'aiScore' | 'lastFollowup' | 'createdAt' | 'dealValue';
  sortOrder?:  'asc' | 'desc';
}
```

### 2.4 AI 相关类型

```typescript
// types/ai.d.ts

export type AiResultType = 'deal_prediction' | 'churn_warning';
export type AiLevel      = 'high' | 'medium' | 'low' | 'unknown';
export type SseEventType = 'start' | 'chunk' | 'done' | 'error';

export interface AiPredictionResult {
  score:      number;       // 0-100
  level:      AiLevel;
  positives:  string[];     // 正向信号，≤ 3 条
  risks:      string[];     // 风险点，≤ 3 条
  suggestion: string;
}

export interface AiResult extends AiPredictionResult {
  id:         string;
  customerId: string;
  type:       AiResultType;
  modelUsed:  string;
  createdAt:  string;
}

// SSE 事件载荷（联合类型，确保类型安全）
export type SsePayload =
  | { type: 'start';  message: string }
  | { type: 'chunk';  content: string }
  | { type: 'done';   totalTokens?: number }
  | { type: 'error';  code: string; message: string };
```

---

## 3. 数据库详细设计（Mongoose Schema）

> ⚠️ **重要**：所有 Schema 均设置 `timestamps: true`，自动管理 `createdAt` / `updatedAt`。`companyId` 为多租户隔离关键字段，所有集合必须包含，所有查询必须携带。

### 3.1 UserSchema

```typescript
// models/user.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email:       string;       // [unique]
  password:    string;       // bcrypt hash，默认不查询返回
  name:        string;
  role:        'admin' | 'manager' | 'sales';
  companyId:   Schema.Types.ObjectId;  // [idx]
  isActive:    boolean;
  lastLoginAt: Date | null;
}

const UserSchema = new Schema<IUser>({
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, select: false },  // select:false 默认不返回
  name:        { type: String, required: true, maxlength: 50 },
  role:        { type: String, enum: ['admin', 'manager', 'sales'], default: 'sales' },
  companyId:   { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  isActive:    { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

// 复合索引：公司内角色查询
UserSchema.index({ companyId: 1, role: 1 });

export const User = model<IUser>('User', UserSchema);
```

### 3.2 CustomerSchema

```typescript
// models/customer.model.ts

export interface ICustomer extends Document {
  companyId:    Schema.Types.ObjectId;
  name:         string;
  contact:      string;
  phone?:       string;
  email?:       string;
  industry:     string;
  status:       'potential' | 'following' | 'intent' | 'negotiating' | 'won' | 'lost';
  source:       'website' | 'referral' | 'ad' | 'exhibition' | 'other';
  assignedTo:   Schema.Types.ObjectId;
  dealValue?:   number;
  aiScore:      number;    // -1 = 未分析
  churnRisk:    'high' | 'medium' | 'low' | 'none';
  lastFollowup: Date | null;
  tags:         string[];
  notes?:       string;
  isDeleted:    boolean;   // 软删除标志
}

const CustomerSchema = new Schema<ICustomer>({
  companyId:    { type: Schema.Types.ObjectId, required: true },
  name:         { type: String, required: true, maxlength: 100 },
  contact:      { type: String, required: true, maxlength: 50 },
  phone:        { type: String, maxlength: 20 },
  email:        { type: String, lowercase: true },
  industry:     { type: String, required: true },
  status:       {
    type: String,
    enum: ['potential', 'following', 'intent', 'negotiating', 'won', 'lost'],
    default: 'potential',
  },
  source:       {
    type: String,
    enum: ['website', 'referral', 'ad', 'exhibition', 'other'],
  },
  assignedTo:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dealValue:    { type: Number, min: 0 },
  aiScore:      { type: Number, default: -1, min: -1, max: 100 },
  churnRisk:    { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'none' },
  lastFollowup: { type: Date, default: null },
  tags:         { type: [String], default: [] },
  notes:        { type: String, maxlength: 2000 },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

// ── 索引策略（按查询频率优先级排列）────────────────────────────────────────
// 1. 主列表查询：公司 + 软删除 + 创建时间
CustomerSchema.index({ companyId: 1, isDeleted: 1, createdAt: -1 });
// 2. 状态筛选 + 负责人筛选（最常用组合）
CustomerSchema.index({ companyId: 1, status: 1, assignedTo: 1 });
// 3. AI 评分排序
CustomerSchema.index({ companyId: 1, aiScore: -1 });
// 4. 流失预警定时扫描
CustomerSchema.index({ companyId: 1, status: 1, lastFollowup: 1 });

export const Customer = model<ICustomer>('Customer', CustomerSchema);
```

### 3.3 FollowupSchema

```typescript
// models/followup.model.ts

export interface IFollowup extends Document {
  customerId:   Schema.Types.ObjectId;
  companyId:    Schema.Types.ObjectId;  // 冗余字段，加速聚合无需 join
  createdBy:    Schema.Types.ObjectId;
  method:       'phone' | 'email' | 'visit' | 'wechat' | 'meeting';
  content:      string;                 // AI 分析的核心输入源
  nextFollowup: Date | null;
}

const FollowupSchema = new Schema<IFollowup>({
  customerId:   { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  companyId:    { type: Schema.Types.ObjectId, required: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  method:       {
    type: String,
    enum: ['phone', 'email', 'visit', 'wechat', 'meeting'],
    required: true,
  },
  content:      { type: String, required: true, maxlength: 5000 },
  nextFollowup: { type: Date, default: null },
}, { timestamps: true });

// 客户时间线查询（最高频）
FollowupSchema.index({ customerId: 1, createdAt: -1 });
// 日报聚合：当日公司内所有跟进记录
FollowupSchema.index({ companyId: 1, createdBy: 1, createdAt: -1 });

export const Followup = model<IFollowup>('Followup', FollowupSchema);
```

### 3.4 AiResultSchema

```typescript
// models/aiResult.model.ts

export interface IAiResult extends Document {
  customerId: Schema.Types.ObjectId;
  companyId:  Schema.Types.ObjectId;
  type:       'deal_prediction' | 'churn_warning';
  score:      number;
  level:      'high' | 'medium' | 'low' | 'unknown';
  positives:  string[];
  risks:      string[];
  suggestion: string;
  modelUsed:  string;   // 记录模型名，便于 A/B 测试
  rawPrompt:  string;   // 调试用，生产环境通过配置关闭
}

const AiResultSchema = new Schema<IAiResult>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  companyId:  { type: Schema.Types.ObjectId, required: true },
  type:       { type: String, enum: ['deal_prediction', 'churn_warning'], required: true },
  score:      { type: Number, default: -1 },
  level:      { type: String, enum: ['high', 'medium', 'low', 'unknown'], default: 'unknown' },
  positives:  { type: [String], default: [] },
  risks:      { type: [String], default: [] },
  suggestion: { type: String, default: '' },
  modelUsed:  { type: String, default: '' },
  rawPrompt:  { type: String, select: false },  // 默认不返回
}, { timestamps: true });

// 缓存查询：指定客户最新分析结果
AiResultSchema.index({ customerId: 1, type: 1, createdAt: -1 });

export const AiResult = model<IAiResult>('AiResult', AiResultSchema);
```

### 3.5 NotificationSchema

```typescript
// models/notification.model.ts

export interface INotification extends Document {
  companyId:    Schema.Types.ObjectId;
  targetUserId: Schema.Types.ObjectId | null;  // null = 全公司可见
  type:         'churn_warning' | 'system';
  title:        string;
  content:      string;
  relatedId:    Schema.Types.ObjectId | null;  // 关联的 customer._id
  level:        'high' | 'medium' | 'low';
  isRead:       boolean;
}

const NotificationSchema = new Schema<INotification>({
  companyId:    { type: Schema.Types.ObjectId, required: true },
  targetUserId: { type: Schema.Types.ObjectId, default: null },
  type:         { type: String, enum: ['churn_warning', 'system'], required: true },
  title:        { type: String, required: true, maxlength: 100 },
  content:      { type: String, required: true, maxlength: 500 },
  relatedId:    { type: Schema.Types.ObjectId, default: null },
  level:        { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  isRead:       { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ companyId: 1, targetUserId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
```

---

## 4. 后端模块详细设计

> ⚠️ **规范红线**：所有 async Controller 方法必须用 `asyncHandler()` 包裹。Service 方法禁止使用 `req` / `res` 对象。禁止在任何模块使用 `console.log`，统一使用 `logger`。

### 4.1 Auth 模块

#### 4.1.1 请求参数校验规则（auth.validator.ts）

| 校验规则组    | 字段        | 规则描述                                                     | 错误提示               |
| ------------- | ----------- | ------------------------------------------------------------ | ---------------------- |
| registerRules | email       | `isEmail()`，`normalizeEmail()`                              | 邮箱格式不正确         |
| registerRules | password    | `isLength({min:8,max:32})`，需包含字母和数字                 | 密码须 8-32 位含字母和数字 |
| registerRules | name        | `isLength({min:2,max:50})`，`trim()`                         | 姓名须 2-50 个字符     |
| registerRules | companyName | `isLength({min:2,max:100})`，`trim()`                        | 公司名须 2-100 个字符  |
| loginRules    | email       | `isEmail()`，`normalizeEmail()`                              | 邮箱格式不正确         |
| loginRules    | password    | `notEmpty()`                                                 | 密码不能为空           |

#### 4.1.2 Service 函数设计（auth.service.ts）

| 函数名         | 签名                                              | 前置条件       | 后置条件                                       | 可能抛出的异常                            |
| -------------- | ------------------------------------------------- | -------------- | ---------------------------------------------- | ----------------------------------------- |
| `register`     | `register(dto: RegisterDTO): Promise<{user, company}>` | 邮箱未注册 | 用户和公司记录写入 DB，返回不含 password 的用户 | `EMAIL_EXISTS`                            |
| `login`        | `login(email, password): Promise<TokenPair & {user}>` | 无         | 更新 `lastLoginAt`，返回双令牌                  | `INVALID_CREDENTIALS` / `ACCOUNT_LOCKED` |
| `refreshToken` | `refreshToken(token): Promise<TokenPair>`         | Refresh Token 有效 | 颁发新 Access Token                        | `TOKEN_INVALID` / `TOKEN_EXPIRED`         |
| `logout`       | `logout(userId): Promise<void>`                   | 用户已登录     | 无操作（v1.4 引入 Redis 黑名单后在此扩展）      | 无                                        |

#### 4.1.3 register 函数伪代码

```typescript
async register(dto: RegisterDTO) {
  // 1. 检查邮箱唯一性
  const exists = await User.findOne({ email: dto.email });
  if (exists) throw new AppError('EMAIL_EXISTS', 400);

  // 2. 创建公司记录
  const company = await Company.create({ name: dto.companyName });

  // 3. 哈希密码（cost=12，约 250ms，平衡安全与性能）
  const hash = await bcrypt.hash(dto.password, 12);

  // 4. 创建用户（首个注册用户自动成为 admin）
  const user = await User.create({
    email: dto.email,
    password: hash,
    name: dto.name,
    role: 'admin',
    companyId: company._id,
  });

  // 5. 返回（剔除 password 字段）
  const { password, ...safeUser } = user.toObject();
  return { user: safeUser, company };
}
```

#### 4.1.4 login 函数伪代码

```typescript
async login(email: string, password: string) {
  // 1. 查询用户（显式 select password）
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw new AppError('INVALID_CREDENTIALS', 401);

  // 2. 验证密码（时间恒定比较，防时序攻击）
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('INVALID_CREDENTIALS', 401);

  // 3. 签发双令牌
  const payload = { userId: user._id, companyId: user.companyId, role: user.role };
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // 4. 更新登录时间（异步，不阻塞响应）
  User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  const { password: _, ...safeUser } = user.toObject();
  return { accessToken, refreshToken, expiresIn: 7200, user: safeUser };
}
```

---

### 4.2 Customer 模块

#### 4.2.1 Service 函数职责说明（customer.service.ts）

| 函数名          | 签名（简化）                                        | 核心逻辑说明                                                                                    |
| --------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `getList`       | `getList(query, companyId, userId, role)`           | `role=sales` 强制 `assignedTo=userId`；`role>=manager` 可跨销售员查询。分页 + 关键词搜索        |
| `getDetail`     | `getDetail(id, companyId)`                          | 查询客户 + 最近 20 条跟进记录（populate）+ 最新 AI 结果，组合返回                               |
| `create`        | `create(dto, companyId, userId)`                    | 创建客户，`assignedTo` 默认为 `userId`；创建后**异步**触发 AI 初步评估（不 await）               |
| `update`        | `update(id, dto, companyId, userId, role)`          | `role=sales` 只能更新自己负责的客户；`role>=manager` 可更新任意客户                             |
| `updateStatus`  | `updateStatus(id, status, companyId)`               | 仅更新 `status` 字段，专供看板拖拽调用（高频操作，单独接口减少传输量）                           |
| `softDelete`    | `softDelete(id, companyId)`                         | 设置 `isDeleted=true`，不物理删除，保留跟进记录和 AI 分析历史                                   |

#### 4.2.2 getList 函数伪代码（含权限过滤）

```typescript
async getList(
  query: CustomerListQuery,
  companyId: string,
  userId: string,
  role: UserRole
) {
  const {
    page = 1, limit = 20,
    status, assignedTo, keyword,
    sortBy = 'createdAt', sortOrder = 'desc'
  } = query;

  // 1. 构建基础 filter（companyId 必须首位）
  const filter: FilterQuery<ICustomer> = {
    companyId,
    isDeleted: false,
  };

  // 2. 权限过滤：sales 只能看自己的客户
  if (role === 'sales') filter.assignedTo = userId;
  else if (assignedTo)  filter.assignedTo = assignedTo;

  // 3. 状态筛选（支持多状态）
  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  // 4. 关键词搜索（name / contact / phone 三字段 OR 查询）
  if (keyword) {
    const reg = new RegExp(keyword, 'i');
    filter.$or = [{ name: reg }, { contact: reg }, { phone: reg }];
  }

  // 5. 构建 sort
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  // 6. countDocuments 与 find 并行，减少总耗时
  const [total, list] = await Promise.all([
    Customer.countDocuments(filter),
    Customer.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Math.min(limit, 100))
      .populate('assignedTo', 'name email')
      .lean(),   // 返回普通对象，性能更好
  ]);

  return { list, total, page, limit };
}
```

---

### 4.3 Followup 模块

#### 4.3.1 createFollowup 函数伪代码

```typescript
async createFollowup(
  customerId: string,
  dto: CreateFollowupDTO,
  companyId: string,
  userId: string
) {
  // 1. 验证客户归属（防止越权写入他人客户的跟进）
  const customer = await Customer.findOne({
    _id: customerId,
    companyId,
    isDeleted: false,
  });
  if (!customer) throw new AppError('CUSTOMER_NOT_FOUND', 404);

  // 2. 创建跟进记录
  const followup = await Followup.create({
    customerId,
    companyId,
    createdBy:   userId,
    method:      dto.method,
    content:     dto.content,
    nextFollowup: dto.nextFollowup || null,
  });

  // 3. 更新客户 lastFollowup（异步，不阻塞响应）
  Customer.updateOne({ _id: customerId }, { lastFollowup: new Date() });

  // 4. 触发 AI 重新分析（异步，后台执行，失败仅记录日志）
  aiService.triggerPrediction(customerId, companyId).catch(logger.error);

  return followup;
}
```

---

### 4.4 Stats 模块

#### 4.4.1 聚合查询设计（stats.service.ts）

| 函数名        | 聚合阶段                                           | 返回数据结构                                                       |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `getOverview` | `$match(companyId)` + `$group(status)`             | `{ total, byStatus: {…}, totalDealValue, avgAiScore }`             |
| `getFunnel`   | `$match` + `$group(status)` + 手动排序             | `[{ stage, count, rate }]` — 6 个阶段的转化率数组                  |
| `getTrend`    | `$match(won, dateRange)` + `$group(date)` + `$sort` | `[{ date, amount, count }]` — 按天聚合成交数据                    |
| `getTeamRank` | `$match` + `$group(assignedTo)` + `$lookup(users)` | `[{ userId, name, wonCount, totalAmount }]` — Top 10 排行          |

#### 4.4.2 getFunnel 聚合管道

```typescript
async getFunnel(companyId: string) {
  const stages: CustomerStatus[] = [
    'potential', 'following', 'intent', 'negotiating', 'won', 'lost',
  ];

  const result = await Customer.aggregate([
    { $match: { companyId: new ObjectId(companyId), isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // 构造带转化率的漏斗数据
  const countMap = Object.fromEntries(result.map(r => [r._id, r.count]));
  const total = countMap['potential'] || 0;

  return stages.map(stage => ({
    stage,
    count: countMap[stage] || 0,
    rate:  total > 0
      ? Math.round(((countMap[stage] || 0) / total) * 100)
      : 0,
  }));
}
```

---

### 4.5 定时任务 — 流失预警

```typescript
// jobs/churnDetection.job.ts
import cron from 'node-cron';

// 每天 09:00 执行（Asia/Shanghai 时区）
cron.schedule('0 9 * * *', runChurnDetection, {
  timezone: 'Asia/Shanghai',
});

async function runChurnDetection() {
  logger.info('[ChurnJob] 开始执行流失预警扫描');
  const startTime = Date.now();

  try {
    const now = new Date();
    const warnings: Partial<INotification>[] = [];

    // 使用游标分批处理，避免一次性加载大量文档
    const cursor = Customer.find({
      status:    { $in: ['following', 'intent', 'negotiating'] },
      isDeleted: false,
    }).cursor();

    for await (const customer of cursor) {
      if (!customer.lastFollowup) continue;

      const daysSince = Math.floor(
        (now.getTime() - customer.lastFollowup.getTime()) / 86_400_000
      );

      let level: 'high' | 'medium' | null = null;
      if (daysSince >= 30)      level = 'high';
      else if (daysSince >= 14) level = 'medium';

      if (level) {
        warnings.push({
          companyId:    customer.companyId,
          targetUserId: customer.assignedTo,
          type:         'churn_warning',
          title:        `客户「${customer.name}」存在流失风险`,
          content:      `距上次跟进已 ${daysSince} 天，建议尽快联系。`,
          relatedId:    customer._id,
          level,
          isRead:       false,
        });

        // 更新 churnRisk 字段（不 await，批量异步）
        Customer.updateOne({ _id: customer._id }, { churnRisk: level });
      }
    }

    if (warnings.length > 0) await Notification.insertMany(warnings);

    logger.info(
      `[ChurnJob] 完成，生成预警 ${warnings.length} 条，耗时 ${Date.now() - startTime}ms`
    );
  } catch (err) {
    logger.error('[ChurnJob] 执行失败', err);
  }
}
```

---

## 5. AI 模块详细设计

### 5.1 ai.gateway.ts — 大模型网关

```typescript
// modules/ai/ai.gateway.ts

export class AiGateway {
  private provider   = getProvider();
  private TIMEOUT_MS = 30_000;
  private MAX_RETRY  = 2;

  /**
   * 非流式调用 — 用于成交预测（需要结构化 JSON）
   */
  async complete(prompt: string): Promise<string> {
    let lastError!: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRY; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        const resp = await fetch(
          `${this.provider.baseURL}/chat/completions`,
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${this.provider.apiKey}`,
            },
            body: JSON.stringify({
              model:      this.provider.model,
              max_tokens: this.provider.maxTokens,
              messages:   [{ role: 'user', content: prompt }],
              stream:     false,
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timer);

        if (!resp.ok) throw new Error(`AI API ${resp.status}`);
        const data = await resp.json();
        return data.choices[0].message.content as string;

      } catch (err) {
        lastError = err as Error;
        if (attempt < this.MAX_RETRY) {
          await sleep(1000 * attempt);  // 指数退避
        }
      }
    }

    throw new AppError('AI_UNAVAILABLE', 503, lastError.message);
  }

  /**
   * 流式调用 — 用于日报生成，通过 callback 逐 chunk 转发
   */
  async stream(
    prompt:  string,
    onChunk: (chunk: string) => void,
    onDone:  (totalTokens: number) => void
  ): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    const resp = await fetch(
      `${this.provider.baseURL}/chat/completions`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this.provider.apiKey}`,
        },
        body: JSON.stringify({
          model:      this.provider.model,
          max_tokens: this.provider.maxTokens,
          messages:   [{ role: 'user', content: prompt }],
          stream:     true,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!resp.ok) throw new AppError('AI_UNAVAILABLE', 503);

    const reader  = resp.body!.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { onDone(totalTokens); return; }

        try {
          const json    = JSON.parse(raw);
          const content = json.choices?.[0]?.delta?.content ?? '';
          if (content) onChunk(content);
          totalTokens = json.usage?.total_tokens ?? totalTokens;
        } catch {
          // 忽略解析失败的 chunk（SSE 中正常现象）
        }
      }
    }
  }
}
```

### 5.2 ai.service.ts — 业务编排

#### 5.2.1 triggerPrediction — 成交预测

```typescript
async triggerPrediction(
  customerId: string,
  companyId:  string
): Promise<AiResult> {

  // 1. 缓存检查：12 小时内不重复分析
  const cacheThreshold = new Date(Date.now() - 12 * 3_600_000);
  const cached = await AiResult.findOne({
    customerId,
    type:      'deal_prediction',
    createdAt: { $gte: cacheThreshold },
  }).sort({ createdAt: -1 });
  if (cached) return cached;

  // 2. 并行读取客户数据和跟进记录
  const [customer, followups] = await Promise.all([
    Customer.findOne({ _id: customerId, companyId }),
    Followup.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);
  if (!customer) throw new AppError('CUSTOMER_NOT_FOUND', 404);

  // 3. 计算互动统计
  const now         = Date.now();
  const thirtyDays  = now - 30 * 86_400_000;
  const recentCount = followups.filter(
    f => f.createdAt.getTime() > thirtyDays
  ).length;
  const stats = {
    followupsLast30Days: recentCount,
    avgIntervalDays:     calcAvgInterval(followups),
  };

  // 4. 构建 Prompt
  const prompt = buildDealPredictionPrompt({
    ...customer.toObject(),
    followups,
    stats,
  });

  // 5. 调用 AI（非流式，获取完整 JSON）
  const raw = await this.gateway.complete(prompt);

  // 6. 解析并校验结果（内置兜底）
  const parsed = parseAndValidateAiResult(raw);

  // 7. 落库
  const result = await AiResult.create({
    customerId,
    companyId,
    type:      'deal_prediction',
    modelUsed: getProvider().model,
    rawPrompt: process.env.NODE_ENV !== 'production' ? prompt : undefined,
    ...parsed,
  });

  // 8. 异步更新客户 aiScore（不 await）
  Customer.updateOne({ _id: customerId }, { aiScore: parsed.score });

  return result;
}
```

#### 5.2.2 generateDailyReport — 销售日报（SSE）

```typescript
async generateDailyReport(
  companyId: string,
  userId:    string,
  role:      UserRole,
  res:       Response
): Promise<void> {

  // 设置 SSE 响应头
  res.setHeader('Content-Type',     'text/event-stream');
  res.setHeader('Cache-Control',    'no-cache');
  res.setHeader('Connection',       'keep-alive');
  res.setHeader('X-Accel-Buffering','no');  // 禁用 Nginx 缓冲
  res.flushHeaders();

  const send = (payload: SsePayload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    send({ type: 'start', message: 'AI 正在生成日报...' });

    // 读取今日业务数据
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const followupFilter = role === 'sales'
      ? { companyId, createdBy: userId, createdAt: { $gte: todayStart } }
      : { companyId, createdAt: { $gte: todayStart } };

    const [newCustomers, todayFollowups, wonToday] = await Promise.all([
      Customer.find({ companyId, createdAt: { $gte: todayStart }, isDeleted: false }).lean(),
      Followup.find(followupFilter)
        .populate('createdBy', 'name')
        .populate('customerId', 'name')
        .lean(),
      Customer.find({ companyId, status: 'won', updatedAt: { $gte: todayStart } }).lean(),
    ]);

    // 构建日报 Prompt
    const prompt = buildDailyReportPrompt({ newCustomers, todayFollowups, wonToday });

    // 流式调用 AI，实时转发 chunk 给前端
    await this.gateway.stream(
      prompt,
      (chunk)       => send({ type: 'chunk', content: chunk }),
      (totalTokens) => { send({ type: 'done', totalTokens }); res.end(); }
    );

  } catch (err) {
    send({ type: 'error', code: 'AI_FAILED', message: '日报生成失败，请重试' });
    res.end();
  }
}
```

### 5.3 AI 结果解析与校验

```typescript
// 兜底结果（AI 解析失败时使用，不影响主流程）
const FALLBACK_RESULT: AiPredictionResult = {
  score:      -1,
  level:      'unknown',
  positives:  [],
  risks:      ['AI 解析失败，请手动重新分析'],
  suggestion: '请手动评估该客户状态',
};

function parseAndValidateAiResult(raw: string): AiPredictionResult {
  let parsed: unknown;

  // 1. 容错解析：兼容 AI 在 JSON 前后夹杂文字的情况
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match?.[0] ?? raw);
  } catch {
    logger.warn('[AI] JSON 解析失败，启用兜底', { raw: raw.slice(0, 200) });
    return FALLBACK_RESULT;
  }

  // 2. Schema 校验（防御性验证，不信任 AI 输出）
  const p = parsed as Record<string, unknown>;
  const isValid =
    Number.isInteger(p.score)   && (p.score as number) >= 0 && (p.score as number) <= 100 &&
    ['high', 'medium', 'low'].includes(p.level as string) &&
    Array.isArray(p.positives)  && (p.positives as []).length <= 5 &&
    Array.isArray(p.risks)      && (p.risks as []).length <= 5 &&
    typeof p.suggestion === 'string';

  if (!isValid) {
    logger.warn('[AI] 结果不符合 Schema，启用兜底', { parsed });
    return FALLBACK_RESULT;
  }

  return {
    score:      p.score      as number,
    level:      p.level      as AiLevel,
    positives: (p.positives  as string[]).slice(0, 3),
    risks:     (p.risks      as string[]).slice(0, 3),
    suggestion: p.suggestion as string,
  };
}
```

### 5.4 Prompt 模板设计

#### 5.4.1 成交预测 Prompt（prompts/dealPrediction.ts）

> **设计原则**：明确角色 → 结构化输入 → 严格约束输出格式 → `<user_data>` 标签隔离防 Prompt 注入

```typescript
export function buildDealPredictionPrompt(data: PromptData): string {
  return `
你是一名专业的销售分析专家。请根据以下信息分析客户成交概率。
只输出 JSON，不输出任何解释文字或 Markdown 格式。

## 客户信息
- 公司：${data.name}  行业：${data.industry}  来源：${data.source}
- 预计金额：${data.dealValue ? `¥${data.dealValue}` : '未填写'}
- 当前状态：${data.status}
- 最近跟进：${data.lastFollowup ?? '从未'}

## 跟进记录（最近 10 条，时间倒序）
<user_data>
${data.followups
  .map((f, i) => `${i + 1}. [${f.method}][${f.createdAt}] ${f.content}`)
  .join('\n')}
</user_data>

## 互动统计
- 近 30 天跟进：${data.stats.followupsLast30Days} 次
- 平均间隔：${data.stats.avgIntervalDays} 天

## 输出格式（严格 JSON，不附加任何文字）
{
  "score":      <0-100 整数>,
  "level":      "<high(70+) | medium(40-69) | low(<40)>",
  "positives":  ["<正向信号1>", "<正向信号2>"],
  "risks":      ["<风险点1>", "<风险点2>"],
  "suggestion": "<一句话下一步建议>"
}
`.trim();
}
```

#### 5.4.2 销售日报 Prompt（prompts/dailyReport.ts）

```typescript
export function buildDailyReportPrompt(data: DailyReportData): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

  return `
你是一名销售团队助理，请根据以下今日销售数据生成一份简洁、专业的日报。
使用 Markdown 格式输出，结构清晰，语气积极。

## 今日数据（${fmt(new Date())}）

### 新增客户（${data.newCustomers.length} 位）
${data.newCustomers.map(c => `- ${c.name}（${c.industry}，来源：${c.source}）`).join('\n') || '- 暂无'}

### 今日跟进记录（${data.todayFollowups.length} 条）
${data.todayFollowups
  .map(f => `- [${f.createdBy?.name}] 跟进「${f.customerId?.name}」：${f.content.slice(0, 50)}...`)
  .join('\n') || '- 暂无'}

### 今日成交（${data.wonToday.length} 单）
${data.wonToday.map(c => `- ${c.name}，合同金额：¥${c.dealValue ?? '未填写'}`).join('\n') || '- 暂无'}

## 请输出
1. 今日工作总结（2-3 句）
2. 数据亮点与不足
3. 明日重点跟进客户推荐（Top 3，带理由）
`.trim();
}
```

---

## 6. 前端模块详细设计

### 6.1 Axios 请求封装（utils/request.ts）

> **核心设计**：双令牌无感刷新 + 并发请求队列，解决多个请求同时 401 时重复刷新的问题。

```typescript
// utils/request.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── 请求拦截器：自动附加 Token ─────────────────────────────────────────────
request.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// ── 响应拦截器：错误处理 + 无感刷新 ───────────────────────────────────────
let isRefreshing = false;
let waitQueue: Array<(token: string) => void> = [];

request.interceptors.response.use(
  // ✅ 成功：直接返回 data 字段，调用方无需 .data.data
  (res) => res.data.data,

  async (err) => {
    const auth   = useAuthStore();
    const status = err.response?.status;
    const config = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401：尝试无感刷新 Token
    if (status === 401 && !config._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        const ok = await auth.refreshAccessToken();
        isRefreshing = false;

        if (ok) {
          // 唤醒等待队列，重放所有暂存请求
          waitQueue.forEach(cb => cb(auth.token!));
          waitQueue = [];
        } else {
          // 刷新失败，清除登录态
          waitQueue = [];
          auth.logout();
          router.push('/auth/login');
          return Promise.reject(err);
        }
      }

      // 等待刷新完成后重放当前请求
      return new Promise((resolve) => {
        waitQueue.push((token) => {
          config._retry = true;
          config.headers!.Authorization = `Bearer ${token}`;
          resolve(request(config));
        });
      });
    }

    // 统一错误提示
    const msg = err.response?.data?.message ?? '网络异常，请稍后重试';
    ElMessage.error(msg);
    return Promise.reject(err);
  }
);

export default request;
```

### 6.2 SSE Composable（composables/useSSE.ts）

> **为什么不用 `EventSource`**：① 不支持 POST 请求；② 无法携带 `Authorization` Header；③ 无法在组件销毁时优雅中断。

```typescript
// composables/useSSE.ts
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { SsePayload } from '@/types/ai';

export function useSSE() {
  const streaming = ref(false);
  const content   = ref('');
  const error     = ref<string | null>(null);

  let controller: AbortController | null = null;

  async function start(url: string, body?: object): Promise<void> {
    stop();   // 先停止已有连接

    streaming.value = true;
    content.value   = '';
    error.value     = null;

    controller = new AbortController();
    const auth      = useAuthStore();

    // 35s 超时保护（比后端 30s 长，留缓冲）
    const timeoutId = setTimeout(() => controller!.abort(), 35_000);

    try {
      const resp = await fetch(url, {
        method:  body ? 'POST' : 'GET',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body:   body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader  = resp.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const payload = JSON.parse(line.slice(6)) as SsePayload;

          switch (payload.type) {
            case 'chunk': content.value += payload.content;   break;
            case 'done':  streaming.value = false;            break;
            case 'error':
              error.value    = payload.message;
              streaming.value = false;
              break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        error.value = '连接中断，请重试';
      }
      streaming.value = false;
    }
  }

  function stop(): void {
    controller?.abort();
    streaming.value = false;
  }

  // 组件卸载时自动断开，防止内存泄漏
  onUnmounted(stop);

  return { streaming, content, error, start, stop };
}
```

### 6.3 权限 Composable（composables/usePermission.ts）

```typescript
// composables/usePermission.ts
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types/auth';

const ROLE_LEVEL: Record<UserRole, number> = {
  admin:   3,
  manager: 2,
  sales:   1,
};

export function usePermission() {
  const auth = useAuthStore();
  const role = computed(() => auth.user?.role ?? 'sales');

  /** 当前用户是否具有 minRole 及以上权限 */
  const can = (minRole: UserRole): boolean =>
    ROLE_LEVEL[role.value] >= ROLE_LEVEL[minRole];

  const isAdmin   = computed(() => can('admin'));
  const isManager = computed(() => can('manager'));

  return { can, isAdmin, isManager, role };
}

// 使用示例
// <el-button v-if="can('manager')">删除客户</el-button>
// <el-menu-item v-if="isAdmin.value">系统设置</el-menu-item>
```

### 6.4 核心 Store 设计

#### 6.4.1 auth.store.ts

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AuthUser, TokenPair } from '@/types/auth';
import * as authApi from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  // Access Token 存内存，不写 localStorage（防 XSS 窃取）
  const token        = ref<string | null>(null);
  const user         = ref<AuthUser | null>(null);

  const isLoggedIn   = computed(() => !!token.value);

  async function login(email: string, password: string): Promise<void> {
    const res = await authApi.login({ email, password });
    token.value = res.accessToken;
    user.value  = res.user;
    // Refresh Token 写 localStorage（7天有效期，页面刷新后用于恢复登录态）
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  async function refreshAccessToken(): Promise<boolean> {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return false;
    try {
      const res   = await authApi.refresh(rt);
      token.value = res.accessToken;
      return true;
    } catch {
      return false;
    }
  }

  function logout(): void {
    token.value = null;
    user.value  = null;
    localStorage.removeItem('refreshToken');
  }

  return { token, user, isLoggedIn, login, logout, refreshAccessToken };
});
```

#### 6.4.2 customer.store.ts

```typescript
// stores/customer.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Customer, CustomerListQuery } from '@/types/customer';
import * as customerApi from '@/api/customer';

export const useCustomerStore = defineStore('customer', () => {
  const list          = ref<Customer[]>([]);
  const total         = ref(0);
  const currentDetail = ref<Customer | null>(null);
  const loading       = ref(false);

  async function fetchList(query: CustomerListQuery): Promise<void> {
    loading.value = true;
    try {
      const res  = await customerApi.getList(query);
      list.value  = res.list;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  async function updateStatus(id: string, status: Customer['status']): Promise<void> {
    // 乐观更新：立即更新本地状态，不等待服务器响应
    const target = list.value.find(c => c.id === id);
    if (target) target.status = status;

    // 后台同步服务器（失败时回滚）
    try {
      await customerApi.updateStatus(id, status);
    } catch {
      if (target) target.status = target.status; // 回滚（实际应存 oldStatus）
    }
  }

  return { list, total, currentDetail, loading, fetchList, updateStatus };
});
```

### 6.5 核心页面组件设计

#### 6.5.1 CustomerListView.vue — 职责与数据流

| 职责             | 实现方式                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| 展示客户列表     | `customerStore.fetchList()`，`watch` 筛选条件自动重新请求                |
| 关键词搜索       | 输入防抖 300ms（`useDebounce`），避免高频 API 请求                        |
| 状态筛选（多选） | `<el-checkbox-group>` 绑定 `filters.status` 数组，变化触发 `fetchList`  |
| AI 评分展示      | `<AiScoreBadge>` 组件，`score=-1` 显示「待分析」，`0-100` 显示彩色进度条 |
| 跳转详情         | 点击行 → `router.push('/customers/:id')`                                 |
| 新建客户         | `<el-dialog>` 内嵌表单，成功后刷新列表                                   |

#### 6.5.2 KanbanView.vue — 拖拽看板核心逻辑

```typescript
<script setup lang="ts">
import { computed } from 'vue';
import { useCustomerStore } from '@/stores/customer';
import type { CustomerStatus } from '@/types/customer';

const COLUMNS: CustomerStatus[] = [
  'potential', 'following', 'intent', 'negotiating', 'won', 'lost',
];

const LABELS: Record<CustomerStatus, string> = {
  potential:   '潜在客户',
  following:   '跟进中',
  intent:      '意向确认',
  negotiating: '报价谈判',
  won:         '已成交',
  lost:        '已流失',
};

const store = useCustomerStore();

// 按状态分组
const columns = computed(() =>
  Object.fromEntries(
    COLUMNS.map(s => [s, store.list.filter(c => c.status === s)])
  )
);

// 拖拽结束：乐观更新 + 后台同步
async function onDrop(customerId: string, newStatus: CustomerStatus): Promise<void> {
  await store.updateStatus(customerId, newStatus);
}
</script>
```

#### 6.5.3 AiAnalysisPanel.vue — 状态机

| UI 状态   | 触发条件               | 展示内容                                                          |
| --------- | ---------------------- | ----------------------------------------------------------------- |
| 未分析    | `aiScore === -1`       | 灰色空状态 + 「开始 AI 分析」按钮                                 |
| 分析中    | `streaming === true`   | 骨架屏 + 旋转加载图标 + 「AI 分析中...」                          |
| 分析完成  | `aiResult !== null`    | 评分圆环 + `level` 徽标 + 正向信号（绿色）+ 风险（红色）+ 建议    |
| 分析失败  | `error !== null`       | 红色警告框 + 错误原因 + 「重试」按钮                               |

---

## 7. 错误码与异常规范

### 7.1 AppError 类定义

```typescript
// utils/AppError.ts
export class AppError extends Error {
  constructor(
    public code:    string,   // 业务错误码（见下表）
    public status:  number,   // HTTP 状态码
    public detail?: string,   // 调试信息（仅开发环境返回）
  ) {
    super(code);
    this.name = 'AppError';
  }
}

// 工厂函数（简化抛出）
export const err = (code: string, status: number, detail?: string) =>
  new AppError(code, status, detail);
```

### 7.2 错误码全量表

| 错误码                | HTTP 状态 | 说明                              | 前端处理                        |
| --------------------- | --------- | --------------------------------- | ------------------------------- |
| `EMAIL_EXISTS`        | 400       | 邮箱已注册                        | 表单字段红色提示                |
| `INVALID_CREDENTIALS` | 401       | 邮箱或密码错误                    | 弹出「邮箱或密码不正确」        |
| `ACCOUNT_LOCKED`      | 401       | 账号被锁定                        | 弹出锁定提示 + 剩余时间         |
| `TOKEN_EXPIRED`       | 401       | Access Token 过期                 | 触发无感刷新                    |
| `TOKEN_INVALID`       | 401       | Token 格式错误或被伪造            | 清除登录态，跳转登录页          |
| `PERMISSION_DENIED`   | 403       | 角色权限不足                      | 弹出「权限不足」提示            |
| `CUSTOMER_NOT_FOUND`  | 404       | 客户不存在或已删除                | 页面显示 404 空状态             |
| `CUSTOMER_FORBIDDEN`  | 403       | 无权操作他人客户                  | 弹出「无权操作」提示            |
| `VALIDATION_FAILED`   | 400       | 请求参数校验失败                  | 表单显示具体字段错误            |
| `RATE_LIMIT_EXCEEDED` | 429       | 接口请求过于频繁                  | 弹出「操作太频繁，请稍后」      |
| `AI_UNAVAILABLE`      | 503       | AI 服务不可用（重试后仍失败）     | 弹出「AI 服务暂时不可用」       |
| `AI_QUOTA_EXCEEDED`   | 429       | 当日 AI 调用次数超限              | 弹出「今日 AI 次数已用完」      |
| `INTERNAL_ERROR`      | 500       | 服务器内部错误                    | 弹出「服务异常，请稍后重试」    |

### 7.3 全局错误处理中间件

```typescript
// middlewares/error.middleware.ts
import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 记录结构化日志（不暴露给用户）
  logger.error({
    code:    err.code ?? 'UNKNOWN',
    message: err.message,
    path:    req.path,
    method:  req.method,
    userId:  req.user?.userId,
    stack:   process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // AppError：业务预期错误
  if (err instanceof AppError) {
    return res.status(err.status).json({
      code:      err.status,
      message:   ERROR_MESSAGES[err.code] ?? err.code,
      data:      null,
      timestamp: Date.now(),
    });
  }

  // Mongoose 字段校验错误
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors)[0]?.message ?? '数据格式错误';
    return res.status(400).json({ code: 400, message: msg, data: null, timestamp: Date.now() });
  }

  // Mongoose 唯一键冲突（code 11000）
  if (err.code === 11000) {
    return res.status(400).json({ code: 400, message: '数据已存在', data: null, timestamp: Date.now() });
  }

  // 兜底：生产环境不暴露内部错误详情
  const msg = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message;
  return res.status(500).json({ code: 500, message: msg, data: null, timestamp: Date.now() });
};
```

---

## 8. 测试设计

### 8.1 测试策略

| 测试层级   | 工具                              | 覆盖范围                                          | 目标覆盖率          |
| ---------- | --------------------------------- | ------------------------------------------------- | ------------------- |
| 单元测试   | Jest + ts-jest                    | Service 层业务逻辑、工具函数、Prompt Builder       | 核心 Service ≥ 80%  |
| 集成测试   | Supertest + MongoMemoryServer     | API 端到端（Controller → DB）                     | P0 接口 100%        |
| 组件测试   | Vitest + Vue Test Utils           | Vue 组件渲染、交互、Pinia Store                   | 核心组件 ≥ 70%      |
| E2E 测试   | Playwright（v1.2 迭代引入）       | 完整用户路径：登录 → 新增客户 → AI 分析           | 主路径 100%         |

### 8.2 单元测试用例设计

#### 8.2.1 auth.service.test.ts

| 测试用例                    | 输入                          | 预期结果                                              |
| --------------------------- | ----------------------------- | ----------------------------------------------------- |
| 注册成功                    | 合法邮箱 + 密码 + 姓名 + 公司名 | 返回 `user`（无 `password` 字段）+ `company` 对象    |
| 注册失败 — 邮箱重复         | 已存在的邮箱                  | 抛出 `AppError('EMAIL_EXISTS', 400)`                  |
| 登录成功                    | 正确邮箱 + 密码               | 返回 `accessToken` + `refreshToken` + `user`          |
| 登录失败 — 密码错误         | 正确邮箱 + 错误密码           | 抛出 `AppError('INVALID_CREDENTIALS', 401)`           |
| 登录失败 — 用户不存在       | 不存在的邮箱                  | 抛出 `AppError('INVALID_CREDENTIALS', 401)`（同码，防用户枚举） |
| Token 刷新成功              | 有效 Refresh Token            | 返回新的 `accessToken`                                |
| Token 刷新失败              | 过期或伪造 Token              | 抛出 `AppError('TOKEN_INVALID', 401)`                 |

#### 8.2.2 customer.service.test.ts

| 测试用例                          | 说明                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| `getList` — sales 只能看自己客户  | 传入 `role=sales`，验证 filter 强制带 `assignedTo=userId`                |
| `getList` — manager 可看全团队    | 传入 `role=manager`，无 `assignedTo` 限制                                |
| `getList` — keyword 走 $or 查询   | 传入 `keyword`，验证生成 `$or: [{name},{contact},{phone}]`               |
| `create` — 自动设置 assignedTo    | 创建时 `assignedTo` 默认为操作者 `userId`                                |
| `updateStatus` — 只更新 status    | 验证只有 `status` 字段变化，其他字段不受影响                              |
| `softDelete` — isDeleted=true     | 删除后 `isDeleted=true`，数据未物理删除，跟进记录仍存在                  |

#### 8.2.3 AI 模块测试

| 测试用例                           | Mock 方式                           | 验证点                               |
| ---------------------------------- | ----------------------------------- | ------------------------------------ |
| `triggerPrediction` — 缓存命中     | Mock `AiResult.findOne` 返回缓存    | 不调用 `gateway.complete()`          |
| `triggerPrediction` — 缓存未命中   | Mock `AiResult.findOne` 返回 null   | 调用 `gateway.complete()` 恰好 1 次  |
| `parseAndValidateAiResult` — 合法  | 标准 JSON 字符串                    | 正确解析所有字段                     |
| `parseAndValidateAiResult` — 非法  | 随机文字                            | 返回 `FALLBACK_RESULT`，不抛异常     |
| `parseAndValidateAiResult` — 越界  | `score=150`                         | 返回 `FALLBACK_RESULT`               |
| `gateway.complete` — 超时          | Mock fetch 30s 无响应               | 触发 `AbortController`，抛 503       |
| `gateway.complete` — 重试机制      | Mock 前 2 次失败，第 3 次成功       | 重试 2 次后返回成功结果              |

### 8.3 API 集成测试用例（Supertest）

| 接口                              | 场景                                    | 验证点                                           |
| --------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `POST /auth/register`             | 正常注册                                | `code=200`，返回 `user+company`，无 `password` 字段 |
| `POST /auth/login`                | 正常登录                                | `code=200`，返回 `accessToken+refreshToken`      |
| `POST /auth/login`                | 密码错误                                | `code=401`                                       |
| `GET /customers`                  | 无 Token                                | `code=401`                                       |
| `GET /customers`                  | sales 带 `assignedTo` 查他人客户        | 列表只返回自己的客户（权限过滤生效）             |
| `POST /customers/:id/followups`   | 非负责人写入跟进记录                    | `code=403`                                       |
| `POST /ai/predict/:id`            | 合法请求                                | `code=200`，返回完整 AI 分析结果                 |
| `POST /ai/predict/:id`            | AI 服务超时（Mock）                     | `code=503`，返回兜底数据                         |
| `GET /customers`（跨公司）        | A 公司 Token 请求 B 公司数据            | `code=200` 但列表为空（companyId 隔离生效）      |

---

## 9. 附录

### 9.1 核心工具函数规范

| 函数名                 | 签名                                              | 说明                                                        |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `calcAvgInterval`      | `(followups: IFollowup[]): number`                | 计算跟进记录平均间隔天数，不足 2 条返回 0                   |
| `sleep`                | `(ms: number): Promise<void>`                     | 延迟工具，用于 AI 重试指数退避                               |
| `sanitizePromptInput`  | `(text: string): string`                          | 过滤跟进内容中的特殊指令字符，防 Prompt 注入                 |
| `getErrorMessage`      | `(code: string): string`                          | 错误码转换为中文提示文字                                    |
| `asyncHandler`         | `(fn: AsyncFn): RequestHandler`                   | 包裹 async Controller，自动捕获异常传递给 `errorHandler`    |
| `formatDateCN`         | `(date: Date): string`                            | 转换为「2026年3月19日」格式，用于 AI Prompt 的日期展示       |

### 9.2 环境变量完整清单

| 变量名                    | 类型    | 默认值        | 说明                                            |
| ------------------------- | ------- | ------------- | ----------------------------------------------- |
| `PORT`                    | number  | `3000`        | 后端监听端口                                    |
| `NODE_ENV`                | string  | `development` | 环境标识，影响错误信息暴露和日志级别            |
| `MONGODB_URI`             | string  | —             | MongoDB 连接串（**必填**）                      |
| `JWT_SECRET`              | string  | —             | Access Token 签名密钥（**必填**，≥32 位随机串） |
| `JWT_REFRESH_SECRET`      | string  | —             | Refresh Token 签名密钥（**必填**，与上不同）    |
| `JWT_EXPIRES_IN`          | number  | `7200`        | Access Token 有效秒数                           |
| `JWT_REFRESH_EXPIRES_IN`  | number  | `604800`      | Refresh Token 有效秒数（7 天）                  |
| `AI_PROVIDER`             | string  | `tongyi`      | 大模型 Provider：`tongyi` / `deepseek` / `openai` |
| `TONGYI_API_KEY`          | string  | —             | 通义千问 API Key                                |
| `DEEPSEEK_API_KEY`        | string  | —             | DeepSeek API Key                                |
| `OPENAI_API_KEY`          | string  | —             | OpenAI API Key                                  |
| `AI_DAILY_CALL_LIMIT`     | number  | `50`          | 每公司每日 AI 调用上限，超出返回 429            |
| `AI_CACHE_TTL_HOURS`      | number  | `12`          | AI 结果缓存有效小时数                           |
| `LOG_LEVEL`               | string  | `info`        | 日志级别：`debug` / `info` / `warn` / `error`  |
| `VITE_API_BASE_URL`       | string  | `http://localhost:3000/api/v1` | 前端 API 基础 URL           |

### 9.3 代码质量检查清单

> ⚠️ 以下检查项在每次 PR 合并前必须通过，建议配置 GitHub Actions 自动执行。

| 检查项             | 工具                   | 通过标准                              |
| ------------------ | ---------------------- | ------------------------------------- |
| TypeScript 编译    | `tsc --noEmit`         | 0 错误，0 警告                        |
| ESLint 检查        | `eslint src/`          | 0 error，warn ≤ 5 个                  |
| 单元测试通过率     | `jest --coverage`      | 通过率 100%，核心模块覆盖率 ≥ 80%     |
| API 集成测试       | `jest integration/`    | P0 接口全部通过                       |
| 无 `console.log`   | ESLint `no-console`    | 0 violations（使用 `logger` 替代）    |
| 无硬编码密钥       | `git-secrets` 或人工   | 0 violations                          |
| 敏感字段不返回     | 集成测试验证 response  | `password`、`rawPrompt` 不出现在响应中 |
| `companyId` 隔离   | 集成测试跨公司请求     | A 公司 Token 无法读取 B 公司数据       |

---

*文档结束*

*SalesPilot LLD v1.0 · SP-LLD-001 · 2026-03-19*
