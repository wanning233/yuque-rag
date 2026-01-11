#!/bin/bash
# 在本地虚拟环境中运行 Streamlit 调试页面

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 激活虚拟环境并运行调试页面
./venv/bin/streamlit run test_webui.py

