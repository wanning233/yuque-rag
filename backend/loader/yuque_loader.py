# loader/yuque_loader.py

import requests
import time
from langchain.schema import Document
from typing import List, Optional


class YuqueLoader:
    def __init__(self, token: str, timeout: int = 60, max_retries: int = 3):
        self.token = token
        self.base_url = "https://www.yuque.com/api/v2"
        self.headers = {
            "X-Auth-Token": self.token,
            "Content-Type": "application/json",
        }
        self.timeout = timeout
        self.max_retries = max_retries


    # ---------- 基础 API ---------- #
    def _get(self, url: str) -> dict:
        """带重试机制的GET请求"""
        last_error = None
        for attempt in range(self.max_retries):
            try:
                resp = requests.get(url, headers=self.headers, timeout=self.timeout)
                resp.raise_for_status()
                return resp.json().get("data", [])
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt  # 指数退避: 1s, 2s, 4s
                    print(f"⚠️  请求超时，{wait_time}秒后重试... (尝试 {attempt + 1}/{self.max_retries})")
                    time.sleep(wait_time)
                else:
                    print(f"❌ 请求失败，已重试 {self.max_retries} 次")
                    raise
            except requests.exceptions.RequestException as e:
                print(f"❌ 请求错误: {e}")
                raise
        
        if last_error:
            raise last_error

    def get_repos(self, group_login: str):
        return self._get(f"{self.base_url}/groups/{group_login}/repos")

    def get_docs_list(self, namespace: str):
        return self._get(f"{self.base_url}/repos/{namespace}/docs")

    def get_doc_content(self, namespace: str, slug: str) -> str:
        url = f"{self.base_url}/repos/{namespace}/docs/{slug}"
        last_error = None
        for attempt in range(self.max_retries):
            try:
                resp = requests.get(url, headers=self.headers, timeout=self.timeout)
                resp.raise_for_status()
                return resp.json()["data"]["body"]  # markdown / html
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"   ⚠️  文档 '{slug}' 获取超时，{wait_time}秒后重试... (尝试 {attempt + 1}/{self.max_retries})")
                    time.sleep(wait_time)
                else:
                    print(f"   ❌ 文档 '{slug}' 获取失败，已重试 {self.max_retries} 次，跳过此文档")
                    return ""  # 返回空字符串而不是失败
            except requests.exceptions.RequestException as e:
                print(f"   ❌ 文档 '{slug}' 请求错误: {e}，跳过此文档")
                return ""
        
        if last_error:
            print(f"   ⚠️  文档 '{slug}' 最终获取失败，跳过")
            return ""


    # ---------- 总入口 ---------- #
    def load_documents(
        self,
        *,
        group_login: Optional[str] = None,
        namespace: Optional[str] = None,
    ) -> List[Document]:
        """
        · group_login → 加载该团队下所有 repo
        · namespace   → 仅加载单一 repo
        """
        if not (group_login or namespace):
            raise ValueError("必须提供 group_login 或 namespace 其中之一")

        documents: List[Document] = []

        def _collect(ns: str):
            docs_list = self.get_docs_list(ns)
            total = len(docs_list)
            print(f"   📄 共找到 {total} 篇文档")
            
            for idx, meta in enumerate(docs_list, 1):
                slug = meta["slug"]
                title = meta.get("title", slug)
                print(f"   [{idx}/{total}] 正在获取: {title}")
                
                content = self.get_doc_content(ns, slug)
                
                # 跳过空文档
                if not content or not content.strip():
                    print(f"   ⚠️  文档 '{title}' 内容为空，跳过")
                    continue

                metadata = {
                    "repo": ns,
                    "doc_id": meta["id"],
                    "title": title,
                    "author_name": meta.get("user", {}).get("name", ""),
                    "created_at": meta["created_at"],
                }

                documents.append(Document(page_content=content, metadata=metadata))
                print(f"   ✅ 成功加载: {title}")

        if namespace:
            print(f"📚 读取指定知识库：{namespace}")
            _collect(namespace)
        else:  # group_login mode
            repos = self.get_repos(group_login)
            print(f"📚 团队 '{group_login}' 共有 {len(repos)} 个知识库")
            for idx, repo in enumerate(repos, 1):
                ns = repo["namespace"]
                repo_name = repo.get("name", ns)
                print(f"\n[{idx}/{len(repos)}] 读取知识库：{repo_name} ({ns})")
                _collect(ns)

        return documents

