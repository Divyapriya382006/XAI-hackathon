import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize Gemini safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Prebuilt demo cases for quick demonstration or fallback
const DEMO_CASES: Record<string, any> = {
  sustainability: {
    conclusion: {
      verdict: "Exaggerated Sustainability Claims",
      summary: "The investigation reveals that while the company has made moderate progress in carbon offsetting, their marketing claims of '100% net-zero emissions by 2025' are substantially exaggerated. Third-party audits, satellite deforestation imagery, and NGO reports confirm they continue to rely on unverified carbon credits while their direct operational emissions (Scope 1 and 2) have actually increased by 7.4% over the last fiscal year.",
      confidence: 84
    },
    confidenceBreakdown: {
      source: 89,
      evidence: 82,
      reasoning: 85,
      citation: 92,
      overall: 84
    },
    sources: [
      {
        id: "src-1",
        title: "Federal Environmental Agency Audit Report FY2025",
        uri: "https://epa.gov/reports/corporate-emissions-audit-2025",
        snippet: "Official government audit of Scope 1-3 corporate emissions. Notes a 7.4% increase in the parent corporation's direct manufacturing footprint and flags unverified carbon offset certificates purchased from offshore brokers.",
        relevance: 95,
        credibility: 98,
        author: "EPA Enforcement Division",
        domain: "epa.gov (Gov)",
        date: "2025-11-12",
        shapWeights: {
          domainReputation: 25,
          recency: 20,
          authorReputation: 25,
          citationsWeight: 18,
          referencesWeight: 10
        }
      },
      {
        id: "src-2",
        title: "Investigative Report: The Carbon Offset Shell Game",
        uri: "https://reuters.com/investigates/carbon-credits-leak",
        snippet: "In-depth journalistic investigation tracing corporate offset purchases. Discovered that the Amazonian preservation project backing the company's carbon-neutral claim was deforested in late 2024.",
        relevance: 90,
        credibility: 92,
        author: "Sarah Jenkins, Reuters Investigates",
        domain: "reuters.com (News)",
        date: "2025-02-18",
        shapWeights: {
          domainReputation: 22,
          recency: 23,
          authorReputation: 20,
          citationsWeight: 15,
          referencesWeight: 12
        }
      },
      {
        id: "src-3",
        title: "Corporate Annual Sustainability Report 2025",
        uri: "https://company.com/sustainability/annual-report-2025",
        snippet: "Self-published corporate document stating: 'We are on track to achieve complete Carbon Neutrality across all operations by 2025, driven by our green-initiative and 100% certified offsetting portfolios.'",
        relevance: 80,
        credibility: 45,
        author: "Corporate PR & ESG Committee",
        domain: "company.com (Self)",
        date: "2025-01-10",
        shapWeights: {
          domainReputation: 5,
          recency: 15,
          authorReputation: 5,
          citationsWeight: 10,
          referencesWeight: 10
        }
      },
      {
        id: "src-4",
        title: "Global Forest Watch Satellite Analysis",
        uri: "https://globalforestwatch.org/map/corporate-grids",
        snippet: "Real-time canopy and deforestation monitoring. Confirms heavy agricultural clearing within the precise coordinates of the carbon-credit offset zone bought by the company.",
        relevance: 85,
        credibility: 94,
        author: "GFW Science Council",
        domain: "globalforestwatch.org (NGO)",
        date: "2025-05-30",
        shapWeights: {
          domainReputation: 20,
          recency: 22,
          authorReputation: 22,
          citationsWeight: 15,
          referencesWeight: 15
        }
      }
    ],
    claims: [
      {
        id: "cl-1",
        text: "Achieved absolute carbon neutrality across Scope 1, 2, and 3 emissions for all product lines.",
        status: "debunked",
        confidence: 96,
        explanation: "Debunked by the EPA report which confirms that direct Scope 1 and 2 operational emissions increased by 7.4%, and their offset credits are fraudulent.",
        limePhrases: [
          { text: "absolute carbon neutrality", impact: "negative", score: -25 },
          { text: "Scope 1, 2, and 3", impact: "neutral", score: 0 },
          { text: "increased by 7.4%", impact: "positive", score: 30 },
          { text: "offset credits are fraudulent", impact: "positive", score: 35 }
        ]
      },
      {
        id: "cl-2",
        text: "Direct manufacturing operations are running on 100% renewable energy grids.",
        status: "verified",
        confidence: 88,
        explanation: "Verified by local municipal utility receipts. They indeed transitioned all core factories to wind and solar power in mid-2024.",
        limePhrases: [
          { text: "100% renewable energy grids", impact: "positive", score: 25 },
          { text: "local municipal utility receipts", impact: "positive", score: 20 },
          { text: "transitioned all core factories", impact: "positive", score: 15 }
        ]
      },
      {
        id: "cl-3",
        text: "Offered carbon-neutral shipping options for online retail orders worldwide.",
        status: "exaggerated",
        confidence: 72,
        explanation: "Exaggerated. Only shipments inside North America are offset, and the offshore broker certificate used for Asian and European logistics was expired.",
        limePhrases: [
          { text: "carbon-neutral shipping", impact: "negative", score: -10 },
          { text: "online retail orders worldwide", impact: "negative", score: -15 },
          { text: "broker certificate was expired", impact: "positive", score: 25 }
        ]
      }
    ],
    alternatives: [
      {
        hypothesis: "The corporate sustainability claims are 100% valid and accurate.",
        status: "Rejected",
        confidence: 12,
        reason: "Rejected because independent EPA findings and satellite imagery clearly demonstrate that the offsets purchased to declare neutrality are physically deforested, and internal operational footprint has risen."
      },
      {
        hypothesis: "The company's green-washing is completely unintentional due to broker fraud.",
        status: "Rejected",
        confidence: 35,
        reason: "Partially rejected. While the carbon offset brokers engaged in misrepresentation, the company's internal compliance audit team received three warnings from NGO monitors and chose to ignore them to maintain their marketing campaign."
      }
    ],
    hallucinationChecks: {
      faithfulness: {
        score: 95,
        rationale: "The final report adheres strictly to documented evidence and references, introducing no fabricated claims or figures."
      },
      grounding: {
        score: 91,
        rationale: "Every sentence in the conclusion correlates directly to specific verified paragraphs in the EPA audit, Reuters report, and Satellite analysis."
      },
      citationCheck: {
        score: 98,
        rationale: "All URLs are active, DOIs are valid, and government/journal publications were cross-referenced against official indexes."
      },
      consistency: {
        score: 94,
        rationale: "Validation agents running under Gemini and secondary Qwen verifiers achieved complete consensus on the core 'Exaggerated' status."
      },
      evidenceCoverage: {
        score: 88,
        rationale: "The evidence base spans government regulatory logs, international investigative reporting, self-published PR, and geographical telemetry."
      }
    },
    decisionTrace: [
      {
        agent: "Planner Agent",
        event: "Generated Investigation Plan",
        details: "Decomposed 'Did this company exaggerate its sustainability claims?' into 4 research queries: Direct operational energy audit, Carbon-credit offset broker verification, Deforestation geographical overlay, and Corporate PR source checking.",
        status: "success",
        timestamp: "12:30:01"
      },
      {
        agent: "Task Decomposer",
        event: "Assigned Sub-agent Teams",
        details: "Assigned Retrieval Team to search regulatory EPA databases; assigned Browser Team to scrap company.com PR portal; assigned Vision Agent to evaluate satellite raster images.",
        status: "success",
        timestamp: "12:30:02"
      },
      {
        agent: "Retriever Agent",
        event: "Indexed Web & Academic Archives",
        details: "Successfully fetched Federal Environmental Agency Audit FY2025 and Reuters investigative files. Found 4 matching records. Refused 11 forum and Reddit threads due to insufficient domain trust.",
        status: "success",
        timestamp: "12:30:03"
      },
      {
        agent: "Browser Agent",
        event: "Extracted Target DOM & Metadata",
        details: "Crawled company.com/sustainability/annual-report-2025. Extracted raw claim text: 'complete Carbon Neutrality across all operations by 2025'. Captured metadata showing the author is the corporate marketing department, not science officers.",
        status: "success",
        timestamp: "12:30:04"
      },
      {
        agent: "Evidence Aggregator",
        event: "Unified Evidence Matrix",
        details: "Merged regulatory EPA logs with journalistic Reuters findings and satellite Canopy data. Discovered a direct logical conflict between 'carbon-neutral shipping' and 'expired broker certificate'.",
        status: "success",
        timestamp: "12:30:05"
      },
      {
        agent: "Source Quality Agent (SHAP)",
        event: "Computed Credibility Weights",
        details: "Calculated credibility scores. Government domain (epa.gov) granted +25% weight; Reuters investigative team granted +22% weight. Corporate PR (company.com) penalized -45% due to self-serving bias and lack of external audits.",
        status: "success",
        timestamp: "12:30:06"
      },
      {
        agent: "Contradiction Detector",
        event: "Flagged Serious Discrepancies",
        details: "ALARM: Corporate statement claims '100% certified offsetting' but Global Forest Watch satellite coordinates prove that 82% of the offset forest parcel was cleared and converted to cattle grazing.",
        status: "warning",
        timestamp: "12:30:07"
      },
      {
        agent: "Hallucination Supervisor",
        event: "Voted on Grounding Sufficiency",
        details: "5-Agent Hallucination Fusion complete. Grounding, Faithfulness, Consistency, and Citations voted PASS. Evidence score calculated at 88%, exceeding the 70% confidence threshold to render a decision.",
        status: "success",
        timestamp: "12:30:08"
      },
      {
        agent: "Judge Agent",
        event: "Rendered Final Decision",
        details: "Synthesized verdict: 'Exaggerated Sustainability Claims'. Confidence score set to 84%. Rejected alternatives and prepared final audit files.",
        status: "success",
        timestamp: "12:30:09"
      }
    ],
    decisionGraph: {
      nodes: [
        { id: "g1", label: "Corporate Claim", type: "input" },
        { id: "g2", label: "EPA Audit Log", type: "evidence" },
        { id: "g3", label: "GFW Satellites", type: "evidence" },
        { id: "g4", label: "Reuters Story", type: "evidence" },
        { id: "g5", label: "Scope 1/2 Increase", type: "claim" },
        { id: "g6", label: "Offset Clearing", type: "claim" },
        { id: "g7", label: "Renewable Factory", type: "claim" },
        { id: "g8", label: "Exaggerated Verdict", type: "decision" }
      ],
      edges: [
        { from: "g1", to: "g5", label: "Conflict" },
        { from: "g2", to: "g5", label: "Proves" },
        { from: "g1", to: "g6", label: "Conflict" },
        { from: "g3", to: "g6", label: "Proves" },
        { from: "g4", to: "g6", label: "Supports" },
        { from: "g1", to: "g7", label: "Matches" },
        { from: "g2", to: "g7", label: "Verifies" },
        { from: "g5", to: "g8", label: "Triggers" },
        { from: "g6", to: "g8", label: "Triggers" }
      ]
    },
    imageAnalysis: {
      ocrText: "GLOBAL CANOPY SATELLITE IMAGE - GRID AREA 12-B: ACTIVE CLEARING DETECTED",
      caption: "High-resolution satellite capture displaying heavy forest clearing and land-use change within the designated carbon offset reserve zone.",
      overlay: [
        { x: 34, y: 45, width: 25, height: 25, intensity: "High Deforestation Area (88% cleared)" },
        { x: 62, y: 20, width: 20, height: 18, intensity: "Moderate Canopy Thinning" }
      ]
    }
  }
};

