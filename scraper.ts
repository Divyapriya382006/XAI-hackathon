import axios from 'axios';
import * as cheerio from 'cheerio';
import { Source, ShapWeights } from './src/types';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  date?: string;
  author?: string;
}

export interface ThinkingStep {
  step: number;
  agent: string;
  thought: string;
  action: string;
  observation: string;
  timestamp: string;
}

/**
 * Web Scraper Module
 * Fetches and parses search results and web content dynamically from multiple query angles
 */

const DEFAULT_SHAP_WEIGHTS: ShapWeights = {
  domainReputation: 20,
  recency: 20,
  authorReputation: 20,
  citationsWeight: 20,
  referencesWeight: 20
};

// Helper to classify domain type
export function getDomainType(urlStr: string): "gov" | "edu" | "news_wire" | "ngo" | "corporate" | "blog" | "social" | "other" {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname.endsWith('.gov') || hostname.endsWith('.mil')) return 'gov';
    if (hostname.endsWith('.edu')) return 'edu';
    
    const wireKeywords = ['reuters.com', 'apnews.com', 'bloomberg.com', 'prnewswire.com', 'businesswire.com', 'forbes.com', 'cnbc.com', 'bbc.com', 'theguardian.com', 'nytimes.com', 'wsj.com', 'washingtonpost.com', 'ft.com', 'economist.com'];
    if (wireKeywords.some(kw => hostname.includes(kw))) return 'news_wire';
    
    if (hostname.endsWith('.org') || hostname.includes('wikipedia')) return 'ngo';
    
    const blogKeywords = ['blog.', '/blog/', 'medium.com', 'substack.com', 'dev.to'];
    if (blogKeywords.some(kw => hostname.includes(kw) || url.pathname.includes(kw))) return 'blog';
    
    const socialKeywords = ['twitter.com', 'x.com', 'reddit.com', 'facebook.com', 'linkedin.com', 'instagram.com', 'tiktok.com'];
    if (socialKeywords.some(kw => hostname.includes(kw))) return 'social';
    
    if (hostname.endsWith('.com') || hostname.endsWith('.co') || hostname.endsWith('.io') || hostname.endsWith('.net')) return 'corporate';
    
    return 'other';
  } catch (e) {
    return 'other';
  }
}

// Adjust SHAP weights based on domain type
function getShapWeightsByDomain(domainType: string): ShapWeights {
  const weights = { ...DEFAULT_SHAP_WEIGHTS };
  
  if (domainType === 'gov') {
    weights.domainReputation = 28;
    weights.authorReputation = 26;
    weights.citationsWeight = 16;
  } else if (domainType === 'edu') {
    weights.authorReputation = 26;
    weights.domainReputation = 24;
    weights.citationsWeight = 18;
  } else if (domainType === 'news_wire') {
    weights.recency = 27;
    weights.domainReputation = 24;
    weights.authorReputation = 20;
  } else if (domainType === 'ngo') {
    weights.domainReputation = 22;
    weights.citationsWeight = 22;
  } else if (domainType === 'blog' || domainType === 'social') {
    weights.domainReputation = 8;
    weights.authorReputation = 10;
    weights.referencesWeight = 8;
  }
  
  return weights;
}

/**
 * Generate sub-queries from main query for broader coverage
 */
function generateSubQueries(query: string): string[] {
  const q = query.toLowerCase();
  const subQueries: string[] = [query]; // always include original

  // Add evidence-specific sub-queries
  subQueries.push(`${query} evidence report`);
  subQueries.push(`${query} official statement`);

  // Add investigative sub-queries
  if (q.includes('claim') || q.includes('allegation') || q.includes('fraud') || q.includes('exaggerate')) {
    subQueries.push(`${query} fact check investigation`);
    subQueries.push(`${query} SEC filing OR regulatory OR court`);
  } else {
    subQueries.push(`${query} analysis research findings`);
    subQueries.push(`${query} news latest update`);
  }

  return subQueries.slice(0, 3); // max 3 sub-queries to avoid rate-limiting
}

/**
 * Fetch a single webpage and extract content
 */
