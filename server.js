

import express from 'express';
import axios from 'axios';
import { ChromaClient } from 'chromadb';
import { ollamaEmbeddingFunction } from './embeddings.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const OLLAMA_HOST =
  process.env.OLLAMA_HOST || 'http://ollama:11434';
const CHROMA_HOST =
  process.env.CHROMA_HOST || 'http://chromadb:8000';

const chroma = new ChromaClient({ path: CHROMA_HOST });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/ask', async (req, res) => {
  try {
    const question =
      typeof req.body?.question === 'string'
        ? req.body.question.trim()
        : '';

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        error: 'Question must be 2000 characters or fewer'
      });
    }

    const collection = await chroma.getCollection({
      name: 'rag_documents',
      embeddingFunction: ollamaEmbeddingFunction
    });

    // Retrieve more relevant chunks for broader questions.
    const searchResults = await collection.query({
      queryTexts: [question],
      nResults: 2,
      include: ['documents', 'metadatas', 'distances']
    });

    const documents = searchResults.documents?.[0] || [];
    const metadatas = searchResults.metadatas?.[0] || [];

    const contextDocs = documents
      .map((document, index) => {
       const source = metadatas[index]?.source || 'Unknown source';
       return `[Source: ${source}]\n${document.slice(0, 1200)}`;
      })
      .join('\n\n---\n\n');

    if (!contextDocs.trim()) {
      return res.status(404).json({
        error: 'No relevant documents were found',
        answer: 'I could not find relevant information in the indexed documents.'
      });
    }

    
const augmentedPrompt = `
You are a question-answering assistant for a document retrieval system.

RULES:
- Answer only from the supplied CONTEXT.
- Never invent facts or use unrelated meanings of terms.
- If the context does not contain the answer, explicitly say:
  "The indexed documents do not contain enough information to answer this."
- Give at most 3 short bullet points.
- Keep the answer under 70 words.
- Do not repeat the question.

CONTEXT:
${contextDocs}

USER QUESTION:
${question}

ANSWER:
`.trim();
    
const ollamaResponse = await axios.post(
  `${OLLAMA_HOST}/api/generate`,
  {
    model: 'phi3',
    prompt: augmentedPrompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 100
    }
  },
  { timeout: 300000 }
);
    res.json({
      question,
      contextUsed: contextDocs,
      answer: ollamaResponse.data.response?.trim() || ''
    });
  } catch (error) {
    console.error('RAG Query Error:', error.message);

    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`RAG Microservice running on port ${PORT}`);
});
