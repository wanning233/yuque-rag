# llm/ollama_llm.py

import requests
import json
from config import OLLAMA_MAX_TOKENS

class OllamaLLM:
    def __init__(self, model_name: str, api_url: str = "http://localhost:11434/api/generate"):
        """
        model_name: Ollama模型名称，如 "llama3"
        api_url: Ollama本地API地址
        """
        self.model_name = model_name
        self.api_url = api_url

    def generate(self, prompt: str, max_tokens: int = OLLAMA_MAX_TOKENS, temperature: float = 0.7) -> str:
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(self.api_url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        result = response.json()

        # 支持不同模型返回结构
        return result.get("completion") or result.get("response") or "[⚠️ 无返回内容]"

    def generate_stream(self, prompt: str, max_tokens: int = OLLAMA_MAX_TOKENS, temperature: float = 0.7):
        """流式生成回答（生成器）"""
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True
        }
        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(self.api_url, headers=headers, data=json.dumps(payload), stream=True)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                result = json.loads(line)
                content = result.get("response") or result.get("completion")
                if content:
                    yield content