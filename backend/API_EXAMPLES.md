# API 使用示例

本文档提供语雀 RAG 问答系统 API 的详细使用示例。

## 📡 API 基础信息

- **基础 URL**: `http://localhost:8000`
- **Content-Type**: `application/json`
- **Swagger 文档**: http://localhost:8000/docs

## 🔍 API 接口列表

### 1. 健康检查

检查服务是否正常运行。

**请求**
```http
GET /health
```

**响应示例**
```json
{
  "status": "ok",
  "message": "系统运行正常"
}
```

**cURL 示例**
```bash
curl http://localhost:8000/health
```

**JavaScript 示例**
```javascript
fetch('http://localhost:8000/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 2. 问答接口（一次性返回）

发送问题并获取完整答案（非流式）。

**请求**
```http
POST /chat
Content-Type: application/json

{
  "question": "什么是 RAG？"
}
```

**响应示例**
```json
{
  "answer": "RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合了信息检索和文本生成的技术。它通过检索相关文档来增强大语言模型的回答能力..."
}
```

**cURL 示例**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "什么是RAG？"}'
```

**Python 示例**
```python
import requests

response = requests.post(
    'http://localhost:8000/chat',
    json={'question': '什么是RAG？'}
)

data = response.json()
print(data['answer'])
```

**JavaScript 示例**
```javascript
fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: '什么是RAG？'
  })
})
  .then(res => res.json())
  .then(data => console.log(data.answer));
```

---

### 3. 流式问答接口（SSE）

发送问题并实时接收答案片段（流式响应）。

**请求**
```http
POST /chat/stream
Content-Type: application/json

{
  "question": "什么是 RAG？"
}
```

**响应格式（Server-Sent Events）**
```
data: {"content": "R"}

data: {"content": "A"}

data: {"content": "G"}

data: {"content": "（"}

data: {"content": "检"}

...

data: {"done": true}

```

**Python 示例**
```python
import requests
import json

def stream_chat(question):
    url = 'http://localhost:8000/chat/stream'
    response = requests.post(
        url,
        json={'question': question},
        stream=True
    )
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = json.loads(line[6:])
                
                if 'content' in data:
                    print(data['content'], end='', flush=True)
                
                if data.get('done'):
                    print('\n完成')
                    break
                    
                if 'error' in data:
                    print(f'\n错误: {data["error"]}')
                    break

# 使用示例
stream_chat('什么是RAG？')
```

**JavaScript 示例（Fetch API）**
```javascript
async function streamChat(question) {
  const response = await fetch('http://localhost:8000/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.content) {
          console.log(data.content);
        }
        
        if (data.done) {
          console.log('完成');
          return;
        }
        
        if (data.error) {
          console.error('错误:', data.error);
          return;
        }
      }
    }
  }
}

// 使用示例
streamChat('什么是RAG？');
```

**JavaScript 示例（EventSource - 仅支持 GET）**
```javascript
// 注意：标准 EventSource 只支持 GET 请求
// 对于 POST 请求，请使用上面的 Fetch API 示例

// 如果后端提供 GET 接口，可以这样使用：
const eventSource = new EventSource(
  'http://localhost:8000/chat/stream?question=' + 
  encodeURIComponent('什么是RAG？')
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.content) {
    console.log(data.content);
  }
  
  if (data.done) {
    console.log('完成');
    eventSource.close();
  }
  
  if (data.error) {
    console.error('错误:', data.error);
    eventSource.close();
  }
};

eventSource.onerror = (error) => {
  console.error('连接错误:', error);
  eventSource.close();
};
```

**React 示例**
```typescript
import { useState } from 'react';

function ChatComponent() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuestion = async (question: string) => {
    setLoading(true);
    setAnswer('');

    try {
      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.content) {
              fullAnswer += data.content;
              setAnswer(fullAnswer);
            }
            
            if (data.done) {
              setLoading(false);
              return;
            }
            
            if (data.error) {
              console.error(data.error);
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('发送失败:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => sendQuestion('什么是RAG？')}
        disabled={loading}
      >
        {loading ? '生成中...' : '发送问题'}
      </button>
      <div>{answer}</div>
    </div>
  );
}
```

## 🔐 错误处理

### 常见错误响应

**400 Bad Request** - 请求参数错误
```json
{
  "detail": "问题不能为空"
}
```

**500 Internal Server Error** - 服务器内部错误
```json
{
  "detail": "生成回答时发生错误"
}
```

**503 Service Unavailable** - 服务不可用
```json
{
  "detail": "模型未就绪，请稍后重试"
}
```

### 错误处理示例

**Python**
```python
try:
    response = requests.post(
        'http://localhost:8000/chat',
        json={'question': '什么是RAG？'},
        timeout=60
    )
    response.raise_for_status()
    data = response.json()
    print(data['answer'])
except requests.exceptions.HTTPError as e:
    print(f'HTTP 错误: {e}')
except requests.exceptions.Timeout:
    print('请求超时')
except requests.exceptions.RequestException as e:
    print(f'请求失败: {e}')
```

**JavaScript**
```javascript
try {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: '什么是RAG？' })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(data.answer);
} catch (error) {
  console.error('请求失败:', error);
}
```

## 📊 性能优化建议

1. **使用流式接口**：提供更好的用户体验，无需等待完整答案
2. **设置合理超时**：建议至少 60 秒，因为 LLM 生成可能较慢
3. **错误重试**：网络不稳定时实现指数退避重试
4. **缓存结果**：相同问题可以缓存答案，减少 API 调用

## 🔗 相关资源

- **Swagger UI**: http://localhost:8000/docs - 可视化 API 文档
- **ReDoc**: http://localhost:8000/redoc - 另一种文档样式
- **项目 README**: 查看完整项目文档

## 💡 最佳实践

1. **始终处理错误**：网络请求可能失败，务必添加错误处理
2. **显示加载状态**：让用户知道系统正在处理
3. **实现取消功能**：允许用户中断长时间运行的请求
4. **流式优先**：优先使用流式接口以提供更好的体验
5. **合理超时**：根据实际情况设置超时时间

## 🎯 实际应用场景

### 场景1：聊天机器人
使用流式接口实时展示回答，提供类似 ChatGPT 的体验。

### 场景2：知识库问答
集成到企业知识库系统，提供智能搜索和问答功能。

### 场景3：文档助手
在文档阅读工具中集成，帮助用户快速理解文档内容。

### 场景4：API 集成
作为微服务集成到现有系统，提供 AI 问答能力。

## 📞 支持与反馈

如有问题或建议，请查看项目 README 或提交 Issue。


