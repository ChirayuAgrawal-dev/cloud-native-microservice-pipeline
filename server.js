

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
      nResults: 4,
      include: ['documents', 'metadatas', 'distances']
    });

    const documents = searchResults.documents?.[0] || [];
    const metadatas = searchResults.metadatas?.[0] || [];

    const contextDocs = documents
      .map((document, index) => {
        const source =
          metadatas[index]?.source || 'Unknown source';

        return `[Source: ${source}]\n${document}`;
      })
      .join('\n\n---\n\n');

    if (!contextDocs.trim()) {
      return res.status(404).json({
        error: 'No relevant documents were found',
        answer: 'I could not find relevant information in the indexed documents.'
      });
    }

    const augmentedPrompt = `
You are a technical assistant explaining the Cloud-Native RAG Microservice Pipeline.

Answer the user's question using the supplied CONTEXT.

Rules:
- Treat the context as the source of truth.
- Do not invent technologies, files, endpoints, features, or deployment behavior.
- If a detail is not supported by the context, explicitly say that the documentation does not specify it.
- Explain technical concepts clearly and organize multi-part answers with headings or numbered steps when useful.
- Distinguish implemented functionality from simulated or planned functionality.
- Use source names in the context to identify where information came from.
- Do not claim that you performed actions or tested anything.

CONTEXT:
${contextDocs}

USER QUESTION:
${question}

GROUNDED ANSWER:
`.trim();

    const ollamaResponse = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: 'phi3',
        prompt: augmentedPrompt,
        stream: false,
        options: {
          temperature: 0.2
        }
      },
      { timeout: 120000 }
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
