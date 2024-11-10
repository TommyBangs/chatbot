const express = require('express');
const cors = require('cors');
const { ContextSDK } = require('@context-labs/sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize the SDK
const context = new ContextSDK({
    apiKey: process.env.CONTEXT_API_KEY
});

app.use(cors());
app.use(express.json());

app.post('/ask', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const response = await context.query({
            botId: process.env.BOT_ID,
            query,
            onData: (data) => {
                console.log('Streaming data:', data);
            },
            onComplete: (data) => {
                res.json({ response: data.controller });
            },
            onError: (error) => {
                console.error('Error:', error);
                res.status(500).json({ error: 'An error occurred' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 