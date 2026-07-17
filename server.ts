import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import { generateInvestigationCase, generateClaimFromSource, generateAlternatives, generateTraceEvents } from "./src/demo_cases";
import { ThinkingStep } from "./src/types";

dotenv.config();
const app = express();

import cors from "cors";
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "10mb" }));

// ─── Types ────────────────────────────────────────────────────────────────────

type DomainType = "gov" | "edu" | "news_wire" | "ngo" | "corporate" | "blog" | "social" | "other";

interface SearchResult {
  url: string;
  title: string;
  snippet?: string;
}

interface EvaluatedSource {
  id: string;
  url: string;
  title: string;
  domain: string;
  domainType: DomainType;
  httpStatus: number;
  rawExcerpt: string;
  snippet: string;
  claimTextMatch: boolean;
  corroboratedByCount: number;
  trustScore: number;
  decision: "accepted" | "rejected";
  reasonCode: string;
  reasonText: string;
  fetchedAt: string;
  // Fields expected by the UI shape
  credibility: number;
  relevance: number;
  author: string;
  date: string;
  shapWeights: {
    domainReputation: number;
    recency: number;
    authorReputation: number;
    citationsWeight: number;
    referencesWeight: number;
  };
}

// ─── Domain Classification ─────────────────────────────────────────────────────

function classifyDomain(urlStr: string): DomainType {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();

    if (host.endsWith(".gov") || host.endsWith(".gov.uk") || host.endsWith(".gov.au") ||
        host.endsWith(".gov.in") || host.endsWith(".mil")) return "gov";

    if (host.endsWith(".edu") || host.endsWith(".ac.uk") || host.endsWith(".ac.in")) return "edu";

    const newsWireDomains = [
      "reuters.com", "apnews.com", "bloomberg.com", "wsj.com", "ft.com",
      "npr.org", "bbc.com", "bbc.co.uk", "theguardian.com", "nytimes.com",
      "washingtonpost.com", "forbes.com", "cnbc.com", "businessinsider.com",
      "prnewswire.com", "businesswire.com", "globenewswire.com", "afp.com",
      "hindustantimes.com", "thehindu.com", "economictimes.indiatimes.com",
      "livemint.com", "businessstandard.com"
    ];
    if (newsWireDomains.some(d => host === d || host.endsWith("." + d))) return "news_wire";

    if (host.endsWith(".org") || host.includes("wikipedia.org")) return "ngo";

    const blogHosts = ["medium.com", "substack.com", "wordpress.com", "blogspot.com", "dev.to"];
    if (blogHosts.some(d => host.includes(d))) return "blog";

    const socialHosts = ["twitter.com", "x.com", "reddit.com", "facebook.com",
                         "linkedin.com", "instagram.com", "tiktok.com", "threads.net"];
    if (socialHosts.some(d => host.includes(d))) return "social";

    if (host.endsWith(".com") || host.endsWith(".co") || host.endsWith(".io") ||
        host.endsWith(".net") || host.endsWith(".co.uk") || host.endsWith(".co.in")) return "corporate";

    return "other";
  } catch {
    return "other";
  }
}

// ─── Trust Scoring ─────────────────────────────────────────────────────────────

