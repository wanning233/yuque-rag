# auth/auth.py

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .user_manager import UserManager


# JWT 配置
SECRET_KEY = "your-secret-key-change-this-in-production"  # 生产环境请使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # token有效期24小时


# 初始化
user_manager = UserManager()
security = HTTPBearer()


class AuthService:
    """认证服务 - 负责JWT token的生成和验证"""
    
    @staticmethod
    def create_access_token(username: str, device_info: str = "") -> str:
        """
        创建访问token
        
        Args:
            username: 用户名
            device_info: 设备信息（可选，用于标识设备）
            
        Returns:
            JWT token字符串
        """
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        
        payload = {
            "sub": username,  # subject: 用户名
            "exp": expire,    # expiration time: 过期时间
            "iat": datetime.utcnow(),  # issued at: 签发时间
            "device": device_info  # 设备信息
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        # 保存为该用户的活跃token（会覆盖旧token，实现单设备登录）
        user_manager.set_active_token(username, token)
        
        return token
    
    @staticmethod
    def verify_token(token: str) -> Dict:
        """
        验证token并返回payload
        
        Args:
            token: JWT token字符串
            
        Returns:
            解码后的payload字典
            
        Raises:
            HTTPException: token无效或过期
        """
        try:
            # 解码token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            
            if username is None:
                raise HTTPException(status_code=401, detail="无效的token")
            
            # 检查用户是否存在
            if not user_manager.user_exists(username):
                raise HTTPException(status_code=401, detail="用户不存在")
            
            # 检查是否是当前活跃的token（单设备登录检查）
            if not user_manager.is_token_active(username, token):
                raise HTTPException(
                    status_code=401,
                    detail="您的账号已在其他设备登录，请重新登录"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="token已过期，请重新登录")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="无效的token")
    
    @staticmethod
    def login(username: str, password: str, device_info: str = "") -> Dict:
        """
        用户登录
        
        Args:
            username: 用户名
            password: 密码
            device_info: 设备信息
            
        Returns:
            包含token和用户信息的字典
            
        Raises:
            HTTPException: 登录失败
        """
        # 验证用户名和密码
        if not user_manager.verify_user(username, password):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        # 生成token（会自动覆盖旧token，踢掉其他设备）
        token = AuthService.create_access_token(username, device_info)
        
        # 更新最后登录时间
        user_manager.update_last_login(username)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "username": username,
            "expires_in": ACCESS_TOKEN_EXPIRE_HOURS * 3600  # 秒
        }
    
    @staticmethod
    def logout(username: str):
        """
        用户登出
        
        Args:
            username: 用户名
        """
        user_manager.revoke_token(username)


# ============== FastAPI 依赖函数 ==============

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    获取当前认证用户（用于依赖注入）
    
    Args:
        credentials: HTTP Bearer token
        
    Returns:
        当前用户名
        
    Raises:
        HTTPException: 认证失败
    """
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    return payload.get("sub")


async def verify_auth_header(authorization: Optional[str] = Header(None)) -> str:
    """
    验证Authorization header（用于不使用HTTPBearer的场景）
    
    Args:
        authorization: Authorization header的值
        
    Returns:
        当前用户名
        
    Raises:
        HTTPException: 认证失败
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="未提供认证信息")
    
    # 解析 "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="无效的认证格式")
    
    token = parts[1]
    payload = AuthService.verify_token(token)
    return payload.get("sub")


