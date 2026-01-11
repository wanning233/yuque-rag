#!/bin/bash
# 启动后端服务器

cd "$(dirname "$0")"

echo "🚀 正在启动语雀 RAG 后端服务..."
echo ""

# 激活虚拟环境并启动服务
./venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --reload
