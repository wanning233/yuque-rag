# server.py

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from app import initialize_retriever_and_llm
import json
from typing import AsyncGenerator

# 初始化 RAG 模型
retriever, llm = initialize_retriever_and_llm()

# 创建 FastAPI 应用，配置 Swagger 文档
app = FastAPI(
    title="语雀 RAG 问答系统 API",
    description="""
    基于语雀知识库的 RAG（检索增强生成）问答系统。
    
    ## 功能特性
    - 📚 知识库检索问答
    - 🔄 流式响应支持
    - 🤖 支持本地/远程大模型
    - 🔍 两阶段检索（向量 + 重排序）
    
    ## 使用说明
    1. 使用 `/chat` 接口进行常规问答（一次性返回）
    2. 使用 `/chat/stream` 接口获取流式响应（实时打字效果）
    3. 使用 `/health` 接口检查系统健康状态
    """,
    version="1.0.0",
    contact={
        "name": "Yuque RAG Project",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)

# 允许跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== 数据模型 ==============

class QueryRequest(BaseModel):
    """问答请求模型"""
    question: str = Field(
        ..., 
        description="用户提出的问题",
        example="四月语雀有哪些更新？"
    )

class ChatResponse(BaseModel):
    """问答响应模型"""
    answer: str = Field(
        ..., 
        description="系统生成的回答",
        example="四月语雀的更新包括新增了团队协作功能，优化了文档编辑体验，以及增强了安全策略。"
    )

class HealthResponse(BaseModel):
    """健康检查响应模型"""
    status: str = Field(..., description="服务状态", example="ok")
    message: str = Field(..., description="状态信息", example="系统运行正常")


# ============== API 接口 ==============

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["系统"],
    summary="健康检查",
    description="检查系统运行状态"
)
def health_check():
    """
    健康检查接口，用于监控系统状态。
    
    Returns:
        HealthResponse: 包含系统状态信息
    """
    return {
        "status": "ok",
        "message": "系统运行正常"
    }


@app.post(
    "/chat",
    response_model=ChatResponse,
    tags=["问答"],
    summary="问答接口（一次性返回）",
    description="向系统提问并获取完整答案（非流式）"
)
def chat(req: QueryRequest):
    """
    常规问答接口，返回完整的答案。
    
    Args:
        req: 包含用户问题的请求体
        
    Returns:
        ChatResponse: 包含生成的答案
        
    Example:
        ```json
        POST /chat
        {
            "question": "什么是RAG？"
        }
        ```
    """
    query = req.question.strip()
    if not query:
        return {"answer": "❗请输入问题"}

    relevant_docs = retriever.invoke(query)
    context = "\n\n".join([doc.page_content for doc in relevant_docs])
    prompt = f"根据以下内容回答问题：\n\n{context}\n\n问题：{query}\n\n回答："
    answer = llm.generate(prompt)

    return {"answer": answer}


@app.post(
    "/chat/stream",
    tags=["问答"],
    summary="问答接口（流式返回）",
    description="向系统提问并获取流式答案（SSE格式，支持实时打字效果）",
    responses={
        200: {
            "description": "成功返回流式数据",
            "content": {
                "text/event-stream": {
                    "example": "data: {\"content\": \"你\"}\n\ndata: {\"content\": \"好\"}\n\n"
                }
            }
        }
    }
)
async def chat_stream(req: QueryRequest):
    """
    流式问答接口，使用 Server-Sent Events (SSE) 返回答案。
    
    适用于需要实时展示回答进度的场景（如前端打字机效果）。
    
    Args:
        req: 包含用户问题的请求体
        
    Returns:
        StreamingResponse: SSE 格式的流式响应
        
    Example:
        ```javascript
        const eventSource = new EventSource('/chat/stream', {
            method: 'POST',
            body: JSON.stringify({question: '什么是RAG？'})
        });
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data.content); // 逐字输出
        };
        ```
    """
    query = req.question.strip()
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        if not query:
            yield f"data: {json.dumps({'content': '❗请输入问题', 'done': True}, ensure_ascii=False)}\n\n"
            return
        
        try:
            # 检索相关文档
            relevant_docs = retriever.invoke(query)
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            prompt = f"根据以下内容回答问题：\n\n{context}\n\n问题：{query}\n\n回答："
            
            # 流式生成答案
            for chunk in llm.generate_stream(prompt):
                yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            
            # 发送完成标记
            yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # 禁用nginx缓冲
        }
    )
