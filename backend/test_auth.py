#!/usr/bin/env python3
# test_auth.py - 认证功能测试脚本

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_separator(title):
    """打印分隔线"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_login():
    """测试登录功能"""
    print_separator("测试1: 用户登录")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": "admin",
            "password": "admin123",
            "device_info": "测试设备A"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 登录成功")
        print(f"   用户名: {data['username']}")
        print(f"   Token类型: {data['token_type']}")
        print(f"   有效期: {data['expires_in']}秒 ({data['expires_in']//3600}小时)")
        print(f"   Token: {data['access_token'][:50]}...")
        return data['access_token']
    else:
        print(f"❌ 登录失败: {response.text}")
        return None

def test_get_me(token):
    """测试获取当前用户信息"""
    print_separator("测试2: 获取当前用户信息")
    
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 认证成功")
        print(f"   用户名: {data['username']}")
        print(f"   消息: {data['message']}")
    else:
        print(f"❌ 获取用户信息失败: {response.text}")

def test_chat(token, question):
    """测试问答功能（需要认证）"""
    print_separator(f"测试3: 问答功能")
    
    print(f"📝 问题: {question}")
    
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"question": question},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 回答成功")
        print(f"💬 回答: {data['answer'][:200]}...")
    else:
        print(f"❌ 问答失败: {response.text}")

def test_single_device_login():
    """测试单设备登录机制"""
    print_separator("测试4: 单设备登录机制")
    
    # 设备A登录
    print("\n📱 设备A登录...")
    response_a = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": "test",
            "password": "test123",
            "device_info": "设备A"
        }
    )
    token_a = response_a.json()['access_token']
    print(f"✅ 设备A登录成功，Token: {token_a[:30]}...")
    
    # 设备A尝试问答
    print("\n📱 设备A尝试提问...")
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"question": "你好"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    if response.status_code == 200:
        print(f"✅ 设备A提问成功")
    
    time.sleep(1)
    
    # 设备B登录（会踢掉设备A）
    print("\n📱 设备B登录相同账号...")
    response_b = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": "test",
            "password": "test123",
            "device_info": "设备B"
        }
    )
    token_b = response_b.json()['access_token']
    print(f"✅ 设备B登录成功，Token: {token_b[:30]}...")
    
    time.sleep(1)
    
    # 设备A再次尝试问答（应该失败）
    print("\n📱 设备A再次尝试提问（使用旧Token）...")
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"question": "你好"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    
    if response.status_code == 401:
        error = response.json()
        print(f"✅ 正确！设备A的Token已失效")
        print(f"   错误信息: {error.get('detail', '')}")
    else:
        print(f"❌ 错误：设备A的Token应该已失效，但仍然可用")
    
    # 设备B尝试问答（应该成功）
    print("\n📱 设备B尝试提问...")
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"question": "你好"},
        headers={"Authorization": f"Bearer {token_b}"}
    )
    
    if response.status_code == 200:
        print(f"✅ 设备B提问成功（当前活跃设备）")
    else:
        print(f"❌ 设备B提问失败: {response.text}")

def test_invalid_token():
    """测试无效token"""
    print_separator("测试5: 无效Token处理")
    
    invalid_token = "invalid.token.here"
    
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"question": "你好"},
        headers={"Authorization": f"Bearer {invalid_token}"}
    )
    
    if response.status_code == 401:
        error = response.json()
        print(f"✅ 正确拒绝无效Token")
        print(f"   错误信息: {error.get('detail', '')}")
    else:
        print(f"❌ 应该拒绝无效Token")

def test_logout(token):
    """测试登出功能"""
    print_separator("测试6: 用户登出")
    
    response = requests.post(
        f"{BASE_URL}/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 登出成功")
        print(f"   消息: {data['message']}")
        
        # 验证token已失效
        print("\n🔍 验证Token是否已失效...")
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 401:
            print(f"✅ Token已正确失效")
        else:
            print(f"❌ Token应该已失效")
    else:
        print(f"❌ 登出失败: {response.text}")

def test_wrong_password():
    """测试错误密码"""
    print_separator("测试7: 错误密码")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": "admin",
            "password": "wrongpassword"
        }
    )
    
    if response.status_code == 401:
        error = response.json()
        print(f"✅ 正确拒绝错误密码")
        print(f"   错误信息: {error.get('detail', '')}")
    else:
        print(f"❌ 应该拒绝错误密码")

def main():
    """主测试流程"""
    print("\n" + "🔐 " + "="*58)
    print("        认证系统测试")
    print("="*60)
    print("\n⚠️  请确保服务器已启动: python server.py")
    print("   服务器地址: http://localhost:8000")
    
    try:
        # 检查服务器是否运行
        print("\n🔍 检查服务器状态...")
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ 服务器运行正常")
        else:
            print("❌ 服务器响应异常")
            return
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请先启动服务器")
        return
    
    # 运行测试
    token = test_login()
    
    if token:
        test_get_me(token)
        test_chat(token, "什么是RAG？")
        test_logout(token)
    
    test_single_device_login()
    test_invalid_token()
    test_wrong_password()
    
    # 测试总结
    print_separator("测试完成")
    print("✅ 所有测试已完成")
    print("\n📚 更多信息请查看: backend/AUTH_README.md")
    print("📖 API文档: http://localhost:8000/docs")

if __name__ == "__main__":
    main()


