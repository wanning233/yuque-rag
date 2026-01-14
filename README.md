<h1 align="center">yuque-rag</h1>

<div align="center">结合 <b>语雀知识库</b> 与本地/远程大模型的 <b>RAG（检索增强生成）</b>问答系统。</div>

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/React-18+-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/React%20Native-0.83+-61DAFB.svg" alt="React Native">
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-Apache%202.0-green.svg" alt="License">
</div>

## ✨ 功能特性

### 后端能力
- 📥 自动加载语雀团队或知识库内容
- 🧹 文档切分、清洗与向量化
- 🔍 两阶段检索（向量检索 + 重排序）
- 🤖 支持本地 LLM（Ollama）或远程 API（OpenAI 兼容）
- 📡 FastAPI REST API + 流式响应（SSE）
- 🔐 JWT 认证系统（单设备登录）
- 📚 Swagger API 文档（访问 `/docs`）
- 🔌 FAISS 向量存储持久化

### 前端界面（Web）
- 💬 实时流式对话（打字机效果）
- 📝 Markdown 渲染和代码语法高亮
- 📂 对话历史记录（localStorage 持久化）
- 🎨 深色/浅色主题切换
- 📱 响应式设计，支持移动端
- ⚡ 基于 React + TypeScript + Vite 构建

### 移动端应用（Android）
- 📱 React Native 原生应用体验
- 🔐 用户登录认证（JWT Token）
- 💬 流式聊天问答（打字机效果）
- 📂 本地聊天历史存储
- 👤 用户信息管理
- 🌓 自动适配暗黑模式
- 🎨 统一主题色（#ee4d2d）

## 🗂️ 项目结构

```bash
yuque-rag/
├── backend/                  # 后端服务
│   ├── app.py                # 命令行问答入口
│   ├── server.py             # FastAPI 服务端（含 Swagger）
│   ├── test_webui.py         # Streamlit 调试页面
│   ├── config.py             # 配置文件
│   ├── auth/                 # 认证系统（JWT）
│   ├── loader/               # 语雀数据加载
│   ├── embedder/             # 向量化与重排序
│   ├── retriever/            # 检索器
│   ├── vectorstore/          # 向量存储
│   ├── llm/                  # LLM 调用（Ollama/OpenAI）
│   ├── tools/                # 工具模块
│   ├── requirements.txt      # Python 依赖
│   ├── run_app.sh           # 启动命令行问答
│   ├── run_server.sh        # 启动 API 服务
│   └── run_webui.sh         # 启动调试页面
│
├── frontend/                 # 前端 Web 应用
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── services/         # API 服务
│   │   ├── types/            # TypeScript 类型
│   │   ├── App.tsx           # 主应用
│   │   └── main.tsx          # 入口文件
│   ├── package.json          # 前端依赖
│   ├── vite.config.ts        # Vite 配置
│   ├── tailwind.config.js    # Tailwind 配置
│   ├── run_dev.sh           # 启动开发服务器
│   └── README.md            # 前端文档
│
└── mobile/                   # 移动端应用（React Native）
    ├── src/
    │   ├── components/       # React Native 组件
    │   ├── contexts/         # Context（认证、状态）
    │   ├── screens/          # 页面组件
    │   ├── services/         # API 服务
    │   ├── utils/            # 工具函数
    │   ├── types/            # TypeScript 类型
    │   └── navigation/       # 导航配置
    ├── android/              # Android 原生代码
    ├── package.json          # 移动端依赖
    ├── App.tsx               # 移动端入口
    ├── setup.sh             # 安装脚本
    └── README_MOBILE.md     # 移动端文档
```

## 🚀 快速开始

### 前置要求

- **后端**: Python 3.8+
- **前端**: Node.js 16+
- **（可选）本地模型**: Ollama（如使用本地 LLM）

### 1️⃣ 后端配置与启动

#### 安装依赖

后端已创建虚拟环境，依赖已安装。如需重新安装：

```bash
cd backend
./venv/bin/pip install -r requirements.txt
```

#### 配置参数

编辑 `backend/config.py`，配置语雀 Token 和 LLM：

```python
# 语雀配置（Token 获取：https://www.yuque.com/yuque/developer/api#sAVSW）
YUQUE_TOKEN = "your-yuque-token"
YUQUE_GROUP = "your-group"
YUQUE_NAMESPACE = "your-group/your-repo"  # 或 None 获取整个团队

# LLM 配置
USE_OPENAI = True  # True 使用 OpenAI API，False 使用 Ollama
OPENAI_API_KEY = "your-api-key"
OPENAI_MODEL = "Qwen/Qwen2.5-7B-Instruct"
OPENAI_API_BASE = "https://api.siliconflow.cn/v1"
```

#### 启动服务

```bash
cd backend

# 方式1：启动 FastAPI 服务（推荐用于前端对接）
./run_server.sh
# 访问 API 文档：http://localhost:8000/docs

# 方式2：命令行问答模式
./run_app.sh

# 方式3：Streamlit 调试页面
./run_webui.sh
```

**首次运行**会自动：
- 下载嵌入模型和重排序模型
- 加载语雀知识库
- 生成向量索引并保存

### 2️⃣ 前端配置与启动

#### 安装依赖

```bash
cd frontend
npm install
```

#### 启动开发服务器

