颜色：

亮色

| 用途                           | RGB                |
| ------------------------------ | ------------------ |
| Pure White（对话气泡等）       | rgb(255, 255, 255) |
| **背景 Primary ★**（页面底色） | rgb(250, 249, 245) |
| 背景 Secondary（面板/卡片）    | rgb(244, 242, 236) |
| 背景 Tertiary（嵌套容器）      | rgb(235, 233, 225) |
| 边框 Light                     | rgb(220, 217, 207) |
| 边框 Default                   | rgb(195, 192, 180) |

文字：

| 用途           | RGB                |
| -------------- | ------------------ |
| 文字 Primary   | rgb(26, 25, 23)    |
| 文字 Secondary | rgb(88, 86, 80)    |
| 文字 Tertiary  | rgb(138, 136, 128) |
| Placeholder    | rgb(168, 165, 155) |
| Disabled       | rgb(195, 192, 180) |

暗色：**页面背景** Canvas `#0b0b0d` Base `#0f0f10` Surface `#161618` Elevated `#1e1e22` Overlay `#27272c`

**边框** Border Subtle `#2a2a2e` Border Muted `#3a3a40` Border Strong `#4b4b52`

**文字** Primary `#e5e5e6` Secondary `#9b9ba0` Tertiary `#6b6b70` Disabled `#4b4b52`

**品牌紫** Purple Tint `#2d1f5e` Purple Muted `#4a3ab5` Purple Base `#5e6ad2` Purple Light `#9e7fff` Purple Pale `#c4b5fd`

**功能色** Blue `#5b9cf6` Green `#4ade80` Amber `#fbbf24` Red `#f87171`

## 基础配置

| 配置项 | 值 |
|--------|-----|
| 基础地址 | `http://localhost:8080/api` |
| 超时时间 | `10000ms` |
| 认证方式 | `Bearer Token (JWT)` |
| Token 存储 | `localStorage` |

---

## 接口列表

### 1. 刷新 Token 接口

| 项目 | 说明 |
|------|------|
| 接口地址 | `/api/auth/refresh` |
| 请求方式 | `POST` |
| Content-Type | `application/json` |

**请求参数：**
```json
{
  "refresh_token": "string"
}
