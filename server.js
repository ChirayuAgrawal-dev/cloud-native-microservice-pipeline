import express from 'express';
import axios from 'axios';
import { ChromaClient } from 'chromadb';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama:11434';
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://chromadb:8000';

const chroma = new ChromaClient({ path: CHROMA_HOST });

// Define matching embedding function structure
const customEmbeddingFunction = {
  generate: async (texts) => texts.map(() => [0.1, 0.2, 0.3, 0.4])
};

app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Connect to the matching collection created during ingestion
    const collection = await chroma.getOrCreateCollection({
      name: 'rag_documents',
      embeddingFunction: customEmbeddingFunction
    });

    // Retrieve documents from ChromaDB
    const searchResults = await collection.query({
      queryTexts: [question],
      nResults: 2
    });

    const contextDocs = searchResults.documents[0] ? searchResults.documents[0].join('\n') : '';

    // Construct augmented prompt
    const augmentedPrompt = `Context:\n${contextDocs}\n\nQuestion: ${question}\n\nAnswer:`;

    // Query Ollama (Phi-3 model)
    const ollamaResponse = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: 'phi3',
      prompt: augmentedPrompt,
      stream: false
    });

    res.json({
      question,
      contextUsed: contextDocs,
      answer: ollamaResponse.data.response
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
  console.log(`🚀 RAG Microservice running on port ${PORT}`);
});