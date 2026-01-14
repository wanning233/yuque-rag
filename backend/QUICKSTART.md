# 语雀 RAG 问答系统 - 快速启动指南

## 🚀 一键启动

### 第一步：启动后端服务

```bash
cd backend
./run_server.sh
```

后端将在 `http://localhost:8000` 启动

**首次运行**会自动下载模型和构建索引，需要等待几分钟。

✅ **验证后端**：访问 http://localhost:8000/docs 查看 API 文档

### 第二步：启动前端服务

打开**新的终端窗口**：

```bash
cd frontend
./run_dev.sh
```

前端将在 `http://localhost:3000` 启动

✅ **验证前端**：浏览器自动打开 http://localhost:3000

## 📋 使用流程

1. 打开 http://localhost:3000
2. 在输入框输入问题，例如："什么是 RAG？"
3. 点击"发送"或按 Enter 键
4. AI 将实时流式返回答案
5. 对话会自动保存在左侧历史记录中

## 🎯 主要功能

### 对话功能
- ✅ 实时流式回答（打字机效果）
- ✅ Markdown 和代码高亮
- ✅ 支持多轮对话

### 历史管理
- ✅ 自动保存对话历史
- ✅ 点击左侧历史记录切换会话
- ✅ 点击"新对话"创建新会话
- ✅ 悬停显示删除按钮

### 界面设置
- ✅ 点击右上角切换深色/浅色主题
- ✅ 点击左上角菜单隐藏/显示侧边栏
- ✅ 响应式设计，支持手机访问

## 🔧 配置说明

### 后端配置（重要）

在 `backend/config.py` 中配置：

```python
# 1. 配置语雀 Token（必须）
YUQUE_TOKEN = "your-token-here"
YUQUE_GROUP = "your-group"
YUQUE_NAMESPACE = "your-group/your-repo"

# 2. 配置 LLM（必须）
USE_OPENAI = True
OPENAI_API_KEY = "your-api-key"
OPENAI_MODEL = "Qwen/Qwen2.5-7B-Instruct"
OPENAI_API_BASE = "https://api.siliconflow.cn/v1"
```

### 前端配置（可选）

前端已配置好代理，无需额外配置。

如需修改后端地址，编辑 `frontend/vite.config.ts`：

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // 后端地址
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## 🐛 常见问题

### 后端启动失败

**问题1：模块未找到**
```bash
cd backend
./venv/bin/pip install -r requirements.txt
```

**问题2：端口被占用**
```bash
# 查找占用 8000 端口的进程
lsof -i :8000
# 杀死进程
kill -9 <PID>
```

**问题3：模型下载慢**
- 设置代理或等待下载完成
- 模型会缓存在 `backend/models/` 目录

### 前端启动失败

**问题1：依赖未安装**
```bash
cd frontend
rm -rf node_modules
npm install
```

**问题2：端口被占用**
```bash
# 查找占用 3000 端口的进程
lsof -i :3000
# 杀死进程
kill -9 <PID>
```

**问题3：连接后端失败**
- 确保后端已启动（`http://localhost:8000`）
- 检查浏览器控制台的错误信息
- 确认后端 CORS 配置正确

### 其他问题

**历史记录丢失**
- 历史记录存储在浏览器 localStorage
- 清除浏览器数据会导致丢失
- 不同浏览器的数据不共享

**回答质量不佳**
- 检查语雀知识库内容是否完整
- 调整 `config.py` 中的检索参数
- 尝试重建索引（设置 `QA_MODE = False`）

## 📚 更多文档

- **项目总览**：查看根目录 `README.md`
- **前端文档**：查看 `frontend/README.md`
- **后端文档**：查看 `backend/README.MD`
- **API 文档**：访问 http://localhost:8000/docs

## 💡 提示

1. **首次运行需要时间**：下载模型和构建索引大约需要 5-10 分钟
2. **后续启动很快**：索引会被缓存，后续启动只需几秒
3. **查看 Swagger 文档**：http://localhost:8000/docs 可以直接测试 API
4. **使用调试页面**：运行 `./backend/run_webui.sh` 查看检索详情

## 🎉 开始使用

现在你已经准备好了！打开浏览器访问：

**http://localhost:3000**

开始你的智能问答之旅吧！


