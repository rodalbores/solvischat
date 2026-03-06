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
const MAX_CHUNKS_PER_SECTION = 2;

const CLASS_KEYWORDS = {
  'critical-safety': ['emergency', 'crisis', 'danger', 'suicide', 'harm', '911', 'urgent'],
  'privacy-legal': ['confidentiality', 'privacy', 'hipaa', 'disclosure', 'records', 'legal', 'subpoena', 'litigation'],
  financial: ['payment', 'insurance', 'reimbursement', 'fee', 'cost', 'charges', 'deductible'],
  'rights-policy': ['right', 'responsibility', 'consent', 'complaint', 'minor', 'guardian', 'policy'],
};

const STOPWORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'can', 'could', 'should', 'would', 'will', 'do', 'does', 'did', 'is',
  'are', 'was', 'were', 'am', 'be', 'been', 'being', 'have', 'has', 'had',
  'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'we', 'our', 'ours',
  'they', 'them', 'their', 'theirs', 'a', 'an', 'the', 'and', 'or', 'to',
  'for', 'of', 'in', 'on', 'at', 'by', 'with', 'about', 'from', 'into',
  'over', 'after', 'before', 'between', 'during', 'without', 'through',
  'than', 'then', 'if', 'as', 'that', 'this', 'these', 'those', 'it',
]);

const EDGE_CASE_CHUNK_HINTS = {
  'kb-0004': ['reschedule', 'cancel appointment', 'scheduling changes', 'phone number'],
  'kb-0010': ['individual counseling', 'individual therapy', 'psychological approaches'],
  'kb-0014': ['stop scheduling', 'several weeks', 'four weeks', 'services end', 'return later'],
  'kb-0016': ['family counseling', 'couples counseling', 'marriage counseling', 'safety risk'],
  'kb-0017': ['family counseling', 'couples counseling', 'marriage counseling'],
  'kb-0018': ['immediate safety risk', 'safety risk', 'emergency action', 'at risk'],
  'kb-0027': ['immediate safety risk', 'emergency action'],
  'kb-0031': ['48 hours notice', 'cancel less than 48 hours'],
  'kb-0032': ['less than 48 hours notice', 'late cancellation', 'no show', 'no-show', 'missed appointment'],
  'kb-0039': ['group counseling', 'group therapy'],
};

function getThresholdsByQuerySize(queryTokens) {
  const unique = [...new Set(queryTokens)];
  const meaningful = unique.filter((token) => !STOPWORDS.has(token) && token.length >= 4);
  const tokenCount = meaningful.length;

  if (tokenCount <= 2) {
    return {
      coverageFloor: 0.2,
      scoreFloor: 2.3,
      minExactMatches: 1,
      minCombinedMatches: 1,
      fallbackScoreFloor: 2.0,
    };
  }
  if (tokenCount <= 5) {
    return {
      coverageFloor: 0.32,
      scoreFloor: 2.9,
      minExactMatches: 2,
      minCombinedMatches: 2,
      fallbackScoreFloor: 2.4,
    };
  }
  return {
    coverageFloor: 0.4,
    scoreFloor: 3.4,
    minExactMatches: 2,
    minCombinedMatches: 3,
    fallbackScoreFloor: 2.9,
  };
}

function passesPrimaryThreshold(entry, thresholds) {
  if (entry.score <= 0) return false;
  if (entry.weightedCoverage >= thresholds.coverageFloor && entry.exactMatches >= thresholds.minExactMatches) {
    return true;
  }
  if (entry.score >= thresholds.scoreFloor
    && entry.exactMatches >= thresholds.minExactMatches
    && (entry.exactMatches + entry.fuzzyMatches) >= thresholds.minCombinedMatches) {
    return true;
  }
  if (entry.classHintMatch
    && entry.keywordHintMatches >= 1
    && entry.exactMatches >= thresholds.minExactMatches
    && entry.weightedCoverage >= (thresholds.coverageFloor - 0.08)) {
    return true;
  }
  return false;
}

function passesFallbackThreshold(entry, thresholds) {
  if (entry.score < thresholds.fallbackScoreFloor) return false;
  if (entry.exactMatches < 1) return false;
  return entry.weightedCoverage >= 0.18;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function normalizeToken(token) {
  const t = String(token || '').toLowerCase();
  const map = {
    counseling: 'therapy',
    counselling: 'therapy',
    scheduling: 'schedule',
    appointments: 'appointment',
    weeks: 'week',
    services: 'service',
    couples: 'couple',
  };
  return map[t] || t;
}

function levenshteinDistanceWithin(a, b, maxDistance) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > maxDistance) return maxDistance + 1;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;

  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j += 1) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= n; j += 1) prev[j] = curr[j];
  }

  return prev[n];
}

