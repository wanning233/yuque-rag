# embedder/bc_embedding.py

from BCEmbedding import EmbeddingModel, RerankerModel
import os

class BCEmbeddingWrapper:
    def __init__(self, embed_model_name: str, rerank_model_name: str, cache_dir: str = None):
        # 如果指定了缓存目录，确保目录存在
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
            # 设置环境变量，让 transformers 和 huggingface_hub 使用指定目录
            os.environ['HF_HOME'] = cache_dir
            os.environ['TRANSFORMERS_CACHE'] = cache_dir
        
        self.embed_model = EmbeddingModel(model_name_or_path=embed_model_name)
        self.rerank_model = RerankerModel(model_name_or_path=rerank_model_name)

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return self.embed_model.encode(texts)

    def rerank(self, query: str, candidates: list[str]) -> list[tuple[str, float]]:
        result = self.rerank_model.rerank(query, candidates)

        # 防止是dict结构（compute_score格式）
        if isinstance(result, dict) and 'rerank_passages' in result and 'rerank_scores' in result:
            passages = result['rerank_passages']
            scores = result['rerank_scores']
            return list(zip(passages, scores))

        return result
