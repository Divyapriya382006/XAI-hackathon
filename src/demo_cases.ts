export interface ShapWeights {
  domainReputation: number;
  recency: number;
  authorReputation: number;
  citationsWeight: number;
  referencesWeight: number;
}

export interface Source {
  id: string;
  title: string;
  uri: string;
  snippet: string;
  relevance: number;
  credibility: number;
  author: string;
  domain: string;
  date: string;
  shapWeights: ShapWeights;
  decision?: string;
  reasonText?: string;
  rawExcerpt?: string;
  domainType?: string;
}

export interface Claim {
  id: string;
  text: string;
  status: 'verified' | 'exaggerated' | 'debunked' | 'unverified';
  confidence: number;
  explanation: string;
}

export const FALLBACK_DATA: Record<string, {
  missionId: string;
  queries: string[];
  sources: Source[];
  claims: Claim[];
}> = {
  sustainability: {
    missionId: "EAIP-2026-1842",
    queries: [
      "Coca-Cola sustainability report 2023 PDF",
      "EPA plastic recycling audit Coca-Cola",
      "Reuters Coca-Cola sustainability investigation"
    ],
    sources: [
      {
        id: "SRC-SEC",
        title: "Coca-Cola Co. 2023 Form 10-K SEC Filing",
        uri: "https://www.sec.gov/Archives/edgar/data/21344/0000021344-24-000012/coca-cola-10k.htm",
        snippet: "In 2023, we continued to execute our 'World Without Waste' initiatives. Program audits indicate we successfully reduced virgin plastic usage in selected European test markets by approximately 18% through lightweighting and increased post-consumer recycled PET content (rPET).",
        relevance: 98,
        credibility: 100,
        author: "Securities and Exchange Commission (USA)",
        domain: "sec.gov (GOV)",
        date: "2024-02-22",
        decision: "accepted",
        reasonText: "Highly regulated official disclosure. Subject to legal penalties for misrepresentation.",
        domainType: "gov",
        rawExcerpt: "<!-- Item 1. Business --> <p>We are making progress toward our packaging goals, including our rPET packaging initiatives. In test markets across Western Europe, audits confirmed an average 18.2% absolute reduction in virgin polymer footprint against the 2020 benchmark baseline.</p>",
        shapWeights: { domainReputation: 25, recency: 20, authorReputation: 25, citationsWeight: 15, referencesWeight: 15 }
      },
      {
        id: "SRC-EPA",
        title: "EPA Industrial Waste Disposal Compliance Audit",
        uri: "https://www.epa.gov/reports/audit-coca-cola-waste-compliance-2023-csr.pdf",
        snippet: "EPA field testing corroborates Coca-Cola's reported plastic mitigation figures. Post-consumer polymer counts from domestic reclamation centers show a corresponding decline in virgin PET dump volume, matching the reported 18% benchmark.",
        relevance: 95,
        credibility: 99,
        author: "Environmental Protection Agency (EPA)",
        domain: "epa.gov (GOV)",
        date: "2024-01-15",
        decision: "accepted",
        reasonText: "Primary environmental regulatory database. Validated via direct physical reclamation measurements.",
        domainType: "gov",
        rawExcerpt: "SECTION 4.2 - POLYMER RECLAMATION DENSITY AUDITING: Domestic beverage container landfills showed a 17.8% drop in virgin PET density in sample regions with high rPET deployment campaigns, aligning closely with corporate disclosures.",
        shapWeights: { domainReputation: 25, recency: 20, authorReputation: 22, citationsWeight: 18, referencesWeight: 14 }
      },
      {
        id: "SRC-REU",
        title: "Reuters Retail & Consumer Sustainability Investigation",
        uri: "https://www.reuters.com/business/retail-consumer/coca-cola-plastic-reduction-investigation-2024-03-12/",
        snippet: "An independent audit of recycling streams in select municipal waste networks confirms that Coca-Cola's rPET conversion rates did indeed result in a measurable 18% decline in local virgin plastic demand.",
        relevance: 92,
        credibility: 95,
        author: "Reuters Business Desk",
        domain: "reuters.com (NEWS_WIRE)",
        date: "2024-03-12",
        decision: "accepted",
        reasonText: "Reputable international news wire. Employs independent third-party investigative journalists and fact-checkers.",
        domainType: "news_wire",
        rawExcerpt: "By Michael Green. Reuters independent supply-chain analysis confirms Coca-Cola's local virgin polymer manufacturing contracts declined by 18% over the trailing 12 months, in lockstep with their advertised green claims.",
        shapWeights: { domainReputation: 20, recency: 20, authorReputation: 22, citationsWeight: 18, referencesWeight: 15 }
      },
      {
        id: "SRC-NGO",
        title: "Break Free From Plastic Global Brand Audit 2023",
        uri: "https://www.breakfreefromplastic.org/global-brand-audit-2023/",
        snippet: "Coca-Cola remains the world's top plastic polluter for the sixth year in a row. Although local rPET initiatives have led to a modest 18% decline in virgin material in specific test markets, overall global plastic output remains unchanged.",
        relevance: 85,
        credibility: 82,
        author: "BFFP Coalition",
        domain: "breakfreefromplastic.org (NGO)",
        date: "2023-11-05",
        decision: "accepted",
        reasonText: "Reputable NGO research coalition. Offers helpful global perspective on macro limits of the local claim.",
        domainType: "corporate",
        rawExcerpt: "Despite localized test-market successes boasting up to 18% virgin polymer reductions, our brand audits across 41 countries show the manufacturer continues to pump millions of metric tons of single-use bottles into active circulation.",
        shapWeights: { domainReputation: 18, recency: 15, authorReputation: 18, citationsWeight: 15, referencesWeight: 16 }
      },
      {
        id: "SRC-BLOG",
        title: "The Eco Green Consumer Forum & Opinion Feed",
        uri: "https://www.greenconsumerblog.net/coca-cola-sustainability-opinion/",
        snippet: "Coca-Cola's claim of 18% reduction is completely fake and just a greenwashing scheme. Local sources tell us they just shipped the virgin plastic to other warehouses to fake the audit numbers.",
        relevance: 60,
        credibility: 31,
        author: "Anonymous Blogger ('EcoWarrior99')",
        domain: "greenconsumerblog.net (BLOG)",
        date: "2024-04-01",
        decision: "rejected",
        reasonText: "No verified author credentials. Relies heavily on hearsay and personal speculation. Zero physical evidence or citations provided.",
        domainType: "other",
        rawExcerpt: "I spoke to a guy who knows a guy at the bottling plant who said they just trucked the raw polymer resins over to the Alabama distribution center right before the auditors arrived. It's all a massive scam!",
        shapWeights: { domainReputation: 5, recency: 10, authorReputation: 5, citationsWeight: 5, referencesWeight: 6 }
      }
    ],
    claims: [
      {
        id: "CLM-001",
        text: "Coca-Cola reduced virgin plastic consumption by 18% in local test regions.",
        status: "verified",
        confidence: 96,
        explanation: "This claim is highly supported by regulatory disclosures (Form 10-K), direct ecological audits from the US EPA, and independent investigative data from Reuters. While global output remains high, the local 18% reduction metric is programmatically verified."
      },
      {
        id: "CLM-002",
        text: "The 18% virgin plastic reduction was replicated uniformly across all worldwide bottling plants.",
        status: "debunked",
        confidence: 84,
        explanation: "BFFP global audit reports and independent logistics data show the reduction was strictly restricted to specific European and domestic test markets. Replicability is nonexistent on a global scale."
      }
    ]
  },
  theranos: {
    missionId: "EAIP-2015-0920",
    queries: [
      "Theranos FDA warning letter 2015",
      "SEC v. Elizabeth Holmes litigation complaint",
      "FDA Newark lab inspection report Theranos"
    ],
    sources: [
      {
        id: "SRC-FDA",
        title: "FDA Warning Letter to Theranos Inc. (Ref: 2016-WL-18)",
        uri: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/theranos-inc-10252015",
        snippet: "An FDA physical inspection of Theranos' Newark facility confirms that they processed clinical samples on unapproved, modified commercial third-party analyzers rather than their proprietary Edison device.",
        relevance: 99,
        credibility: 99,
        author: "Food and Drug Administration (USA)",
        domain: "fda.gov (GOV)",
        date: "2015-10-25",
        decision: "accepted",
        reasonText: "Official federal public health enforcement document. Based on sworn inspectors and direct lab access.",
        domainType: "gov",
        rawExcerpt: "The FDA inspection conducted between August 25 and September 15, 2015, revealed that your proprietary 'Edison' device was only utilized for a tiny fraction of tests, while the majority were routed to diluted commercial systems.",
        shapWeights: { domainReputation: 25, recency: 20, authorReputation: 25, citationsWeight: 15, referencesWeight: 14 }
      },
      {
        id: "SRC-SEC-TH",
        title: "SEC vs. Elizabeth Holmes Litigation Complaint",
        uri: "https://www.sec.gov/litigation/complaints/2018/comp-pr2018-41.pdf",
        snippet: "Theranos committed a multi-year fraud by making false statements about its proprietary technology, falsely claiming the Edison machine could run over 200 clinical assays when it was restricted to only twelve.",
        relevance: 98,
        credibility: 100,
        author: "Securities and Exchange Commission (USA)",
        domain: "sec.gov (GOV)",
        date: "2018-03-14",
        decision: "accepted",
        reasonText: "Official federal fraud complaint based on forensic subpoenas, financial ledgers, and employee depositions.",
        domainType: "gov",
        rawExcerpt: "Holmes and Theranos knew that the proprietary analyzer could not compete with commercial laboratory equipment, and performed less than 10% of their advertised catalog on their actual custom hardware.",
        shapWeights: { domainReputation: 25, recency: 20, authorReputation: 25, citationsWeight: 15, referencesWeight: 14 }
      },
      {
        id: "SRC-NAT",
        title: "Nature Biotechnology: Accuracy of Fingerstick Blood Tests",
        uri: "https://www.nature.com/articles/nbt.3214",
        snippet: "A peer-reviewed academic trial evaluating fingerstick laboratory results reveals that Theranos' assays exhibited coefficient variations exceeding 30%, which is well outside acceptable clinical safety benchmarks.",
        relevance: 90,
        credibility: 98,
        author: "Nature Editorial Board",
        domain: "nature.com (EDU)",
        date: "2016-04-12",
        decision: "accepted",
        reasonText: "Top-tier peer-reviewed academic journal with extensive expert panel validation.",
        domainType: "edu",
        rawExcerpt: "We observed discrepancies in lipid and potassium levels. Our regression models indicate Theranos' custom methods pose risks of false diagnoses due to high coefficient fluctuation.",
        shapWeights: { domainReputation: 24, recency: 20, authorReputation: 24, citationsWeight: 15, referencesWeight: 15 }
      },
      {
        id: "SRC-FORUM",
        title: "Tech Investor Rumors & Speculation Board",
        uri: "https://www.techinvestorforum.com/threads/theranos-real-or-fake/",
        snippet: "My cousin works in Silicon Valley and says he saw Elizabeth Holmes drinking green juice and crying because her machines literally exploded during a demo for the military.",
        relevance: 40,
        credibility: 25,
        author: "User 'AlphaVenture99'",
        domain: "techinvestorforum.com (BLOG)",
        date: "2015-08-20",
        decision: "rejected",
        reasonText: "Third-hand online rumors. Lacks professional credentials, documented evidence, or verifiable sources.",
        domainType: "other",
        rawExcerpt: "I can't name my sources, but a VP at Walgreens told my buddy that they've been using off-the-shelf Siemens machines in the back of the clinics because the Edison box just throws error codes.",
        shapWeights: { domainReputation: 5, recency: 10, authorReputation: 4, citationsWeight: 3, referencesWeight: 3 }
      }
    ],
    claims: [
      {
        id: "CLM-003",
        text: "Elizabeth Holmes developed Edison diagnostic machines with multi-assay capabilities.",
        status: "debunked",
        confidence: 99,
        explanation: "This claim is entirely debunked. FDA physical inspections, SEC forensic litigation, and academic clinical trials confirm the Edison device was structurally incapable of running multiple assays, and commercial machines were covertly used instead."
      }
    ]
  },
  tesla: {
    missionId: "EAIP-2020-1115",
    queries: [
      "Tesla Solar City merger chancery litigation",
      "PV-Magazine Solar Roof census 2020",
      "SEC investigation Tesla solar roof volume"
    ],
    sources: [
      {
        id: "SRC-DEL",
        title: "Delaware Chancery Court SolarCity Litigation Opinion",
        uri: "https://courts.delaware.gov/opinions/download.aspx?ID=325410",
        snippet: "Court records reveal that Tesla's internal production forecasts for Solar Roof tiles were repeatedly missed, and the factory was operating at less than 15% of its projected capacity during the disputed merger period.",
        relevance: 98,
        credibility: 100,
        author: "Delaware Judiciary",
        domain: "courts.delaware.gov (GOV)",
        date: "2022-04-27",
        decision: "accepted",
        reasonText: "Official judicial opinion based on extensive court testimony, internal emails, and financial spreadsheets.",
        domainType: "gov",
        rawExcerpt: "Trial evidence confirms the '1,000 installs per week' forecast was an aspirational target developed by Elon Musk rather than a production-backed timeline verified by Tesla's engineering leadership.",
        shapWeights: { domainReputation: 25, recency: 18, authorReputation: 25, citationsWeight: 16, referencesWeight: 16 }
      },
      {
        id: "SRC-PVM",
        title: "PV-Magazine: Tracking Tesla's Solar Roof Deployment Volume",
        uri: "https://www.pv-magazine.com/2020/08/15/tesla-solar-roof-installations-volume-census/",
        snippet: "An exhaustive physical check of local utility interconnect permits indicates that Tesla solar roof installations peaked at only ~40 per week, far below the advertised 1,000 installs per week forecast.",
        relevance: 95,
        credibility: 88,
        author: "PV-Magazine Solar Panel Census",
        domain: "pv-magazine.com (NEWS_WIRE)",
        date: "2020-08-15",
        decision: "accepted",
        reasonText: "Specialized clean-energy investigative journal. Claims are supported by actual county-level electrical permit audits.",
        domainType: "news_wire",
        rawExcerpt: "Our review of building permits across California, Texas, and Florida shows only 38 active interconnects for Tesla Solar Roof tiles in the entire month of June 2020.",
        shapWeights: { domainReputation: 18, recency: 20, authorReputation: 18, citationsWeight: 17, referencesWeight: 15 }
      },
      {
        id: "SRC-TSLA",
        title: "Tesla Inc. Form 10-Q Quarterly Report (Q3 2020)",
        uri: "https://www.sec.gov/Archives/edgar/data/1318605/000156459020044500/tsla-10q.htm",
        snippet: "We continue to face ramp-up challenges in the Solar Roof manufacturing lines at Gigafactory New York. Interconnect and deployment rates are subject to local utility delays.",
        relevance: 90,
        credibility: 100,
        author: "Securities and Exchange Commission (USA)",
        domain: "sec.gov (GOV)",
        date: "2020-10-26",
        decision: "accepted",
        reasonText: "Official corporate disclosure governed by SEC reporting guidelines and accounting standards.",
        domainType: "gov",
        rawExcerpt: "Our energy generation and storage business continues to experience production complexity regarding the solar glass roof scaling operations. Actual installations remain heavily backlogged.",
        shapWeights: { domainReputation: 25, recency: 20, authorReputation: 25, citationsWeight: 15, referencesWeight: 15 }
      },
      {
        id: "SRC-SOL",
        title: "Tesla Solar Roof Fanatics Tracker Group",
        uri: "https://www.solarfanatics.com/tesla-solar-roof-install-tracking-unverified/",
        snippet: "A user-driven spreadsheet tracking self-reported solar roof installs in California claims that Tesla has already installed over 10,000 roofs and everyone in my neighborhood is getting one.",
        relevance: 55,
        credibility: 40,
        author: "Forum Administrator ('SolarKing')",
        domain: "solarfanatics.com (BLOG)",
        date: "2020-09-01",
        decision: "rejected",
        reasonText: "Unverifiable crowdsourced data. Heavy selection bias and lack of audit checks or proof of installation documents.",
        domainType: "other",
        rawExcerpt: "Just look around! I saw three Tesla trucks in San Jose yesterday. They are definitely installing 1,000 a week. The haters are just spreading oil company FUD.",
        shapWeights: { domainReputation: 8, recency: 15, authorReputation: 8, citationsWeight: 5, referencesWeight: 4 }
      }
    ],
    claims: [
      {
        id: "CLM-004",
        text: "Tesla will achieve 1,000 Solar Roof installs per week by the end of 2020.",
        status: "exaggerated",
        confidence: 91,
        explanation: "This claim is highly exaggerated and practically ungrounded. Delaware court depositions of engineering leads and county utility permit counts confirm peak installs hovered at under 5% of this stated milestone."
      }
    ]
  }
};

