import kbChunks from './kb-chunks.js';

// Cloudflare Pages Function - handles /api/chat endpoint
const KB_CHUNKS = Array.isArray(kbChunks) ? kbChunks : [];
const MAX_CONTEXT_CHARS = 4500;
const TOP_K = 6;
const MAX_CHUNKS_PER_SECTION = 2;
const SIMILARITY_THRESHOLD = 0.63;

const TOKEN_NORMALIZATION = {
  // Common misspellings
  therapyy: 'therapy',
  therapy: 'therapy',
  theraphy: 'therapy',
  terapy: 'therapy',
  psycotherapy: 'psychotherapy',
  psychoterapy: 'psychotherapy',
  counceling: 'counseling',
  counselng: 'counseling',
  confedentiality: 'confidentiality',
  confidetiality: 'confidentiality',
  confideniality: 'confidentiality',
  confidenciality: 'confidentiality',
  hippa: 'hipaa',
  insurence: 'insurance',
  emergancy: 'emergency',
  emegency: 'emergency',
  emergncy: 'emergency',
  lawsuite: 'lawsuit',
  arbitation: 'arbitration',
  arbitraion: 'arbitration',
  paymant: 'payment',
  payement: 'payment',
  copay: 'copayment',
  copays: 'copayment',
  reembursement: 'reimbursement',

  // Light synonym normalization
  payments: 'payment',
  fees: 'fee',
  costs: 'cost',
  charges: 'charge',
  minors: 'minor',
  guardians: 'guardian',
  records: 'record',
  disclosures: 'disclosure',
  rights: 'right',
  responsibilities: 'responsibility',
  complaints: 'complaint',
  emergencies: 'emergency',
  crises: 'crisis',
  counseling: 'therapy',
  counselling: 'therapy',
  scheduling: 'schedule',
  appointments: 'appointment',
  weeks: 'week',
  services: 'service',
  couples: 'couple',
};

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

function normalizeToken(token) {
  const t = String(token || '').toLowerCase();
  return TOKEN_NORMALIZATION[t] || t;
}

