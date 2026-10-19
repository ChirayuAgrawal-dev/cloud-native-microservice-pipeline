import express from 'express';
import axios from 'axios';
import { ChromaClient } from 'chromadb';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

const chromaClient = new ChromaClient({ path: CHROMA_URL });

// 1. Health Check Endpoint (Used by Kubernetes Liveness & Readiness Probes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// 2. RAG Query Endpoint
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Please provide a "question" in the request body.' });
  }

  try {
    console.log(`🔍 Received Query: "${question}"`);

    // Step A: Search ChromaDB for relevant document context
    const collection = await chromaClient.getOrCreateCollection({ name: 'personal_knowledge' });
    const searchResults = await collection.query({
      queryTexts: [question],
      nResults: 2 // Fetch top 2 most relevant matching text chunks
    });

    const retrievedContext = searchResults.documents[0]?.join('\n') || 'No relevant documents found.';
    console.log(`📄 Retrieved Context from ChromaDB:\n${retrievedContext}\n`);

    // Step B: Construct Grounded Prompt for Phi-3 (Ollama)
    const augmentedPrompt = `
You are a helpful Personal AI Knowledge Assistant. 
Answer the user's question using ONLY the provided context below. If the context does not contain enough information, state clearly that you do not know based on the notes.

CONTEXT:
${retrievedContext}

QUESTION:
${question}

ANSWER:
`;

    // Step C: Send Context + Question to Ollama Container
    const ollamaResponse = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'phi3',
      prompt: augmentedPrompt,
      stream: false
    });

    // Step D: Send Final Grounded Answer Back to Client
    return res.status(200).json({
      question: question,
      contextUsed: retrievedContext,
      answer: ollamaResponse.data.response
    });

  } catch (error) {
    console.error('❌ Error processing RAG request:', error.message);
    return res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 RAG Microservice running on port ${PORT}`);
});