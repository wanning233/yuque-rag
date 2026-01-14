# 认证系统使用说明

## 功能概述

本系统实现了基于JWT的用户认证功能，具有以下特点：

✅ **账号密码登录** - 支持用户名密码认证  
✅ **单设备登录** - 一个账号同时只能在一台设备登录  
✅ **自动踢出** - 新设备登录会使旧设备的token失效  
✅ **Token验证** - 所有问答接口都需要携带有效token  

---

## 默认测试账号

系统默认创建了以下测试账号：

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |
| user1 | password123 |
| test | test123 |

---

## API 接口说明

### 1. 用户登录

**接口：** `POST /auth/login`

**请求体：**
```json
{
  "username": "admin",
  "password": "admin123",
  "device_info": "Chrome on Windows"  // 可选，用于标识设备
}
```

**响应：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "admin",
  "expires_in": 86400  // 24小时，单位：秒
}
```

**curl 示例：**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

### 2. 获取当前用户信息

**接口：** `GET /auth/me`

**请求头：**
```
Authorization: Bearer <your_token>
```

**响应：**
```json
{
  "username": "admin",
  "message": "认证成功"
}
```

**curl 示例：**
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. 用户登出

**接口：** `POST /auth/logout`

**请求头：**
```
Authorization: Bearer <your_token>
```

**响应：**
```json
{
  "message": "用户 admin 已登出"
}
```

**curl 示例：**
```bash
curl -X POST "http://localhost:8000/auth/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. 问答接口（需要认证）

**接口：** `POST /chat`

**请求头：**
```
Authorization: Bearer <your_token>
```

**请求体：**
```json
{
  "question": "什么是RAG？"
}
```

**响应：**
```json
{
  "answer": "RAG是检索增强生成..."
}
```

**curl 示例：**
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "question": "什么是RAG？"
  }'
```

---

### 5. 流式问答接口（需要认证）

**接口：** `POST /chat/stream`

**请求头：**
```
Authorization: Bearer <your_token>
```

**请求体：**
```json
{
  "question": "什么是RAG？"
}
```

**响应：** Server-Sent Events (SSE) 格式
```
data: {"content": "RAG"}

data: {"content": "是"}

data: {"content": "检索"}

data: {"done": true}
```

---

## 单设备登录机制

### 工作原理

1. **登录时**：
   - 用户输入用户名和密码
   - 系统验证通过后生成新的JWT token
   - 新token会覆盖该用户的旧token
   - 旧token立即失效

2. **使用API时**：
   - 每次请求都会验证token是否是当前活跃的token
   - 如果token已被新token替换，返回401错误
   - 错误提示："您的账号已在其他设备登录，请重新登录"

3. **多设备场景**：
   ```
   设备A: 登录 admin → 获得 token_A（有效）
   设备B: 登录 admin → 获得 token_B（有效），token_A 失效
   设备A: 使用 token_A 请求 → 返回 401 错误
   ```

---

## 使用示例（Python）

### 完整的认证流程

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. 登录获取token
def login(username, password):
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": username,
            "password": password,
            "device_info": "Python Client"
        }
    )
    if response.status_code == 200:
        data = response.json()
        return data["access_token"]
    else:
        raise Exception(f"登录失败: {response.text}")

# 2. 使用token进行问答
def chat(token, question):
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"question": question},
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        return response.json()["answer"]
    elif response.status_code == 401:
        raise Exception("认证失败，token可能已失效")
    else:
        raise Exception(f"请求失败: {response.text}")

# 3. 登出
def logout(token):
    response = requests.post(
        f"{BASE_URL}/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

# 使用示例
if __name__ == "__main__":
    # 登录
    token = login("admin", "admin123")
    print(f"✅ 登录成功，token: {token[:50]}...")
    
    # 提问
    answer = chat(token, "什么是RAG？")
    print(f"💬 回答: {answer}")
    
    # 登出
    result = logout(token)
    print(f"👋 {result['message']}")
```

---

## 使用示例（JavaScript/TypeScript）

### Fetch API

