import axios from 'axios';
(async () => {
  try {
    const r = await axios.get('https://html.duckduckgo.com/html/?q=BP+sustainability+report', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' }
    });
    console.log('STATUS:', r.status);
    const body = (r.data as string);
    // check for result links
    const matches = body.match(/href="(https?:\/\/[^"]+)"/g)?.slice(0, 20);
    console.log('HREF SAMPLE:', JSON.stringify(matches));
    console.log('BODY SNIPPET:', body.substring(0, 1500));
  } catch(e: any) {
    console.error('ERROR:', e.message, e.code);
  }
})();