// Main investigation handler
app.post("/api/investigate", async (req, res) => {
  const { question, inputs } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Research question or claim is required." });
  }

  const ai = getGeminiClient();

  // If no Gemini API key, return rich mock data or matching prebuilt case for excellent UX
  if (!ai) {
    console.log("No GEMINI_API_KEY detected or using placeholder. Returning high-fidelity simulation model.");
    
    // Check if we can map the question to our sustainability template
    const normalizedQuestion = question.toLowerCase();
    let caseData = DEMO_CASES.sustainability;
    
    if (normalizedQuestion.includes("theranos") || normalizedQuestion.includes("blood")) {
      caseData = getTheranosMockCase(question);
    } else if (normalizedQuestion.includes("tesla") || normalizedQuestion.includes("solar") || normalizedQuestion.includes("musk")) {
      caseData = getTeslaMockCase(question);
    } else {
      // Generate a dynamic mock template customized with the user's specific question!
      caseData = generateDynamicMockCase(question, inputs);
    }

    // Add a marker that this is demo mode
    return res.json({
      ...caseData,
      demoMode: true,
      message: "Demonstration mode. Set GEMINI_API_KEY in Secrets for live web-scale investigations."
    });
  }

  try {
    console.log(`Starting Live Autonomous Investigation for: "${question}"`);

    // STEP 1: Search grounding call to collect real-world sources & web details
    const searchResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the lead investigator of the Explainable Autonomous Investigation Platform (EAIP).
The user is investigating this question/claim: "${question}".
Additional files or context provided: ${JSON.stringify(inputs || [])}.

Perform a deep, web-scale query to retrieve authoritative sources, government reports, financial filings, press releases, scientific papers, or media investigations. Collect both supporting and contradicting evidence.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    const searchSupport = searchResponse.text || "No direct text returned from search phase.";

    console.log(`Search grounded successfully. Found ${groundingChunks.length} raw search sources.`);

    // STEP 2: Multi-Agent Analysis call to build the highly structured, explainable response
    const analystPrompt = `You are the final Judge, Analyst, and Explanation Generator Agents of the Explainable Autonomous Investigation Platform (EAIP).
Your task is to compile a pristine, auditable, and fully explainable investigation dossier based on the user's question, supplementary files, and retrieved Google Search grounding evidence.

---
USER RESEARCH CONTEXT:
Question/Claim: "${question}"
Inputs: ${JSON.stringify(inputs || [])}

RETRIEVED SEARCH SYNTHESIS:
${searchSupport}

GROUNDING METADATA SOURCES:
${JSON.stringify(groundingChunks)}
---

Conduct a rigorous evaluation. You must format your response as a strict, valid JSON object matching the detailed JSON schema below. Do not include markdown code block syntax like \`\`\`json outside the structure, just output the JSON object directly.

Your multi-agent breakdown must include:
1. "conclusion": A precise verdict and a detailed explanatory summary, along with an overall numeric confidence score (0-100).
2. "confidenceBreakdown": Scores for source credibility, evidence sufficiency, reasoning logic, and citation soundness.
3. "sources": Cleaned lists of the retrieved web documents with calculated SHAP-like feature weights showing exactly why they are rated credible or penalized (domain name, author, recency, citations).
4. "claims": Specific factual sub-claims extracted from the query/inputs. For each claim, determine status (verified/debunked/exaggerated/unverified) and perform a LIME-like phrase attribution highlighting key segments and their logical contribution.
5. "alternatives": At least 2 alternative hypotheses that you evaluated and rejected, detailing the reason and confidence score.
6. "hallucinationChecks": Five verification checks (Faithfulness, Grounding, Citation integrity, Consistency, Evidence coverage) with rationales.
7. "decisionTrace": A complete chronological trace of agent operations (Planner, Decomposer, Retriever, Evidence Aggregator, Source Quality, Contradiction Detector, Hallucination Supervisor, Judge, Explanation Generator).
8. "decisionGraph": Logical flow nodes and edges linking claims, evidence, and decision.
9. "imageAnalysis": OCR text, caption, and simulated Grad-CAM heat-map nodes of interest if an image was uploaded.

SCHEMA DEFINITION:
{
  "conclusion": {
    "verdict": "Verdict string (e.g., 'Debunked', 'Verified', 'Exaggerated Claim')",
    "summary": "Deep, comprehensive paragraph outlining findings",
    "confidence": 85
  },
  "confidenceBreakdown": {
    "source": 85,
    "evidence": 80,
    "reasoning": 90,
    "citation": 95,
    "overall": 85
  },
  "sources": [
    {
      "id": "src-1",
      "title": "Title of article/source",
      "uri": "URL of source",
      "snippet": "Short summary of proof",
      "relevance": 90,
      "credibility": 85,
      "author": "Author or publisher name",
      "domain": "Domain category (e.g., 'gov', 'news', 'academic', 'self')",
      "date": "Approximate date or year",
      "shapWeights": {
        "domainReputation": 20,
        "recency": 15,
        "authorReputation": 20,
        "citationsWeight": 15,
        "referencesWeight": 15
      }
    }
  ],
  "claims": [
    {
      "id": "cl-1",
      "text": "Extracted claim",
      "status": "verified | debunked | exaggerated | unverified",
      "confidence": 85,
      "explanation": "Why this status was chosen",
      "limePhrases": [
        { "text": "exact sub-phrase", "impact": "positive | negative | neutral", "score": 20 }
      ]
    }
  ],
  "alternatives": [
    {
      "hypothesis": "Alternative statement",
      "status": "Rejected",
      "confidence": 20,
      "reason": "Why rejected"
    }
  ],
  "hallucinationChecks": {
    "faithfulness": { "score": 95, "rationale": "Explanation" },
    "grounding": { "score": 90, "rationale": "Explanation" },
    "citationCheck": { "score": 95, "rationale": "Explanation" },
    "consistency": { "score": 92, "rationale": "Explanation" },
    "evidenceCoverage": { "score": 85, "rationale": "Explanation" }
  },
  "decisionTrace": [
    {
      "agent": "Planner Agent | Retriever Agent | etc.",
      "event": "What they did",
      "details": "Details of action",
      "status": "success | warning | error",
      "timestamp": "HH:MM:SS"
    }
  ],
  "decisionGraph": {
    "nodes": [ { "id": "g1", "label": "Label", "type": "input | evidence | claim | decision" } ],
    "edges": [ { "from": "g1", "to": "g2", "label": "Relation label" } ]
  },
  "imageAnalysis": {
    "ocrText": "OCR text or none",
    "caption": "Image caption or none",
    "overlay": [ { "x": 50, "y": 50, "width": 20, "height": 20, "intensity": "Details" } ]
  }
}`;

    const finalResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: analystPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conclusion: {
              type: Type.OBJECT,
              properties: {
                verdict: { type: Type.STRING },
                summary: { type: Type.STRING },
                confidence: { type: Type.INTEGER }
              },
              required: ["verdict", "summary", "confidence"]
            },
            confidenceBreakdown: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.INTEGER },
                evidence: { type: Type.INTEGER },
                reasoning: { type: Type.INTEGER },
                citation: { type: Type.INTEGER },
                overall: { type: Type.INTEGER }
              }
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  uri: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                  relevance: { type: Type.INTEGER },
                  credibility: { type: Type.INTEGER },
                  author: { type: Type.STRING },
                  domain: { type: Type.STRING },
                  date: { type: Type.STRING },
                  shapWeights: {
                    type: Type.OBJECT,
                    properties: {
                      domainReputation: { type: Type.INTEGER },
                      recency: { type: Type.INTEGER },
                      authorReputation: { type: Type.INTEGER },
                      citationsWeight: { type: Type.INTEGER },
                      referencesWeight: { type: Type.INTEGER }
                    }
                  }
                }
              }
            },
            claims: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  status: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  limePhrases: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        impact: { type: Type.STRING },
                        score: { type: Type.INTEGER }
                      }
                    }
                  }
                }
              }
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hypothesis: { type: Type.STRING },
                  status: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  reason: { type: Type.STRING }
                }
              }
            },
            hallucinationChecks: {
              type: Type.OBJECT,
              properties: {
                faithfulness: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, rationale: { type: Type.STRING } }
                },
                grounding: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, rationale: { type: Type.STRING } }
                },
                citationCheck: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, rationale: { type: Type.STRING } }
                },
                consistency: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, rationale: { type: Type.STRING } }
                },
                evidenceCoverage: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, rationale: { type: Type.STRING } }
                }
              }
            },
            decisionTrace: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  agent: { type: Type.STRING },
                  event: { type: Type.STRING },
                  details: { type: Type.STRING },
                  status: { type: Type.STRING },
                  timestamp: { type: Type.STRING }
                }
              }
            },
            decisionGraph: {
              type: Type.OBJECT,
              properties: {
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING }
                    }
                  }
                },
                edges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      from: { type: Type.STRING },
                      to: { type: Type.STRING },
                      label: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            imageAnalysis: {
              type: Type.OBJECT,
              properties: {
                ocrText: { type: Type.STRING },
                caption: { type: Type.STRING },
                overlay: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.INTEGER },
                      y: { type: Type.INTEGER },
                      width: { type: Type.INTEGER },
                      height: { type: Type.INTEGER },
                      intensity: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          required: ["conclusion", "sources", "claims", "decisionTrace"]
        }
      }
    });

    const parsedData = JSON.parse(finalResponse.text || "{}");
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Live investigation failed:", error);
    return res.status(500).json({
      error: "Live autonomous investigation crashed.",
      details: error.message
    });
  }
});

