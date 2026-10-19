import { ChromaClient } from 'chromadb';
import { ollamaEmbeddingFunction } from './embeddings.js';

const CHROMA_HOST = process.env.CHROMA_HOST || 'http://chromadb:8000';

async function runIngestion() {
    console.log("🔄 Connecting to ChromaDB...");

    const client = new ChromaClient({ path: CHROMA_HOST });

    try {
        // Drop the old collection so re-running ingestion is safe.
        try {
            await client.deleteCollection({ name: "rag_documents" });
            console.log("🧹 Removed old collection");
        } catch (e) {
            // Collection didn't exist yet, nothing to remove
        }

        const collection = await client.getOrCreateCollection({
            name: "rag_documents",
            embeddingFunction: ollamaEmbeddingFunction
        });

        console.log("📥 Adding documents to collection...");
        await collection.add({
            ids: ["doc1", "doc2", "doc3", "doc4", "doc5"],
            documents: [
                "Chirayu Agrawal is 20 years old, pursuing a B.Tech in Computer Science and Engineering at MIT World Peace University (2024-2028), specializing in Self-supervised Continual Domain Adaptation.",
                "Chirayu resides in Pune, builds full-stack web applications with React and Node.js, and creates cloud-native microservices using Docker and Kubernetes.",
                "The ccd-microservice project runs a RAG pipeline on Minikube using Express, ChromaDB and Ollama with the phi3 model.",
                "Chirayu enjoys building computer vision projects, including an ANPR gate system that detects number plates with YOLO.",
                "MIT World Peace University is located in Pune, Maharashtra, and offers B.Tech programs in engineering."
            ],
            metadatas: [
                { source: "profile" },
                { source: "skills" },
                { source: "project" },
                { source: "projects" },
                { source: "college" }
            ]
        });

        console.log("✅ Ingestion completed successfully!");
    } catch (error) {
        console.error("❌ Ingestion Error:", error);
    }
}

runIngestion();