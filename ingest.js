
import { ChromaClient } from 'chromadb';
import { ollamaEmbeddingFunction } from './embeddings.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const CHROMA_HOST =
  process.env.CHROMA_HOST || 'http://chromadb:8000';

const OLLAMA_HOST =
  process.env.OLLAMA_HOST || 'http://ollama:11434';

const EMBED_MODEL =
  process.env.EMBED_MODEL || 'nomic-embed-text';

const COLLECTION_NAME = 'rag_documents';
const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');

// Split long documents into overlapping chunks for better retrieval.
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

// Your existing project knowledge.
const SAMPLE_DOCUMENTS = [
  {
    source: 'project-profile.txt',
    category: 'profile',
    text:
      'Chirayu Agrawal is pursuing a B.Tech in Computer Science ' +
      'and Engineering at MIT World Peace University (2024-2028), ' +
      'with an interest in self-supervised continual domain adaptation.'
  },
  {
    source: 'skills.txt',
    category: 'skills',
    text:
      'The project profile describes experience building full-stack ' +
      'web applications with React and Node.js, and cloud-native ' +
      'microservices using Docker and Kubernetes.'
  },
  {
    source: 'rag-project.txt',
    category: 'project',
    text:
      'The ccd-microservice project implements a Retrieval-Augmented ' +
      'Generation (RAG) pipeline using Express, ChromaDB, Ollama, ' +
      'the Phi-3 language model, and the nomic-embed-text embedding model. ' +
      'The API accepts questions, retrieves relevant document chunks, ' +
      'and passes the retrieved context to Phi-3 to generate an answer.'
  },
  {
    source: 'computer-vision.txt',
    category: 'projects',
    text:
      'A computer vision project uses YOLO for number-plate detection ' +
      'and classification, with a focus on distinguishing green Indian ' +
      'electric-vehicle number plates from non-EV number plates.'
  },
  {
    source: 'college.txt',
    category: 'education',
    text:
      'MIT World Peace University is located in Pune, Maharashtra, India, ' +
      'and offers B.Tech engineering programs.'
  }
];

// Read supported text-based documents from the documents folder.
async function loadDocumentsFromFolder() {
  const supportedExtensions = new Set([
    '.txt',
    '.md',
    '.json',
    '.csv'
  ]);

  const loaded = [];

  await fs.mkdir(DOCUMENTS_DIR, { recursive: true });

  async function walk(directory) {
    const entries = await fs.readdir(directory, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();

      if (!supportedExtensions.has(extension)) continue;

      const text = (await fs.readFile(fullPath, 'utf8')).trim();

      if (!text) {
        console.warn(`Skipping empty file: ${fullPath}`);
        continue;
      }

      const source = path.relative(DOCUMENTS_DIR, fullPath);

      loaded.push({
        source: `documents/${source}`,
        category: 'uploaded-document',
        text
      });
    }
  }

  await walk(DOCUMENTS_DIR);
  return loaded;
}

// Break large documents into chunks with a small overlap.
function splitIntoChunks(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();

  if (normalized.length <= CHUNK_SIZE) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE, normalized.length);

    // Prefer a paragraph or sentence boundary where possible.
    if (end < normalized.length) {
      const minimumEnd = start + Math.floor(CHUNK_SIZE * 0.65);
      const boundary = normalized.lastIndexOf('\n', end);

      if (boundary >= minimumEnd) {
        end = boundary;
      } else {
        const sentenceBoundary = normalized.lastIndexOf('. ', end);

        if (sentenceBoundary >= minimumEnd) {
          end = sentenceBoundary + 1;
        }
      }
    }

    const chunk = normalized.slice(start, end).trim();

    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

function prepareChunks(documents) {
  const ids = [];
  const texts = [];
  const metadatas = [];

  for (const document of documents) {
    const chunks = splitIntoChunks(document.text);

    chunks.forEach((chunk, index) => {
      // Stable IDs make document chunks identifiable between runs.
      const hash = createHash('sha256')
        .update(`${document.source}:${index}:${chunk}`)
        .digest('hex')
        .slice(0, 24);

      ids.push(`doc_${hash}`);
      texts.push(chunk);

      metadatas.push({
        source: document.source,
        category: document.category,
        chunk: index
      });
    });
  }

  return { ids, texts, metadatas };
}

async function runIngestion() {
  console.log('Connecting to Ollama and ChromaDB...');

  // Check the embedding model before touching the existing collection.
  const modelResponse = await fetch(`${OLLAMA_HOST}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: 'Embedding dimension verification.'
    })
  });

  if (!modelResponse.ok) {
    throw new Error(
      `Embedding model check failed (${modelResponse.status}). ` +
      `Ensure ${EMBED_MODEL} is available in Ollama.`
    );
  }

  const modelData = await modelResponse.json();
  const dimension = modelData.embeddings?.[0]?.length;

  if (!dimension) {
    throw new Error('Ollama returned no embedding vector.');
  }

  console.log(`Embedding model: ${EMBED_MODEL}`);
  console.log(`Embedding dimensions: ${dimension}`);

  // Prepare all documents before replacing the collection.
  const folderDocuments = await loadDocumentsFromFolder();

  const documents = [
    ...SAMPLE_DOCUMENTS,
    ...folderDocuments
  ];

  const { ids, texts, metadatas } = prepareChunks(documents);

  if (texts.length === 0) {
    throw new Error('No documents found to ingest.');
  }

  console.log(`Source documents: ${documents.length}`);
  console.log(`Document chunks: ${texts.length}`);

  const client = new ChromaClient({
    path: CHROMA_HOST
  });

  // The collection is replaced only after the model and input checks pass.
  try {
    await client.deleteCollection({
      name: COLLECTION_NAME
    });

    console.log('Replaced the existing collection.');
  } catch (error) {
    // A missing collection is expected on the first run.
    console.log('No existing collection to replace.');
  }

  const collection = await client.createCollection({
    name: COLLECTION_NAME,
    embeddingFunction: ollamaEmbeddingFunction,
    metadata: {
      description: 'Project knowledge base using Ollama embeddings',
      embedding_model: EMBED_MODEL,
      embedding_dimension: dimension
    }
  });

  // Insert in batches to avoid excessively large requests.
  const BATCH_SIZE = 32;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, texts.length);

    await collection.add({
      ids: ids.slice(i, end),
      documents: texts.slice(i, end),
      metadatas: metadatas.slice(i, end)
    });

    console.log(`Indexed ${end}/${texts.length} chunks.`);
  }

  const count = await collection.count();

  console.log('Ingestion completed successfully!');
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Stored chunks: ${count}`);
}

runIngestion().catch((error) => {
  console.error('Ingestion failed:', error.message);
  process.exitCode = 1;
});
