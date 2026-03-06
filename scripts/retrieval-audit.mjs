import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import kbChunks from '../functions/api/kb-chunks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'kb-questions.retrieval.txt');
const REPORT_PATH = path.join(ROOT, 'kb-questions.retrieval.audit.txt');
const MAX_CONTEXT_CHARS = 4500;
const TOP_K = 6;
const MAX_CHUNKS_PER_SECTION = 2;

const TOKEN_NORMALIZATION = {
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
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
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

function retrieveTopChunksWithScores(query, chunks, topK = TOP_K, maxContextChars = MAX_CONTEXT_CHARS) {
  const queryTextLower = String(query || '').toLowerCase();
  const queryRawTokens = tokenizeRaw(queryTextLower);
  const normalizedQueryTokens = queryRawTokens.map(normalizeToken);
  const queryTokens = augmentQueryTokens(normalizedQueryTokens, queryTextLower);
  if (!queryTokens.length || !chunks.length) return [];

  const thresholds = getThresholdsByQuerySize(queryTokens);
  const rankedAll = chunks
    .map((chunk) => ({
      chunk,
      ...scoreChunk(queryTokens, queryTextLower, chunk),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.weightedCoverage !== a.weightedCoverage) return b.weightedCoverage - a.weightedCoverage;
      if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
      return b.titleMatches - a.titleMatches;
    });

  const rankedPrimary = rankedAll.filter((entry) => passesPrimaryThreshold(entry, thresholds));
  const ranked = rankedPrimary.length
    ? rankedPrimary
    : rankedAll.filter((entry) => passesFallbackThreshold(entry, thresholds));

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

    selected.push(entry);
    sectionCounts.set(sectionKey, sectionCount + 1);
    usedChars += text.length;
  }

  return selected;
}

async function main() {
  const questionsRaw = await readFile(QUESTIONS_PATH, 'utf8');
  const questions = questionsRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const chunks = Array.isArray(kbChunks) ? kbChunks.map(buildChunkSearchData) : [];

  const rows = [];
  const noResult = [];
  const weakTop = [];

  for (const question of questions) {
    const selected = retrieveTopChunksWithScores(question, chunks);
    const topIds = selected.map((entry) => entry.chunk.chunk_id);
    const topScore = selected[0]?.score ?? 0;

    if (!topIds.length) {
      noResult.push(question);
    } else if (topScore < 3.0) {
      weakTop.push({ question, topScore, ids: topIds.slice(0, 3) });
    }

    rows.push({
      question,
      topIds: topIds.slice(0, 6),
      topScore: Number(topScore.toFixed(2)),
    });
  }

  const lines = [];
  lines.push(`# Retrieval audit (${new Date().toISOString()})`);
  lines.push(`questions: ${rows.length}`);
  lines.push(`no_result: ${noResult.length}`);
  lines.push(`weak_top_score_lt_3: ${weakTop.length}`);
  lines.push('');
  lines.push('## question -> top chunk IDs');
  for (const row of rows) {
    lines.push(`- ${row.question} -> ${row.topIds.length ? row.topIds.join(', ') : '(none)'} [topScore=${row.topScore}]`);
  }
  lines.push('');
  lines.push('## edge cases');
  lines.push('### no result');
  if (!noResult.length) {
    lines.push('- (none)');
  } else {
    for (const q of noResult) lines.push(`- ${q}`);
  }
  lines.push('');
  lines.push('### weak top score (< 3.0)');
  if (!weakTop.length) {
    lines.push('- (none)');
  } else {
    for (const item of weakTop) {
      lines.push(`- ${item.question} -> ${item.ids.join(', ')} [topScore=${item.topScore.toFixed(2)}]`);
    }
  }

  await writeFile(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote report: ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