```javascript
const BASE_URL = 'http://localhost:8000';

// 1. 登录
async function login(username, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
      device_info: 'Web Browser'
    }),
  });
  
  if (!response.ok) {
    throw new Error('登录失败');
  }
  
  const data = await response.json();
  return data.access_token;
}

// 2. 使用token进行问答
async function chat(token, question) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });
  
  if (response.status === 401) {
    throw new Error('认证失败，请重新登录');
  }
  
  if (!response.ok) {
    throw new Error('请求失败');
  }
  
  const data = await response.json();
  return data.answer;
}

// 3. 登出
async function logout(token) {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
}

// 使用示例
(async () => {
  try {
    // 登录
    const token = await login('admin', 'admin123');
    console.log('✅ 登录成功');
    
    // 保存token到localStorage
    localStorage.setItem('access_token', token);
    
    // 提问
    const answer = await chat(token, '什么是RAG？');
    console.log('💬 回答:', answer);
    
    // 登出
    await logout(token);
    localStorage.removeItem('access_token');
    console.log('👋 已登出');
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
})();
```

---

## 错误处理

### 常见错误码

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 401 | 用户名或密码错误 | 登录凭证错误 |
| 401 | token已过期，请重新登录 | token超过24小时有效期 |
| 401 | 无效的token | token格式错误或已损坏 |
| 401 | 您的账号已在其他设备登录，请重新登录 | 被其他设备踢下线 |
| 401 | 未提供认证信息 | 请求头缺少Authorization |

### 错误处理示例

```python
try:
    answer = chat(token, "什么是RAG？")
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        error_detail = e.response.json().get("detail", "")
        if "其他设备" in error_detail:
            print("⚠️ 您的账号在其他设备登录，请重新登录")
            # 重新登录逻辑
            token = login(username, password)
        elif "已过期" in error_detail:
            print("⚠️ 登录已过期，请重新登录")
            token = login(username, password)
        else:
            print(f"❌ 认证失败: {error_detail}")
```

---

## 安全注意事项

### 生产环境配置

⚠️ **重要：** 在生产环境部署前，请务必修改以下配置：

1. **修改JWT密钥**（在 `backend/auth/auth.py`）：
   ```python
   # 使用环境变量设置强密钥
   SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-very-long-random-secret-key")
   ```

2. **使用HTTPS**：
   - 生产环境必须使用HTTPS传输
   - 防止token在传输过程中被截获

3. **修改默认账号**：
   - 删除或修改默认测试账号
   - 使用强密码策略

4. **Token有效期**：
   - 根据业务需求调整token有效期
   - 可以添加刷新token机制

---

## 文件结构

```
backend/
├── auth/
│   ├── __init__.py         # 包初始化文件
│   ├── auth.py             # JWT认证逻辑
│   ├── user_manager.py     # 用户管理
│   └── users.json          # 用户数据存储（自动生成）
├── server.py               # FastAPI应用（已添加认证接口）
├── requirements.txt        # 依赖列表（已添加PyJWT）
└── AUTH_README.md          # 本文档
```

---

## 测试步骤

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
python server.py
# 或使用 uvicorn
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 3. 访问 Swagger 文档

打开浏览器访问：http://localhost:8000/docs

在Swagger UI中可以：
- 测试所有API接口
- 查看接口文档
- 使用内置的认证功能

### 4. 测试单设备登录

**终端1：**
```bash
# 设备A登录
TOKEN_A=$(curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

echo "设备A的token: $TOKEN_A"

# 使用设备A的token提问
curl -X POST "http://localhost:8000/chat" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"question":"你好"}'
```

**终端2：**
```bash
# 设备B登录（会踢掉设备A）
TOKEN_B=$(curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

echo "设备B的token: $TOKEN_B"
```

**终端1（继续）：**
```bash
# 设备A再次尝试使用旧token（会失败）
curl -X POST "http://localhost:8000/chat" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"question":"你好"}'

# 预期返回: {"detail":"您的账号已在其他设备登录，请重新登录"}
```

---

## 常见问题

### Q: 如何添加新用户？

A: 目前用户数据存储在 `backend/auth/users.json` 文件中，可以通过修改 `user_manager.py` 中的 `_create_default_users()` 方法添加新用户，或者扩展系统添加用户注册接口。

### Q: Token有效期是多久？

A: 默认24小时，可以在 `backend/auth/auth.py` 中修改 `ACCESS_TOKEN_EXPIRE_HOURS` 变量。

### Q: 如何实现"记住我"功能？

A: 可以为"记住我"场景生成更长有效期的token，或者实现refresh token机制。

### Q: 如何支持多设备同时登录？

A: 修改 `user_manager.py` 中的 `active_tokens`，从单个token改为token列表，允许存储多个活跃token。

---

## 技术栈

- **FastAPI** - Web框架
- **PyJWT** - JWT token生成和验证
- **Pydantic** - 数据验证
- **SHA256** - 密码加密

---

## 相关文档

- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [JWT.io](https://jwt.io/)
- [API使用示例](API_EXAMPLES.md)


