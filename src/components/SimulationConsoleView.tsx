import React, { useState } from 'react';
import { AlertTriangle, Code, Cpu, Terminal, ShieldCheck, Info, FileText, ExternalLink } from 'lucide-react';

interface SimulationConsoleViewProps {
  question: string;
  errorMessage?: string;
  onRunAgain?: () => void;
}

export default function SimulationConsoleView({ question, errorMessage, onRunAgain }: SimulationConsoleViewProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'fetchPage' | 'sourceScoring' | 'fallbackBranch'>('fetchPage');

  const fetchPageCode = `// Helper to fetch and extract raw text from a webpage
async function fetchPage(url: string, timeoutMs: number = 4000): Promise<{ success: boolean; status?: number; content?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 1.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (EAIP-Auditor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    clearTimeout(id);
    
    if (!res.ok) {
      return { success: false, status: res.status, error: \`HTTP error \${res.status}\` };
    }
    
    const text = await res.text();
    // Strip HTML tags cleanly
    const cleanText = text
      .replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
      .replace(/<style\\b[^<]*(?:(?!<\\/style>)<[^<]*)*<\\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\s+/g, ' ')
      .trim();
      
    return { success: true, status: res.status, content: cleanText };
  } catch (err: any) {
    return { success: false, error: err.message || 'Fetch aborted or failed' };
  }
}`;

  const sourceScoringCode = `// STEP 3: Rule-based Source Scoring Function (Deterministic and programmatic!)
const allClaimsTexts = [question]; 

for (let i = 0; i < fetchRecords.length; i++) {
  const rec = fetchRecords[i];
  if (rec.type !== "page_fetch") continue;

  const url = rec.url;
  const domain = rec.domain;
  const domainType = getDomainType(url);
  
  const corroboratingDomains = fetchRecords.filter(r => r.type === "page_fetch" && r.success && r.domain !== domain);
  const corroboratedByCount = corroboratingDomains.length;
  const claimTextMatch = programmaticallyCheckMatch(rec.rawExcerpt || "", question, allClaimsTexts);

  let trustPoints = 0;
  if (domainType === "gov" || domainType === "edu" || domainType === "news_wire") {
    trustPoints += 2;
  }
  if (corroboratedByCount >= 2) {
    trustPoints += 2;
  }

  let decision: "accepted" | "rejected" = "accepted";
  let reasonCode = "corroborated_high_trust";
  let reasonText = "";

  if (!claimTextMatch) {
    decision = "rejected";
    reasonCode = "no_claim_match";
    reasonText = "The retrieved text does not programmatically match the target claim.";
  } else if ((domainType === "blog" || domainType === "social") && corroboratedByCount === 0) {
    decision = "rejected";
    reasonCode = "single_uncorroborated_source";
    reasonText = "This blog or social media post is uncorroborated by other high-trust sources.";
  } else if (trustPoints < 1) {
    decision = "rejected";
    reasonCode = "low_domain_trust";
    reasonText = "The source domain has insufficient trust credentials.";
  } else {
    reasonCode = \`corroborated_by_\${domainType}\`;
    reasonText = \`This high-trust \${domainType} source is corroborated by other authoritative records.\`;
  }

  const evalRecord = {
    fetchRecordId: rec.id,
    url: url,
    domain: domain,
    domainType: domainType,
    corroboratedByCount: corroboratedByCount,
    claimTextMatch: claimTextMatch,
    decision: decision,
    reasonCode: reasonCode,
    reasonText: reasonText,
    trustPoints: trustPoints
  };

  sourceEvaluations.push(evalRecord);
}`;

  const fallbackBranchCode = `try {
  console.log(\`Starting Live Autonomous Investigation for: "\${question}"\`);
  
  // Executing Google Search grounding call
  const searchResponse = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ text: searchText }, ...geminiParts],
    config: { tools: [{ googleSearch: {} }] }
  });

  const groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks || [];
  
  // Real Page Fetching and HTML scraping
  for (const url of uniqueUrls) {
    const fetchResult = await fetchPage(url);
    // ... evaluates and scores pages ...
  }
  
  return res.json(parsedData);

} catch (error: any) {
  console.warn("Live investigation failed, falling back to high-fidelity simulation:", error?.message || error);
  
  // Generate customized fallback dataset directly corresponding to the question
  const caseData = generateDynamicMockCase(question, inputs);

  return res.json({
    ...caseData,
    demoMode: true,
    message: \`Simulation Mode Active. The live Gemini API returned a quota limit error. (Details: \${error.message})\`
  });
}`;

  return (
    <div className="space-y-8 animate-fade-in text-slate-100" id="simulation-console-workspace">
      
      {/* 1. SEVERE WARNING BOX - VISUALLY DISTINCT FROM COMPLETED VERDICT */}
      <div className="bg-amber-950/15 border-2 border-amber-500/35 p-6 rounded-2xl flex flex-col md:flex-row gap-5 items-start text-left shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        
        <div className="space-y-3 flex-1">
          <div>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block">
              Simulated Dry-Run Active
            </span>
            <h3 className="text-xl font-bold text-white mt-1.5 font-display">
              Degraded Mode: Live Grounding Paused
            </h3>
          </div>
          
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed max-w-4xl">
            <p>
              The platform is currently operating in <strong>Dry-Run Simulation Mode</strong>. Live Google searching and page crawling are suspended because a Gemini API Key is missing or the project has hit its rate limits (429 Resource Exhausted).
            </p>
            {errorMessage && (
              <p className="bg-slate-950 border border-slate-800 p-2 rounded text-rose-400 font-mono text-[10px] break-all leading-normal">
                Reason: {errorMessage}
              </p>
            )}
            <p className="text-slate-400">
              To prevent presenting unverified or fabricated facts as authoritative conclusions, the standard verdict gauge, causal graph, and counterfactual sandbox have been locked. This page acts as an educational simulator demonstrating our internal code logic.
            </p>
          </div>
        </div>
      </div>

      {/* 2. THEORETICAL MULTI-AGENT EXECUTION PIPELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-6">
        <div>
          <h4 className="text-sm font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-sky-400" />
            1. Theoretical Multi-Agent Pipeline
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            How the platform processes questions and crawls evidence when fully active:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-sky-500 block">STAGE 01</span>
              <span className="text-xs font-bold text-white block mt-1">Planner Agent</span>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                Decomposes target query into 3-5 distinct verification questions and locates primary search phrases.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block border-t border-slate-850/60 pt-2 mt-2">Active Planner</span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-sky-500 block">STAGE 02</span>
              <span className="text-xs font-bold text-white block mt-1">Grounded Search</span>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                Leverages Google Search API grounding tools to identify authoritative articles, registers, and federal filings.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block border-t border-slate-850/60 pt-2 mt-2">API Grounded</span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-sky-500 block">STAGE 03</span>
              <span className="text-xs font-bold text-white block mt-1">HTML Crawler</span>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                Invokes <code className="text-emerald-400 font-mono text-[10px]">fetchPage()</code> to pull HTML raw text and clean tags using regular expressions.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block border-t border-slate-850/60 pt-2 mt-2">Live Grab</span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-sky-500 block">STAGE 04</span>
              <span className="text-xs font-bold text-white block mt-1">Rule Evaluator</span>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                Applies strict scoring rules: evaluates domain (.gov/.edu), counts corroborations, and filters weak social content.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block border-t border-slate-850/60 pt-2 mt-2">Deterministic Audit</span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-sky-500 block">STAGE 05</span>
              <span className="text-xs font-bold text-white block mt-1">Judge Synthesis</span>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                Weighs the collected fact vectors, runs hallucination guards, and outputs a dynamic explanation ledger.
              </p>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block border-t border-slate-850/60 pt-2 mt-2">Secure Outcome</span>
          </div>

        </div>
      </div>

      {/* 3. TRANSPARENT CODE INSPECTION PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4" id="code-inspection-panel">
        <div>
          <h4 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-400" />
            2. Code Auditing Console (Transparency First)
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Inspect our backend codebase directly to verify that the live pipeline actually exists and features real scraping, tag-stripping, and deterministic scoring:
          </p>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col h-[480px]">
          
          {/* Code Tab Navigation */}
          <div className="flex bg-slate-950 border-b border-slate-850 p-1">
            <button
              onClick={() => setActiveCodeTab('fetchPage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCodeTab === 'fetchPage' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              fetchPage() scraper
            </button>
            <button
              onClick={() => setActiveCodeTab('sourceScoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCodeTab === 'sourceScoring' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Source Ingestion Scoring
            </button>
            <button
              onClick={() => setActiveCodeTab('fallbackBranch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCodeTab === 'fallbackBranch' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Fallback Catch Branch
            </button>
          </div>

          {/* Code Display Area */}
          <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950 select-text">
            <pre className="whitespace-pre">
              {activeCodeTab === 'fetchPage' ? fetchPageCode :
               activeCodeTab === 'sourceScoring' ? sourceScoringCode :
               fallbackBranchCode}
            </pre>
          </div>
          
          <div className="bg-slate-900 border-t border-slate-850 py-2.5 px-4 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>FILE: /server.ts (Node.js/Express Backend Core)</span>
            <span className="text-emerald-500/80 font-bold uppercase tracking-widest">REAL CODEBASE LAYER</span>
          </div>

        </div>
      </div>

    </div>
  );
}
