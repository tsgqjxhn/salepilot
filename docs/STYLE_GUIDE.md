# SalePilot 前端风格指南

## 一、颜色系统

### Surface（表面/背景色）
| 变量名 | 亮色模式值 | 暗色模式值 | 用途 |
|--------|-----------|-----------|------|
| `--surface-white` | `rgb(255, 255, 255)` | `rgb(24, 30, 38)` | 卡片、弹窗主背景 |
| `--surface-primary` | `rgb(248, 245, 238)` | `rgb(13, 18, 24)` | 页面主背景、输入框背景 |
| `--surface-secondary` | `rgb(240, 235, 226)` | `rgb(19, 25, 33)` | 次级背景、hover状态 |
| `--surface-tertiary` | `rgb(229, 223, 211)` | `rgb(28, 35, 45)` | 侧边栏背景 |
| `--surface-glass` | `rgba(255, 255, 255, 0.76)` | `rgba(19, 25, 33, 0.78)` | 毛玻璃效果（Header） |

### Border（边框色）
| 变量名 | 亮色模式值 | 暗色模式值 | 用途 |
|--------|-----------|-----------|------|
| `--border-light` | `rgba(191, 181, 167, 0.34)` | `rgba(122, 139, 160, 0.2)` | 默认边框 |
| `--border-default` | `rgba(142, 127, 109, 0.34)` | `rgba(143, 164, 188, 0.28)` | hover状态边框 |

### Text（文字色）
| 变量名 | 亮色模式值 | 暗色模式值 | 用途 |
|--------|-----------|-----------|------|
| `--text-primary` | `rgb(32, 28, 23)` | `rgb(236, 242, 249)` | 主要文字、标题 |
| `--text-secondary` | `rgb(95, 83, 69)` | `rgb(178, 192, 208)` | 次要文字、描述 |
| `--text-tertiary` | `rgb(145, 131, 114)` | `rgb(122, 139, 160)` | 辅助文字、标签 |

### Accent（强调色）
| 变量名 | 亮色模式值 | 暗色模式值 | 用途 |
|--------|-----------|-----------|------|
| `--accent-primary` | `rgb(35, 113, 196)` | `rgb(96, 171, 255)` | 主强调色、链接、高亮 |
| `--accent-soft` | `rgba(35, 113, 196, 0.12)` | `rgba(96, 171, 255, 0.16)` | 强调色背景 |
| `--accent-strong` | `rgb(20, 72, 133)` | `rgb(64, 142, 228)` | 深强调色 |

### 状态色
- `--success-soft`: 成功状态背景
- `--warning-soft`: 警告状态背景
- `--danger-soft`: 危险状态背景

### 阴影与遮罩
- `--shadow-soft`: 按钮、小卡片阴影
- `--shadow-card`: 大卡片阴影
- `--overlay-color`: 遮罩层

## 二、圆角规范

| 类型 | 圆角值 | 应用场景 |
|------|-------|---------|
| 大圆角 | `28px - 30px` | 页面卡片、表单面板 |
| 中圆角 | `14px - 20px` | 按钮、输入框、菜单项 |
| 全圆角 | `999px` | Pill按钮、标签、徽章 |
| 圆形 | `50%` | 头像、图标按钮 |

## 三、间距规范

- 页面内间距：`36px`
- 卡片内间距：`24px - 28px`
- 元素间距：`12px - 18px`
- 紧凑间距：`8px - 10px`

## 四、字体规范

### Eyebrow标签
```css
font-size: 12px - 13px;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
```

### 正文
```css
font-size: 14px - 16px;
```

### 小标题
```css
font-size: 20px - 22px;
font-weight: 700;
```

### 大标题
```css
font-size: 30px - 46px;
font-weight: 700;
letter-spacing: -0.04em;
```

### Hero标题
```css
font-size: clamp(32px, 5vw, 56px);
```

## 五、组件开发清单

开发新页面时请遵循：

1. ✅ 使用 `var(--surface-*)` 系列变量设置背景
2. ✅ 使用 `var(--text-*)` 系列变量设置文字颜色
3. ✅ 卡片圆角使用 `28px - 30px`
4. ✅ 按钮圆角使用 `999px` (pill) 或 `14px` (标准)
5. ✅ 阴影使用 `var(--shadow-card)` 或 `var(--shadow-soft)`
6. ✅ Eyebrow标签使用 `13px + 700 + 0.08em + uppercase`
7. ✅ 标题使用 `clamp()` 实现响应式字号
8. ✅ 间距优先使用 `12px, 14px, 16px, 18px, 24px` 系列

## 六、参考文件

- 颜色变量定义: [`src/assets/base.css`](../src/assets/base.css)
- 主样式文件: [`src/assets/main.css`](../src/assets/main.css)