function tokenizeRaw(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function tokenize(text) {
  return tokenizeRaw(text).map(normalizeToken);
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

  const hintToken = normalizeToken(hintLower);
  if (queryTokensSet.has(hintToken)) return true;
  if (hintToken.length <= 5) return false;

  for (const token of queryTokensSet) {
    if (token.length <= 4 || STOPWORDS.has(token)) continue;
    if (isFuzzyTokenMatch(token, hintToken)) return true;
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
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const tokenCounts = new Map();
  for (const token of tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
  }
  const weightedTokenSet = new Set(tokens.filter((token) => !STOPWORDS.has(token)));
  return {
    ...chunk,
    _keywordHints: mergedKeywordHints,
    _titleLower: title,
    _tokenSet: tokenSet,
    _tokenCounts: tokenCounts,
    _weightedTokenSet: weightedTokenSet,
    _tokens: [...tokenSet],
  };
}

function buildTokenCountMap(tokens) {
  const counts = new Map();
  for (const token of tokens || []) {
    if (!token || STOPWORDS.has(token) || token.length < 3) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function vectorNorm(tokenCountMap) {
  let sumSquares = 0;
  for (const value of tokenCountMap.values()) {
    sumSquares += value * value;
  }
  return Math.sqrt(sumSquares);
}

function cosineSimilarityWithChunk(queryTokenCounts, queryNorm, chunkTokenCounts) {
  if (!queryNorm || !queryTokenCounts.size || !chunkTokenCounts) return 0;

  let dot = 0;
  let projectedChunkNormSquares = 0;

  for (const [token, queryWeight] of queryTokenCounts) {
    const chunkWeight = chunkTokenCounts.get(token) || 0;
    if (!chunkWeight) continue;
    dot += queryWeight * chunkWeight;
    projectedChunkNormSquares += chunkWeight * chunkWeight;
  }

  if (!dot || !projectedChunkNormSquares) return 0;
  return dot / (queryNorm * Math.sqrt(projectedChunkNormSquares));
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
  const exactCoverage = exactMatches / (uniqueTokens.length || 1);

  if (weightedCoverage >= 0.6) score += 1.0;
  else if (weightedCoverage >= 0.4) score += 0.5;
  else if (weightedCoverage < 0.2) score -= 0.5;

  if (exactMatches === 0 && fuzzyMatches > 0) score -= 0.5;
  if (exactMatches + fuzzyMatches < 2 && uniqueTokens.length >= 4) score -= 0.4;

  return {
    score,
    weightedCoverage,
    exactCoverage,
    exactMatches,
    fuzzyMatches,
    titleMatches: titleExactMatches + titleFuzzyMatches,
    keywordHintMatches,
    classHintMatch,
  };
}

const KB_SEARCH_CHUNKS = KB_CHUNKS.map(buildChunkSearchData);

function isDebugEnabled(env) {
  const value = String(
    env?.DEBUG_RETRIEVAL || env?.DEBUG_DID_YOU_MEAN || env?.NODE_ENV || ''
  ).toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'development';
}

function buildDidYouMeanDebug(rawTokens, normalizedTokens, topChunks) {
  const tokenMap = [];
  const seen = new Set();

  for (let i = 0; i < normalizedTokens.length; i += 1) {
    const raw = rawTokens[i];
    const normalized = normalizedTokens[i];
    const key = `${raw}->${normalized}`;
    if (!raw || !normalized || seen.has(key)) continue;
    seen.add(key);
    if (raw !== normalized) {
      tokenMap.push({ original: raw, normalized });
    }
  }

  const fuzzyMatches = [];
  const exactSet = new Set();
  const candidateTokens = new Set();

  for (const chunk of topChunks || []) {
    for (const token of chunk?._tokens || []) {
      candidateTokens.add(token);
    }
  }

  for (const token of normalizedTokens) {
    exactSet.add(token);
  }

  const matchedSeen = new Set();
  for (const queryToken of exactSet) {
    if (candidateTokens.has(queryToken)) continue;
    let matchedToken = null;
    for (const candidate of candidateTokens) {
      if (isFuzzyTokenMatch(queryToken, candidate)) {
        matchedToken = candidate;
        break;
      }
    }
    if (matchedToken) {
      const key = `${queryToken}->${matchedToken}`;
      if (!matchedSeen.has(key)) {
        fuzzyMatches.push({ queryToken, matchedToken });
        matchedSeen.add(key);
      }
    }
  }

  return {
    originalTokens: [...new Set(rawTokens)],
    normalizedTokens: [...new Set(normalizedTokens)],
    normalizedFromMisspellingOrAlias: tokenMap,
    fuzzyMatches,
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
  const queryRawTokens = tokenizeRaw(queryTextLower);
  const normalizedQueryTokens = queryRawTokens.map(normalizeToken);
  const queryTokens = augmentQueryTokens(normalizedQueryTokens, queryTextLower);
  if (!queryTokens.length || !chunks.length) {
    return {
      selected: [],
      debug: {
        didYouMean: buildDidYouMeanDebug(queryRawTokens, normalizedQueryTokens, []),
        retrieval: {
          similarityThreshold: SIMILARITY_THRESHOLD,
          queryTokenCount: queryTokens.length,
          totalChunksEvaluated: chunks.length,
          passedSimilarityCount: 0,
          failedSimilarityCount: chunks.length,
          rankingMode: 'none',
          candidates: [],
        },
      },
    };
  }

  const queryTokenCounts = buildTokenCountMap(queryTokens);
  const queryNorm = vectorNorm(queryTokenCounts);
  if (!queryNorm) {
    return {
      selected: [],
      debug: {
        didYouMean: buildDidYouMeanDebug(queryRawTokens, normalizedQueryTokens, []),
        retrieval: {
          similarityThreshold: SIMILARITY_THRESHOLD,
          queryTokenCount: queryTokens.length,
          totalChunksEvaluated: chunks.length,
          passedSimilarityCount: 0,
          failedSimilarityCount: chunks.length,
          rankingMode: 'none',
          candidates: [],
        },
      },
    };
  }

  const thresholds = getThresholdsByQuerySize(queryTokens);
  const rankedAll = chunks
    .map((chunk) => ({
      chunk,
      similarity: cosineSimilarityWithChunk(queryTokenCounts, queryNorm, chunk._tokenCounts),
      ...scoreChunk(queryTokens, queryTextLower, chunk),
    }));
  const rankedAllSorted = [...rankedAll].sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    if (b.score !== a.score) return b.score - a.score;
    if (b.weightedCoverage !== a.weightedCoverage) return b.weightedCoverage - a.weightedCoverage;
    if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
    return b.titleMatches - a.titleMatches;
  });
  const rankedBySimilarity = rankedAll
    .filter((entry) => entry.similarity > SIMILARITY_THRESHOLD)
    .sort((a, b) => {
      if (b.similarity !== a.similarity) return b.similarity - a.similarity;
      if (b.score !== a.score) return b.score - a.score;
      if (b.weightedCoverage !== a.weightedCoverage) return b.weightedCoverage - a.weightedCoverage;
      if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
      return b.titleMatches - a.titleMatches;
    });
  const rankedPrimary = rankedBySimilarity.filter((entry) => passesPrimaryThreshold(entry, thresholds));
  const ranked = rankedPrimary.length
    ? rankedPrimary
    : rankedBySimilarity.filter((entry) => passesFallbackThreshold(entry, thresholds));
  const rankingMode = rankedPrimary.length ? 'primary' : 'fallback';

  const selected = [];
  const selectedEntries = [];
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
    selectedEntries.push(entry);
    sectionCounts.set(sectionKey, sectionCount + 1);
    usedChars += text.length;
  }

  const selectedIds = new Set(selectedEntries.map((entry) => entry.chunk.chunk_id));
  const candidates = rankedAllSorted.slice(0, 25).map((entry) => ({
    chunkId: entry.chunk.chunk_id,
    sectionTitle: entry.chunk.section_title,
    retrievalClass: entry.chunk.retrieval_class,
    similarity: Number(entry.similarity.toFixed(4)),
    score: Number(entry.score.toFixed(3)),
    passedSimilarity: entry.similarity > SIMILARITY_THRESHOLD,
    passedPrimary: passesPrimaryThreshold(entry, thresholds),
    passedFallback: passesFallbackThreshold(entry, thresholds),
    selected: selectedIds.has(entry.chunk.chunk_id),
  }));

  return {
    selected,
    debug: {
      didYouMean: buildDidYouMeanDebug(queryRawTokens, normalizedQueryTokens, selected),
      retrieval: {
        similarityThreshold: SIMILARITY_THRESHOLD,
        queryTokenCount: queryTokens.length,
        totalChunksEvaluated: rankedAll.length,
        passedSimilarityCount: rankedBySimilarity.length,
        failedSimilarityCount: rankedAll.length - rankedBySimilarity.length,
        rankingMode,
        selectedChunkIds: [...selectedIds],
        candidates,
      },
    },
  };
}

function buildRetrievedContext(topChunks) {
  if (!topChunks.length) return '';
  const blocks = topChunks.map((chunk, index) => (
    `Snippet ${index + 1} [${chunk.chunk_id}] (${chunk.section_title}):\n${chunk.text}`
  ));
  return `RETRIEVED KNOWLEDGE BASE SNIPPETS (highest relevance first):\n\n${blocks.join('\n\n---\n\n')}`;
}

function buildKbOnlyFallback(latestUserMessage) {
  const prompt = String(latestUserMessage || '').trim();
  const intro = prompt
    ? `I could not find a reliable answer in the current knowledge base for: "${prompt}".`
    : 'I could not find a reliable answer in the current knowledge base for that question.';
  return `${intro} Please contact Casa de la Familia at (877) 611-2272 for direct support.`;
}

export async function onRequestPost(context) {
  try {
    const { system, messages } = await context.request.json();

    const apiKey = context.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert messages to Gemini format
    const geminiContents = [];
    
    const normalizedSystem = typeof system === 'string' ? system.trim() : '';
    const latestUserMessage = getLatestUserMessage(messages);
    const retrievalResult = retrieveTopChunks(latestUserMessage, KB_SEARCH_CHUNKS);
    const topChunks = retrievalResult.selected;
    const retrievedContext = buildRetrievedContext(topChunks);

    if (!topChunks.length) {
      const kbOnlyFallback = {
        content: [{
          type: 'text',
          text: buildKbOnlyFallback(latestUserMessage)
        }]
      };
      if (isDebugEnabled(context.env)) {
        kbOnlyFallback.debug = retrievalResult.debug;
      }
      return new Response(JSON.stringify(kbOnlyFallback), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const combinedInstruction = [
      normalizedSystem,
      retrievedContext,
      'Answer using only the retrieved knowledge base snippets above.',
      'Do not rely on general background knowledge or reusable Casa de la Familia marketing blurbs.',
      'If the snippets are insufficient for any part of the question, say you do not have enough information in the knowledge base and suggest contacting Casa de la Familia at (877) 611-2272.'
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.2,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        error: errorData.error?.message || 'Failed to get response from AI' 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
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

    if (isDebugEnabled(context.env)) {
      geminiResponse.debug = retrievalResult.debug;
    }
    
    return new Response(JSON.stringify(geminiResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
