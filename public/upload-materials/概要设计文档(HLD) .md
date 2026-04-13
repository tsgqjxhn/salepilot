# SalesPilot · AI 销售 CRM SaaS

## 概要设计文档（High-Level Design）

---

| 项目       | 内容                                         |
| ---------- | -------------------------------------------- |
| 文档编号   | SP-HLD-001                                   |
| 文档版本   | v1.0                                         |
| 项目名称   | SalesPilot · AI 驱动的销售 CRM SaaS 系统    |
| 技术栈     | Vue 3 / TypeScript / Node.js / MongoDB / AI API |
| 文档状态   | 草稿（Draft）                                |
| 创建日期   | 2026-03-19                                   |
| 关联文档   | SP-SRS-001（需求规格说明书 v1.0）            |

---

## 修订历史

| 版本  | 日期       | 修改内容       | 修改人   |
| ----- | ---------- | -------------- | -------- |
| v0.1  | 2026-03-19 | 初稿创建       | 项目负责人 |
| v1.0  | 2026-03-19 | 全文审核，发布 | 项目负责人 |

---

## 目录

1. [引言](#1-引言)
2. [系统总体架构](#2-系统总体架构)
3. [前端架构设计](#3-前端架构设计)
4. [后端架构设计](#4-后端架构设计)
5. [AI 模块设计](#5-ai-模块设计)
6. [数据架构设计](#6-数据架构设计)
7. [接口设计](#7-接口设计)
8. [安全架构设计](#8-安全架构设计)
9. [部署架构设计](#9-部署架构设计)
10. [关键技术决策](#10-关键技术决策)
11. [性能设计](#11-性能设计)
12. [错误处理策略](#12-错误处理策略)
13. [开发规范](#13-开发规范)
14. [附录](#14-附录)

---

## 1. 引言

### 1.1 文档目的

本文档为 SalesPilot AI 销售 CRM SaaS 系统的概要设计文档（HLD），在需求规格说明书（SRS v1.0）基础上，从系统架构层面描述各模块的设计方案、技术选型、模块划分及交互关系，为详细设计（LLD）和编码实现提供顶层指导。

本文档的目标读者为：

- 项目开发者（前后端实现参考）
- 代码评审者（架构合理性审查）
- 未来开源贡献者（快速理解系统全貌）

### 1.2 设计原则

| 原则         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| **关注点分离** | 前端只负责展示与交互，业务逻辑全部在后端，AI 逻辑收敛至 AI 代理模块 |
| **单一职责** | 每个模块/服务只做一件事，Controller 不写业务逻辑，Service 不直接操作 HTTP |
| **可插拔 AI** | 大模型 Provider 以配置方式切换，代码不耦合具体厂商 API        |
| **防御性设计** | AI 输出不可信，所有 AI 返回结果必须经过 Schema 校验后才落库   |
| **渐进增强** | MVP 阶段不引入 Redis、消息队列等中间件，功能完整可用后再优化  |

### 1.3 与 SRS 的对应关系

```
SRS 功能需求  →  HLD 模块设计  →  LLD 接口/类设计  →  编码实现
```

本文档覆盖 SRS 中所有 P0（必须）和 P1（重要）功能的设计方案，P2（迭代）功能仅在架构预留说明，不展开设计。

---

## 2. 系统总体架构

### 2.1 架构风格

系统采用**前后端分离 + RESTful API + SSE 流式推送**的经典三层架构，结合 AI 代理层形成四层结构。整体为单体应用（Monolith），预留微服务拆分扩展点。

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端（Browser）                      │
│              Vue 3 SPA · TypeScript · Vite                   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS · REST / SSE
┌────────────────────────────▼────────────────────────────────┐
│                     后端服务（Backend）                        │
│           Node.js · Express · JWT · RBAC                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Auth    │ │ Customer │ │  Stats   │ │  AI Gateway  │   │
│  │  Module  │ │  Module  │ │  Module  │ │   Module     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────┬───────┘   │
└──────────────────────────────────────────────────┼──────────┘
                             │                     │ HTTPS
┌────────────────────────────▼────┐   ┌────────────▼────────┐
│          数据层（Data）           │   │    外部 AI API        │
│   MongoDB Atlas · 主数据库       │   │  通义千问 / DeepSeek  │
│   Redis（v1.4 迭代引入）         │   │  兼容 OpenAI 格式     │
└─────────────────────────────────┘   └─────────────────────┘
```

### 2.2 系统分层说明

| 层次       | 技术选型                      | 职责                                           |
| ---------- | ----------------------------- | ---------------------------------------------- |
| 展示层     | Vue 3 + TypeScript + Vite     | 用户交互、数据展示、SSE 接收、路由控制          |
| 应用层     | Node.js + Express             | 请求路由、参数校验、业务编排、权限控制          |
| 领域层     | Service + Model               | 核心业务逻辑、数据访问、AI 调用编排             |
| AI 代理层  | AI Gateway Module             | Prompt 拼装、大模型调用、结果解析、缓存判断     |
| 数据层     | MongoDB + （Redis）           | 数据持久化、索引优化、缓存加速                  |
| 外部服务层 | 通义千问 / DeepSeek / OpenAI  | 大模型推理能力                                  |

### 2.3 核心数据流

#### 2.3.1 普通业务请求流

```
用户操作
  → 前端发起 Axios 请求（携带 JWT）
  → 后端 Auth 中间件校验 Token
  → Router 分发至对应 Controller
  → Controller 调用 Service
  → Service 调用 Model 操作 MongoDB
  → 返回 JSON 响应
  → 前端 Pinia Store 更新状态
  → 视图响应式更新
```

#### 2.3.2 AI 分析请求流（SSE）

```
用户点击「AI 分析」
  → 前端发起 POST /ai/predict/:customerId
  → 后端 AI Gateway 检查缓存（ai_results 集合，12h 内）
    ├── 命中缓存 → 直接返回缓存结果
    └── 未命中  → 从 MongoDB 读取客户数据 + 跟进记录
                 → 拼装结构化 Prompt
                 → 调用大模型 API（流式模式）
                 → 后端通过 SSE 转发 chunk 至前端
                 → 流结束后，解析完整结果入库 ai_results
  → 前端 EventSource 接收，实时渲染打字效果
  → 分析完成，更新客户卡片 AI 评分
```

---

## 3. 前端架构设计

### 3.1 技术选型

| 库/工具        | 版本   | 用途                          |
| -------------- | ------ | ----------------------------- |
| Vue 3          | 3.4+   | 核心框架，Composition API      |
| TypeScript     | 5.x    | 类型安全                      |
| Vite           | 5.x    | 构建工具，HMR 热更新           |
| Vue Router 4   | 4.x    | 前端路由，路由守卫鉴权         |
| Pinia          | 2.x    | 全局状态管理                  |
| Element Plus   | 2.x    | UI 组件库                     |
| ECharts 5      | 5.x    | 数据可视化                    |
| VueUse         | 10.x   | 拖拽看板（useDraggable）      |
| Axios          | 1.x    | HTTP 客户端，统一拦截器        |
| marked + DOMPurify | latest | Markdown 渲染 + XSS 防护  |

### 3.2 目录结构

```
src/
├── api/                    # API 请求层（按模块拆分）
│   ├── auth.ts
│   ├── customer.ts
│   ├── ai.ts
│   └── stats.ts
├── assets/                 # 静态资源
├── components/             # 组件层
│   ├── common/             # 原子组件（Button、Modal、Table 等）
│   │   ├── AppButton.vue
│   │   ├── AppModal.vue
│   │   └── AppPagination.vue
│   ├── business/           # 业务组件（跨页面复用）
│   │   ├── CustomerCard.vue
│   │   ├── FollowupTimeline.vue
│   │   ├── AiScoreBadge.vue
│   │   └── AiAnalysisPanel.vue
│   └── charts/             # ECharts 封装组件
│       ├── FunnelChart.vue
│       ├── LineChart.vue
│       └── HeatmapChart.vue
├── composables/            # 可复用 Composition Functions
│   ├── useSSE.ts           # SSE 流式接收封装
│   ├── usePermission.ts    # 权限判断
│   └── usePagination.ts    # 分页逻辑
├── layouts/                # 页面布局
│   ├── DefaultLayout.vue   # 主布局（侧边栏 + Header）
│   └── AuthLayout.vue      # 认证页布局
├── router/                 # 路由配置
│   ├── index.ts
│   └── guards.ts           # 路由守卫（鉴权、权限检查）
├── stores/                 # Pinia Store
│   ├── auth.ts             # 用户登录态、Token
│   ├── customer.ts         # 客户列表、当前详情
│   ├── ai.ts               # AI 分析结果、流式状态
│   └── notification.ts     # 预警通知
├── types/                  # TypeScript 类型定义
│   ├── customer.d.ts
│   ├── ai.d.ts
│   └── api.d.ts
├── utils/                  # 工具函数
│   ├── request.ts          # Axios 实例 + 拦截器
│   ├── format.ts           # 日期、金额格式化
│   └── permission.ts       # 权限常量
└── views/                  # 页面视图
    ├── auth/
    │   ├── LoginView.vue
    │   └── RegisterView.vue
    ├── customer/
    │   ├── CustomerListView.vue
    │   └── CustomerDetailView.vue
    ├── kanban/
    │   └── KanbanView.vue
    ├── ai/
    │   └── DailyReportView.vue
    ├── dashboard/
    │   └── DashboardView.vue
    └── settings/
        └── SettingsView.vue
```

### 3.3 路由设计

```typescript
// 路由结构（含权限控制元信息）
const routes = [
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      { path: 'login',    component: LoginView },
      { path: 'register', component: RegisterView },
    ]
  },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },        // 全局需要登录
    children: [
      { path: 'dashboard',          component: DashboardView,      meta: { roles: ['admin', 'manager'] } },
      { path: 'customers',          component: CustomerListView,   meta: { roles: ['admin', 'manager', 'sales'] } },
      { path: 'customers/:id',      component: CustomerDetailView, meta: { roles: ['admin', 'manager', 'sales'] } },
      { path: 'kanban',             component: KanbanView,         meta: { roles: ['admin', 'manager', 'sales'] } },
      { path: 'ai/daily-report',    component: DailyReportView,    meta: { roles: ['admin', 'manager', 'sales'] } },
      { path: 'settings',           component: SettingsView,       meta: { roles: ['admin'] } },
    ]
  }
]
```

**路由守卫逻辑：**

```
beforeEach:
  1. 目标路由需要 Auth → 检查 Pinia auth.token
     ├── 无 Token → redirect /auth/login
     └── 有 Token → 继续
  2. 检查目标路由 meta.roles
     ├── 当前用户 role 在列表中 → 放行
     └── 不在列表中 → redirect /403
  3. Token 过期（401 响应）→ 尝试 Refresh Token
     ├── 刷新成功 → 重试原请求
     └── 刷新失败 → 清除 Token，redirect /auth/login
```

### 3.4 状态管理设计

```typescript
// stores/auth.ts
interface AuthStore {
  token: string | null           // Access Token（内存存储）
  refreshToken: string | null    // Refresh Token（localStorage）
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'sales'
    companyId: string
  } | null
  // Actions
  login(credentials): Promise<void>
  logout(): void
  refreshAccessToken(): Promise<boolean>
}

// stores/customer.ts
interface CustomerStore {
  list: Customer[]
  total: number
  currentPage: number
  filters: CustomerFilters
  currentDetail: CustomerDetail | null
  loading: boolean
  // Actions
  fetchList(params): Promise<void>
  fetchDetail(id): Promise<void>
  createCustomer(data): Promise<Customer>
  updateStatus(id, status): Promise<void>
}

// stores/ai.ts
interface AiStore {
  streaming: boolean             // SSE 是否正在流式输出
  streamContent: string          // 当前流式内容（实时追加）
  analysisResults: Map<string, AiResult>  // customerId → 分析结果
  // Actions
  predict(customerId): Promise<void>      // 触发成交预测
  generateDailyReport(): void             // 触发日报生成（SSE）
  stopStream(): void
}
```

### 3.5 SSE 封装设计

```typescript
// composables/useSSE.ts
// 封装 SSE 流式接收，供 AI 日报、成交预测复用

interface UseSSEOptions {
  url: string
  onChunk: (chunk: string) => void    // 收到新 chunk 的回调
  onDone: () => void                  // 流结束回调
  onError: (err: Error) => void       // 错误回调
  timeout?: number                    // 超时时间，默认 30s
}

// 使用 fetch + ReadableStream 而非 EventSource
// 原因：EventSource 不支持 POST 请求，且无法携带 Authorization Header
export function useSSE(options: UseSSEOptions) {
  const controller = new AbortController()
  // fetch → response.body.getReader() → 循环 read() → 解码 → 回调
  // 超时后调用 controller.abort()
}
```

### 3.6 Axios 拦截器设计

```
请求拦截器：
  → 自动附加 Authorization: Bearer <token>
  → 统一设置 Content-Type: application/json

响应拦截器：
  → code = 200 → 返回 data 字段
  → code = 401 → 触发 Token 刷新逻辑
  → code = 403 → 弹出权限不足提示
  → code = 429 → 弹出请求过于频繁提示
  → code = 500 → 弹出服务器错误提示
  → 网络错误  → 弹出网络异常提示
```

---

## 4. 后端架构设计

### 4.1 技术选型

| 库/工具        | 版本   | 用途                                  |
| -------------- | ------ | ------------------------------------- |
| Node.js        | 20 LTS | 运行时                                |
| Express        | 4.x    | HTTP 框架                             |
| Mongoose       | 8.x    | MongoDB ODM，Schema 定义              |
| jsonwebtoken   | 9.x    | JWT 签发与验证                        |
| bcrypt         | 5.x    | 密码哈希                              |
| express-validator | 7.x | 请求参数校验                         |
| express-rate-limit | 7.x | 接口限流                           |
| node-cron      | 3.x    | 定时任务（流失预警）                  |
| cors           | 2.x    | 跨域配置                              |
| helmet         | 7.x    | HTTP 安全响应头                       |
| dotenv         | 16.x   | 环境变量管理                          |
| winston        | 3.x    | 日志系统                              |

### 4.2 目录结构

```
server/
├── src/
│   ├── config/                 # 配置层
│   │   ├── database.ts         # MongoDB 连接
│   │   ├── env.ts              # 环境变量类型化读取
│   │   └── aiProvider.ts       # AI Provider 配置工厂
│   ├── middlewares/            # 中间件层
│   │   ├── auth.middleware.ts  # JWT 验证
│   │   ├── rbac.middleware.ts  # 角色权限检查
│   │   ├── validate.middleware.ts  # 参数校验
│   │   ├── rateLimiter.middleware.ts  # 限流
│   │   └── error.middleware.ts     # 全局错误处理
│   ├── modules/                # 业务模块层（按领域划分）
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validator.ts
│   │   ├── customer/
│   │   │   ├── customer.router.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── customer.service.ts
│   │   │   └── customer.validator.ts
│   │   ├── followup/
│   │   │   ├── followup.router.ts
│   │   │   ├── followup.controller.ts
│   │   │   └── followup.service.ts
│   │   ├── ai/
│   │   │   ├── ai.router.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts           # AI 业务编排
│   │   │   ├── ai.gateway.ts           # 大模型调用核心
│   │   │   └── prompts/                # Prompt 模板目录
│   │   │       ├── dealPrediction.ts
│   │   │       ├── churnWarning.ts
│   │   │       └── dailyReport.ts
│   │   ├── stats/
│   │   │   ├── stats.router.ts
│   │   │   ├── stats.controller.ts
│   │   │   └── stats.service.ts
│   │   └── notification/
│   │       ├── notification.router.ts
│   │       └── notification.service.ts
│   ├── models/                 # Mongoose Model 层
│   │   ├── user.model.ts
│   │   ├── company.model.ts
│   │   ├── customer.model.ts
│   │   ├── followup.model.ts
│   │   ├── aiResult.model.ts
│   │   └── notification.model.ts
│   ├── jobs/                   # 定时任务
│   │   └── churnDetection.job.ts
│   ├── utils/                  # 工具函数
│   │   ├── response.ts         # 统一响应格式
│   │   ├── logger.ts           # Winston 日志
│   │   └── asyncHandler.ts     # async/await 错误捕获包装
│   └── app.ts                  # Express 应用入口
├── .env.example
├── package.json
└── tsconfig.json
```

### 4.3 分层职责规范

```
Router      → 仅定义路由路径，挂载中间件，调用 Controller
Controller  → 解析请求参数，调用 Service，返回响应；禁止写业务逻辑
Service     → 核心业务逻辑，调用 Model 或其他 Service；禁止直接操作 req/res
Model       → Mongoose Schema 定义，静态方法，索引配置
Middleware  → 横切关注点（鉴权、限流、参数校验、错误处理）
```

**禁止事项（代码规范红线）：**

- ❌ Controller 中直接 `Model.find()`
- ❌ Service 中使用 `req`、`res`、`next`
- ❌ 在任何模块中 `console.log`（使用 winston logger）
- ❌ 硬编码 API Key 或密钥
- ❌ try-catch 未处理的 async 函数（使用 asyncHandler 包装）

### 4.4 统一响应格式

```typescript
// utils/response.ts
interface ApiResponse<T> {
  code: number           // HTTP 状态码
  message: string        // 人可读的说明
  data: T | null         // 业务数据
  timestamp: number      // Unix 时间戳（ms）
}

// 成功响应
{ code: 200, message: 'success', data: { ... }, timestamp: 1711234567890 }

// 分页响应（data 字段）
{ list: [...], total: 100, page: 1, limit: 20 }

// 错误响应
{ code: 400, message: '邮箱格式不正确', data: null, timestamp: ... }
{ code: 401, message: 'Token 已过期', data: null, timestamp: ... }
{ code: 403, message: '权限不足', data: null, timestamp: ... }
{ code: 429, message: '请求过于频繁，请稍后重试', data: null, timestamp: ... }
{ code: 500, message: '服务器内部错误', data: null, timestamp: ... }
```

### 4.5 RBAC 中间件设计

```typescript
// middlewares/rbac.middleware.ts

// 角色层级：admin > manager > sales
const ROLE_HIERARCHY = {
  admin:   3,
  manager: 2,
  sales:   1,
}

// 使用方式（挂载在路由上）
// requireRole('manager') 表示 manager 及以上角色可访问
export const requireRole = (minRole: string) =>
  (req, res, next) => {
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 999
    if (userLevel >= requiredLevel) return next()
    return res.status(403).json(errorResponse('权限不足'))
  }

// 数据隔离中间件：自动注入 companyId 过滤条件
export const injectCompanyFilter = (req, res, next) => {
  req.companyFilter = { companyId: req.user.companyId }
  next()
}
```

### 4.6 定时任务设计

```
churnDetection.job.ts

调度：每天 09:00（Asia/Shanghai）
执行步骤：
  1. 查询所有 status 为 following / intent 的客户（全公司）
  2. 计算 daysSinceLastFollowup = now - lastFollowup
  3. 规则判断：
     - daysSinceLastFollowup > 30 → 生成高风险预警
     - daysSinceLastFollowup > 14 → 生成中风险预警
  4. 批量写入 notifications 集合
  5. 更新客户的 churnRisk 字段
  6. 记录执行日志（winston）
```

---

## 5. AI 模块设计

### 5.1 模块概览

AI 模块是 SalesPilot 的核心差异化能力，设计原则为：**AI 深度读取业务数据，不是对话层套壳**。

```
ai.service.ts（业务编排）
  ├── 判断是否使用缓存
  ├── 从 MongoDB 读取业务数据
  ├── 调用对应 Prompt Builder
  └── 调用 ai.gateway.ts

ai.gateway.ts（大模型网关）
  ├── 根据配置选择 Provider（通义 / DeepSeek / OpenAI）
  ├── 统一调用接口（Chat Completions 格式）
  ├── 处理流式（SSE）和非流式两种模式
  └── 错误重试（最多 2 次）

prompts/（Prompt 模板）
  ├── dealPrediction.ts   → 成交预测
  ├── churnWarning.ts     → 流失预警
  └── dailyReport.ts      → 销售日报
```

### 5.2 AI Provider 工厂设计

```typescript
// config/aiProvider.ts
// 通过环境变量切换，代码不耦合具体厂商

interface AiProvider {
  name: string
  baseURL: string
  apiKey: string
  model: string
  maxTokens: number
}

// 支持的 Provider
const providers: Record<string, AiProvider> = {
  tongyi: {
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.TONGYI_API_KEY!,
    model: 'qwen-plus',
    maxTokens: 2000,
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY!,
    model: 'deepseek-chat',
    maxTokens: 2000,
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
    maxTokens: 2000,
  },
}

// 通过 AI_PROVIDER=tongyi 环境变量切换
export const getProvider = () => providers[process.env.AI_PROVIDER ?? 'tongyi']
```

> 三家 API 均兼容 OpenAI Chat Completions 格式，网关层代码零修改即可切换。

### 5.3 成交预测 Prompt 设计

```typescript
// prompts/dealPrediction.ts

export function buildDealPredictionPrompt(customer: CustomerData): string {
  return `
你是一名经验丰富的销售分析专家。请根据以下客户信息和跟进记录，分析该客户的成交概率。

## 客户基本信息
- 公司名称：${customer.name}
- 所属行业：${customer.industry}
- 客户来源：${customer.source}
- 预计合同金额：${customer.dealValue ? `¥${customer.dealValue}` : '未填写'}
- 当前状态：${customer.status}
- 最近跟进时间：${customer.lastFollowup}

## 跟进记录（最近 10 条，时间倒序）
${customer.followups.map((f, i) =>
  `${i + 1}. [${f.date}] [${f.method}] ${f.content}`
).join('\n')}

## 互动统计
- 近 30 天跟进次数：${customer.stats.followupsLast30Days} 次
- 平均跟进间隔：${customer.stats.avgIntervalDays} 天

## 输出要求
请严格以 JSON 格式返回，不要输出任何 JSON 以外的内容：
{
  "score": <0-100 的整数，成交概率>,
  "level": "<high|medium|low>",
  "positives": ["<正向信号1>", "<正向信号2>"],
  "risks": ["<风险点1>", "<风险点2>"],
  "suggestion": "<一句话下一步建议>"
}
`.trim()
}
```

### 5.4 AI 结果校验与兜底

```typescript
// ai.service.ts（结果校验逻辑）

// AI 返回结果 Schema（防御性验证）
const AiResultSchema = {
  score:      (v) => Number.isInteger(v) && v >= 0 && v <= 100,
  level:      (v) => ['high', 'medium', 'low'].includes(v),
  positives:  (v) => Array.isArray(v) && v.length <= 5,
  risks:      (v) => Array.isArray(v) && v.length <= 5,
  suggestion: (v) => typeof v === 'string' && v.length > 0,
}

// 校验失败时的兜底处理
const fallbackResult = {
  score: -1,
  level: 'unknown',
  positives: [],
  risks: ['AI 解析失败，请重新分析'],
  suggestion: '请手动评估该客户状态',
}
```

### 5.5 SSE 流式转发设计

```
前端                    后端                      大模型 API
  │                       │                            │
  │── POST /ai/daily ────▶│                            │
  │                       │── Chat Completions ───────▶│
  │                       │   (stream: true)            │
  │◀── SSE Headers ───────│                            │
  │                       │◀── chunk1 ─────────────────│
  │◀── data: chunk1 ──────│                            │
  │                       │◀── chunk2 ─────────────────│
  │◀── data: chunk2 ──────│                            │
  │                       │◀── [DONE] ─────────────────│
  │◀── data: [DONE] ──────│                            │
  │                       │── 解析完整内容，入库 ─────────│
```

**后端 SSE 响应头设置：**

```typescript
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
res.setHeader('X-Accel-Buffering', 'no')  // 禁用 Nginx 缓冲
res.flushHeaders()
```

---

## 6. 数据架构设计

### 6.1 集合详细设计

#### 6.1.1 users

```typescript
{
  _id:          ObjectId,
  email:        String,       // 唯一索引
  password:     String,       // bcrypt hash
  name:         String,
  role:         String,       // enum: ['admin', 'manager', 'sales']
  companyId:    ObjectId,     // 关联 companies
  isActive:     Boolean,      // false = 账号停用
  lastLoginAt:  Date,
  createdAt:    Date,
  updatedAt:    Date,
}
// 索引：{ email: 1 } unique，{ companyId: 1, role: 1 }
```

#### 6.1.2 customers

```typescript
{
  _id:           ObjectId,
  companyId:     ObjectId,    // 租户隔离关键字段，所有查询必须带此条件
  name:          String,
  contact:       String,
  phone:         String,
  email:         String,
  industry:      String,      // enum: 枚举行业列表
  status:        String,      // enum: ['potential','following','intent','negotiating','won','lost']
  source:        String,      // enum: ['website','referral','ad','exhibition','other']
  assignedTo:    ObjectId,    // 关联 users
  dealValue:     Number,      // 单位：元
  aiScore:       Number,      // -1 = 未分析，0-100 = AI 评分
  churnRisk:     String,      // enum: ['high','medium','low','none']
  lastFollowup:  Date,
  tags:          [String],
  notes:         String,
  isDeleted:     Boolean,     // 软删除标志
  createdAt:     Date,
  updatedAt:     Date,
}
// 索引：
//   { companyId: 1, status: 1, assignedTo: 1 }  复合查询
//   { companyId: 1, aiScore: -1 }                按评分排序
//   { companyId: 1, lastFollowup: 1 }             流失预警扫描
//   { companyId: 1, isDeleted: 1, createdAt: -1 } 列表分页
```

#### 6.1.3 followups

```typescript
{
  _id:          ObjectId,
  customerId:   ObjectId,     // 关联 customers
  companyId:    ObjectId,     // 冗余字段，加速查询无需 join
  createdBy:    ObjectId,     // 关联 users（操作者）
  method:       String,       // enum: ['phone','email','visit','wechat','meeting']
  content:      String,       // 跟进内容，AI 的核心输入
  nextFollowup: Date,         // 计划下次跟进时间
  createdAt:    Date,
}
// 索引：{ customerId: 1, createdAt: -1 }（时间线查询）
//       { companyId: 1, createdBy: 1, createdAt: -1 }（日报统计）
```

#### 6.1.4 ai_results

```typescript
{
  _id:          ObjectId,
  customerId:   ObjectId,     // 关联 customers
  companyId:    ObjectId,
  type:         String,       // enum: ['deal_prediction', 'churn_warning']
  score:        Number,       // 0-100，仅 deal_prediction 有效
  level:        String,       // 'high' | 'medium' | 'low' | 'unknown'
  positives:    [String],
  risks:        [String],
  suggestion:   String,
  modelUsed:    String,       // 记录使用的模型，便于 A/B 测试
  rawPrompt:    String,       // 完整 Prompt（生产环境可通过配置关闭）
  createdAt:    Date,         // 分析时间，缓存有效期判断依据
}
// 索引：{ customerId: 1, type: 1, createdAt: -1 }（缓存查询）
// TTL 索引（可选）：{ createdAt: 1 } expireAfterSeconds: 86400（24h 自动清理）
```

#### 6.1.5 notifications

```typescript
{
  _id:          ObjectId,
  companyId:    ObjectId,
  targetUserId: ObjectId,     // 通知接收人，null = 全公司可见
  type:         String,       // 'churn_warning' | 'system'
  title:        String,
  content:      String,
  relatedId:    ObjectId,     // 关联的 customer._id
  level:        String,       // 'high' | 'medium' | 'low'
  isRead:       Boolean,
  createdAt:    Date,
}
// 索引：{ companyId: 1, targetUserId: 1, isRead: 1, createdAt: -1 }
```

### 6.2 多租户数据隔离策略

系统采用**共享数据库 + 字段隔离**方案（Shared Database, Separate Data）：

```
所有集合均包含 companyId 字段
后端所有数据查询，必须在 Service 层注入 { companyId: req.user.companyId } 条件
不依赖前端传入 companyId（防止越权）

示例：
// ✅ 正确
const customers = await Customer.find({ companyId: req.user.companyId, ...filters })

// ❌ 错误（未过滤公司，存在越权风险）
const customers = await Customer.find({ ...filters })
```

### 6.3 索引设计原则

1. 所有涉及 `companyId` 的查询，`companyId` 必须作为复合索引第一个字段
2. 高频排序字段（`createdAt`、`aiScore`）加入复合索引末尾
3. 避免超过 3 个字段的复合索引
4. `followups` 为高写入集合，索引数量控制在 3 个以内

---

## 7. 接口设计

### 7.1 接口总览

| 模块     | 方法   | 路径                              | 说明                | 最低角色  |
| -------- | ------ | --------------------------------- | ------------------- | --------- |
| 认证     | POST   | `/api/v1/auth/register`           | 用户注册            | 公开      |
| 认证     | POST   | `/api/v1/auth/login`              | 用户登录            | 公开      |
| 认证     | POST   | `/api/v1/auth/refresh`            | 刷新 Access Token   | 公开      |
| 认证     | POST   | `/api/v1/auth/logout`             | 登出                | sales     |
| 客户     | GET    | `/api/v1/customers`               | 客户列表（分页）    | sales     |
| 客户     | POST   | `/api/v1/customers`               | 新增客户            | sales     |
| 客户     | GET    | `/api/v1/customers/:id`           | 客户详情            | sales     |
| 客户     | PUT    | `/api/v1/customers/:id`           | 更新客户信息        | sales     |
| 客户     | PATCH  | `/api/v1/customers/:id/status`    | 更新客户状态        | sales     |
| 客户     | DELETE | `/api/v1/customers/:id`           | 软删除客户          | manager   |
| 跟进记录 | GET    | `/api/v1/customers/:id/followups` | 跟进记录列表        | sales     |
| 跟进记录 | POST   | `/api/v1/customers/:id/followups` | 新增跟进记录        | sales     |
| AI       | POST   | `/api/v1/ai/predict/:customerId`  | 触发成交预测        | sales     |
| AI       | GET    | `/api/v1/ai/result/:customerId`   | 获取最新分析结果    | sales     |
| AI       | POST   | `/api/v1/ai/daily-report`         | 生成日报（SSE）     | sales     |
| 统计     | GET    | `/api/v1/stats/overview`          | 数据大盘概览        | manager   |
| 统计     | GET    | `/api/v1/stats/funnel`            | 销售漏斗数据        | manager   |
| 统计     | GET    | `/api/v1/stats/trend`             | 销售额趋势          | manager   |
| 通知     | GET    | `/api/v1/notifications`           | 通知列表            | sales     |
| 通知     | PATCH  | `/api/v1/notifications/:id/read`  | 标记已读            | sales     |

### 7.2 关键接口详细说明

#### POST /api/v1/auth/login

**请求体：**
```json
{ "email": "user@example.com", "password": "Password123" }
```

**成功响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 7200,
    "user": {
      "id": "64f...",
      "name": "张三",
      "email": "user@example.com",
      "role": "sales",
      "companyId": "64e..."
    }
  },
  "timestamp": 1711234567890
}
```

#### GET /api/v1/customers（分页+筛选）

**Query 参数：**

| 参数        | 类型   | 说明                                            |
| ----------- | ------ | ----------------------------------------------- |
| page        | number | 页码，默认 1                                    |
| limit       | number | 每页条数，默认 20，最大 100                     |
| status      | string | 状态筛选，多个用逗号分隔                        |
| assignedTo  | string | 负责人 ID，manager 以上可筛选他人               |
| keyword     | string | 关键词搜索（name / contact / phone）            |
| sortBy      | string | 排序字段：`aiScore`/`lastFollowup`/`createdAt`  |
| sortOrder   | string | `asc` / `desc`，默认 `desc`                     |

#### POST /api/v1/ai/daily-report（SSE）

**响应格式（text/event-stream）：**

```
data: {"type":"start","message":"AI 正在生成日报..."}

data: {"type":"chunk","content":"## 今日销售日报\n\n"}

data: {"type":"chunk","content":"### 今日概览\n"}

data: {"type":"chunk","content":"- 新增客户：3 位\n"}

data: {"type":"done","totalTokens":456}
```

**错误格式：**
```
data: {"type":"error","code":"AI_TIMEOUT","message":"AI 服务超时，请重试"}
```

---

## 8. 安全架构设计

### 8.1 认证方案

```
Token 双令牌机制：

Access Token：
  - 有效期：2 小时
  - 存储：前端内存（Pinia store），不写 localStorage
  - 用途：每次请求携带，API 鉴权

Refresh Token：
  - 有效期：7 天
  - 存储：localStorage（HttpOnly Cookie 在跨域 SaaS 场景有兼容问题）
  - 用途：Access Token 过期时，无感刷新

Token 刷新流程：
  1. 请求返回 401
  2. Axios 拦截器暂存当前请求
  3. 使用 Refresh Token 请求 /auth/refresh
  4. 成功 → 更新 Access Token → 重放暂存请求
  5. 失败 → 清除所有 Token → 跳转登录页
```

### 8.2 数据安全

| 安全措施           | 实现方式                                              |
| ------------------ | ----------------------------------------------------- |
| 密码存储           | bcrypt hash，cost factor = 12                         |
| SQL 注入防护       | MongoDB + Mongoose，无原生 SQL，参数化查询            |
| XSS 防护（后端）   | helmet 设置 Content-Security-Policy                   |
| XSS 防护（前端）   | marked 渲染 Markdown 后，DOMPurify 净化 HTML          |
| API Key 保护       | 仅存服务端 .env，禁止前端直接调用大模型 API           |
| 数据越权防护       | 所有查询注入 companyId，Service 层强制过滤             |
| 接口限流           | express-rate-limit，全局 120次/min，AI 接口 10次/hour |
| HTTPS              | Vercel / Railway 自动 HTTPS，禁止 HTTP                |

### 8.3 AI 安全

```
Prompt 注入防护：
  - 跟进记录内容在拼入 Prompt 前，过滤特殊指令字符
  - Prompt 结构使用 XML 标签包裹用户数据，与系统指令明确分隔
  - 示例：<user_data>{{ followup.content }}</user_data>

AI 输出信任边界：
  - AI 返回内容不直接展示为 HTML（防止 XSS）
  - 必须通过 JSON Schema 校验后才写入数据库
  - 异常格式触发兜底机制，不影响正常业务流程
```

---

## 9. 部署架构设计

### 9.1 MVP 阶段部署方案（全免费）

```
                        ┌──────────────┐
   用户浏览器  ──HTTPS──▶│    Vercel     │ 前端 SPA 静态部署
                        │  (全球 CDN)  │ 自动 CI/CD（GitHub 推送即部署）
                        └──────┬───────┘
                               │ API 请求
                        ┌──────▼───────┐
                        │   Railway    │ 后端 Node.js 服务
                        │  (自动扩缩)  │ 免费 500 小时/月
                        └──────┬───────┘
                               │ Mongoose 连接
                        ┌──────▼───────┐
                        │ MongoDB Atlas│ 免费 M0（512MB）
                        │ (新加坡节点) │
                        └─────────────┘
```

### 9.2 环境配置

| 环境       | 前端              | 后端            | 数据库              |
| ---------- | ----------------- | --------------- | ------------------- |
| 开发（dev）| localhost:5173    | localhost:3000  | 本地 MongoDB        |
| 测试（staging）| Vercel Preview | Railway Preview | Atlas 测试集群   |
| 生产（prod）| Vercel Production | Railway Prod   | Atlas 生产集群      |

### 9.3 CI/CD 流程

```
开发者 git push → GitHub

GitHub Actions：
  ├── 前端：npm run build → Vercel CLI 部署
  └── 后端：npm run build → Railway 自动检测推送部署

main 分支 → 生产环境
dev 分支  → 预览环境（每次 PR 自动生成预览 URL）
```

### 9.4 环境变量清单

```bash
# 后端 .env（服务端，禁止提交 Git）
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<随机 32 位字符串>
JWT_REFRESH_SECRET=<随机 32 位字符串>
JWT_EXPIRES_IN=7200
JWT_REFRESH_EXPIRES_IN=604800

AI_PROVIDER=tongyi            # tongyi | deepseek | openai
TONGYI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...

AI_DAILY_CALL_LIMIT=50        # 每公司每日 AI 调用上限
AI_CACHE_TTL_HOURS=12         # AI 结果缓存时间（小时）
NODE_ENV=production

# 前端 .env（公开，可提交）
VITE_API_BASE_URL=https://api.salepilot.app/api/v1
```

---

## 10. 关键技术决策

### 10.1 决策记录（Architecture Decision Record）

#### ADR-001：为什么选择 SSE 而非 WebSocket？

| 维度     | SSE                         | WebSocket                    |
| -------- | --------------------------- | ---------------------------- |
| 方向     | 单向（服务端 → 客户端）     | 双向                         |
| 复杂度   | 低，HTTP 原生支持            | 高，需要握手和心跳           |
| 适用场景 | AI 流式输出（单向推送）     | 实时聊天、协作（双向）       |
| 代理兼容 | 更好（基于 HTTP）            | 部分代理需要特殊配置         |

**决策：选择 SSE**。AI 日报生成和成交预测均为服务端单向推送，SSE 完全满足需求，且复杂度更低。

#### ADR-002：为什么选择 MongoDB 而非 MySQL？

跟进记录的 `content` 字段为非结构化文本，不同销售员记录习惯差异大；客户的 `tags` 是动态数组；未来 AI 分析结果的 JSON 结构可能随模型升级变化。文档模型对这类 schema 灵活演进的场景天然友好，无需频繁 migration。

#### ADR-003：为什么 AI API Key 不直接在前端调用？

1. **安全**：前端 API Key 通过浏览器开发者工具、JS 逆向均可提取
2. **控制**：后端统一管理 AI 调用次数、限流、缓存，防止滥用
3. **可维护**：更换 AI Provider 只改后端配置，前端零感知

#### ADR-004：MVP 阶段不引入 Redis 的原因

Redis 增加了部署复杂度（Railway 付费套餐），且 MongoDB Atlas 免费版 512MB 足够 MVP 阶段的 AI 结果缓存需求（ai_results 文档体积小）。v1.4 版本数据量增长后再引入 Redis 加速。

---

## 11. 性能设计

### 11.1 前端性能

| 优化点           | 方案                                              |
| ---------------- | ------------------------------------------------- |
| 首屏加载         | Vite 代码分割，路由懒加载（`defineAsyncComponent`）|
| 图片/静态资源    | Vite 构建自动 hash + CDN 缓存（Vercel 全球 CDN）   |
| ECharts 按需引入 | 仅引入使用的图表类型，减少 Bundle 体积            |
| 大列表渲染       | 客户列表使用虚拟滚动（vueuse/useVirtualList）     |
| API 请求缓存     | Pinia store 缓存列表数据，避免重复请求            |
| Skeleton Screen  | AI 分析等待期间展示骨架屏，避免页面空白           |

### 11.2 后端性能

| 优化点         | 方案                                              |
| -------------- | ------------------------------------------------- |
| 数据库查询     | 所有高频查询字段建立索引，explain 验证查询计划    |
| AI 结果缓存    | 同一客户 12 小时内不重复调用大模型，读 ai_results |
| 分页查询       | 使用 skip + limit，数据量大后改为游标分页         |
| 聚合查询       | Stats 模块使用 MongoDB Aggregation Pipeline       |
| AI 超时保护    | 大模型调用超时 30 秒，触发 abort 并返回错误       |

### 11.3 性能指标基准

| 指标                 | 目标值         | 监控方式               |
| -------------------- | -------------- | ---------------------- |
| 前端 LCP             | < 2.5 秒       | Lighthouse CI          |
| 前端 TTI             | < 3.5 秒       | Lighthouse CI          |
| API P95 响应时间     | < 300ms        | Railway 监控面板        |
| AI 首字延迟          | < 1 秒         | 前端计时打点           |
| MongoDB 查询时间     | < 100ms（P90） | Mongoose debug 日志    |

---

## 12. 错误处理策略

### 12.1 错误分类

| 错误类型     | 处理方式                                           | 用户感知           |
| ------------ | -------------------------------------------------- | ------------------ |
| 参数校验失败 | 返回 400 + 具体字段错误信息                        | 表单字段红色提示   |
| 认证失败     | 返回 401，前端触发 Token 刷新或跳转登录            | 无感刷新或弹登录框 |
| 权限不足     | 返回 403 + 说明                                    | 弹出提示弹窗       |
| 资源不存在   | 返回 404                                           | 页面显示"未找到"   |
| 限流触发     | 返回 429 + Retry-After 头                          | 提示"稍后重试"     |
| AI 调用失败  | 后端重试 2 次，仍失败返回 503 + 兜底数据           | 提示"AI 分析失败，请重试" |
| 数据库错误   | 记录 winston 日志，返回 500（不暴露内部错误信息）  | 提示"服务异常"     |
| 网络断开     | 前端 Axios 超时（10s）后展示网络异常提示           | Toast 提示         |

### 12.2 全局错误处理中间件

```typescript
// middlewares/error.middleware.ts

// 挂载在所有路由之后（Express 四参数中间件 = 错误处理）
export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  })

  // Mongoose 校验错误
  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse('数据校验失败', err.errors))
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Token 无效'))
  }

  // 兜底
  return res.status(500).json(errorResponse(
    process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  ))
}
```

---

## 13. 开发规范

### 13.1 Git 分支策略

```
main          → 生产环境，只接受 PR 合并，禁止直接 push
dev           → 日常开发集成分支
feature/xxx   → 功能开发分支（如 feature/ai-predict）
fix/xxx       → Bug 修复分支
```

### 13.2 Commit 规范（Conventional Commits）

```
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响逻辑）
refactor: 代码重构
test:     测试相关
chore:    构建/工具链

示例：
feat(ai): add deal prediction SSE endpoint
fix(auth): handle refresh token expiry edge case
docs(readme): add deployment guide
```

### 13.3 代码规范

**前端：**

- ESLint（Vue 官方规则）+ Prettier，提交前自动格式化
- 组件命名：大驼峰 `CustomerCard.vue`
- Composable 命名：`use` 前缀 `useSSE.ts`
- 禁止在 `<template>` 中写复杂逻辑，抽取为 computed 或方法

**后端：**

- ESLint + TypeScript strict 模式
- 所有 async 函数必须用 `asyncHandler` 包裹
- 禁止 `any` 类型（特殊场景需加注释说明）
- 环境变量通过 `config/env.ts` 统一读取，禁止 `process.env.XXX` 散落各处

### 13.4 TypeScript 类型共享策略

前后端共享类型定义通过独立的 `types/` 目录管理：

```
types/                       # 可提取为独立 npm 包或 monorepo shared 目录
├── customer.ts              # Customer、FollowupRecord 接口
├── ai.ts                    # AiResult、AiPrediction 接口
├── auth.ts                  # User、JwtPayload 接口
└── api.ts                   # ApiResponse<T>、PaginatedResponse<T> 泛型
```

---

## 14. 附录

### 14.1 模块间依赖关系

```
ai.module
  └── depends on → customer.service（读取客户数据）
  └── depends on → followup.service（读取跟进记录）
  └── depends on → aiResult.model（缓存读写）

stats.module
  └── depends on → customer.model（聚合查询）
  └── depends on → followup.model（活跃度统计）

notification.module
  └── depends on → customer.model（预警扫描）
  └── triggered by → churnDetection.job（定时触发）
```

### 14.2 第三方服务依赖清单

| 服务           | 用途              | 免费额度                  | 付费预警阈值         |
| -------------- | ----------------- | ------------------------- | -------------------- |
| MongoDB Atlas  | 主数据库          | 512MB，无时间限制         | 数据量接近 400MB 时  |
| Vercel         | 前端部署          | 100GB 带宽/月             | 月访问量 > 10万次    |
| Railway        | 后端部署          | $5 免费额度/月            | 超出后约 $0.000463/vCPU秒 |
| 通义千问       | AI 大模型         | 每日免费 Token 额度        | 设置 50次/公司/日限制 |
| GitHub Actions | CI/CD             | 2000 分钟/月（公开仓库无限） | 通常不会超出         |

### 14.3 风险点与应对

| 风险             | 概率 | 影响 | 应对措施                                           |
| ---------------- | ---- | ---- | -------------------------------------------------- |
| AI API 限流      | 中   | 中   | 后端设置每公司每日调用上限，超出降级提示           |
| MongoDB 512MB 超出 | 低 | 高   | 跟进记录设置软删除而非真实删除，定期归档旧数据     |
| Railway 服务冷启动 | 高 | 中   | 设置健康检查接口，前端首次请求加 loading 状态      |
| AI 返回非 JSON   | 中   | 中   | 后端 try-catch 解析，触发兜底数据，不影响主流程    |
| SSE 连接被代理截断 | 中 | 中   | 超时 30s 后前端自动降级为轮询 /ai/result 接口      |

### 14.4 后续迭代预留扩展点

| 扩展方向       | 当前预留                               | 迭代版本 |
| -------------- | -------------------------------------- | -------- |
| Redis 缓存层   | AI 结果写 MongoDB，接口结构不变        | v1.4     |
| 多租户计费     | companyId 字段已预留，subscription 表待建 | v2.0  |
| 微信/钉钉推送  | notification 集合 channel 字段待扩展  | v1.3     |
| 移动端 App     | API 设计已 RESTful，可直接对接         | v2.0     |
| AI 模型微调    | rawPrompt 字段存储，可导出训练数据集   | v3.0     |

---

*文档结束*

*SalesPilot HLD v1.0 · SP-HLD-001 · 2026-03-19*
