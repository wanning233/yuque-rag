# auth/user_manager.py

import json
import os
from typing import Optional, Dict
from hashlib import sha256
from datetime import datetime


class UserManager:
    """用户管理器 - 负责用户数据的存储和验证"""
    
    def __init__(self, users_file: str = "./auth/users.json"):
        self.users_file = users_file
        self.users: Dict[str, dict] = {}
        self.active_tokens: Dict[str, str] = {}  # {username: token} 存储当前活跃的token
        self._load_users()
    
    def _load_users(self):
        """从文件加载用户数据"""
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.users = data.get('users', {})
                    self.active_tokens = data.get('active_tokens', {})
            except Exception as e:
                print(f"❌ 加载用户数据失败: {e}")
                self.users = {}
                self.active_tokens = {}
        else:
            # 创建默认用户
            self._create_default_users()
    
    def _save_users(self):
        """保存用户数据到文件"""
        os.makedirs(os.path.dirname(self.users_file), exist_ok=True)
        try:
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'users': self.users,
                    'active_tokens': self.active_tokens
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ 保存用户数据失败: {e}")
    
    def _create_default_users(self):
        """创建默认测试用户"""
        default_users = [
            {"username": "admin", "password": "admin123"},
            {"username": "user1", "password": "password123"},
            {"username": "test", "password": "test123"}
        ]
        
        for user in default_users:
            self.create_user(user['username'], user['password'])
        
        print("✅ 已创建默认用户:")
        for user in default_users:
            print(f"   - 用户名: {user['username']}, 密码: {user['password']}")
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """密码加密"""
        return sha256(password.encode('utf-8')).hexdigest()
    
    def create_user(self, username: str, password: str) -> bool:
        """创建新用户"""
        if username in self.users:
            return False
        
        self.users[username] = {
            'password_hash': self._hash_password(password),
            'created_at': datetime.now().isoformat(),
            'last_login': None
        }
        self._save_users()
        return True
    
    def verify_user(self, username: str, password: str) -> bool:
        """验证用户名和密码"""
        if username not in self.users:
            return False
        
        password_hash = self._hash_password(password)
        return self.users[username]['password_hash'] == password_hash
    
    def update_last_login(self, username: str):
        """更新用户最后登录时间"""
        if username in self.users:
            self.users[username]['last_login'] = datetime.now().isoformat()
            self._save_users()
    
    def set_active_token(self, username: str, token: str):
        """设置用户的活跃token（会覆盖旧token，实现单设备登录）"""
        self.active_tokens[username] = token
        self._save_users()
    
    def get_active_token(self, username: str) -> Optional[str]:
        """获取用户当前的活跃token"""
        return self.active_tokens.get(username)
    
    def is_token_active(self, username: str, token: str) -> bool:
        """检查token是否是该用户当前的活跃token"""
        return self.active_tokens.get(username) == token
    
    def revoke_token(self, username: str):
        """撤销用户的token"""
        if username in self.active_tokens:
            del self.active_tokens[username]
            self._save_users()
    
    def user_exists(self, username: str) -> bool:
        """检查用户是否存在"""
        return username in self.users