function getFuzzyThreshold(token) {
  const len = token.length;
  if (len <= 4) return 0;
  if (len <= 7) return 1;
  return 2;
}

function isFuzzyTokenMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  const maxDistance = getFuzzyThreshold(a);
  return levenshteinDistanceWithin(a, b, maxDistance) <= maxDistance;
}

function queryHasHint(queryTextLower, queryTokensSet, hint) {
  const hintLower = String(hint || '').toLowerCase();
  if (!hintLower) return false;
  if (queryTextLower.includes(hintLower)) return true;
  if (queryTokensSet.has(hintLower)) return true;
  if (hintLower.length <= 5) return false;

  for (const token of queryTokensSet) {
    if (token.length <= 4 || STOPWORDS.has(token)) continue;
    if (isFuzzyTokenMatch(token, hintLower)) return true;
  }

  return false;
}

function augmentQueryTokens(queryTokens, queryTextLower) {
  const tokenSet = new Set(queryTokens);
  const add = (...tokens) => {
    for (const token of tokens) {
      const normalized = normalizeToken(token);
      if (normalized && normalized.length >= 3) tokenSet.add(normalized);
    }
  };

  if (/\bindividual\s+(therapy|counseling|counselling)\b/.test(queryTextLower)) {
    add('individual', 'therapy', 'treatment');
  }
  if (/\bgroup\s+(therapy|counseling|counselling)\b/.test(queryTextLower)) {
    add('group', 'therapy');
  }
  if (/\bfamily\s+(therapy|counseling|counselling)\b/.test(queryTextLower)) {
    add('family', 'therapy', 'couple');
  }
  if (/\b(marriage|couples?)\s+(therapy|counseling|counselling)\b/.test(queryTextLower)) {
    add('marriage', 'couple', 'therapy', 'family');
  }
  if (/\b(less than|under)\s+48\s+hours?\b/.test(queryTextLower)) {
    add('48', 'notice', 'cancel', 'cancellation', 'late', 'show', 'noshow');
  }
  if (/\bno[\s-]?show\b/.test(queryTextLower)) {
    add('noshow', 'missed', 'appointment');
  }
  if (/\b(schedule|scheduling)\s+(changes?|change)\b/.test(queryTextLower)
    || /\bcancel or reschedule\b/.test(queryTextLower)) {
    add('schedule', 'appointment', 'reschedule', 'cancel');
  }
  if (/\bstop scheduling\b/.test(queryTextLower) || /\bseveral weeks?\b/.test(queryTextLower)) {
    add('schedule', 'week', 'terminate', 'break', 'return');
  }
  if (/\bservices?\s+end\b/.test(queryTextLower) || /\breturn later\b/.test(queryTextLower)) {
    add('termination', 'terminate', 'return', 'therapy');
  }
  if (/\bimmediate safety risk\b/.test(queryTextLower) || /\bat risk\b/.test(queryTextLower)) {
    add('safety', 'risk', 'emergency', 'crisis', 'danger');
  }
  if (/\bhow long\b/.test(queryTextLower) && /\btherapy\b/.test(queryTextLower)) {
    add('session', 'length', 'minute');
  }

  return [...tokenSet];
}

function buildChunkSearchData(chunk) {
  const title = String(chunk.section_title || '').toLowerCase();
  const text = `${chunk.section_title || ''}\n${chunk.text || ''}`;
  const mergedKeywordHints = [
    ...(Array.isArray(chunk.keyword_hints) ? chunk.keyword_hints : []),
    ...(EDGE_CASE_CHUNK_HINTS[chunk.chunk_id] || []),
  ];
  const tokens = tokenize(text).map(normalizeToken);
  const tokenSet = new Set(tokens);
  const weightedTokenSet = new Set(tokens.filter((token) => !STOPWORDS.has(token)));
  return {
    ...chunk,
    _keywordHints: mergedKeywordHints,
    _titleLower: title,
    _tokenSet: tokenSet,
    _weightedTokenSet: weightedTokenSet,
    _tokens: [...tokenSet],
  };
}

