# tools/web_search.py
"""
网络搜索工具 - 使用 DuckDuckGo 进行实时网络搜索
"""

from duckduckgo_search import DDGS

class WebSearchTool:
    """DuckDuckGo 网络搜索工具"""
    
    def __init__(self, max_results=5):
        """
        初始化搜索工具
        
        Args:
            max_results: 最多返回的搜索结果数量
        """
        self.max_results = max_results
    
    def search(self, query: str) -> str:
        """
        搜索互联网并返回格式化的结果
        
        Args:
            query: 搜索关键词
            
        Returns:
            str: 格式化的搜索结果文本
        """
        try:
            print(f"🌐 正在搜索：{query}")
            
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=self.max_results))
            
            if not results:
                return "❌ 未找到相关信息"
            
            # 格式化搜索结果
            context = f"🔍 互联网搜索结果（共 {len(results)} 条）：\n\n"
            
            for i, result in enumerate(results, 1):
                context += f"【{i}】{result['title']}\n"
                context += f"📄 {result['body']}\n"
                context += f"🔗 来源: {result['href']}\n\n"
            
            return context
            
        except Exception as e:
            return f"❌ 搜索失败: {str(e)}\n请检查网络连接或稍后重试。"


# 测试代码
if __name__ == "__main__":
    # 测试搜索功能
    searcher = WebSearchTool(max_results=3)
    results = searcher.search("Python 最新版本")
    print(results)

