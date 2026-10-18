const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Main API endpoint interacting with Ollama
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
            model: 'phi3', // or any lightweight model you pull
            prompt: prompt,
            stream: false
        });
        res.status(200).json({ result: response.data.response });
    } catch (error) {
        console.error('Error communicating with Ollama:', error.message);
        res.status(500).json({ error: 'Failed to generate response from local AI model' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});