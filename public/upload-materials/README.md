
# SalesPilot · AI 销售 CRM SaaS

**用 AI 真实驱动销售决策，而不是套壳对话框**

让大模型读懂你的客户数据，给出成交概率评分、流失预警和每日销售洞察

[在线 Demo](#) · [文档中心](#文档) · [快速开始](#快速开始) · [参与贡献](#参与贡献)

---

![Vue3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=flat-square&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)
![Status](https://img.shields.io/badge/Status-In_Development-orange?style=flat-square)

</div>

---

## 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [环境变量](#环境变量)
- [API 文档](#api-文档)
- [部署指南](#部署指南)
- [开发路线图](#开发路线图)
- [文档](#文档)
- [参与贡献](#参与贡献)
- [许可证](#许可证)

---

## 项目简介

SalesPilot 是一个**全栈开源的 AI 销售 CRM SaaS 系统**，基于 Vue 3 + Node.js 构建，将大模型能力深度嵌入销售业务全链路。

### 和普通 CRM 的本质区别

市面上大多数「AI CRM」只是在传统 CRM 旁边挂了一个对话框。SalesPilot 的 AI 真正**读取业务数据**再输出决策建议：

| 普通 CRM | SalesPilot |
|----------|------------|
| 手动判断客户意向 | AI 读取全部跟进记录，输出 0-100 成交概率评分 |
| 客户流失后才知道 | AI 提前预警：「此客户 16 天无互动，中等流失风险」|
| 靠经验写日报 | AI 读取今日跟进数据，一键生成结构化销售日报 |
| 数据靠手动统计 | ECharts 实时大盘，漏斗图/趋势图/团队排行 |

### 适合谁用

- 5 ~ 50 人规模的销售团队
- 需要客户跟进管理但不想购买 Salesforce 的中小企业
- 想了解 AI SaaS 产品全栈实现的开发者

---

## 核心功能

### 🎯 AI 成交概率预测

输入客户跟进记录，AI 自动分析并输出：

- **成交评分** 0 ~ 100 的量化评估
- **正向信号** 识别已有的有利因素（≤ 3 条）
- **风险点** 识别潜在阻碍（≤ 3 条）
- **行动建议** 下一步最优跟进策略

```
客户：北京创想科技
评分：72 分（高意向）
正向信号：预算已获批 · 近 30 天跟进 5 次 · 已接触 CTO
风险点：竞品已进入评估 · 私有化部署需求增加复杂度
建议：本周内安排技术 Demo，重点演示数据安全方案
```

### ⚠️ AI 流失预警

定时扫描所有跟进中的客户，自动识别流失风险：

- **高风险**（红）— 30 天以上无跟进
- **中风险**（橙）— 14 ~ 29 天无跟进
- **低风险**（黄）— 7 ~ 13 天无跟进

### 📋 AI 销售日报生成

一键生成今日销售工作总结，**SSE 流式输出打字效果**，支持：

- 今日新增客户 / 跟进记录 / 成交情况汇总
- AI 洞察：整体跟进质量评估
- 明日优先跟进客户推荐（Top 3 + 理由）
- 一键复制 Markdown，直接粘贴至钉钉 / 企业微信

### 📋 销售看板（Kanban）

拖拽式看板管理客户销售阶段：

```
潜在客户 → 跟进中 → 意向确认 → 报价谈判 → 已成交
```

- 拖拽客户卡片自动更新阶段状态
- 卡片实时展示 AI 评分、负责人、最近跟进时间
- 评分 > 80 绿色高亮，评分 < 30 红色预警

### 📊 数据可视化大盘

基于 ECharts 5 的实时数据看板：

- 销售额趋势折线图
- 客户来源分布饼图
- 销售漏斗转化图
- 团队业绩排行榜
- AI 评分分布直方图

### 🔐 RBAC 权限系统

三角色权限体系，接口级鉴权：

| 角色 | 权限 |
|------|------|
| `admin` 管理员 | 所有功能 + 用户管理 + 系统配置 |
| `manager` 主管 | 团队全量数据 + 数据大盘 + 预警管理 |
| `sales` 销售员 | 自己负责客户的增删改查 + AI 分析 |

---

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                前端（Vue 3 SPA）                      │
│   Vue3 · TypeScript · Pinia · ECharts · Element Plus │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS · REST / SSE
┌──────────────────────────▼──────────────────────────┐
│              后端（Node.js + Express）                │
│   Auth · Customer · AI Gateway · Stats · Notify     │
└────────────┬─────────────────────────┬──────────────┘
             │                         │ HTTPS
┌────────────▼──────────┐  ┌──────────▼──────────────┐
│     MongoDB Atlas     │  │    AI API（可配置）       │
│   主数据库 · 索引优化  │  │  通义千问 / DeepSeek     │
└───────────────────────┘  └─────────────────────────┘
```

### 技术栈全览

**前端**

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4+ | 核心框架，Composition API |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由（含路由守卫） |
| Element Plus | 2.x | UI 组件库 |
| ECharts | 5.x | 数据可视化 |
| VueUse | 10.x | 拖拽看板（useDraggable） |
| Axios | 1.x | HTTP 客户端 |
| marked + DOMPurify | latest | Markdown 渲染 + XSS 防护 |

**后端**

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 运行时 |
| Express | 4.x | HTTP 框架 |
| Mongoose | 8.x | MongoDB ODM |
| jsonwebtoken | 9.x | JWT 双令牌认证 |
| bcrypt | 5.x | 密码哈希（cost=12） |
| express-validator | 7.x | 请求参数校验 |
| express-rate-limit | 7.x | 接口限流 |
| node-cron | 3.x | 定时任务（流失预警） |
| helmet | 7.x | HTTP 安全响应头 |
| winston | 3.x | 结构化日志 |

**AI 接入**

支持通过环境变量一键切换大模型 Provider，三家 API 均兼容 OpenAI Chat Completions 格式：

| Provider | 模型 | 特点 |
|----------|------|------|
| 通义千问（默认） | `qwen-plus` | 国内访问稳定，有免费额度 |
| DeepSeek | `deepseek-chat` | 性价比高，推理能力强 |
| OpenAI | `gpt-4o-mini` | 国际标准，需代理 |

---

## 快速开始

### 环境要求

- Node.js >= 20.x
- MongoDB >= 7.x（或 MongoDB Atlas 免费账号）
- 至少一个大模型 API Key（通义千问 / DeepSeek / OpenAI）

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/salepilot.git
cd salepilot
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 3. 配置环境变量

```bash
# 后端
cp server/.env.example server/.env
# 编辑 server/.env，填入 MongoDB URI 和 AI API Key

# 前端
cp client/.env.example client/.env
# 默认指向 http://localhost:3000/api/v1，无需修改
```

### 4. 启动开发服务

```bash
# 终端 1：启动后端
cd server
npm run dev
# 后端运行在 http://localhost:3000

# 终端 2：启动前端
cd client
npm run dev
# 前端运行在 http://localhost:5173
```

### 5. 初始化数据（可选）

```bash
# 执行种子脚本，导入演示数据
cd server
npm run seed
```

访问 `http://localhost:5173`，使用种子数据账号登录：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@demo.com` | `Demo@123456` |
| 销售主管 | `manager@demo.com` | `Demo@123456` |
| 销售员 | `sales@demo.com` | `Demo@123456` |

---

## 项目结构

```
salepilot/
├── client/                          # 前端 Vue 3 应用
│   ├── src/
│   │   ├── api/                     # API 请求层
│   │   │   ├── auth.ts
│   │   │   ├── customer.ts
│   │   │   ├── ai.ts
│   │   │   └── stats.ts
│   │   ├── components/              # 组件层
│   │   │   ├── common/              # 原子组件
│   │   │   ├── business/            # 业务组件
│   │   │   └── charts/              # ECharts 封装
│   │   ├── composables/             # Composition Functions
│   │   │   ├── useSSE.ts            # SSE 流式接收
│   │   │   ├── usePermission.ts     # 权限判断
│   │   │   └── usePagination.ts     # 分页逻辑
│   │   ├── layouts/                 # 页面布局
│   │   ├── router/                  # 路由配置 + 守卫
│   │   ├── stores/                  # Pinia Store
│   │   │   ├── auth.ts
│   │   │   ├── customer.ts
│   │   │   └── ai.ts
│   │   ├── types/                   # TypeScript 类型定义
│   │   ├── utils/                   # 工具函数
│   │   │   └── request.ts           # Axios + 双令牌刷新
│   │   └── views/                   # 页面视图
│   │       ├── auth/
│   │       ├── customer/
│   │       ├── kanban/
│   │       ├── ai/
│   │       └── dashboard/
│   ├── .env.example
│   └── package.json
│
├── server/                          # 后端 Node.js 应用
│   ├── src/
│   │   ├── config/                  # 配置层
│   │   │   ├── database.ts          # MongoDB 连接
│   │   │   └── aiProvider.ts        # AI Provider 工厂
│   │   ├── middlewares/             # 中间件
│   │   │   ├── auth.middleware.ts   # JWT 验证
│   │   │   ├── rbac.middleware.ts   # 角色权限
│   │   │   └── error.middleware.ts  # 全局错误处理
│   │   ├── modules/                 # 业务模块（按领域划分）
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── followup/
│   │   │   ├── ai/
│   │   │   │   ├── ai.gateway.ts    # 大模型网关
│   │   │   │   └── prompts/         # Prompt 模板
│   │   │   ├── stats/
│   │   │   └── notification/
│   │   ├── models/                  # Mongoose Schema
│   │   ├── jobs/                    # 定时任务
│   │   │   └── churnDetection.job.ts
│   │   └── utils/
│   │       ├── AppError.ts
│   │       ├── asyncHandler.ts
│   │       └── logger.ts
│   ├── .env.example
│   └── package.json
│
├── docs/                            # 项目文档
│   ├── SP-SRS-001.docx              # 需求规格说明书
│   ├── SP-HLD-001.md                # 概要设计文档
│   ├── SP-LLD-001.md                # 详细设计文档
│   └── SP-DDD-001.md                # 数据库设计文档
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                   # GitHub Actions CI
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── CHANGELOG.md
├── CONTRIBUTING.md
└── README.md
```

---

## 环境变量

### 后端（`server/.env`）

```bash
# ── 服务器 ──────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── 数据库 ──────────────────────────────────────────
# 本地：mongodb://localhost:27017/salespilot_dev
# Atlas：mongodb+srv://<user>:<pass>@cluster.mongodb.net/salespilot_prod
MONGODB_URI=mongodb://localhost:27017/salespilot_dev

# ── JWT ─────────────────────────────────────────────
# 使用随机字符串：openssl rand -base64 32
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRES_IN=7200          # Access Token 有效秒数（2小时）
JWT_REFRESH_EXPIRES_IN=604800 # Refresh Token 有效秒数（7天）

# ── AI 配置 ──────────────────────────────────────────
# 选择 Provider：tongyi | deepseek | openai
AI_PROVIDER=tongyi

TONGYI_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

AI_DAILY_CALL_LIMIT=50   # 每公司每日 AI 调用上限
AI_CACHE_TTL_HOURS=12    # AI 结果缓存有效小时数

# ── 日志 ─────────────────────────────────────────────
LOG_LEVEL=info  # debug | info | warn | error
```

### 前端（`client/.env`）

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## API 文档

后端启动后，访问 `http://localhost:3000/api/docs` 查看 Swagger 文档（开发环境自动开启）。

### 核心接口速查

```
POST   /api/v1/auth/register              用户注册
POST   /api/v1/auth/login                 用户登录
POST   /api/v1/auth/refresh               刷新 Token

GET    /api/v1/customers                  客户列表（分页+筛选）
POST   /api/v1/customers                  新增客户
GET    /api/v1/customers/:id              客户详情
PUT    /api/v1/customers/:id              更新客户
PATCH  /api/v1/customers/:id/status       更新客户状态（看板拖拽）
DELETE /api/v1/customers/:id              软删除客户

POST   /api/v1/customers/:id/followups    新增跟进记录
GET    /api/v1/customers/:id/followups    跟进记录列表

POST   /api/v1/ai/predict/:customerId     触发成交预测
GET    /api/v1/ai/result/:customerId      获取最新 AI 分析
POST   /api/v1/ai/daily-report            生成日报（SSE 流式）

GET    /api/v1/stats/overview             数据大盘概览
GET    /api/v1/stats/funnel               销售漏斗数据
GET    /api/v1/stats/trend                销售额趋势

GET    /api/v1/notifications              通知列表
PATCH  /api/v1/notifications/:id/read     标记已读
```

---

## 部署指南

### 推荐方案（全免费）

| 服务 | 用途 | 免费额度 |
|------|------|----------|
| Vercel | 前端静态部署 | 100GB 带宽/月 |
| Railway | 后端 Node.js | $5 免费额度/月 |
| MongoDB Atlas | 数据库 M0 | 512MB 永久免费 |

### 一键部署

**前端部署至 Vercel**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在 client/ 目录执行
cd client
vercel --prod
```

**后端部署至 Railway**

1. 访问 [railway.app](https://railway.app)，新建项目
2. 连接 GitHub 仓库，选择 `server/` 目录
3. 添加环境变量（参考上方环境变量配置）
4. Railway 自动检测 Node.js 并部署

**数据库 MongoDB Atlas**

1. 访问 [cloud.mongodb.com](https://cloud.mongodb.com)，注册账号
2. 新建 M0 免费集群（选择新加坡节点，延迟更低）
3. 创建数据库用户，获取连接串
4. 将连接串填入 Railway 环境变量 `MONGODB_URI`

### 生产环境 Checklist

部署前请确认以下配置：

- [ ] `NODE_ENV` 设置为 `production`
- [ ] `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 使用随机强密码（≥ 32 位）
- [ ] MongoDB Atlas 开启 IP 白名单（仅允许 Railway 出口 IP）
- [ ] 前端 `VITE_API_BASE_URL` 指向 Railway 生产域名
- [ ] Railway 后端绑定自定义域名并开启 HTTPS
- [ ] 删除或禁用种子数据脚本

---

## 开发路线图

### ✅ v1.0 — MVP（当前）

- [x] 用户认证（注册/登录/JWT 双令牌）
- [x] RBAC 三角色权限系统
- [x] 客户管理（增删改查 + 软删除）
- [x] 跟进记录时间线
- [x] 销售看板（拖拽 Kanban）
- [x] AI 成交概率预测
- [x] AI 销售日报生成（SSE 流式）
- [x] 全免费方案部署（Vercel + Railway + Atlas）

### 🚧 v1.1 — 预警增强

- [ ] AI 流失预警定时任务
- [ ] 通知中心（站内消息）
- [ ] 流失预警 AI 话术建议

### 📅 v1.2 — 数据大盘

- [ ] ECharts 销售漏斗图
- [ ] 销售额趋势折线图
- [ ] 团队业绩排行榜
- [ ] AI 评分分布直方图

### 📅 v1.3 — 团队协作

- [ ] 多销售员任务分配
- [ ] 主管视角全团队看板
- [ ] 钉钉 / 企业微信日报推送

### 📅 v1.4 — 性能优化

- [ ] Redis 缓存层（AI 结果 / JWT 黑名单 / 限流）
- [ ] 接口响应时间优化
- [ ] 前端虚拟滚动（大列表）

### 📅 v2.0 — 多租户商业化

- [ ] 套餐系统（Free / Pro / Enterprise）
- [ ] 在线支付（微信支付 / 支付宝）
- [ ] 企业独立域名
- [ ] 数据导出（Excel / PDF）

> 💡 有好的功能想法？欢迎 [提 Issue](../../issues/new?template=feature_request.md) 讨论！

---

## 文档

| 文档 | 说明 |
|------|------|
| [SP-SRS-001](./docs/SP-SRS-001.docx) | 需求规格说明书 |
| [SP-HLD-001](./docs/SP-HLD-001.md) | 概要设计文档（系统架构） |
| [SP-LLD-001](./docs/SP-LLD-001.md) | 详细设计文档（函数/类型设计） |
| [SP-DDD-001](./docs/SP-DDD-001.md) | 数据库设计文档（Schema/索引） |
| [CONTRIBUTING](./CONTRIBUTING.md) | 贡献指南 |
| [CHANGELOG](./CHANGELOG.md) | 版本变更记录 |

---

## 参与贡献

非常欢迎任何形式的贡献，无论是代码、文档、测试还是想法！

### 贡献流程

```bash
# 1. Fork 本仓库
# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 提交代码（遵循 Conventional Commits）
git commit -m "feat(ai): add churn warning SSE endpoint"

# 4. 推送分支
git push origin feature/your-feature-name

# 5. 创建 Pull Request，填写 PR 模板
```

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响逻辑）
refactor: 代码重构
test:     测试相关
chore:    构建/工具链
```

### 适合新手的 Issues

查找标有以下标签的 Issue，适合作为第一个贡献：

- `good first issue` — 难度较低，适合入门
- `help wanted` — 欢迎社区参与
- `documentation` — 文档改进

### 本地开发规范

```bash
# 代码检查（提交前必须通过）
npm run lint

# 运行单元测试
npm run test

# 运行集成测试
npm run test:integration

# TypeScript 类型检查
npm run type-check
```

详细贡献指南请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 常见问题

**Q：AI 分析功能需要付费吗？**

A：AI 分析调用第三方大模型 API，默认使用通义千问（有免费额度）。系统设置了每公司每日 50 次调用上限，个人开发测试基本免费。

**Q：数据存在哪里？是否安全？**

A：所有数据存储在你自己的 MongoDB Atlas 数据库，系统不收集任何用户数据。多租户严格隔离，A 公司数据不可能被 B 公司访问。

**Q：支持私有化部署吗？**

A：完全支持。按照[部署指南](#部署指南)中的步骤，使用自己的服务器和数据库即可。所有配置通过环境变量管理。

**Q：可以切换大模型 Provider 吗？**

A：支持。修改 `AI_PROVIDER` 环境变量为 `tongyi` / `deepseek` / `openai`，重启后端服务即可切换，代码无需任何改动。

**Q：MongoDB Atlas M0 免费层够用吗？**

A：根据容量规划，10 家公司规模的 MVP 运营约占用 146MB 存储，Atlas M0（512MB）可支撑约 20 个月，初期完全够用。

---

## 许可证

本项目基于 [MIT License](./LICENSE) 开源。

```
MIT License

Copyright (c) 2026 SalesPilot Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

如果这个项目对你有帮助，欢迎点个 ⭐ Star 支持一下！

[提交 Bug](../../issues/new?template=bug_report.md) · [请求新功能](../../issues/new?template=feature_request.md) · [参与讨论](../../discussions)

**用 AI 让销售更聪明** 🚀

</div>
