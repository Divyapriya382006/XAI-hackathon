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
}

export interface LimePhrase {
  text: string;
  impact: 'positive' | 'negative' | 'neutral';
  score: number;
}

export interface Claim {
  id: string;
  text: string;
  status: 'verified' | 'exaggerated' | 'debunked' | 'unverified';
  confidence: number;
  explanation: string;
  limePhrases: LimePhrase[];
}

export interface Alternative {
  hypothesis: string;
  status: string;
  confidence: number;
  reason: string;
}

export interface HallucinationCheck {
  score: number;
  rationale: string;
}

export interface HallucinationChecks {
  faithfulness: HallucinationCheck;
  grounding: HallucinationCheck;
  citationCheck: HallucinationCheck;
  consistency: HallucinationCheck;
  evidenceCoverage: HallucinationCheck;
}

export interface TraceEvent {
  agent: string;
  event: string;
  details: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface Node {
  id: string;
  label: string;
  type: 'input' | 'evidence' | 'claim' | 'decision';
}

export interface Edge {
  from: string;
  to: string;
  label: string;
}

export interface DecisionGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface OverlayPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: string;
}

export interface ImageAnalysis {
  ocrText: string;
  caption: string;
  overlay: OverlayPoint[];
}

export interface ConfidenceBreakdown {
  source: number;
  evidence: number;
  reasoning: number;
  citation: number;
  overall: number;
}

export interface InvestigationCase {
  conclusion: {
    verdict: string;
    summary: string;
    confidence: number;
  };
  confidenceBreakdown: ConfidenceBreakdown;
  sources: Source[];
  claims: Claim[];
  alternatives: Alternative[];
  hallucinationChecks: HallucinationChecks;
  decisionTrace: TraceEvent[];
  decisionGraph: DecisionGraph;
  imageAnalysis?: ImageAnalysis;
  demoMode?: boolean;
  message?: string;
}

export interface UserInputFile {
  name: string;
  type: 'pdf' | 'docx' | 'image' | 'text';
  size: string;
  content?: string;
  previewUrl?: string;
}
