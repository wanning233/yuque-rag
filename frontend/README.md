# 语雀 RAG 问答系统 - 前端

基于 React + TypeScript + Vite + Tailwind CSS 构建的现代化问答界面。

## 功能特性

- ✅ 实时流式回答展示（打字机效果）
- ✅ Markdown 渲染和代码语法高亮
- ✅ 对话历史记录（localStorage 持久化）
- ✅ 深色/浅色主题切换
- ✅ 响应式设计，支持移动端
- ✅ 优雅的 UI 交互体验

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录。

### 4. 预览生产构建

```bash
npm run preview
```

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter
- **图标**: lucide-react
- **HTTP 客户端**: axios

## 项目结构

```
src/
├── components/          # React 组件
│   ├── ChatMessage.tsx  # 消息展示组件
│   ├── ChatInput.tsx    # 输入框组件
│   └── ChatHistory.tsx  # 历史记录侧边栏
├── hooks/              # 自定义 Hooks
│   ├── useChat.ts      # 聊天逻辑
│   └── useHistory.ts   # 历史记录管理
├── services/           # API 服务
│   └── api.ts          # 后端 API 调用
├── types/              # TypeScript 类型
│   └── chat.ts         # 聊天相关类型定义
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 配置说明

### API 代理配置

开发环境下，前端会自动将 `/api` 请求代理到后端服务（默认 `http://localhost:8000`）。

配置文件：`vite.config.ts`

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

### 主题配置

主题配置在 `tailwind.config.js` 中，支持浅色和深色两种模式。

用户选择的主题会自动保存在 localStorage 中。

## 使用说明

### 基本操作

1. **发送消息**：在输入框输入问题，点击"发送"按钮或按 Enter 键
2. **换行**：Shift + Enter
3. **新建对话**：点击侧边栏顶部的"新对话"按钮
4. **切换历史**：点击侧边栏中的历史对话
5. **删除对话**：悬停在历史对话上，点击删除图标
6. **切换主题**：点击右上角的太阳/月亮图标
7. **隐藏侧边栏**：点击左上角的菜单图标

### 快捷键

- `Enter` - 发送消息
- `Shift + Enter` - 换行

## 开发指南

### 添加新组件

在 `src/components/` 目录下创建新的 `.tsx` 文件：

```typescript
import React from 'react';

interface MyComponentProps {
  // 定义 props 类型
}

const MyComponent: React.FC<MyComponentProps> = (props) => {
  return <div>My Component</div>;
};

export default MyComponent;
```

### 添加新的 API 接口

在 `src/services/api.ts` 中添加新的 API 函数：

```typescript
export async function myNewApi(params: any): Promise<any> {
  const response = await api.post('/my-endpoint', params);
  return response.data;
}
```

### 样式自定义

使用 Tailwind CSS 的 utility classes 进行样式定制。

如需添加自定义样式，可以在 `src/index.css` 中使用 `@layer` 指令：

```css
@layer components {
  .my-custom-class {
    @apply bg-blue-500 text-white px-4 py-2 rounded;
  }
}
```

## 故障排查

### 连接后端失败

1. 确保后端服务已启动（`http://localhost:8000`）
2. 检查浏览器控制台的网络请求
3. 确认 CORS 配置正确

### 页面样式异常

1. 清除浏览器缓存
2. 确保 Tailwind CSS 配置正确
3. 运行 `npm run build` 重新构建

### 历史记录丢失

历史记录保存在浏览器的 localStorage 中：
- 清除浏览器数据会导致历史记录丢失
- 不同浏览器的数据不共享
- 隐私模式下的数据在关闭窗口后会清除

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## License

Apache 2.0