function scoreChunk(queryTokens, queryTextLower, chunk) {
  const uniqueTokens = [...new Set(queryTokens)].filter((token) => !STOPWORDS.has(token));
  const queryTokenSet = new Set(uniqueTokens);
  const weightedQueryTokens = uniqueTokens.filter((token) => token.length >= 4);
  const weightedQueryTokenSet = new Set(weightedQueryTokens);
  const weightedQueryCount = weightedQueryTokens.length || uniqueTokens.length || 1;
  let score = 0;
  let exactMatches = 0;
  let fuzzyMatches = 0;
  let titleExactMatches = 0;
  let titleFuzzyMatches = 0;
  let keywordHintMatches = 0;
  let classHintMatch = 0;

  for (const token of uniqueTokens) {
    const tokenWeight = token.length >= 7 ? 1.1 : token.length >= 5 ? 1.0 : 0.9;
    if (chunk._tokenSet.has(token)) {
      exactMatches += 1;
      score += 1.2 * tokenWeight;
      if (chunk._titleLower.includes(token)) {
        titleExactMatches += 1;
        score += 0.6 * tokenWeight;
      }
      continue;
    }

    let fuzzyMatched = false;
    for (const chunkToken of chunk._tokens) {
      if (isFuzzyTokenMatch(token, chunkToken)) {
        fuzzyMatched = true;
        break;
      }
    }

    if (fuzzyMatched) {
      fuzzyMatches += 1;
      score += 0.45 * tokenWeight;
      if (chunk._titleLower.includes(token)) {
        titleFuzzyMatches += 1;
        score += 0.18 * tokenWeight;
      }
    }
  }

  for (const hint of chunk._keywordHints || []) {
    if (queryHasHint(queryTextLower, queryTokenSet, hint)) {
      keywordHintMatches += 1;
      score += 1.0;
    }
  }

  const classHints = CLASS_KEYWORDS[chunk.retrieval_class] || [];
  for (const hint of classHints) {
    if (queryHasHint(queryTextLower, queryTokenSet, hint)) {
      classHintMatch = 1;
      score += 0.8;
      break;
    }
  }

  const weightedExactMatches = [...weightedQueryTokenSet]
    .filter((token) => chunk._weightedTokenSet.has(token))
    .length;
  const weightedCoverage = weightedExactMatches / weightedQueryCount;

  if (weightedCoverage >= 0.6) score += 1.0;
  else if (weightedCoverage >= 0.4) score += 0.5;
  else if (weightedCoverage < 0.2) score -= 0.5;

  if (exactMatches === 0 && fuzzyMatches > 0) score -= 0.5;
  if (exactMatches + fuzzyMatches < 2 && uniqueTokens.length >= 4) score -= 0.4;

  return {
    score,
    weightedCoverage,
    exactMatches,
    fuzzyMatches,
    titleMatches: titleExactMatches + titleFuzzyMatches,
    keywordHintMatches,
    classHintMatch,
  };
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
  const queryTokens = augmentQueryTokens(tokenize(queryTextLower).map(normalizeToken), queryTextLower);
  if (!queryTokens.length || !chunks.length) return [];

  const thresholds = getThresholdsByQuerySize(queryTokens);
  const rankedAll = chunks
    .map((chunk) => ({
      chunk,
      ...scoreChunk(queryTokens, queryTextLower, chunk),
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.weightedCoverage !== a.weightedCoverage) return b.weightedCoverage - a.weightedCoverage;
      if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
      return b.titleMatches - a.titleMatches;
    });
  const rankedPrimary = rankedAll.filter((entry) => passesPrimaryThreshold(entry, thresholds));
  const ranked = rankedPrimary.length ? rankedPrimary : rankedAll.filter((entry) => passesFallbackThreshold(entry, thresholds));

  const selected = [];
  const sectionCounts = new Map();
  let usedChars = 0;
  for (const entry of ranked) {
    if (selected.length >= topK) break;
    const text = String(entry.chunk?.text || '');
    if (!text) continue;
    const sectionKey = String(entry.chunk?.section_title || '').toLowerCase();
    const sectionCount = sectionCounts.get(sectionKey) || 0;
    if (sectionCount >= MAX_CHUNKS_PER_SECTION) continue;
    if (usedChars + text.length > maxContextChars && selected.length > 0) break;
    selected.push(entry.chunk);
    sectionCounts.set(sectionKey, sectionCount + 1);
    usedChars += text.length;
  }

  return selected;
}

const KB_SEARCH_CHUNKS = KB_CHUNKS.map(buildChunkSearchData);

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
    const topChunks = retrieveTopChunks(latestUserMessage, KB_SEARCH_CHUNKS);
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