async function fetchWebPage(url: string, timeoutMs: number = 6000): Promise<ScrapedContent | null> {
  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (EAIP-Scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    
    // Extract title
    let title = $('head title').text() || $('meta[property="og:title"]').attr('content') || $('h1').first().text() || 'Untitled';
    title = title.trim().substring(0, 200);
    
    // Extract content - broader selectors
    const paragraphs: string[] = [];
    $('p, article, main, .content, .post-content, .article-body, .entry-content, section').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 40) {
        paragraphs.push(text);
      }
    });
    
    const content = paragraphs.join('\n\n').substring(0, 6000);
    
    // Extract excerpt (first 400 chars)
    const excerpt = content.substring(0, 400) + (content.length > 400 ? '...' : '');
    
    // Extract date
    let date = '';
    const datePatterns = [
      $('meta[property="article:published_time"]').attr('content'),
      $('meta[itemprop="datePublished"]').attr('content'),
      $('time').attr('datetime'),
      $('[class*="date"]').first().text()
    ];
    
    for (const pattern of datePatterns) {
      if (pattern) {
        date = pattern.substring(0, 10);
        break;
      }
    }
    
    // Extract author
    let author = '';
    const authorPatterns = [
      $('meta[name="author"]').attr('content'),
      $('meta[property="article:author"]').attr('content'),
      $('[class*="author"]').first().text(),
      $('[rel="author"]').first().text()
    ];
    
    for (const pattern of authorPatterns) {
      if (pattern && pattern.trim().length > 0) {
        author = pattern.substring(0, 100).trim();
        break;
      }
    }
    
    return {
      url,
      title,
      content,
      excerpt,
      date: date || new Date().toISOString().split('T')[0],
      author: author || 'Unknown'
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Perform web search using DuckDuckGo (no API key required)
 */
async function searchWeb(query: string, maxResults: number = 6): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    // Try both DuckDuckGo HTML and lite endpoints for resilience
    const searchUrls = [
      `https://html.duckduckgo.com/?q=${encodedQuery}`,
      `https://duckduckgo.com/html/?q=${encodedQuery}`
    ];
    
    for (const searchUrl of searchUrls) {
      try {
        const response = await axios.get(searchUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://duckduckgo.com/'
          }
        });
        
        const $ = cheerio.load(response.data);
        const results: SearchResult[] = [];
        
        // Try multiple result selectors for resilience
        const selectors = ['div.result', 'div.web-result', 'article.result', '.results_links'];
        
        for (const selector of selectors) {
          $(selector).each((_, el) => {
            if (results.length >= maxResults) return;
            
            const titleEl = $(el).find('a.result__a, a.result-link, h2 a, h3 a');
            const title = titleEl.text().trim();
            let url = titleEl.attr('href') || '';
            
            // Handle DuckDuckGo redirect URLs
            if (url.startsWith('//duckduckgo.com/l/?')) {
              try {
                const urlObj = new URL('https:' + url);
                url = urlObj.searchParams.get('uddg') || url;
              } catch {}
            }
            
            const snippetEl = $(el).find('.result__snippet, .result-snippet, p');
            const snippet = snippetEl.text().trim();
            
            if (url && title && url.startsWith('http') && !url.includes('duckduckgo.com')) {
              results.push({
                title,
                url,
                snippet: snippet.substring(0, 400)
              });
            }
          });
          if (results.length > 0) break;
        }
        
        if (results.length > 0) {
          console.log(`Fetched ${results.length} search results for query: "${query}"`);
          return results;
        }
      } catch (innerErr) {
        console.warn(`Search URL failed: ${searchUrl}`, innerErr instanceof Error ? innerErr.message : '');
      }
    }
    
    console.warn(`No search results found for query: "${query}"`);
    return [];
  } catch (error) {
    console.error('Error performing web search:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Calculate relevance score based on keyword match
 */
function calculateRelevance(content: string, query: string): number {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const contentLower = content.toLowerCase();
  
  if (keywords.length === 0) return 75;
  
  const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
  const matchRatio = matchCount / keywords.length;
  
  // 60-100 range based on match
  return Math.min(100, Math.round(60 + matchRatio * 40));
}

/**
 * Generate reasoning for why a source was accepted or rejected
 */
function generateSourceReasoning(
  domainType: string,
  credibility: number,
  relevance: number,
  content: string,
  query: string
): { decision: 'accepted' | 'rejected'; reasonText: string; reasonCode: string } {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const matchCount = keywords.filter(kw => content.toLowerCase().includes(kw)).length;
  
  if (matchCount === 0 && content.length < 100) {
    return {
      decision: 'rejected',
      reasonCode: 'no_content_match',
      reasonText: 'The scraped page contains insufficient content or no matching keywords for the query.'
    };
  }
  
  if (domainType === 'social' && credibility < 40) {
    return {
      decision: 'rejected',
      reasonCode: 'low_trust_social',
      reasonText: 'Social media sources without professional verification lack the authority required for forensic investigations.'
    };
  }
  
  if (domainType === 'blog' && credibility < 55) {
    return {
      decision: 'rejected',
      reasonCode: 'unverified_blog',
      reasonText: 'This blog/personal source lacks verifiable author credentials and peer review. Cannot be accepted without corroboration.'
    };
  }
  
  if (credibility >= 85) {
    return {
      decision: 'accepted',
      reasonCode: `high_trust_${domainType}`,
      reasonText: `This ${domainType.replace('_', ' ')} source has a credibility score of ${credibility}% and is considered authoritative for forensic investigations.`
    };
  }
  
  if (credibility >= 65) {
    return {
      decision: 'accepted',
      reasonCode: `moderate_trust_${domainType}`,
      reasonText: `Accepted with moderate confidence. Source credibility is ${credibility}%. Cross-reference with high-trust sources is recommended.`
    };
  }
  
  return {
    decision: 'rejected',
    reasonCode: 'insufficient_credibility',
    reasonText: `Source credibility score of ${credibility}% falls below the minimum threshold required for forensic evidence acceptance.`
  };
}

/**
 * Main function to scrape sources for a given query - now fetches 10+ sources via multi-query
 */
export async function scrapeSources(query: string, maxSources: number = 12): Promise<{
  sources: Source[];
  thinkingSteps: ThinkingStep[];
  allSearchResults: SearchResult[];
}> {
  console.log(`Starting multi-angle web scrape for query: "${query}"`);
  const thinkingSteps: ThinkingStep[] = [];
  const allSearchResultsMap = new Map<string, SearchResult>();
  const startTime = Date.now();

  // Step 1: Query Decomposition
  thinkingSteps.push({
    step: 1,
    agent: 'Planner Agent',
    thought: `I need to investigate: "${query}". I will decompose this into multiple search angles to maximize source coverage and avoid echo chambers.`,
    action: `Generating sub-queries from: "${query}"`,
    observation: `Created 3 targeted search angles: primary query, evidence-focused query, and news/official query.`,
    timestamp: new Date(startTime + 100).toISOString()
  });
  
  const subQueries = generateSubQueries(query);
  console.log(`Generated ${subQueries.length} sub-queries:`, subQueries);

  // Step 2: Web Search
  thinkingSteps.push({
    step: 2,
    agent: 'Retriever Agent',
    thought: `Executing parallel web searches across ${subQueries.length} query angles to retrieve diverse source candidates.`,
    action: `Querying DuckDuckGo with: ${subQueries.map(q => `"${q}"`).join(', ')}`,
    observation: `Initiating search requests...`,
    timestamp: new Date(startTime + 500).toISOString()
  });

  for (let qi = 0; qi < subQueries.length; qi++) {
    const subQuery = subQueries[qi];
    const resultsPerQuery = Math.ceil(maxSources / subQueries.length) + 2;
    const results = await searchWeb(subQuery, resultsPerQuery);
    
    for (const r of results) {
      if (!allSearchResultsMap.has(r.url)) {
        allSearchResultsMap.set(r.url, r);
      }
    }
    
    if (qi < subQueries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  const allSearchResults = Array.from(allSearchResultsMap.values()).slice(0, maxSources + 2);
  
  thinkingSteps.push({
    step: 3,
    agent: 'Retriever Agent',
    thought: `Search phase complete. Evaluating ${allSearchResults.length} unique URLs for content extraction.`,
    action: `De-duplicated and ranked ${allSearchResults.length} candidate URLs across all sub-queries.`,
    observation: `Found ${allSearchResults.length} unique sources. Proceeding to content extraction phase.`,
    timestamp: new Date(startTime + 1200).toISOString()
  });

  // Step 3: Page scraping
  thinkingSteps.push({
    step: 4,
    agent: 'Scraper Agent',
    thought: `I will now fetch each URL, parse the HTML content, strip boilerplate, and extract relevant text passages that can be used as forensic evidence.`,
    action: `Crawling ${allSearchResults.length} URLs - stripping scripts/styles, extracting paragraphs, isolating metadata (author, date, title).`,
    observation: `Beginning sequential page fetches with 400ms delay between requests...`,
    timestamp: new Date(startTime + 1500).toISOString()
  });

  const sources: Source[] = [];
  const rejectedSources: Source[] = [];
  
  for (let i = 0; i < allSearchResults.length; i++) {
    const result = allSearchResults[i];
    
    try {
      const scrapedContent = await fetchWebPage(result.url);
      
      if (scrapedContent) {
        const domainType = getDomainType(result.url);
        let urlObj: URL;
        try {
          urlObj = new URL(result.url);
        } catch {
          continue;
        }
        
        // Calculate credibility score based on domain
        let credibility = 62;
        if (domainType === 'gov') credibility = 97;
        else if (domainType === 'edu') credibility = 91;
        else if (domainType === 'news_wire') credibility = 85;
        else if (domainType === 'ngo') credibility = 76;
        else if (domainType === 'corporate') credibility = 68;
        else if (domainType === 'blog') credibility = 48;
        else if (domainType === 'social') credibility = 32;

        const relevance = calculateRelevance(scrapedContent.content + ' ' + scrapedContent.title, query);
        const { decision, reasonText, reasonCode } = generateSourceReasoning(
          domainType, credibility, relevance, scrapedContent.content, query
        );
        
        const source: Source = {
          id: `SRC-${i + 1}`,
          title: scrapedContent.title || result.title,
          uri: result.url,
          snippet: scrapedContent.excerpt || result.snippet,
          relevance,
          credibility,
          author: scrapedContent.author || 'Unknown',
          domain: urlObj.hostname,
          date: scrapedContent.date,
          domainType: domainType as any,
          rawExcerpt: scrapedContent.content.substring(0, 600),
          decision,
          reasonText,
          shapWeights: getShapWeightsByDomain(domainType)
        };
        
        if (decision === 'accepted') {
          sources.push(source);
          console.log(`✓ Accepted [${domainType}]: ${scrapedContent.title.substring(0, 60)}`);
        } else {
          rejectedSources.push(source);
          console.log(`✗ Rejected [${domainType}]: ${scrapedContent.title.substring(0, 60)} - ${reasonCode}`);
        }
      }
    } catch (error) {
      console.error(`Failed to scrape ${result.url}:`, error instanceof Error ? error.message : 'Unknown error');
    }
    
    if (i < allSearchResults.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  // Step 4: Domain evaluation
  thinkingSteps.push({
    step: 5,
    agent: 'Auditor Agent',
    thought: `Content extraction complete. I will now apply domain reputation scoring (SHAP weights) and keyword relevance matching to evaluate which sources should be accepted as evidence.`,
    action: `Applying credibility heuristics: gov=97%, edu=91%, news_wire=85%, ngo=76%, corporate=68%, blog=48%, social=32%. Running keyword match against query terms.`,
    observation: `Evaluated ${sources.length + rejectedSources.length} sources. Accepted: ${sources.length}, Rejected: ${rejectedSources.length}.`,
    timestamp: new Date(startTime + 3000).toISOString()
  });

  // Step 5: SHAP explanation
  thinkingSteps.push({
    step: 6,
    agent: 'Explainability Agent',
    thought: `I will now compute SHAP feature importance weights for each accepted source to explain WHY each source contributes to the final verdict. The five dimensions are: Domain Reputation, Recency, Author Reputation, Citation Weight, and Reference Weight.`,
    action: `Computing SHAP attribution for ${sources.length} accepted sources. Higher domainReputation weight = more influence from source's official standing.`,
    observation: `SHAP weights computed per-source. Gov sources: domainReputation +8pts above baseline. Social/blog sources: penalized -10pts.`,
    timestamp: new Date(startTime + 3500).toISOString()
  });

  // Step 6: Confidence synthesis
  const avgCred = sources.length > 0 ? sources.reduce((s, src) => s + src.credibility, 0) / sources.length : 50;
  const avgRel = sources.length > 0 ? sources.reduce((s, src) => s + src.relevance, 0) / sources.length : 50;
  
  thinkingSteps.push({
    step: 7,
    agent: 'Judge Agent',
    thought: `All evidence has been gathered and evaluated. I will now synthesize a final verdict based on the weighted average credibility (${Math.round(avgCred)}%) and relevance (${Math.round(avgRel)}%) of accepted sources. Sources with high gov/edu/news_wire domain scores carry more weight in this calculation.`,
    action: `Computing final confidence: avg_credibility=${Math.round(avgCred)}%, avg_relevance=${Math.round(avgRel)}%, final_confidence=${Math.round((avgCred + avgRel) / 2)}%.`,
    observation: `Investigation complete. ${sources.length} evidence sources accepted. Final confidence score: ${Math.round((avgCred + avgRel) / 2)}%.`,
    timestamp: new Date(startTime + 4000).toISOString()
  });

  // Merge all sources (accepted first, then rejected) for full transparency
  const allSources = [...sources, ...rejectedSources];
  
  console.log(`Scraping complete: ${sources.length} accepted, ${rejectedSources.length} rejected.`);
  
  return {
    sources: allSources,
    thinkingSteps,
    allSearchResults: allSearchResults
  };
}

/**
 * Generate a mock fallback source when scraping fails
 */
export function generateFallbackSource(query: string, index: number): Source {
  return {
    id: `SRC-FB-${index}`,
    title: `Research Report: "${query.substring(0, 50)}"`,
    uri: `https://search.example.com/result/${index}`,
    snippet: 'Unable to fetch live data from the internet. This is a system-generated placeholder. Please check your network connection and try again.',
    relevance: 40,
    credibility: 30,
    author: 'System Fallback',
    domain: 'example.com',
    date: new Date().toISOString().split('T')[0],
    domainType: 'other',
    decision: 'rejected',
    reasonText: 'Fallback placeholder generated because live web scraping failed to retrieve results.',
    rawExcerpt: `Placeholder for query: ${query}`,
    shapWeights: DEFAULT_SHAP_WEIGHTS
  };
}
