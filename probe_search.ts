/**
 * Probe which web search sources respond correctly from this machine.
 * Tests Bing News RSS, Bing Web HTML, and DuckDuckGo lite.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

const query = 'Adidas recycled ocean plastic sneakers';

(async () => {
  // --- 1. Bing News RSS ---
  try {
    const r = await axios.get(`https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS`, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124', 'Accept': 'application/rss+xml,text/xml' }
    });
    const $ = cheerio.load(r.data, { xmlMode: true });
    const items: string[] = [];
    $('item').each((_, el) => { items.push($(el).find('link').text() || $(el).find('guid').text() || ''); });
    console.log('BING_NEWS_RSS status:', r.status, '| items:', items.length, '| first URL:', items[0]);
  } catch (e: any) { console.log('BING_NEWS_RSS FAILED:', e.message); }

  // --- 2. Bing Web HTML ---
  try {
    const r = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124', 'Accept': 'text/html' }
    });
    const $ = cheerio.load(r.data);
    const urls: string[] = [];
    $('li.b_algo h2 a').each((_, el) => { const h = $(el).attr('href'); if (h) urls.push(h); });
    console.log('BING_WEB_HTML status:', r.status, '| urls:', urls.length, '| first:', urls[0]);
  } catch (e: any) { console.log('BING_WEB_HTML FAILED:', e.message); }

  // --- 3. DuckDuckGo Lite ---
  try {
    const r = await axios.get(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124', 'Accept': 'text/html' }
    });
    const $ = cheerio.load(r.data);
    const urls: string[] = [];
    $('a.result-link, tr td a[href^="http"]').each((_, el) => { const h = $(el).attr('href'); if (h && h.startsWith('http')) urls.push(h); });
    console.log('DDG_LITE status:', r.status, '| urls:', urls.length, '| first:', urls[0]);
  } catch (e: any) { console.log('DDG_LITE FAILED:', e.message); }

  // --- 4. Tavily check (need API key) ---
  const tavilyKey = process.env.TAVILY_API_KEY;
  console.log('TAVILY_API_KEY present:', !!tavilyKey);
})();
