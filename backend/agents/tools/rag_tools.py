"""CrewAI tools for RAG-based document Q&A."""

from crewai.tools import BaseTool
from pydantic import Field


class SearchDocumentsTool(BaseTool):
    name: str = "search_documents"
    description: str = (
        "Search uploaded maintenance documents (manuals, warranties, guides) "
        "using semantic search. Input: a natural language query."
    )
    user_id: str = Field(default="")
    home_id: str = Field(default="")

    def _run(self, query: str) -> str:
        from backend.rag.retriever import DocumentRetriever

        retriever = DocumentRetriever()
        results = retriever.search(query, user_id=self.user_id, home_id=self.home_id)
        if not results:
            return "No relevant documents found. The user may need to upload documents first."

        output_parts = []
        for i, doc in enumerate(results, 1):
            source = doc.metadata.get("source", "Unknown")
            output_parts.append(f"--- Result {i} (Source: {source}) ---\n{doc.page_content}")
        return "\n\n".join(output_parts)