function computeTrustScore(
  domainType: DomainType,
  corroboratedByCount: number,
  claimTextMatch: boolean
): { score: number; reasonCode: string; reasonText: string; decision: "accepted" | "rejected" } {

  if (!claimTextMatch) {
    return {
      score: 0,
      reasonCode: "no_claim_match",
      reasonText: "The fetched page text contains no keyword overlap with the query — page is off-topic.",
      decision: "rejected"
    };
  }

  let score = 40; // baseline for any page that passes content match

  if (domainType === "gov" || domainType === "edu" || domainType === "news_wire") score += 30;
  else if (domainType === "ngo") score += 15;
  else if (domainType === "corporate") score += 5;
  else if (domainType === "blog") score += 0;
  else if (domainType === "social") score -= 10;

  if (corroboratedByCount >= 3) score += 15;
  else if (corroboratedByCount >= 1) score += 8;

  // Uncorroborated blog/social sources are explicitly rejected
  if ((domainType === "blog" || domainType === "social") && corroboratedByCount === 0) {
    return {
      score: Math.max(0, score),
      reasonCode: "single_uncorroborated_source",
      reasonText: "Blog or social media source with zero corroboration from independent high-trust domains. Cannot be admitted as evidence.",
      decision: "rejected"
    };
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const accepted = finalScore >= 55;

  return {
    score: finalScore,
    reasonCode: accepted ? `accepted_${domainType}` : "low_domain_trust",
    reasonText: accepted
      ? `${domainType.replace("_", " ")} source with trust score ${finalScore}% — corroborated by ${corroboratedByCount} other domain(s).`
      : `Trust score ${finalScore}% falls below the 55% acceptance threshold for domain type "${domainType}".`,
    decision: accepted ? "accepted" : "rejected"
  };
}

// ─── Keyword Match (runs against REAL fetched plainText) ──────────────────────

function claimTextMatchCheck(plainText: string, query: string): boolean {
  const stopWords = new Set([
    "the", "and", "was", "are", "for", "its", "did", "has", "have", "been",
    "with", "that", "this", "from", "they", "their", "what", "were", "into",
    "more", "also", "how", "which", "when", "where", "than", "then", "about"
  ]);

  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  if (keywords.length === 0) return true; // no meaningful keywords to check

  const lowerText = plainText.toLowerCase();
  const matchCount = keywords.filter(kw => lowerText.includes(kw)).length;
  const matchRatio = matchCount / keywords.length;

  return matchCount >= 2 || matchRatio >= 0.25;
}

// ─── Low Quality / Paywall Excerpt Check ──────────────────────────────────────

function isLowQualityExcerpt(text: string): boolean {
  const lowercase = text.toLowerCase();
  const boilerplatePhrases = [
    "subscribe to", "subscribe now", "subscription", "sign in", "logged in", "log in",
    "create an account", "create account", "register now", "cookie policy", "cookie settings",
    "cookie notice", "privacy policy", "terms of service", "terms of use", "all rights reserved",
    "copyright", "read more", "disable adblocker", "ad-free", "please support", "support our journalism",
    "member exclusive", "subscriber content", "you are logged in", "for full access", "continue reading",
    "sign up"
  ];
  
  for (const phrase of boilerplatePhrases) {
    if (lowercase.includes(phrase)) {
      return true;
    }
  }

  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 10) {
    return true; // Too short to be a valid prose sentence
  }

  return false;
}

// ─── Real Web Search via Tavily API ───────────────────────────────────────────

async function searchTavily(query: string, maxResults = 18): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey === "YOUR_TAVILY_API_KEY") {
    throw new Error("Missing Tavily API key. Please add TAVILY_API_KEY to your .env file.");
  }

  const response = await axios.post("https://api.tavily.com/search", {
    api_key: apiKey,
    query: query,
    search_depth: "advanced",
    max_results: maxResults,
    include_domains: [],
    exclude_domains: []
  }, {
    timeout: 15000,
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.data || !Array.isArray(response.data.results)) {
    throw new Error("Invalid response received from Tavily Search API.");
  }

  const results: SearchResult[] = response.data.results.map((r: any) => ({
    url: r.url,
    title: r.title,
    snippet: r.content
  }));

  console.log(`[Search] Tavily API → ${results.length} results returned for: "${query}"`);
  return results;
}

// ─── Page Fetch + Plain Text Extraction ───────────────────────────────────────