// Returns a full mock case structure for frontend demo view
export function getDemoCaseResult(topic: 'sustainability' | 'theranos' | 'tesla') {
  const dataset = FALLBACK_DATA[topic];
  
  let verdict = "Exaggerated Claims";
  let summary = "";
  let confidence = 75;
  let breakdown = { source: 75, evidence: 75, reasoning: 75, citation: 75, overall: 75 };

  if (topic === 'sustainability') {
    verdict = "Exaggerated Sustainability Claims";
    summary = "Coca-Cola Co. is verified to have reduced virgin plastic footprint by 18% in Western European local test markets, but global single-use container output remains unmitigated. Claim of worldwide polymer reduction is Exaggerated.";
    confidence = 94;
    breakdown = { source: 96, evidence: 92, reasoning: 94, citation: 95, overall: 94 };
  } else if (topic === 'theranos') {
    verdict = "Debunked Fraudulent Medical Claims";
    summary = "The Theranos proprietary Edison diagnostic machines were completely incapable of running 200+ clinical assays. Commercial analyzers were covertly used, and laboratory assays exhibited unacceptably high error rates. Claim is completely Debunked.";
    confidence = 98;
    breakdown = { source: 99, evidence: 97, reasoning: 98, citation: 99, overall: 98 };
  } else if (topic === 'tesla') {
    verdict = "Exaggerated Installation Targets";
    summary = "Tesla Inc. repeatedly failed to meet Elon Musk's public target of 1,000 Solar Roof installations per week in 2020, with actual county permits peaking at less than 40 per week. Stated weekly deployment scale is Exaggerated.";
    confidence = 91;
    breakdown = { source: 94, evidence: 89, reasoning: 90, citation: 92, overall: 91 };
  }

  return {
    demoMode: true,
    isSampleInvestigation: true,
    missionId: dataset.missionId,
    queries: dataset.queries,
    conclusion: {
      verdict,
      summary,
      confidence
    },
    confidenceBreakdown: breakdown,
    sources: dataset.sources,
    claims: dataset.claims,
    decisionTrace: [
      {
        agent: "Planner Agent",
        event: "Goal Identified & Task Decomposed",
        details: `Formulated custom verification parameters for historical topic: ${topic}.`,
        status: "success",
        timestamp: "09:00:15"
      },
      {
        agent: "Retriever Agent",
        event: "Regulatory Index Search Executed",
        details: `Retrieved historical dockets and certified agency audits from domain indices.`,
        status: "success",
        timestamp: "09:00:45"
      },
      {
        agent: "Auditor Agent",
        event: "Exemplary Consensus Completed",
        details: `Validated credentials, scored and accepted/rejected sources, and finalized the judgment graph.`,
        status: "success",
        timestamp: "09:01:20"
      }
    ],
    decisionGraph: {
      nodes: [
        { id: "input-q", label: "Corporate Claim Prompt", type: "input" },
        ...dataset.sources.map(s => ({ id: s.id, label: s.title.substring(0, 25) + "...", type: "evidence" })),
        ...dataset.claims.map(c => ({ id: c.id, label: c.text.substring(0, 25) + "...", type: "claim" })),
        { id: "conclusion-node", label: verdict, type: "decision" }
      ],
      edges: [
        ...dataset.sources.map(s => ({ from: "input-q", to: s.id, label: "References" })),
        ...dataset.sources.map(s => ({ from: s.id, to: "conclusion-node", label: s.decision === 'accepted' ? "Corroborates" : "Refutes" })),
        ...dataset.claims.map(c => ({ from: c.id, to: "conclusion-node", label: "Evaluates" }))
      ]
    },
    alternatives: [
      {
        hypothesis: "Complete Compliance with Stated Target",
        status: "debunked",
        confidence: 12,
        reason: "Overwhelming physical and regulatory evidence demonstrates systematic shortfalls from the public claim."
      },
      {
        hypothesis: "Localized Partial Target Attainment",
        status: "verified",
        confidence: 88,
        reason: "Sub-targets in select European and California test nodes were successfully met."
      }
    ],
    hallucinationChecks: {
      faithfulness: { score: 98, rationale: "Every detail traces to official regulatory or journalistic investigations." },
      grounding: { score: 96, rationale: "No unsourced statements are introduced into final audit ledger." },
      citationCheck: { score: 99, rationale: "All cited items exactly match corresponding document indices." },
      consistency: { score: 95, rationale: "Agent consensus achieved 100% agreement on final verdict." },
      evidenceCoverage: { score: 90, rationale: "Covers municipal, federal, corporate, and independent third-party indices." }
    }
  };
}
