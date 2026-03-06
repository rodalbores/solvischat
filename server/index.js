import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import kbChunks from '../functions/api/kb-chunks.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const KB_CHUNKS = Array.isArray(kbChunks) ? kbChunks : [];
const MAX_CONTEXT_CHARS = 4500;
const TOP_K = 6;

const CLASS_KEYWORDS = {
  'critical-safety': ['emergency', 'crisis', 'danger', 'suicide', 'harm', '911', 'urgent'],
  'privacy-legal': ['confidentiality', 'privacy', 'hipaa', 'disclosure', 'records', 'legal', 'subpoena', 'litigation'],
  financial: ['payment', 'insurance', 'reimbursement', 'fee', 'cost', 'charges', 'deductible'],
  'rights-policy': ['right', 'responsibility', 'consent', 'complaint', 'minor', 'guardian', 'policy'],
};

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function scoreChunk(queryTokens, queryTextLower, chunk) {
  const chunkText = `${chunk.section_title || ''}\n${chunk.text || ''}`.toLowerCase();
  const uniqueTokens = [...new Set(queryTokens)];
  let score = 0;

  for (const token of uniqueTokens) {
    if (chunkText.includes(token)) {
      score += 1;
      if ((chunk.section_title || '').toLowerCase().includes(token)) {
        score += 0.6;
      }
    }
  }

  for (const hint of chunk.keyword_hints || []) {
    if (queryTextLower.includes(String(hint).toLowerCase())) {
      score += 1.2;
    }
  }

  const classHints = CLASS_KEYWORDS[chunk.retrieval_class] || [];
  for (const hint of classHints) {
    if (queryTextLower.includes(hint)) {
      score += 1.3;
      break;
    }
  }

  return score;
}

function getLatestUserMessage(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' && typeof messages[i]?.content === 'string') {
      return messages[i].content;
    }
  }
  return '';
}

function retrieveTopChunks(query, chunks, topK = TOP_K, maxContextChars = MAX_CONTEXT_CHARS) {
  const queryTextLower = String(query || '').toLowerCase();
  const queryTokens = tokenize(queryTextLower);
  if (!queryTokens.length || !chunks.length) return [];

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(queryTokens, queryTextLower, chunk),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = [];
  let usedChars = 0;
  for (const entry of ranked) {
    if (selected.length >= topK) break;
    const text = String(entry.chunk?.text || '');
    if (!text) continue;
    if (usedChars + text.length > maxContextChars && selected.length > 0) break;
    selected.push(entry.chunk);
    usedChars += text.length;
  }

  return selected;
}

function buildRetrievedContext(topChunks) {
  if (!topChunks.length) return '';
  const blocks = topChunks.map((chunk, index) => (
    `Snippet ${index + 1} [${chunk.chunk_id}] (${chunk.section_title}):\n${chunk.text}`
  ));
  return `RETRIEVED KNOWLEDGE BASE SNIPPETS (highest relevance first):\n\n${blocks.join('\n\n---\n\n')}`;
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set GEMINI_API_KEY environment variable.' 
      });
    }

    // Convert messages to Gemini format
    const geminiContents = [];
    
    const normalizedSystem = typeof system === 'string' ? system.trim() : '';
    const latestUserMessage = getLatestUserMessage(messages);
    const topChunks = retrieveTopChunks(latestUserMessage, KB_CHUNKS);
    const retrievedContext = buildRetrievedContext(topChunks);

    const combinedInstruction = [
      normalizedSystem,
      retrievedContext,
      'Use retrieved snippets as the primary factual source. If relevant details are missing, say you do not have enough information and suggest contacting Casa de la Familia at (877) 611-2272.'
    ].filter(Boolean).join('\n\n');

    // Add system instruction and knowledge context as first user message if provided
    if (combinedInstruction) {
      geminiContents.push({
        role: 'user',
        parts: [{ text: `System instruction and context:\n${combinedInstruction}\n\nPlease follow the above instruction for all responses.` }]
      });
      geminiContents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      });
    }
    
    // Convert chat messages
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to get response from AI' 
      });
    }

    const data = await response.json();
    
    // Convert Gemini response to match expected format
    const geminiResponse = {
      content: [{
        type: 'text',
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
      }]
    };
    
    res.json(geminiResponse);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request.' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all handler for SPA routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/chat`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY not set. Chat functionality will not work.');
  }
});