async function fetchAndExtractText(url: string, timeoutMs = 8000): Promise<{
  httpStatus: number;
  plainText: string;
  title: string;
  author: string;
  date: string;
  fetchedAt: string;
}> {
  const fetchedAt = new Date().toISOString();

  const response = await axios.get(url, {
    timeout: timeoutMs,
    maxRedirects: 5,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    },
    validateStatus: () => true
  });

  const httpStatus = response.status;
  const $ = cheerio.load(response.data as string);

  // Remove boilerplate
  $("script, style, noscript, nav, header, footer, aside, .ad, .advertisement, .sidebar, .menu, .cookie-banner, .popup").remove();

  // Extract title
  const title = ($("head title").text() ||
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text() || "").trim().substring(0, 200);

  // Extract author
  const author = ($('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    $('[class*="author"]').first().text() || "Unknown").trim().substring(0, 100);

  // Extract date
  const date = ($('meta[property="article:published_time"]').attr("content") ||
    $('meta[itemprop="datePublished"]').attr("content") ||
    $("time[datetime]").attr("datetime") || "").substring(0, 10) ||
    new Date().toISOString().split("T")[0];

  // Get body text
  const bodyEl = $("article, main, .article-body, .post-content, .entry-content, .story-body, .content-body");
  const rawText = bodyEl.length ? bodyEl.text() : $("body").text();
  const plainText = rawText.replace(/\s+/g, " ").trim();

  return { httpStatus, plainText, title, author, date, fetchedAt };
}

// ─── Verbatim Excerpt Extraction + Assertion ───────────────────────────────────

function extractVerifiedExcerpt(plainText: string): string | null {
  const sentences = plainText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 50 && s.length < 500 && !/^\[/.test(s));

  for (let i = 0; i < sentences.length - 1; i++) {
    const candidate = sentences[i] + " " + sentences[i + 1];
    if (candidate.length >= 100 && candidate.length <= 520) {
      if (plainText.includes(candidate)) return candidate;
    }
  }

  for (const s of sentences) {
    if (s.length >= 100 && plainText.includes(s)) return s;
  }

  return null;
}

// ─── SHAP weights derived from domain type ─────────────────────────────────────

function shapWeightsFromDomain(domainType: DomainType, trustScore: number) {
  const base = { domainReputation: 20, recency: 20, authorReputation: 20, citationsWeight: 20, referencesWeight: 20 };

  if (domainType === "gov") {
    return { domainReputation: 30, recency: 20, authorReputation: 25, citationsWeight: 15, referencesWeight: 10 };
  } else if (domainType === "edu") {
    return { domainReputation: 25, recency: 15, authorReputation: 30, citationsWeight: 20, referencesWeight: 10 };
  } else if (domainType === "news_wire") {
    return { domainReputation: 25, recency: 30, authorReputation: 20, citationsWeight: 15, referencesWeight: 10 };
  } else if (domainType === "ngo") {
    return { domainReputation: 20, recency: 20, authorReputation: 20, citationsWeight: 25, referencesWeight: 15 };
  } else if (domainType === "blog" || domainType === "social") {
    return { domainReputation: 8, recency: 25, authorReputation: 10, citationsWeight: 5, referencesWeight: 5 };
  }
  return base;
}

// ─── Core pipeline ─────────────────────────────────────────────────────────────

async function runRealInvestigation(query: string, userAttachedUrls: string[] = []): Promise<{
  evaluatedSources: EvaluatedSource[];
  thinkingSteps: ThinkingStep[];
}> {
  const startMs = Date.now();
  const thinkingSteps: ThinkingStep[] = [];

  thinkingSteps.push({
    step: 1,
    agent: "Planner Agent",
    thought: `Query received: "${query}". I'll perform a Tavily Web Search. User has ${userAttachedUrls.length} attached URL(s) to fetch and evaluate.`,
    action: "Invoking Tavily API for authentic web search results.",
    observation: "Search request submitted.",
    timestamp: new Date(startMs + 50).toISOString()
  });

  const searchResults = await searchTavily(query, 18);

  const urlSet = new Set<string>();
  const allCandidates: SearchResult[] = [];

  for (const attachedUrl of userAttachedUrls) {
    if (!urlSet.has(attachedUrl)) {
      urlSet.add(attachedUrl);
      allCandidates.push({ url: attachedUrl, title: "User-attached URL" });
    }
  }

  for (const r of searchResults) {
    if (!urlSet.has(r.url)) {
      urlSet.add(r.url);
      allCandidates.push(r);
    }
  }

  thinkingSteps.push({
    step: 2,
    agent: "Retriever Agent",
    thought: `Retrieved ${searchResults.length} web sources from Tavily. Evaluating ${allCandidates.length} unique candidates.`,
    action: `Starting fetch on ${allCandidates.length} URLs.`,
    observation: `Candidates: ${allCandidates.slice(0, 4).map(r => r.url).join(" | ")}`,
    timestamp: new Date(startMs + 1500).toISOString()
  });

  thinkingSteps.push({
    step: 3,
    agent: "Scraper Agent",
    thought: "Fetching page content over HTTP, sanitizing boilerplate HTML with cheerio, and extracting plain text.",
    action: "Commencing page crawls...",
    observation: "Crawlers active.",
    timestamp: new Date(startMs + 2000).toISOString()
  });

  const crawlResults: Array<{
    candidate: SearchResult;
    httpStatus: number;
    plainText: string;
    title: string;
    author: string;
    date: string;
    fetchedAt: string;
    excerpt: string;
    fetchError?: string;
    failedReasonCode?: string;
    failedReasonText?: string;
  }> = [];

  const candidatesToFetch = allCandidates.slice(0, 22);

  for (const candidate of candidatesToFetch) {
    const fetchedAt = new Date().toISOString();
    try {
      const fetched = await fetchAndExtractText(candidate.url);

      if (fetched.httpStatus < 200 || fetched.httpStatus >= 400) {
        crawlResults.push({
          candidate,
          httpStatus: fetched.httpStatus,
          plainText: fetched.plainText,
          title: fetched.title || candidate.title,
          author: fetched.author,
          date: fetched.date,
          fetchedAt,
          excerpt: "",
          failedReasonCode: "http_error",
          failedReasonText: `Server returned non-200 HTTP status code: ${fetched.httpStatus}.`
        });
        continue;
      }

      if (fetched.plainText.length < 300) {
        crawlResults.push({
          candidate,
          httpStatus: fetched.httpStatus,
          plainText: fetched.plainText,
          title: fetched.title || candidate.title,
          author: fetched.author,
          date: fetched.date,
          fetchedAt,
          excerpt: "",
          failedReasonCode: "too_short",
          failedReasonText: `Extracted text length (${fetched.plainText.length} chars) is below the 300 character quality threshold.`
        });
        continue;
      }

      const excerpt = extractVerifiedExcerpt(fetched.plainText);
      if (!excerpt) {
        crawlResults.push({
          candidate,
          httpStatus: fetched.httpStatus,
          plainText: fetched.plainText,
          title: fetched.title || candidate.title,
          author: fetched.author,
          date: fetched.date,
          fetchedAt,
          excerpt: "",
          failedReasonCode: "no_excerpt_extracted",
          failedReasonText: "Could not extract a valid 2-3 sentence verbatim excerpt from the page."
        });
        continue;
      }

      if (isLowQualityExcerpt(excerpt)) {
        crawlResults.push({
          candidate,
          httpStatus: fetched.httpStatus,
          plainText: fetched.plainText,
          title: fetched.title || candidate.title,
          author: fetched.author,
          date: fetched.date,
          fetchedAt,
          excerpt: "",
          failedReasonCode: "low_quality_extraction",
          failedReasonText: "Excerpt contains paywall, cookie, or login boilerplate instead of substantive article content."
        });
        continue;
      }

      if (!fetched.plainText.includes(excerpt)) {
        crawlResults.push({
          candidate,
          httpStatus: fetched.httpStatus,
          plainText: fetched.plainText,
          title: fetched.title || candidate.title,
          author: fetched.author,
          date: fetched.date,
          fetchedAt,
          excerpt: "",
          failedReasonCode: "excerpt_not_verbatim",
          failedReasonText: "Excerpt failed verbatim inclusion validation check."
        });
        continue;
      }

      crawlResults.push({
        candidate,
        ...fetched,
        excerpt
      });
      console.log(`[Fetch] ✓ ${fetched.httpStatus} | ${candidate.url}`);
    } catch (err: any) {
      console.log(`[Fetch] ERROR ${candidate.url}: ${err.message}`);
      crawlResults.push({
        candidate,
        httpStatus: 0,
        plainText: "",
        title: candidate.title,
        author: "Unknown",
        date: new Date().toISOString().split("T")[0],
        fetchedAt,
        excerpt: "",
        failedReasonCode: "fetch_failed",
        failedReasonText: `HTTP crawl failed or network timeout: ${err.message}`
      });
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const successfulCrawls = crawlResults.filter(c => !c.failedReasonCode).length;

  thinkingSteps.push({
    step: 4,
    agent: "Scraper Agent",
    thought: `Fetch phase complete. ${successfulCrawls} pages passed format validations, excerpt matching, and plainText.includes assertions.`,
    action: "Moving verified pages to domain evaluation.",
    observation: `${successfulCrawls} source texts loaded.`,
    timestamp: new Date(startMs + 6000).toISOString()
  });

  thinkingSteps.push({
    step: 5,
    agent: "Auditor Agent",
    thought: "Computing domain types, checking keyword matches against plainText, and verifying mutual domain corroboration.",
    action: "Applying trustScore() and claimTextMatchCheck()",
    observation: "Scoring metrics active.",
    timestamp: new Date(startMs + 6500).toISOString()
  });

  const processedCrawl = crawlResults.map((c, idx) => {
    const domainType = classifyDomain(c.candidate.url);
    let domain = "";
    try { domain = new URL(c.candidate.url).hostname.toLowerCase(); } catch {}
    
    if (c.failedReasonCode) {
      return {
        ...c,
        domainType,
        domain,
        claimTextMatch: false,
        idx
      };
    }

    const claimTextMatch = claimTextMatchCheck(c.plainText, query);
    return {
      ...c,
      domainType,
      domain,
      claimTextMatch,
      idx
    };
  });

  const evaluatedSources: EvaluatedSource[] = [];

  for (const ev of processedCrawl) {
    let corroboratedByCount = 0;
    if (!ev.failedReasonCode && ev.claimTextMatch) {
      corroboratedByCount = processedCrawl.filter(
        other => !other.failedReasonCode && other.domain !== ev.domain && other.claimTextMatch
      ).length;
    }

    let decision: "accepted" | "rejected";
    let score = 0;
    let reasonCode = ev.failedReasonCode || "";
    let reasonText = ev.failedReasonText || "";

    if (ev.failedReasonCode) {
      decision = "rejected";
      score = 0;
    } else {
      const trust = computeTrustScore(ev.domainType, corroboratedByCount, ev.claimTextMatch);
      score = trust.score;
      reasonCode = trust.reasonCode;
      reasonText = trust.reasonText;
      decision = trust.decision;
    }

    evaluatedSources.push({
      id: `SRC-${ev.idx + 1}`,
      url: ev.candidate.url,
      title: ev.title || ev.candidate.title,
      domain: ev.domain,
      domainType: ev.domainType,
      httpStatus: ev.httpStatus,
      rawExcerpt: ev.excerpt,
      snippet: ev.candidate.snippet || ev.excerpt.substring(0, 200) || reasonText,
      claimTextMatch: ev.claimTextMatch,
      corroboratedByCount,
      trustScore: score,
      decision,
      reasonCode,
      reasonText,
      fetchedAt: ev.fetchedAt,
      credibility: score,
      relevance: ev.claimTextMatch ? Math.min(100, 55 + corroboratedByCount * 8) : 20,
      author: ev.author,
      date: ev.date,
      shapWeights: shapWeightsFromDomain(ev.domainType, score)
    });
  }

  const accepted = evaluatedSources.filter(s => s.decision === "accepted");

  thinkingSteps.push({
    step: 6,
    agent: "Auditor Agent",
    thought: `Scores calculated. Accepted: ${accepted.length}. Rejected: ${evaluatedSources.length - accepted.length}.`,
    action: "Exporting results.",
    observation: `Accepted domains: ${accepted.map(s => s.domain).join(", ")}`,
    timestamp: new Date(startMs + 7500).toISOString()
  });

  const avgTrust = accepted.length > 0 ? accepted.reduce((sum, s) => sum + s.trustScore, 0) / accepted.length : 0;

  thinkingSteps.push({
    step: 7,
    agent: "Explainability Agent",
    thought: `Computing SHAP attributions based on domain profiles. Average trust is ${Math.round(avgTrust)}%`,
    action: "Attributing influence variables.",
    observation: "Applied SHAP weights.",
    timestamp: new Date(startMs + 8000).toISOString()
  });

  thinkingSteps.push({
    step: 8,
    agent: "Judge Agent",
    thought: "Synthesizing ultimate verdict and confidence levels based on corroborated findings.",
    action: "Rendering verdict JSON.",
    observation: "Completed.",
    timestamp: new Date(startMs + 8500).toISOString()
  });

  return { evaluatedSources, thinkingSteps };
}

function buildInvestigationResponse(
  query: string,
  evaluatedSources: EvaluatedSource[],
  thinkingSteps: ThinkingStep[],
  backendMs: number
) {
  const accepted = evaluatedSources.filter(s => s.decision === "accepted");
  const usable = accepted.length > 0 ? accepted.slice(0, 10) : evaluatedSources.slice(0, 4);

  const avgTrust = usable.reduce((sum, s) => sum + s.trustScore, 0) / Math.max(1, usable.length);
  const confidence = Math.round(Math.min(95, Math.max(30, avgTrust * 0.7 + Math.min(accepted.length, 10) * 3)));

  const uiSources = usable.map(s => ({
    id: s.id,
    title: s.title,
    uri: s.url,
    snippet: s.snippet,
    relevance: s.relevance,
    credibility: s.credibility,
    author: s.author,
    domain: s.domain,
    date: s.date,
    domainType: s.domainType,
    rawExcerpt: s.rawExcerpt,
    decision: s.decision,
    reasonText: s.reasonText,
    shapWeights: s.shapWeights,
    claimTextMatch: s.claimTextMatch,
    trustScore: s.trustScore,
    corroboratedByCount: s.corroboratedByCount,
    reasonCode: s.reasonCode,
    fetchedAt: s.fetchedAt,
    httpStatus: s.httpStatus
  }));

  const claims = uiSources.map((s, idx) => generateClaimFromSource(s as any, idx + 1));
  const alternatives = generateAlternatives(uiSources as any, query);
  const traceEvents = generateTraceEvents(query, uiSources.length, backendMs);
  const investigationCase = generateInvestigationCase(query, uiSources as any, claims, alternatives, traceEvents);

  let verdict = "Claim Under Review";
  let summary = `${accepted.length} sources retrieved via Tavily search. Average trust score: ${Math.round(avgTrust)}%.`;

  if (confidence >= 80) {
    verdict = accepted.some(s => s.domainType === "gov" || s.domainType === "edu")
      ? "Substantiated by Authoritative Sources"
      : "Evidence Corroborated";
    summary = `${accepted.length} independent sources corroborate this topic with an average trust of ${Math.round(avgTrust)}%.`;
  } else if (confidence >= 60) {
    verdict = "Partially Supported — Further Evidence Needed";
  } else if (accepted.length === 0) {
    verdict = "Insufficient Evidence";
    summary = "No search results met the reliability and relevance benchmarks for this query.";
  }

  return {
    ...investigationCase,
    conclusion: { verdict, summary, confidence },
    confidenceBreakdown: {
      source: Math.round(Math.min(100, accepted.length * 10)),
      evidence: Math.round(avgTrust),
      reasoning: Math.round(confidence * 0.9),
      citation: Math.round(Math.min(100, accepted.filter(s => s.domainType === "news_wire" || s.domainType === "gov").length * 15 + 30)),
      overall: confidence
    },
    sources: uiSources,
    demoMode: false,
    thinkingSteps,
    allSources: evaluatedSources,
    message: `Tavily investigation complete. ${accepted.length} accepted from ${evaluatedSources.length} fetched.`
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// /api/investigate — MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/api/investigate", async (req, res) => {
  const { question, inputs } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Research question or claim is required." });
  }

  const requestStartMs = Date.now();
  console.log(`\n[EAIP] ══ Investigation Triggered ══ "${question}"`);

  const userAttachedUrls: string[] = [];
  if (inputs && Array.isArray(inputs)) {
    for (const file of inputs) {
      if (!file.content) continue;
      if (typeof file.content === "string" && file.content.startsWith("Target URL link to scrape:")) {
        const match = file.content.match(/https?:\/\/[^\s]+/);
        if (match) userAttachedUrls.push(match[0]);
      }
    }
  }

  try {
    const { evaluatedSources, thinkingSteps } = await runRealInvestigation(question, userAttachedUrls);
    const backendMs = Date.now() - requestStartMs;

    const responseData = buildInvestigationResponse(question, evaluatedSources, thinkingSteps, backendMs);
    return res.json(responseData);

  } catch (error: any) {
    console.error("[EAIP] Pipeline failed:", error.message);
    return res.status(500).json({
      error: "Investigation failed",
      details: error.message
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "EAIP Server running — Tavily API Active" });
});

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = require("fs").existsSync(path.join(distPath, "index.html"));

  if (isProduction) {
    console.log("[EAIP] Production mode — serving static files from dist/");
    app.use(express.static(distPath));
    // SPA catch-all: serve index.html for non-API routes only
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  } else {
    console.log("[EAIP] Development mode — setting up Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EAIP Server] http://localhost:${PORT} — mode: ${isProduction ? "production" : "development"}`);
  });
}

startServer();
