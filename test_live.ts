import axios from 'axios';

const query = "Did OnePlus overstate the battery life of the OnePlus 12?";

(async () => {
  console.log(`Running test investigation for query: "${query}"`);
  try {
    const res = await axios.post('http://localhost:3000/api/investigate', {
      question: query,
      inputs: [
        {
          name: "pokemon_link.txt",
          content: "Target URL link to scrape: https://pokemon.com"
        }
      ]
    }, {
      timeout: 120000
    });
    console.log("=== RAW JSON RESPONSE ===");
    console.log(JSON.stringify(res.data, null, 2));
    console.log("=========================");
  } catch (err: any) {
    console.error("Test failed:", err.response?.data || err.message);
  }
})();
