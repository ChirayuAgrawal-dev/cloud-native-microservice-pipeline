import { ChromaClient } from 'chromadb';

// Connect to ChromaDB (uses environment variable if running inside container, or localhost if running manually)
const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
const client = new ChromaClient({ path: chromaUrl });

async function runIngestion() {
  console.log('🔄 Connecting to ChromaDB...');

  // 1. Create or get a collection named "personal_knowledge"
  const collection = await client.getOrCreateCollection({
    name: "personal_knowledge"
  });

  // 2. Define your sample notes/documents to ingest
  const sampleKnowledge = [
    {
      id: "doc1",
      text: "Chirayu Agrawal is pursuing a Bachelor of Technology in Computer Science and Engineering at MIT World Peace University in Pune."
    },
    {
      id: "doc2",
      text: "The Cloud & DevOps project uses a Node.js Express backend, ChromaDB for vector retrieval, Ollama with Phi-3 for local AI inference, and Jenkins for CI/CD automation."
    },
    {
      id: "doc3",
      text: "Kubernetes liveness probes check if the microservice is healthy, while readiness probes ensure the container is ready to accept incoming user traffic."
    }
  ];

  console.log('📌 Ingesting documents into ChromaDB vector store...');

  // 3. Store documents into the collection
  await collection.add({
    ids: sampleKnowledge.map(doc => doc.id),
    documents: sampleKnowledge.map(doc => doc.text)
  });

  console.log('✅ Ingestion complete! Knowledge base is updated.');
}

runIngestion().catch((err) => {
  console.error('❌ Ingestion Error:', err);
});