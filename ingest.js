import { ChromaClient } from 'chromadb';

async function runIngestion() {
    console.log("🔄 Connecting to ChromaDB...");
    
    // Connect pointing to the Docker service name 'chromadb' on port 8000
    const client = new ChromaClient({
        path: "http://chromadb:8000"
    });

    try {
        // Create or get collection with a custom trivial embedding function to bypass external module errors, 
        // or let Chroma handle it if embeddings are passed manually. 
        // Here we use a basic embedding function or pass pre-computed dummy vectors for local RAG testing.
        const collection = await client.getOrCreateCollection({
            name: "rag_documents",
            embeddingFunction: {
                generate: async (texts) => {
                    // Simple mock embedding generator for local testing 
                    // (Returns a fake vector array for each text string)
                    return texts.map(() => [0.1, 0.2, 0.3, 0.4]);
                }
            }
        });

        console.log("📥 Adding documents to collection...");
        await collection.add({
            ids: ["doc1", "doc2"],
            documents: [
                "Chirayu Agrawal is 20 years old, pursuing a B.Tech in Computer Science and Engineering at MIT World Peace University (2024-2028), specializing in Self-supervised Continual Domain Adaptation.",
                "Chirayu resides in Pune, builds full-stack web applications with React and Node.js, and creates cloud-native microservices using Docker and Kubernetes."
            ],
            metadatas: [{ source: "profile" }, { source: "skills" }]
        });

        console.log("✅ Ingestion completed successfully!");
    } catch (error) {
        console.error("❌ Ingestion Error:", error);
    }
}

runIngestion();