// Mock generator for Theranos
function getTheranosMockCase(question: string) {
  return {
    conclusion: {
      verdict: "Debunked Fraudulent Medical Claims",
      summary: "The automated platform's multi-agent synthesis confirms that Theranos' claims regarding proprietary finger-prick diagnostics running 200+ clinical blood assays were completely fabricated. Internal testing, clinical trials, FDA records, and subsequent SEC filings confirm that the Edison machine was only capable of running 12 test types with high error rates, while the remaining 190+ tests were secretly ran on modified commercial third-party analyzers.",
      confidence: 98
    },
    confidenceBreakdown: {
      source: 99,
      evidence: 97,
      reasoning: 98,
      citation: 99,
      overall: 98
    },
    sources: [
      {
        id: "src-t1",
        title: "SEC vs. Elizabeth Holmes & Ramesh Balwani Complaints",
        uri: "https://sec.gov/litigation/complaints/2018/theranos",
        snippet: "Official regulatory charging documents detailing direct misrepresentations to investors, doctors, and patients. Proves that proprietary machines were only used for a tiny fraction of tests and produced widely fluctuating results.",
        relevance: 98,
        credibility: 99,
        author: "US Securities and Exchange Commission",
        domain: "sec.gov (Gov)",
        date: "2018-03-14",
        shapWeights: { domainReputation: 25, recency: 15, authorReputation: 25, citationsWeight: 19, referencesWeight: 15 }
      },
      {
        id: "src-t2",
        title: "Bad Blood: Secrets and Lies in a Silicon Valley Startup",
        uri: "https://carreydoc.com/bad-blood-theranos-expose",
        snippet: "Pulitzer-prize-winning investigative framework outlining laboratory manipulation, whistleblower testimonies, and corporate intimidation designed to conceal operational failure.",
        relevance: 92,
        credibility: 95,
        author: "John Carreyrou, Wall Street Journal",
        domain: "wsj.com (News)",
        date: "2015-10-15",
        shapWeights: { domainReputation: 24, recency: 18, authorReputation: 24, citationsWeight: 15, referencesWeight: 14 }
      },
      {
        id: "src-t3",
        title: "FDA Inspection Report: Newark Lab Deficiencies",
        uri: "https://fda.gov/inspections/theranos-newark-lab",
        snippet: "Clinical inspections proving that Theranos operated uncertified medical devices (Edison) to perform diagnostic tests without appropriate quality validation and quality control measures.",
        relevance: 95,
        credibility: 98,
        author: "Food and Drug Administration",
        domain: "fda.gov (Gov)",
        date: "2015-09-10",
        shapWeights: { domainReputation: 25, recency: 16, authorReputation: 25, citationsWeight: 17, referencesWeight: 15 }
      }
    ],
    claims: [
      {
        id: "cl-t1",
        text: "Perform 240 different diagnostic blood tests on a single droplet of blood.",
        status: "debunked",
        confidence: 99,
        explanation: "Debunked. Proprietary technology only supported 12 tests, which suffered from high coefficient of variation (unreliable margins).",
        limePhrases: [
          { text: "droplet of blood", impact: "negative", score: -35 },
          { text: "240 diagnostic tests", impact: "negative", score: -45 },
          { text: "only supported 12", impact: "positive", score: 20 }
        ]
      }
    ],
    alternatives: [
      {
        hypothesis: "Theranos technology was functional but suffered from premature commercial scaling.",
        status: "Rejected",
        confidence: 8,
        reason: "Rejected. Evidence demonstrates Holmes and Balwani intentionally modified commercial Siemens machines to dilute blood samples to cheat quality testing, indicating structural fraud, not scaling hiccups."
      }
    ],
    hallucinationChecks: {
      faithfulness: { score: 99, rationale: "Derived strictly from federal testimonies." },
      grounding: { score: 98, rationale: "All metrics mapped directly to verified trial logs." },
      citationCheck: { score: 100, rationale: "All cited filings are officially documented by courts." },
      consistency: { score: 99, rationale: "Qwen, Gemini, and GPT verifiers achieved absolute 100% agreement." },
      evidenceCoverage: { score: 97, rationale: "Includes clinical audits, financial charges, and eyewitness whistleblowers." }
    },
    decisionTrace: [
      { agent: "Planner Agent", event: "Formulated Edison Audit Plan", details: "Mapped claims of finger-prick diagnostics against clinical verification protocols.", status: "success", timestamp: "12:30:01" },
      { agent: "Retriever Agent", event: "Discovered FDA and SEC charges", details: "Retrieved definitive regulatory documents from court archives.", status: "success", timestamp: "12:30:03" },
      { agent: "Judge Agent", event: "Rendered Debunked Verdict", details: "Concluded complete fraud based on diluting blood samples and falsifying test lists.", status: "success", timestamp: "12:30:09" }
    ],
    decisionGraph: {
      nodes: [
        { id: "gt1", label: "Theranos Claim", type: "input" },
        { id: "gt2", label: "FDA Inspections", type: "evidence" },
        { id: "gt3", label: "Edison Failures", type: "claim" },
        { id: "gt4", label: "Fraud Verdict", type: "decision" }
      ],
      edges: [
        { from: "gt1", to: "gt3", label: "Conflict" },
        { from: "gt2", to: "gt3", label: "Disproves" },
        { from: "gt3", to: "gt4", label: "Declares" }
      ]
    },
    imageAnalysis: {
      ocrText: "THERANOS NANOTAINER - SERIAL NO. 90124",
      caption: "Visual analysis of the tiny 'nanotainer' tube. Image Agent highlights that the physical sample volume is fundamentally insufficient to run standard chemical dilution panels without compromising assay sensitivity.",
      overlay: [
        { x: 45, y: 50, width: 10, height: 35, intensity: "Extremely low volume limits validation accuracy" }
      ]
    }
  };
}

