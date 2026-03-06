import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SOURCE_PATH = resolve(process.cwd(), 'kb.md');
const OUTPUT_JSON_PATH = resolve(process.cwd(), 'kb.chunks.json');
const OUTPUT_JSONL_PATH = resolve(process.cwd(), 'kb.chunks.jsonl');
const OUTPUT_JS_MODULE_PATH = resolve(process.cwd(), 'functions/api/kb-chunks.js');

const TARGET_CHARS = 900;
const MAX_CHARS = 1200;
const OVERLAP_CHARS = 150;

function isMostlyUppercase(value) {
  const letters = value.replace(/[^A-Za-z]/g, '');
  if (!letters) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.75;
}

function isLikelyHeading(line) {
  const text = line.trim();
  if (!text) return false;
  if (text.length > 90) return false;
  if (/[.!?]$/.test(text)) return false;
  if (/^\d+\./.test(text)) return false;
  if (/^\(?\d+\)/.test(text)) return false;
  if (/^[•\-*]/.test(text)) return false;

  if (isMostlyUppercase(text)) return true;
  if (/^[A-Z][A-Za-z/&(),'\- ]{2,80}$/.test(text) && text.split(/\s+/).length <= 10) {
    return true;
  }
  return false;
}

function normalizeWhitespace(text) {
  return text
    .replace(/\u2013/g, '-')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSections(lines) {
  const sections = [];
  let current = {
    title: 'General',
    startLine: 1,
    lines: [],
  };

  const pushCurrent = (endLine) => {
    const rawText = normalizeWhitespace(current.lines.join('\n'));
    if (rawText) {
      sections.push({
        title: current.title,
        startLine: current.startLine,
        endLine,
        text: rawText,
      });
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;

    const inlineHeadingMatch = trimmed.match(/^([A-Z][A-Z0-9/&(),'\- ]{3,80}):\s+(.+)$/);
    if (inlineHeadingMatch) {
      pushCurrent(lineNumber - 1);
      current = {
        title: inlineHeadingMatch[1].trim(),
        startLine: lineNumber,
        lines: [inlineHeadingMatch[2].trim()],
      };
      continue;
    }

    if (isLikelyHeading(trimmed)) {
      pushCurrent(lineNumber - 1);
      current = {
        title: trimmed,
        startLine: lineNumber,
        lines: [],
      };
      continue;
    }

    current.lines.push(line);
  }

  pushCurrent(lines.length);
  return sections;
}

function splitIntoUnits(text) {
  const rows = text.split('\n');
  const units = [];
  let buffer = [];

  const flushBuffer = () => {
    const paragraph = normalizeWhitespace(buffer.join(' '));
    if (paragraph) units.push(paragraph);
    buffer = [];
  };

  for (const row of rows) {
    const line = row.trim();
    if (!line) {
      flushBuffer();
      continue;
    }

    if (/^([•\-*]|\d+\.)\s+/.test(line)) {
      flushBuffer();
      units.push(line);
      continue;
    }

    buffer.push(line);
  }
  flushBuffer();
  return units;
}

function splitLongUnit(unit, maxChars) {
  if (unit.length <= maxChars) return [unit];
  const sentences = unit.split(/(?<=[.!?])\s+/);
  if (sentences.length === 1) {
    const parts = [];
    for (let i = 0; i < unit.length; i += maxChars) {
      parts.push(unit.slice(i, i + maxChars));
    }
    return parts;
  }

  const parts = [];
  let current = '';
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxChars && current) {
      parts.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function buildChunksFromUnits(units, options) {
  const { targetChars, maxChars, overlapChars } = options;
  const chunks = [];
  let current = '';

  const pushChunk = () => {
    const cleaned = normalizeWhitespace(current);
    if (!cleaned) return;
    chunks.push(cleaned);
    current = '';
  };

  for (const rawUnit of units) {
    const oversizedParts = splitLongUnit(rawUnit, maxChars);

    for (const unit of oversizedParts) {
      const separator = current ? '\n\n' : '';
      const candidate = `${current}${separator}${unit}`;

      if (candidate.length <= targetChars) {
        current = candidate;
      } else if (candidate.length <= maxChars) {
        current = candidate;
        pushChunk();
      } else {
        pushChunk();
        current = unit;
      }
    }
  }
  pushChunk();

  if (chunks.length <= 1 || overlapChars <= 0) return chunks;

  const withOverlap = [];
  for (let i = 0; i < chunks.length; i += 1) {
    if (i === 0) {
      withOverlap.push(chunks[i]);
      continue;
    }
    const prevTail = chunks[i - 1].slice(-overlapChars);
    withOverlap.push(`${prevTail}\n\n${chunks[i]}`);
  }
  return withOverlap;
}

function classifyChunk(text) {
  const lower = text.toLowerCase();
  if (/\b(911|emergency|crisis|danger|suicide)\b/.test(lower)) return 'critical-safety';
  if (/\b(confidentiality|hipaa|privacy|disclosure|records)\b/.test(lower)) return 'privacy-legal';
  if (/\b(payment|insurance|reimbursement|fee|charges)\b/.test(lower)) return 'financial';
  if (/\b(right|responsibility|consent|complaint)\b/.test(lower)) return 'rights-policy';
  return 'general';
}

function extractKeywords(text) {
  const dictionary = [
    'therapy',
    'telehealth',
    'emergency',
    'confidentiality',
    'privacy',
    'disclosure',
    'insurance',
    'payment',
    'rights',
    'responsibility',
    'consent',
    'records',
    'complaints',
    'domestic violence',
    'immigration',
    'minor',
    'arbitration',
    'crisis',
    'hipaa',
  ];

  const lower = text.toLowerCase();
  return dictionary.filter((term) => lower.includes(term)).slice(0, 8);
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

async function main() {
  const raw = await readFile(SOURCE_PATH, 'utf8');
  const lines = raw.split(/\r?\n/);
  const sections = extractSections(lines);

  const chunks = [];
  for (const section of sections) {
    const units = splitIntoUnits(section.text);
    const sectionChunks = buildChunksFromUnits(units, {
      targetChars: TARGET_CHARS,
      maxChars: MAX_CHARS,
      overlapChars: OVERLAP_CHARS,
    });

    sectionChunks.forEach((text, index) => {
      const chunkId = `kb-${String(chunks.length + 1).padStart(4, '0')}`;
      chunks.push({
        chunk_id: chunkId,
        source: 'kb.md',
        section_title: section.title,
        section_start_line: section.startLine,
        section_end_line: section.endLine,
        section_chunk_index: index,
        retrieval_class: classifyChunk(text),
        keyword_hints: extractKeywords(text),
        token_estimate: estimateTokens(text),
        text,
      });
    });
  }

  const strategy = {
    source: 'kb.md',
    created_at: new Date().toISOString(),
    strategy: {
      splitter: 'section-aware paragraph chunking',
      target_chars: TARGET_CHARS,
      max_chars: MAX_CHARS,
      overlap_chars: OVERLAP_CHARS,
      overlap_scope: 'within same section only',
      notes: [
        'Split first by detected heading/inline-heading.',
        'Keep bullet/numbered lines atomic when possible.',
        'Split oversized paragraphs by sentence boundaries.',
        'Add retrieval-class metadata for ranking and filtering.',
      ],
    },
    stats: {
      section_count: sections.length,
      chunk_count: chunks.length,
      avg_chunk_chars: Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / Math.max(chunks.length, 1)),
      avg_chunk_tokens_est: Math.round(chunks.reduce((sum, c) => sum + c.token_estimate, 0) / Math.max(chunks.length, 1)),
    },
    chunks,
  };

  await writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(strategy, null, 2)}\n`, 'utf8');
  await writeFile(
    OUTPUT_JSONL_PATH,
    `${chunks.map((chunk) => JSON.stringify(chunk)).join('\n')}\n`,
    'utf8',
  );
  await writeFile(
    OUTPUT_JS_MODULE_PATH,
    `// Auto-generated by server/chunk-kb.mjs\nexport default ${JSON.stringify(chunks, null, 2)};\n`,
    'utf8',
  );

  console.log(`Chunked ${SOURCE_PATH}`);
  console.log(`Sections: ${strategy.stats.section_count}`);
  console.log(`Chunks: ${strategy.stats.chunk_count}`);
  console.log(`Wrote: ${OUTPUT_JSON_PATH}`);
  console.log(`Wrote: ${OUTPUT_JSONL_PATH}`);
  console.log(`Wrote: ${OUTPUT_JS_MODULE_PATH}`);
}

main().catch((error) => {
  console.error('Failed to chunk kb.md:', error);
  process.exit(1);
});
