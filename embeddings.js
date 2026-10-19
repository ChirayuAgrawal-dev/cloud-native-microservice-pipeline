import axios from 'axios';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://ollama:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

// Same function must be used for ingestion AND querying,
// otherwise documents and questions end up in different vector spaces.
export const ollamaEmbeddingFunction = {
  generate: async (texts) => {
    const res = await axios.post(`${OLLAMA_HOST}/api/embed`, {
      model: EMBED_MODEL,
      input: texts
    });
    return res.data.embeddings;
  }
};