// Mock generator for Tesla
function getTeslaMockCase(question: string) {
  return {
    conclusion: {
      verdict: "Exaggerated Architectural Claims",
      summary: "Autonomous evaluation indicates Tesla's early marketing campaigns regarding the 'Solar Roof tiles' as an instantly deployable, standard solar-shingle solution were highly exaggerated. While functional roofs exist, custom framing requirements, electrical wiring difficulties, high permitting costs, and thermal performance limits meant that 85% of early pre-orders could not be fulfilled at the initial pricing, and deployment rates remained under 5% of corporate targets.",
      confidence: 78
    },
    confidenceBreakdown: {
      source: 82,
      evidence: 75,
      reasoning: 80,
      citation: 85,
      overall: 78
    },
    sources: [
      {
        id: "src-s1",
        title: "SEC Solar City Merger Disclosure Audits",
        uri: "https://sec.gov/files/tesla-solarcity-investigations",
        snippet: "Disclosures in investor lawsuits proving early functional solar roof models shown in October 2016 were mockups lacking live solar cells and wiring connections.",
        relevance: 90,
        credibility: 98,
        author: "Federal Court Filings",
        domain: "sec.gov (Gov)",
        date: "2021-04-10",
        shapWeights: { domainReputation: 25, recency: 12, authorReputation: 25, citationsWeight: 18, referencesWeight: 18 }
      },
      {
        id: "src-s2",
        title: "Solar Roof Installation Metrics & Deployment Bottlenecks",
        uri: "https://pv-magazine.com/tesla-solar-roof-deployment-numbers",
        snippet: "Independent clean energy census showing Tesla installed an average of just 21 solar roofs per week in 2023, compared to initial rollout targets of 1,000 per week.",
        relevance: 85,
        credibility: 90,
        author: "PV Magazine Editorial",
        domain: "pv-magazine.com (Academic)",
        date: "2023-09-05",
        shapWeights: { domainReputation: 20, recency: 22, authorReputation: 20, citationsWeight: 15, referencesWeight: 13 }
      }
    ],
    claims: [
      {
        id: "cl-s1",
        text: "Deploy 1,000 live Solar Roof installs per week by 2020.",
        status: "exaggerated",
        confidence: 94,
        explanation: "Exaggerated by over 95%. Actual installations peaked around 21-30 per week due to custom roof geometries and structural constraints.",
        limePhrases: [
          { text: "1,000 solar installs per week", impact: "negative", score: -20 },
          { text: "targets were missed", impact: "positive", score: 25 },
          { text: "custom geometric constraints", impact: "positive", score: 15 }
        ]
      }
    ],
    alternatives: [
      {
        hypothesis: "Solar roofs are a massive commercial success hindered only by general supply chain constraints.",
        status: "Rejected",
        confidence: 24,
        reason: "Rejected. Installation complexity is intrinsic to the product design, which requires high hand-crafting and specialized local electricians, making it a low-volume luxury product rather than a standard modular shingle."
      }
    ],
    hallucinationChecks: {
      faithfulness: { score: 94, rationale: "Matches investor filing timelines." },
      grounding: { score: 90, rationale: "Verified by clean energy census tables." },
      citationCheck: { score: 91, rationale: "All docket numbers are correctly indexed." },
      consistency: { score: 92, rationale: "Verifying LLMs reached consensus on target-versus-actual analysis." },
      evidenceCoverage: { score: 85, rationale: "Based on court records, expert energy columns, and patent files." }
    },
    decisionTrace: [
      { agent: "Planner Agent", event: "Solar Rollout Plan", details: "Decoupled production capabilities from installation logistics.", status: "success", timestamp: "12:30:01" },
      { agent: "Retriever Agent", event: "Searched PV Census", details: "Fetched state-by-state solar installation permits.", status: "success", timestamp: "12:30:04" },
      { agent: "Judge Agent", event: "Rendered Exaggerated Verdict", details: "Found a massive gap between target installations and physical counts due to labor bottlenecks.", status: "success", timestamp: "12:30:09" }
    ],
    decisionGraph: {
      nodes: [
        { id: "gs1", label: "Tesla target", type: "input" },
        { id: "gs2", label: "State Solar permits", type: "evidence" },
        { id: "gs3", label: "Actual numbers", type: "claim" },
        { id: "gs4", label: "Exaggerated Verdict", type: "decision" }
      ],
      edges: [
        { from: "gs1", to: "gs3", label: "Conflict" },
        { from: "gs2", to: "gs3", label: "Proves" },
        { from: "gs3", to: "gs4", label: "Declares" }
      ]
    },
    imageAnalysis: {
      ocrText: "TESLA SOLAR GLASS INTEGRITY EXPERIMENT",
      caption: "Analysis of tempered active solar shingle layers. Visual mapping indicates high density wiring paths which increase thermal stress coefficients on internal silicon layers.",
      overlay: [
        { x: 50, y: 30, width: 25, height: 25, intensity: "High thermal accumulation coordinate" }
      ]
    }
  };
}

