"""
微信API工具
"""
import requests
from typing import Optional
from app.core.config import settings


class WechatAPI:
    """微信API封装类"""

    @staticmethod
    def code2session(code: str) -> Optional[dict]:
        """
        微信登录凭证校验

        Args:
            code: 微信登录code

        Returns:
            包含openid和session_key的字典，失败返回None
        """
        url = "https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": settings.WECHAT_APPID,
            "secret": settings.WECHAT_SECRET,
            "js_code": code,
            "grant_type": "authorization_code"
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if "openid" in data:
                return {
                    "openid": data["openid"],
                    "session_key": data.get("session_key", ""),
                    "unionid": data.get("unionid", "")
                }
            else:
                print(f"微信登录失败: {data}")
                return None

        except Exception as e:
            print(f"微信API调用异常: {str(e)}")
            return None


wechat_api = WechatAPI()
