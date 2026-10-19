
# API Documentation

## Project

Cloud-Native RAG Microservice Pipeline

**Repository:** https://github.com/ChirayuAgrawal-dev/cloud-native-microservice-pipeline

## 1. Overview

The API accepts a question, retrieves relevant documents from ChromaDB, and passes the retrieved context to Ollama's Phi-3 model to generate an answer.

## 2. Base URL

Local API:

`http://localhost:3000`

## 3. Available Endpoint

### POST `/api/ask`

Submits a question to the RAG pipeline.

**Request header**

`Content-Type: application/json`

**Request body**

```json
{
  "question": "What technologies does this RAG project use?"
}
```

The `question` field is required.

### Successful response

**HTTP status:** `200 OK`

```json
{
  "question": "What technologies does this RAG project use?",
  "contextUsed": "Retrieved document text",
  "answer": "Generated response from Phi-3"
}
```

The returned values depend on the indexed documents and the model's response.

### Response fields

| Field | Description |
|---|---|
| `question` | The submitted question |
| `contextUsed` | Retrieved text passed to the generation prompt |
| `answer` | Generated answer from Phi-3 |

## 4. Error Responses

### Missing question

**HTTP status:** `400 Bad Request`

```json
{
  "error": "Question is required"
}
```

### Processing failure

**HTTP status:** `500 Internal Server Error`

```json
{
  "error": "Failed to process request",
  "details": "Underlying error message"
}
```

A processing failure may occur if ChromaDB, Ollama, or the embedding request fails.

## 5. PowerShell Example

```powershell
$body = @{
    question = "What technologies does this RAG project use?"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3000/api/ask" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## 6. cURL Example

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What technologies does this RAG project use?"}'
```

## 7. Backend Dependencies

The endpoint depends on:

- Express and Node.js
- ChromaDB
- Ollama
- `nomic-embed-text` for embeddings
- `phi3` for answer generation
- An initialized `rag_documents` collection

## 8. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama API address |
| `CHROMA_HOST` | `http://chromadb:8000` | ChromaDB address |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model |
| `PORT` | `3000` | Express server port |

Inside Docker Compose, the service names are used for internal communication. From the host machine, use the mapped localhost ports.

## 9. Retrieval and Answer Generation

The backend retrieves up to two results from ChromaDB and adds their text to a prompt sent to Phi-3.

This is a basic RAG implementation. It does not guarantee that every generated claim is supported by the retrieved context. A stricter prompt and source display can improve grounding.

## 10. Scope

This documentation covers the repository's documented `POST /api/ask` endpoint. It does not assume that document upload, authentication, streaming, or health-check endpoints exist.

For implementation details, see the source files `server.js`, `embeddings.js`, and `ingest.js`.