// Generate fully customized dynamic mock data based on the user's input question!
function generateDynamicMockCase(question: string, inputs: any[]) {
  // Determine an intelligent verdict based on keywords
  let verdict = "Unverified Claim";
  let confidence = 65;
  let summary = `Our multi-agent autonomous framework has evaluated the research question: "${question}". Based on our initial analysis of domain registers and cached public files, we have compiled an evidence file. Additional evidence gathering is recommended to elevate confidence beyond demonstration levels.`;

  const questionLower = question.toLowerCase();
  
  if (questionLower.includes("exaggerate") || questionLower.includes("fake") || questionLower.includes("lie") || questionLower.includes("scam") || questionLower.includes("mislead")) {
    verdict = "Likely Exaggerated Claim";
    confidence = 74;
    summary = `The platform's parallel agents have audited the claim: "${question}". We flagged several key points of logical divergence between public marketing brochures and independent metrics. Specifically, self-published announcements are missing detailed verification disclosures and rely on proxy estimates rather than audited operational data.`;
  } else if (questionLower.includes("true") || questionLower.includes("valid") || questionLower.includes("proven") || questionLower.includes("real")) {
    verdict = "Verified Claim";
    confidence = 82;
    summary = `Investigation completed for: "${question}". Sources from peer-reviewed databases and official registers have validated the primary assertions. Our Evidence Aggregator matched operational parameters with historical compliance certificates, confirming the claims are supported by a high-reputation evidence base.`;
  } else if (questionLower.includes("conspiracy") || questionLower.includes("flat") || questionLower.includes("fake moon") || questionLower.includes("hoax")) {
    verdict = "Debunked Falsehood";
    confidence = 95;
    summary = `Deep analysis of: "${question}" confirms this represents a classic debunked falsehood. Multi-agent physical, historical, and geological archives demonstrate a 100% contradiction rate. There is zero authoritative evidence supporting this claim. All promoting literature originates from unverified, self-published forums with zero credibility weights.`;
  }

  // Create a customized list of sources
  const host = "investigation-node.net";
  const sources = [
    {
      id: "ds-1",
      title: `Official Regulatory Advisory on ${question.substring(0, 30)}...`,
      uri: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(question)}`,
      snippet: `Public registry records and expert panels outlining key validation methodologies related to this subject. Notes standard verification metrics and provides baseline operational criteria.`,
      relevance: 90,
      credibility: 95,
      author: "International Standards Commission",
      domain: "standards.org (Academic)",
      date: "2025-04-12",
      shapWeights: { domainReputation: 25, recency: 18, authorReputation: 22, citationsWeight: 15, referencesWeight: 15 }
    },
    {
      id: "ds-2",
      title: `Expert Review: Analyzing ${question.substring(0, 35)}`,
      uri: `https://scholar.google.com/scholar?q=${encodeURIComponent(question)}`,
      snippet: `A peer-reviewed study evaluating direct claims of credibility and historical accuracy. Concludes that standard compliance thresholds require empirical auditing rather than self-reported surveys.`,
      relevance: 85,
      credibility: 90,
      author: "Dr. Arthur Vance, Research Consortium",
      domain: "scholar-portal.net (Academic)",
      date: "2024-10-18",
      shapWeights: { domainReputation: 22, recency: 20, authorReputation: 20, citationsWeight: 15, referencesWeight: 13 }
    },
    {
      id: "ds-3",
      title: `Public Briefing and Statement on Current Investigations`,
      uri: `https://reuters.com/search/news?blob=${encodeURIComponent(question)}`,
      snippet: `In-depth reporting summarizing public discussions and corporate statements. Focuses on the gap between advertised outcomes and actual independent observation records.`,
      relevance: 75,
      credibility: 88,
      author: "Global Newsroom Bureau",
      domain: "reuters.com (News)",
      date: "2025-06-01",
      shapWeights: { domainReputation: 20, recency: 24, authorReputation: 18, citationsWeight: 14, referencesWeight: 12 }
    }
  ];

  // Dynamic claims
  const claims = [
    {
      id: "dc-1",
      text: `Primary Claim: Assertions regarding the absolute truth of "${question.substring(0, 50)}..."`,
      status: verdict.toLowerCase().includes("debunked") ? "debunked" : verdict.toLowerCase().includes("exaggerated") ? "exaggerated" : "verified",
      confidence: confidence,
      explanation: `Evaluated by the analyst agent. The assertion fails to reconcile with independent empirical records, leading to a status classification of ${verdict}.`,
      limePhrases: [
        { text: "assertions are unverified", impact: "negative", score: -15 },
        { text: "empirical testing", impact: "positive", score: 20 },
        { text: "contradictions identified", impact: "negative", score: -25 }
      ]
    }
  ];

  return {
    conclusion: {
      verdict,
      summary,
      confidence
    },
    confidenceBreakdown: {
      source: Math.round(confidence * 1.05),
      evidence: Math.round(confidence * 0.95),
      reasoning: Math.round(confidence * 1.02),
      citation: Math.round(confidence * 0.98),
      overall: confidence
    },
    sources,
    claims,
    alternatives: [
      {
        hypothesis: `The alternative scenario where the claims are 100% complete and flawless.`,
        status: "Rejected",
        confidence: 100 - confidence,
        reason: `Rejected because three independent source registers contain evidence demonstrating substantial logical deviations, rendering absolute compliance highly improbable.`
      }
    ],
    hallucinationChecks: {
      faithfulness: { score: 98, rationale: "The compiled dataset is 100% faithful to the text logs and references." },
      grounding: { score: 92, rationale: "No ungrounded concepts or figures were appended during agent reasoning." },
      citationCheck: { score: 95, rationale: "All generated references map to valid external research search queries." },
      consistency: { score: 91, rationale: "Multiple verification models successfully converged on the final rating." },
      evidenceCoverage: { score: 86, rationale: "Coverage spans academic index registers, news wire feeds, and regulatory parameters." }
    },
    decisionTrace: [
      { agent: "Planner Agent", event: "Generated Custom Inquiry Plan", details: `Parsed input question: "${question}". Decomposed into primary, verification, and audit pipelines.`, status: "success", timestamp: "12:30:01" },
      { agent: "Retriever Agent", event: "Indexed Mock Repositories", details: "Indexed standard academic registers and public press releases.", status: "success", timestamp: "12:30:03" },
      { agent: "Evidence Aggregator", event: "Unified Logical Map", details: "Checked and highlighted semantic conflicts between claims and third-party reports.", status: "success", timestamp: "12:30:05" },
      { agent: "Judge Agent", event: `Concluded ${verdict}`, details: `Formulated the finalized rating with ${confidence}% aggregate certainty score.`, status: "success", timestamp: "12:30:09" }
    ],
    decisionGraph: {
      nodes: [
        { id: "dn1", label: "User Question", type: "input" },
        { id: "dn2", label: "Registry Files", type: "evidence" },
        { id: "dn3", label: "Expert Review", type: "evidence" },
        { id: "dn4", label: "Analyzed Claim", type: "claim" },
        { id: "dn5", label: "Final Verdict", type: "decision" }
      ],
      edges: [
        { from: "dn1", to: "dn4", label: "Defines" },
        { from: "dn2", to: "dn4", label: "Evaluates" },
        { from: "dn3", to: "dn4", label: "Evaluates" },
        { from: "dn4", to: "dn5", label: "Results In" }
      ]
    },
    imageAnalysis: {
      ocrText: inputs && inputs.find(i => i.type === 'image') ? "MOCK OCR TEXT: IMAGE SCAN COMPLETED" : "No OCR scan performed (No image provided)",
      caption: inputs && inputs.find(i => i.type === 'image') ? "Visual analysis of the uploaded evidence document or capture." : "No image provided for visual inspection.",
      overlay: [
        { x: 30, y: 30, width: 40, height: 40, intensity: "Identified Region of Interest" }
      ]
    }
  };
}

// Vite and development middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Dev Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static files from dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EAIP Server] Running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
