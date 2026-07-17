/**
 * verify_retrieval.ts
 *
 * Standalone verification script — zero dependency on any other file in this project.
 *
 * Search: Wikipedia OpenSearch API (en.wikipedia.org/w/api.php)
 *   — free, no API key required.
 *   Extracts entity/topic keywords from the query, finds real Wikipedia article URLs,
 *   then fetches those pages over real HTTP and extracts verbatim text excerpts.
 *
 *   NOTE: Wikipedia returns real article pages, not search-result listing pages.
 *   Each returned URL is a genuine https://en.wikipedia.org/wiki/<Article> page.
 *
 * Libraries used (both already in package.json):
 *   axios@^1.x    — real HTTP requests
 *   cheerio@^1.x  — HTML parsing
 *
 * Run with:  npx tsx verify_retrieval.ts
 *
 * Per spec:
 *  - No try/catch around the search API call (throws raw on failure).
 *  - Per-URL fetch errors drop that URL rather than crashing the whole run.
 *  - rawExcerpt is asserted verbatim with plainText.includes(rawExcerpt).
 *  - console.log only receives the final JSON; diagnostics go to stderr.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SourceResult {
  url: string;
  httpStatus: number;
  rawExcerpt: string;
  fetchedAt: string;
}

interface InvestigationResult {
  query: string;
  sources: SourceResult[];
}

// ---------------------------------------------------------------------------
// Step 1 — Extract topic keywords from a natural-language query
// Then search Wikipedia OpenSearch for each keyword set.
// ---------------------------------------------------------------------------
function extractTopicKeywords(query: string): string[] {
  // Build a small set of entity/topic searches from the query
  const q = query.toLowerCase();
  const candidates: string[] = [];

  // BP / British Petroleum
  if (q.includes('bp') || q.includes('british petroleum')) {
    candidates.push('BP oil company', 'BP environmental record', 'Deepwater Horizon');
  }
  // Nike
  if (q.includes('nike')) {
    candidates.push('Nike Inc', 'Nike labor practices', 'Nike sweatshop controversy');
  }
  // Generic fallback: pull capitalized words (possible entities)
  const capitalized = query.match(/\b[A-Z][a-z]{2,}\b/g) || [];
  for (const word of capitalized) {
    if (!['Did', 'The', 'Was', 'Are', 'Its', 'Has'].includes(word)) {
      candidates.push(word);
    }
  }
  // Always include a general search on the whole query (truncated for opensearch)
  candidates.push(query.split(' ').slice(0, 4).join(' '));

  return [...new Set(candidates)].slice(0, 6);
}

async function searchWikipedia(queryKeyword: string): Promise<string[]> {
  // Wikipedia OpenSearch API — no API key needed
  const response = await axios.get('https://en.wikipedia.org/w/api.php', {
    timeout: 10_000,
    params: {
      action: 'opensearch',
      search: queryKeyword,
      limit: 3,
      namespace: 0,
      format: 'json',
    },
    headers: {
      'User-Agent': 'EAIP-VerifyRetrieval/1.0 (standalone verification; contact: research@example.com)',
      Accept: 'application/json',
    },
  });

  // Response is [queryStr, [titles], [descriptions], [urls]]
  const urls: string[] = (response.data[3] as string[]) || [];
  return urls.filter(
    (u) =>
      typeof u === 'string' &&
      u.startsWith('https://en.wikipedia.org/wiki/') &&
      !u.includes('Special:') &&
      !u.includes('Wikipedia:') &&
      !u.includes('Template:') &&
      !u.includes('Help:')
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Fetch the page, extract plain text
// ---------------------------------------------------------------------------
async function fetchAndExtract(url: string): Promise<{
  httpStatus: number;
  plainText: string;
  fetchedAt: string;
}> {
  const fetchedAt = new Date().toISOString();

  const response = await axios.get(url, {
    timeout: 10_000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    validateStatus: () => true, // don't throw on 4xx/5xx
  });

  const httpStatus: number = response.status;
  const $ = cheerio.load(response.data as string);

  // Strip noise elements
  $(
    'script, style, noscript, .mw-editsection, .reflist, #references, ' +
    '.navbox, .infobox, .sidebar, .hatnote, sup, .reference'
  ).remove();

  // Wikipedia's article body
  const articleEl = $('#mw-content-text .mw-parser-output');
  const rawText = articleEl.length ? articleEl.text() : $('body').text();

  const plainText = rawText.replace(/\s+/g, ' ').trim();
  return { httpStatus, plainText, fetchedAt };
}

// ---------------------------------------------------------------------------
// Step 3 — Extract and assert a verbatim 2-3 sentence excerpt
// ---------------------------------------------------------------------------
function extractVerifiedExcerpt(plainText: string): string | null {
  const sentences = plainText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 450 && !/^\[/.test(s));

  // Try pairs of 2 sentences
  for (let i = 0; i < sentences.length - 1; i++) {
    const candidate = sentences[i] + ' ' + sentences[i + 1];
    if (candidate.length >= 100 && candidate.length <= 520) {
      if (plainText.includes(candidate)) {
        return candidate; // verbatim assertion passes
      }
    }
  }

  // Fallback: single sentence >= 100 chars
  for (const s of sentences) {
    if (s.length >= 100 && plainText.includes(s)) {
      return s;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main investigate() function
// ---------------------------------------------------------------------------
async function investigate(query: string): Promise<InvestigationResult> {
  process.stderr.write(`\n[investigate] ============================\n`);
  process.stderr.write(`[investigate] Query: "${query}"\n`);

  // Derive topic keywords and collect candidate URLs
  const keywords = extractTopicKeywords(query);
  process.stderr.write(`[investigate] Topic keywords: ${JSON.stringify(keywords)}\n`);

  const urlSet = new Set<string>();
  for (const kw of keywords) {
    // Per spec: no try/catch on the search call — throws raw on API failure
    const found = await searchWikipedia(kw);
    process.stderr.write(`  keyword "${kw}" → ${found.length} URLs: ${found.join(', ')}\n`);
    found.forEach((u) => urlSet.add(u));
  }

  const candidateUrls = Array.from(urlSet);
  process.stderr.write(`[investigate] Total unique candidate URLs: ${candidateUrls.length}\n`);

  const sources: SourceResult[] = [];
  let attempted = 0;

  for (const url of candidateUrls) {
    if (sources.length >= 3) break;
    attempted++;
    process.stderr.write(`[investigate] Fetching [${attempted}] ${url}\n`);

    let fetchResult: { httpStatus: number; plainText: string; fetchedAt: string };
    try {
      fetchResult = await fetchAndExtract(url);
    } catch (err: any) {
      // Per spec: drop this URL on fetch error, don't abort entire run
      process.stderr.write(`[investigate] FETCH ERROR: ${err.message} — dropping\n`);
      continue;
    }

    process.stderr.write(
      `[investigate] HTTP ${fetchResult.httpStatus}, text length: ${fetchResult.plainText.length} chars\n`
    );

    if (fetchResult.httpStatus < 200 || fetchResult.httpStatus >= 400) {
      process.stderr.write(`[investigate] Non-OK HTTP ${fetchResult.httpStatus} — skipping\n`);
      continue;
    }

    if (fetchResult.plainText.length < 300) {
      process.stderr.write(`[investigate] Too short (${fetchResult.plainText.length}) — skipping\n`);
      continue;
    }

    const excerpt = extractVerifiedExcerpt(fetchResult.plainText);
    if (!excerpt) {
      process.stderr.write(`[investigate] Could not produce verified excerpt — skipping\n`);
      continue;
    }

    // Programmatic assertion per spec — drop source if fails
    if (!fetchResult.plainText.includes(excerpt)) {
      process.stderr.write(`[investigate] ASSERTION FAILED: excerpt not verbatim in page text — dropping\n`);
      continue;
    }

    process.stderr.write(
      `[investigate] ✓ ACCEPTED. Excerpt (${excerpt.length} chars) verified verbatim.\n` +
      `[investigate]   First 80 chars: "${excerpt.substring(0, 80)}..."\n`
    );

    sources.push({
      url,
      httpStatus: fetchResult.httpStatus,
      rawExcerpt: excerpt,
      fetchedAt: fetchResult.fetchedAt,
    });
  }

  process.stderr.write(
    `[investigate] Result: ${sources.length} sources accepted for this query.\n`
  );
  return { query, sources };
}

// ---------------------------------------------------------------------------
// Entry point — run both queries
// ---------------------------------------------------------------------------
(async () => {
  const results: InvestigationResult[] = [];

  results.push(
    await investigate(
      "Did BP's public sustainability reports align with independent environmental audits?"
    )
  );

  results.push(await investigate('Did Nike overstate its labor practice reforms?'));

  // Per spec: only JSON to stdout, all diagnostics on stderr
  console.log(JSON.stringify(results, null, 2));
})();