```bash
./run_dev.sh
# 或直接运行: npm run dev
```

访问：**http://localhost:3000**

前端会自动代理 `/api` 请求到后端 `http://localhost:8000`。

#### 生产构建

```bash
npm run build
npm run preview  # 预览生产构建
```

### 3️⃣ 移动端配置与启动

#### 环境要求

- Node.js >= 20
- Java JDK 17+
- Android Studio
- Android SDK (API Level 24+)

#### 安装依赖

```bash
cd mobile
npm install
```

或使用安装脚本：

```bash
cd mobile
chmod +x setup.sh
./setup.sh
```

#### 配置后端地址

编辑 `mobile/src/config/index.ts` 配置后端服务器地址：

```typescript
export const Config = {
  API_BASE_URL: 'https://your-backend-url.com',
  // ...
};
```

#### 启动应用

```bash
# 启动 Metro 服务器
npm start

# 在另一个终端运行 Android
npm run android
```

#### 测试账号

- admin / admin123
- user1 / password123
- test / test123

详细文档见 `mobile/README_MOBILE.md`

## 📡 API 接口说明

后端提供以下 REST API（详细文档见 `http://localhost:8000/docs`）：

### 1. 健康检查
```bash
GET /health
```

### 2. 问答接口（一次性返回）
```bash
POST /chat
Content-Type: application/json

{
  "question": "什么是 RAG？"
}
```

### 3. 流式问答接口（SSE）
```bash
POST /chat/stream
Content-Type: application/json

{
  "question": "什么是 RAG？"
}
```

返回格式（SSE）：
```
data: {"content": "R"}
data: {"content": "A"}
data: {"content": "G"}
...
data: {"done": true}
```

## 🎨 前端功能说明

### 主要功能

1. **实时对话**：流式展示 AI 回答，支持打字机效果
2. **Markdown 渲染**：自动渲染 Markdown 格式，代码块语法高亮
3. **历史记录**：自动保存对话历史，支持切换、删除
4. **主题切换**：深色/浅色模式，自动保存偏好
5. **响应式设计**：支持桌面端和移动端

### 快捷键

- `Enter` - 发送消息
- `Shift + Enter` - 换行

## 🧠 模型说明

### 嵌入模型
`maidalun1020/bce-embedding-base_v1`
- 用于文档向量化
- 维度：768

### 重排序模型
`maidalun1020/bce-reranker-base_v1`
- 用于检索结果重排序
- 提升检索准确率

致谢：[NetEase Youdao. BCEmbedding: Bilingual and Crosslingual Embedding for RAG, 2023.](https://github.com/netease-youdao/BCEmbedding)

## 🔧 开发指南

### 后端开发

1. **添加新接口**：在 `backend/server.py` 中添加路由
2. **修改配置**：编辑 `backend/config.py`
3. **查看日志**：运行 `./run_server.sh` 后查看控制台输出

### 前端开发

1. **添加组件**：在 `frontend/src/components/` 创建 `.tsx` 文件
2. **添加 API**：在 `frontend/src/services/api.ts` 中添加接口函数
3. **样式定制**：使用 Tailwind CSS 或编辑 `index.css`

详见 `frontend/README.md`。

## 📊 技术栈

### 后端
- **框架**: FastAPI + Uvicorn
- **向量存储**: FAISS
- **嵌入模型**: BCEmbedding（HuggingFace）
- **LLM**: OpenAI API / Ollama
- **检索**: LangChain + Reranker

### 前端（Web）
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **Markdown**: react-markdown
- **代码高亮**: react-syntax-highlighter
- **图标**: lucide-react

### 移动端（Android）
- **框架**: React Native 0.83 + TypeScript
- **导航**: React Navigation
- **存储**: AsyncStorage
- **HTTP**: Axios
- **图标**: react-native-vector-icons

## 🐛 故障排查

### 后端问题

**模型下载慢**：
```bash
# 设置代理（如有需要）
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
```

**向量索引需要重建**：
```python
# 在 config.py 中设置
QA_MODE = False
```

### 前端问题

**连接后端失败**：
1. 确认后端已启动（`http://localhost:8000`）
2. 检查浏览器控制台的网络请求
3. 确认代理配置（`vite.config.ts`）

**历史记录丢失**：
- 历史记录存储在 localStorage，清除浏览器数据会丢失

## 📈 性能优化

- **向量索引缓存**：首次运行后索引会保存，后续直接加载
- **流式响应**：前端实时展示，减少等待时间
- **懒加载**：前端组件按需加载
- **生产构建**：使用 `npm run build` 优化包体积

## ✅ TODO

- [ ] 支持个人用户的知识库获取
- [ ] 累进模式，多次获取叠加并去重
- [ ] 不同知识库数据的单独管理
- [ ] 前端支持多会话并行
- [ ] 添加用户认证功能

## 📜 License

本项目采用 [Apache 2.0 License](https://github.com/netease-youdao/BCEmbedding/blob/master/LICENSE)

## 🙏 致谢

- [BCEmbedding](https://github.com/netease-youdao/BCEmbedding) - 提供中文优化的嵌入和重排序模型
- [LangChain](https://github.com/langchain-ai/langchain) - RAG 框架支持
- [FastAPI](https://fastapi.tiangolo.com/) - 高性能 Web 框架
- [React](https://react.dev/) - 前端框架
