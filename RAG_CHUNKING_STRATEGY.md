# RAG Chunking Strategy for `kb.md`

## Goal
- Keep legally sensitive policy text accurate and retrievable.
- Preserve section meaning (privacy, consent, payments, emergency, minors, telehealth).
- Avoid chunks that are too large for embedding quality.

## Strategy
- **Primary split:** section-aware splitting using heading detection.
- **Secondary split:** paragraph and list-aware segmentation within each section.
- **Fallback split:** sentence-boundary splitting for oversized paragraphs.
- **Chunk size target:** ~900 chars (soft), max 1200 chars.
- **Overlap:** 150 chars, only between adjacent chunks in the same section.

## Why this works for `kb.md`
- `kb.md` contains long policy paragraphs and pseudo-headings (not strict Markdown headers).
- Section-first splitting improves retrieval precision for legal-style questions like:
  - confidentiality limits
  - emergency procedures
  - insurance/payment responsibilities
  - rights of minors/parents
- Limited overlap protects context continuity without causing heavy duplicate retrieval.

## Metadata included per chunk
- `chunk_id`
- `source`
- `section_title`
- `section_start_line`
- `section_end_line`
- `section_chunk_index`
- `retrieval_class` (`critical-safety`, `privacy-legal`, `financial`, `rights-policy`, `general`)
- `keyword_hints`
- `token_estimate`
- `text`

## Ranking recommendations
- Hybrid retrieval (vector + BM25/keyword) with weighted re-ranking:
  - `critical-safety`: +0.25 boost for crisis/emergency queries
  - `privacy-legal`: +0.20 boost for confidentiality/disclosure/records queries
  - `financial`: +0.15 boost for insurance/payment queries
- If a query includes crisis terms (`emergency`, `911`, `danger`, `suicide`), always force-include top `critical-safety` chunk.

## Operational guidance
- Rebuild chunks any time `kb.md` changes.
- Keep chunking deterministic so embedding updates are stable.
- Store both:
  - `kb.chunks.json` (full strategy + chunks)
  - `kb.chunks.jsonl` (one chunk per line for ingestion pipelines)
  - `functions/api/kb-chunks.js` (auto-generated ESM module used by Cloudflare function retrieval)

## Command
- Run:

```bash
node server/chunk-kb.mjs
```
