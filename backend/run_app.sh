#!/bin/bash
# 在本地虚拟环境中运行应用

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 激活虚拟环境并运行程序
./venv/bin/python app.py

