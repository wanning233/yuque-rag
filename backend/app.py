# app.py

import os
# ⚠️ 必须在导入任何库之前设置环境变量
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["HF_HOME"] = "./models"
os.environ["TRANSFORMERS_CACHE"] = "./models"

from loader.yuque_loader import YuqueLoader
from loader.text_preprocessor import TextPreprocessor
from embedder.bc_embedding import BCEmbeddingWrapper
from vectorstore.faiss_store import FaissVectorStore
from retriever.rerank_retriever import RerankRetriever
from llm.ollama_llm import OllamaLLM
from llm.openai_llm import OpenAILLM
from tools.web_search import WebSearchTool

from config import (
    FAISS_INDEX_PATH,
    VECTOR_DIM,
    BC_EMBED_MODEL,
    BC_RERANK_MODEL,
    OLLAMA_MODEL,
    USE_OPENAI,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_API_BASE,
    QA_MODE,
    TOP_K_INITIAL,
    TOP_K_RERANK,
    YUQUE_TOKEN,
    YUQUE_GROUP,
    YUQUE_NAMESPACE
)

def initialize_retriever_and_llm():
    # ===== 配置部分 =====
    yuque_token = YUQUE_TOKEN
    group_login = YUQUE_GROUP            # 团队名（加载整个团队知识库）
    namespace = YUQUE_NAMESPACE          # 不为空则加载单一知识库

    embed_model_name = BC_EMBED_MODEL
    rerank_model_name = BC_RERANK_MODEL

    # ===== 尝试加载已有索引 =====
    faiss_store = FaissVectorStore(vector_dim=VECTOR_DIM, index_path=FAISS_INDEX_PATH)
    index_exists = os.path.exists(FAISS_INDEX_PATH) and os.path.exists(FAISS_INDEX_PATH + ".docs.pkl")

    # ===== 加载BCEmbedding模型（预处理模式和问答模式都用到）=====
    print("🧠 初始化 BCEmbedding 模型...")
    bc_embedding = BCEmbeddingWrapper(embed_model_name, rerank_model_name)

    # 如果没有找到索引及文档，或关闭了纯问答模式
    if not index_exists or not QA_MODE:
        print("🧩 进入数据持久化模式...")

        # ===== 加载文档 =====
        print("🔍 正在加载语雀知识库文档...")
        loader = YuqueLoader(yuque_token)
        documents = loader.load_documents(group_login=group_login, namespace=namespace)
        print(f"✅ 加载完成，共 {len(documents)} 篇文档")

        # ===== 文本预处理（清洗与切分） =====
        print("🧹 正在清洗与切分文档...")
        preprocessor = TextPreprocessor()
        documents = preprocessor.process_documents(documents)
        print(f"✅ 清洗与切分完成，共 {len(documents)} 段文本")


        # ===== 向量化文档内容 =====
        print("🔢 正在生成文档向量...")
        texts = [doc.page_content for doc in documents]
        embeddings = bc_embedding.embed_texts(texts)

        # ===== 构建向量索引 =====
        print("📦 构建 FAISS 向量索引...")
        faiss_store.add_embeddings(embeddings, documents)
        faiss_store.save()
        print("✅ 数据持久化完成")

    else:
        print("📥 加载已有向量索引...")
        faiss_store.load()

    documents = faiss_store.documents

    # ===== 检索器（带重排序） =====
    retriever = RerankRetriever(
        faiss_store=faiss_store,
        bc_embedding_wrapper=bc_embedding,
        documents=documents,
        top_k_initial=TOP_K_INITIAL,
        top_k_rerank=TOP_K_RERANK
    )

    # ===== 初始化 LLM =====
    if USE_OPENAI:
        print("🌐 使用 OpenAI API 模型")
        llm = OpenAILLM(
            model_name=OPENAI_MODEL,
            api_key=OPENAI_API_KEY,
            api_base=OPENAI_API_BASE  # ✅ 传入 base_url
        )
    else:
        print("🖥️ 使用本地 Ollama 模型")
        llm = OllamaLLM(OLLAMA_MODEL)

    return retriever, llm

def run_cli_loop(retriever, llm):
    """命令行问答循环 - 支持知识库检索和网络搜索"""
    
    # 初始化网络搜索工具
    web_search = WebSearchTool(max_results=5)
    
    print("\n" + "="*60)
    print("🎤 欢迎使用智能问答系统")
    print("="*60)
    print("\n💡 使用说明：")
    print("  📚 直接提问 → 从知识库检索回答")
    print("  🌐 @搜索 [问题] → 联网搜索实时信息")
    print("  🔄 @混合 [问题] → 同时使用知识库和网络搜索")
    print("  ❌ 输入 exit 或 quit → 退出系统")
    print("\n" + "="*60)
    
    while True:
        query = input("\n🧾 你的问题：").strip()
        
        if query.lower() in {"exit", "quit"}:
            print("\n👋 感谢使用，再见！")
            break
        
        if not query:
            print("⚠️  请输入问题")
            continue
        
        try:
            # 判断搜索模式
            if query.startswith("@搜索"):
                # 纯网络搜索模式
                search_query = query.replace("@搜索", "").strip()
                if not search_query:
                    print("⚠️  请输入搜索内容，例如：@搜索 Python最新版本")
                    continue
                
                print(f"\n🌐 联网搜索模式：{search_query}")
                web_context = web_search.search(search_query)
                
                # 使用网络搜索结果
                prompt = f"根据以下互联网搜索结果回答问题：\n\n{web_context}\n\n问题：{search_query}\n\n请用中文简洁地总结回答："
                
            elif query.startswith("@混合"):
                # 混合搜索模式（知识库 + 网络）
                search_query = query.replace("@混合", "").strip()
                if not search_query:
                    print("⚠️  请输入搜索内容，例如：@混合 Python面试题")
                    continue
                
                print(f"\n🔄 混合搜索模式：{search_query}")
                print("  📚 正在检索知识库...")
                relevant_docs = retriever.invoke(search_query)
                kb_context = "\n\n".join([doc.page_content for doc in relevant_docs])
                
                print("  🌐 正在搜索互联网...")
                web_context = web_search.search(search_query)
                
                # 合并两种来源
                prompt = f"""请根据以下信息回答问题：

【知识库内容】
{kb_context}

【互联网搜索结果】
{web_context}

问题：{search_query}

请综合以上信息用中文回答："""
                
            else:
                # 默认模式：知识库检索
                print(f"\n📚 知识库检索模式")
                relevant_docs = retriever.invoke(query)
                context = "\n\n".join([doc.page_content for doc in relevant_docs])
                
                prompt = f"根据以下内容回答问题：\n\n{context}\n\n问题：{query}\n\n回答："
            
            # 调用 LLM 生成回答
            print("\n🤖 正在生成回答...")
            answer = llm.generate(prompt)
            print(f"\n💬 回答：\n{answer}\n")
            
        except KeyboardInterrupt:
            print("\n\n⚠️  操作已取消")
            continue
        except Exception as e:
            print(f"\n❌ 发生错误：{str(e)}")
            print("请重试或输入 exit 退出")
            continue

if __name__ == "__main__":
    retriever, llm = initialize_retriever_and_llm()
    run_cli_loop(retriever, llm)