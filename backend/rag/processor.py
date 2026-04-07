"""Document processing pipeline: upload -> extract text -> chunk -> embed -> store in pgvector."""

import logging
import os
import tempfile

from fastapi import UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader

from backend.core.config import settings
from backend.core.supabase_client import get_supabase

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Processes uploaded documents into vector embeddings stored in Supabase pgvector."""

    def __init__(self):
        self.supabase = get_supabase()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    async def process_upload(
        self,
        file: UploadFile,
        user_id: str,
        home_id: str,
    ) -> int:
        """Process an uploaded file: extract text, chunk, embed, and store."""
        # Save to temp file
        suffix = os.path.splitext(file.filename or "doc.txt")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Upload original to Supabase Storage
            storage_path = f"{user_id}/{home_id}/{file.filename}"
            self.supabase.storage.from_("documents").upload(
                storage_path, content, {"content-type": file.content_type or "application/octet-stream"}
            )

            # Extract text based on file type
            documents = self._load_document(tmp_path, suffix)

            # Chunk the documents
            chunks = self.text_splitter.split_documents(documents)

            # Generate embeddings and store
            for i, chunk in enumerate(chunks):
                embedding = await self._get_embedding(chunk.page_content)

                self.supabase.table("document_chunks").insert({
                    "user_id": user_id,
                    "home_id": home_id,
                    "source_file": file.filename,
                    "chunk_index": i,
                    "content": chunk.page_content,
                    "embedding": embedding,
                    "metadata": {
                        "page": chunk.metadata.get("page", 0),
                        "source": file.filename,
                    },
                }).execute()

            return len(chunks)

        finally:
            os.unlink(tmp_path)

    def _load_document(self, file_path: str, suffix: str):
        """Load document based on file extension."""
        if suffix.lower() == ".pdf":
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path)
        return loader.load()

    async def _get_embedding(self, text: str) -> list[float]:
        """Generate embedding vector for a text chunk using Anthropic's Voyage
        or a compatible embedding API. Falls back to a simple hash-based
        embedding for development."""
        try:
            import httpx

            # Use Supabase's built-in embedding function if available,
            # otherwise fall back to a development placeholder
            response = await httpx.AsyncClient().post(
                f"{settings.supabase_url}/rest/v1/rpc/generate_embedding",
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "Content-Type": "application/json",
                },
                json={"input_text": text},
            )
            if response.status_code == 200:
                return response.json()
        except Exception:
            logger.warning("Embedding API unavailable, using placeholder")

        # Development fallback: hash-based pseudo-embedding (NOT for production)
        import hashlib

        hash_bytes = hashlib.sha256(text.encode()).digest()
        # Create a 384-dimensional vector from the hash
        embedding = []
        for i in range(384):
            byte_val = hash_bytes[i % len(hash_bytes)]
            embedding.append((byte_val / 255.0) * 2 - 1)  # Normalize to [-1, 1]
        return embedding
