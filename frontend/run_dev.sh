#!/bin/bash
# 启动前端开发服务器

cd "$(dirname "$0")"

echo "🎨 正在启动语雀 RAG 前端开发服务器..."
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动开发服务器
npm run dev


