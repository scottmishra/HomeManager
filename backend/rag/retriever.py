"""Document retrieval using pgvector similarity search in Supabase."""

import logging

from langchain.schema import Document

from backend.core.supabase_client import get_supabase

logger = logging.getLogger(__name__)


class DocumentRetriever:
    """Retrieves relevant document chunks from Supabase pgvector."""

    def __init__(self):
        self.supabase = get_supabase()

    def search(
        self,
        query: str,
        user_id: str,
        home_id: str = "",
        top_k: int = 5,
    ) -> list[Document]:
        """Search for relevant document chunks using semantic similarity."""
        try:
            # Get query embedding
            import asyncio

            from backend.rag.processor import DocumentProcessor

            processor = DocumentProcessor()
            # Run async embedding in sync context
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    query_embedding = pool.submit(
                        asyncio.run, processor._get_embedding(query)
                    ).result()
            else:
                query_embedding = asyncio.run(processor._get_embedding(query))

            # Call the Supabase RPC function for similarity search
            params = {
                "query_embedding": query_embedding,
                "match_count": top_k,
                "filter_user_id": user_id,
            }
            if home_id:
                params["filter_home_id"] = home_id

            result = self.supabase.rpc("match_documents", params).execute()

            documents = []
            for row in result.data or []:
                documents.append(
                    Document(
                        page_content=row["content"],
                        metadata={
                            "source": row.get("source_file", "Unknown"),
                            "similarity": row.get("similarity", 0),
                            "chunk_index": row.get("chunk_index", 0),
                        },
                    )
                )
            return documents

        except Exception as e:
            logger.exception("Document search failed")
            return []
