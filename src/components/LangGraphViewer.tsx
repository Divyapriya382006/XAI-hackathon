import React from 'react';
import { Play, Pause, Activity, RefreshCw } from 'lucide-react';

export interface LangNode {
  id: string;
  label: string;
  role: string;
  step: number; // The milestone step when it executes
  x: number;    // Grid column: -1 for left, 0 for center, 1 for right
  y: number;    // Vertical rank
  details: {
    title: string;
    metrics: { label: string; val: string }[];
    io: { input: string; output: string };
    latency: string;
    toolCalls: string[];
    errors: string;
  };
}

export const LANGGRAPH_NODES: LangNode[] = [
  {
    id: 'start',
    label: 'Start Node',
    role: 'System Trigger',
    step: 0,
    x: 0,
    y: 0,
    details: {
      title: 'Investigation Initiator',
      metrics: [
        { label: 'Event Trigger', val: 'USER_RESEARCH_QUERY' },
        { label: 'Ingress Port', val: 'Secure HTTPS Ingress' },
        { label: 'Timestamp', val: '12:30:00.002 UTC' }
      ],
      io: {
        input: 'User prompt: "Examine corporate sustainability claims and satellite metrics."',
        output: 'System trigger dispatched to Task Planner.'
      },
      latency: '2 ms',
      toolCalls: [],
      errors: 'None'
    }
  },
  {
    id: 'planner',
    label: 'Planner Agent',
    role: 'Goal Decomposer',
    step: 1,
    x: 0,
    y: 1,
    details: {
      title: 'Planner Agent Forensic Audit',
      metrics: [
        { label: 'Generated Tasks', val: '7 Discrete Subtasks' },
        { label: 'Strategy Map', val: 'Dynamic Parallel Grounding' },
        { label: 'Confidence Score', val: '100% (High Certainty)' }
      ],
      io: {
        input: 'Parsed goal statement: "Did Coca-Cola exaggerate its sustainability claims?"',
        output: '7-phase task decomposition JSON mapped to target nodes.'
      },
      latency: '84 ms',
      toolCalls: ['DecomposeInquiry()', 'EstablishVerificationAnchors()'],
      errors: 'None'
    }
  },
  {
    id: 'normalizer',
    label: 'Query Normalizer',
    role: 'Semantic Resolver',
    step: 2,
    x: 0,
    y: 2,
    details: {
      title: 'Semantic Query Normalizer Audit',
      metrics: [
        { label: 'Search Targets', val: '6 Synonyms resolved' },
        { label: 'Context Filters', val: 'Approved Academic & Legal' },
        { label: 'Language Density', val: '98.5% confidence' }
      ],
      io: {
        input: '"Coca-Cola plastic target", "Scope 1 emissions discrepancy"',
        output: 'Formulated query vectors mapped to physical search anchors.'
      },
      latency: '42 ms',
      toolCalls: ['ResolveSynonyms()', 'FormulateVectors()'],
      errors: 'None'
    }
  },
  {
    id: 'evidence_planner',
    label: 'Evidence Planner',
    role: 'Vector Routing Hub',
    step: 3,
    x: 0,
    y: 3,
    details: {
      title: 'Evidence Router Hub Audit',
      metrics: [
        { label: 'Weight Allocation', val: 'Academic (0.45) | Gov (0.40) | Press (0.15)' },
        { label: 'Routing Strategy', val: 'Multi-threaded parallel fetch' },
        { label: 'Max Depth limit', val: '3 hops' }
      ],
      io: {
        input: 'Decomposed task list with relevance filters.',
        output: 'Parallel routing instructions dispatched to Search, Browser & PDF agents.'
      },
      latency: '35 ms',
      toolCalls: ['GetStrategicWeights()', 'InitializeParallelStreams()'],
      errors: 'None'
    }
  },
  {
    id: 'search',
    label: 'Search Agent',
    role: 'Google Grounding',
    step: 4,
    x: -1,
    y: 4,
    details: {
      title: 'Search Agent Grounding Audit',
      metrics: [
        { label: 'Queries Generated', val: '8 search parameters' },
        { label: 'Trusted Domains', val: 'Reuters, EPA, SEC, Academic Portal' },
        { label: 'Domain Rejected', val: 'Wikipedia (Reason: Insufficient authority)' }
      ],
      io: {
        input: 'Query vectors: "EPA municipal bottle recycling dumps" | "SEC sustainability dockets"',
        output: '18 high-reputation documents indexed into temporary buffer.'
      },
      latency: '1.8 sec',
      toolCalls: ['PerformGoogleSearch()', 'FilterLowAuthorityDomains()'],
      errors: 'None'
    }
  },
  {
    id: 'browser',
    label: 'Browser Agent',
    role: 'DOM Scraper',
    step: 4,
    x: 0,
    y: 4,
    details: {
      title: 'Headless Browser Agent Scraping Audit',
      metrics: [
        { label: 'DOM Nodes Inspected', val: '4,201 elements' },
        { label: 'Crawl Targets', val: 'coca-cola.com, EPA-bulletins.org' },
        { label: 'Security Handshake', val: 'SSL verified / Scripts stripped' }
      ],
      io: {
        input: 'Target corporate press releases and active sustainability links.',
        output: 'HTML parsed content payload with CSS formatting stripped.'
      },
      latency: '1.4 sec',
      toolCalls: ['SpawnHeadlessBrowser()', 'StripJavascript()', 'ExtractSemanticText()'],
      errors: 'None'
    }
  },
  {
    id: 'pdf_vision',
    label: 'PDF & Vision Agent',
    role: 'Document Parser',
    step: 4,
    x: 1,
    y: 4,
    details: {
      title: 'PDF Parser & Vision OCR Audit',
      metrics: [
        { label: 'Pages Indexed', val: '184 pages' },
        { label: 'Tables Extracted', val: '12 active tables' },
        { label: 'SHA-256 Fingerprint', val: 'd8f3a8b29c017ef36d6a2f7c9e80ba1e' }
      ],
      io: {
        input: 'User-uploaded emissions_report_2025.pdf & amazon_canopy.png',
        output: 'Structured tabular data vectors and OCR layout coordinates.'
      },
      latency: '2.1 sec',
      toolCalls: ['ParsePdfStructure()', 'OCRScanImage()', 'GenerateSHA256Hash()'],
      errors: 'None'
    }
  },
  {
    id: 'merge',
    label: 'Evidence Merge',
    role: 'Aggregation Hub',
    step: 5,
    x: 0,
    y: 5,
    details: {
      title: 'Evidence Merging & Deduplication Audit',
      metrics: [
        { label: 'Total Ingested Sources', val: '26 document entries' },
        { label: 'Extracted Facts Linked', val: '134 evidence lines' },
        { label: 'Conflicts Resolved', val: '7 resolved | 2 pending' }
      ],
      io: {
        input: 'Disjointed raw text chunks from Search, Browser, and PDF agents.',
        output: 'Unified, deduplicated fact graph mapping claims to citations.'
      },
      latency: '450 ms',
      toolCalls: ['DeduplicateVectors()', 'AlignSchedules()', 'FlagContradictingRecords()'],
      errors: 'None'
    }
  },
  {
    id: 'claim_extractor',
    label: 'Claim Extractor',
    role: 'Assertion Isolator',
    step: 6,
    x: 0,
    y: 6,
    details: {
      title: 'Claim Extractor Audit',
      metrics: [
        { label: 'Extracted Claims', val: '47 raw statements' },
        { label: 'Filtered Assertions', val: '39 unique claims' },
        { label: 'Ambiguous Excluded', val: '8 non-verifiable claims' }
      ],
      io: {
        input: 'Unified evidence facts graph.',
        output: '39 localized, testable claim statements containing metrics.'
      },
      latency: '280 ms',
      toolCalls: ['IsolateAssertions()', 'PruneGenericStatements()'],
      errors: 'None'
    }
  },
  {
    id: 'cross_verification',
    label: 'Cross Verification',
    role: 'Parallel Validator',
    step: 7,
    x: 0,
    y: 7,
    details: {
      title: 'Cross-Verification Engine Audit',
      metrics: [
        { label: 'Models Run', val: 'Qwen-72B, GPT-4o, Gemini-1.5-Pro' },
        { label: 'Grounding Verification', val: '94% factual certainty rate' },
        { label: 'Consensus Rate', val: '98% models agreed' }
      ],
      io: {
        input: '39 unique statements with linked reference coordinates.',
        output: 'Grounding matrix grading each statement on factual compliance.'
      },
      latency: '2.4 sec',
      toolCalls: ['InvokeEnsembleModels()', 'VerifyCitations()', 'CalculateConsensusIndex()'],
      errors: 'None'
    }
  },
  {
    id: 'contradiction_detector',
    label: 'Conflict Auditor',
    role: 'Overlap Agent',
    step: 8,
    x: 0,
    y: 8,
    details: {
      title: 'Contradiction & Overlap Auditor Ledger',
      metrics: [
        { label: 'Conflicts Flagged', val: '2 critical discrepancies' },
        { label: 'Agreement Index', val: '78% typical alignment' },
        { label: 'Divergence Score', val: '0.84 semantic distance' }
      ],
      io: {
        input: 'Grounding compliance matrix.',
        output: 'Causal verification logs isolating statements in conflict with benchmarks.'
      },
      latency: '190 ms',
      toolCalls: ['DetectLogicalGaps()', 'CompareTargetMetrics()'],
      errors: 'None'
    }
  },
  {
    id: 'hallucination_guard',
    label: 'Guard Agent',
    role: 'Grounded Supervisor',
    step: 9,
    x: 0,
    y: 9,
    details: {
      title: 'Hallucination Guard Audit',
      metrics: [
        { label: 'Statements Audited', val: '47 candidate claims' },
        { label: 'Grounded References', val: '44 fully supported statements' },
        { label: 'Unsupported Purged', val: '3 removed (No authoritative anchor)' }
      ],
      io: {
        input: 'Synthesized argument files before publishing.',
        output: 'Verified, hallucination-free output draft. Status: PASS.'
      },
      latency: '310 ms',
      toolCalls: ['AuditSentenceFaithfulness()', 'RejectUngroundedDrafts()'],
      errors: 'None'
    }
  },
  {
    id: 'judge',
    label: 'Judge Agent',
    role: 'Consensus Synthesizer',
    step: 10,
    x: 0,
    y: 10,
    details: {
      title: 'Judge Agent Verdict Synthesis',
      metrics: [
        { label: 'Weighed Hypotheses', val: '4 alternative scenarios' },
        { label: 'Approved Winner', val: 'Hypothesis 2 (Exaggerated claims)' },
        { label: 'Overall Confidence', val: '93% Certainty rating' }
      ],
      io: {
        input: 'Verified argument draft, contradiction maps, and grounding matrix.',
        output: 'Finalized verdict classifications and formal executive summaries.'
      },
      latency: '1.1 sec',
      toolCalls: ['WeighHypotheses()', 'CalculateAggregateScore()'],
      errors: 'None'
    }
  },
  {
    id: 'explanation_generator',
    label: 'Explanation Engine',
    role: 'Causal Explainer',
    step: 11,
    x: 0,
    y: 11,
    details: {
      title: 'Causal Explanation Generator Audit',
      metrics: [
        { label: 'Shap Weights Derived', val: '5 weights mapped' },
        { label: 'Counterfactual Model', val: 'Resilience verified' },
        { label: 'Lime Highlight Density', val: '12 paragraphs flagged' }
      ],
      io: {
        input: 'Finalized judge verdict data and confidence breakdowns.',
        output: 'Human-readable LIME highlighters and SHAP explanation charts.'
      },
      latency: '620 ms',
      toolCalls: ['GenerateShapleyWeights()', 'ComputeLimeImpacts()'],
      errors: 'None'
    }
  },
  {
    id: 'audit_logger',
    label: 'Audit Logger',
    role: 'Immutable Ledger',
    step: 12,
    x: 0,
    y: 12,
    details: {
      title: 'Forensic Audit Logger & Committer',
      metrics: [
        { label: 'Ledger Hash ID', val: 'SHA-256: e3b0c44298fc1c149afbf4c8996fb924' },
        { label: 'Verification Code', val: 'COMMITTED_EAIP_SECURE_2026' },
        { label: 'Signatures Ingested', val: '8 parallel agent cryptographic keys' }
      ],
      io: {
        input: 'Complete investigation record and citations trace logs.',
        output: 'Immutable audit log written to forensic verification ledger.'
      },
      latency: '90 ms',
      toolCalls: ['CommitLedgerEntry()', 'GenerateCryptographicSignature()'],
      errors: 'None'
    }
  },
  {
    id: 'end',
    label: 'END Node',
    role: 'System Complete',
    step: 13,
    x: 0,
    y: 13,
    details: {
      title: 'Investigation Concluded',
      metrics: [
        { label: 'Final Audit Status', val: 'SUCCESS_COMMITTED_SECURE' },
        { label: 'Active Swarms Disposed', val: 'All parallel sandboxes closed' },
        { label: 'Total Exec Latency', val: '11.83 seconds' }
      ],
      io: {
        input: 'Written immutable ledger file confirmation.',
        output: 'System terminal on standby.'
      },
      latency: '1 ms',
      toolCalls: [],
      errors: 'None'
    }
  }
];

interface LangGraphViewerProps {
  currentStep: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  replaySpeed: number;
  setReplaySpeed: (speed: number) => void;
  isReplaying: boolean;
  setIsReplaying: (val: boolean) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
}

export default function LangGraphViewer({
  currentStep,
  selectedNodeId,
  onSelectNode,
  replaySpeed,
  setReplaySpeed,
  isReplaying,
  setIsReplaying,
  onStepForward,
  onStepBackward,
  onReset
}: LangGraphViewerProps) {
  
  // Grid parameters to scale the layout
  const colWidth = 110;
  const rowHeight = 64;
  const paddingY = 24;
  const paddingX = 140;

  // Helper to translate x, y into pixels
  const getCoords = (node: LangNode) => {
    return {
      cx: paddingX + node.x * colWidth,
      cy: paddingY + node.y * rowHeight
    };
  };

  const getNodeStatus = (node: LangNode): 'completed' | 'running' | 'queued' => {
    // Search, Browser, PDF_Vision are all on step 4 (parallel)
    if (node.step < currentStep) return 'completed';
    if (node.step === currentStep) return 'running';
    return 'queued';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full" id="langgraph-visualizer">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
            <Activity className="text-emerald-400 w-4 h-4" />
            Live LangGraph Swarm Agent Loop
          </h3>
          <p className="text-[11px] text-slate-400">
            Interactive LangGraph execution network. Click any agent node to drill down into its Forensic Ledger.
          </p>
        </div>
      </div>

      {/* Interactive Playback Control Board */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsReplaying(!isReplaying); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isReplaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
            }`}
            id="play-pause-btn"
          >
            {isReplaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isReplaying ? 'Pause' : 'Play Replay'}
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStep === 0}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            title="Step Backward"
            id="prev-step-btn"
          >
            ⏮
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStep >= 13}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            title="Step Forward"
            id="next-step-btn"
          >
            ⏭
          </button>

          <button
            onClick={onReset}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Reset to Start"
            id="reset-timeline-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-[10px] font-mono">
            {[0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setReplaySpeed(speed)}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  replaySpeed === speed
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
                id={`speed-btn-${speed}`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Step: <strong className="text-white">{currentStep} / 13</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Graph Canvas */}
      <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl overflow-y-auto relative p-3 min-h-[580px] max-h-[750px] flex items-center justify-center">
        
        <svg className="absolute inset-0 w-full h-[950px] pointer-events-none z-0">
          <defs>
            <marker id="arrow-completed" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-running" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
            <marker id="arrow-queued" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
          </defs>

          {/* Render Connection Paths */}
          {(() => {
            const paths: React.ReactNode[] = [];
            
            // Generate link paths between sequential nodes
            for (let i = 0; i < LANGGRAPH_NODES.length; i++) {
              const fromNode = LANGGRAPH_NODES[i];
              const fromCoords = getCoords(fromNode);
              const fromStatus = getNodeStatus(fromNode);

              // Connect normal flow sequentially, handling split and merges
              if (fromNode.id === 'evidence_planner') {
                // Splits to search, browser, pdf_vision
                ['search', 'browser', 'pdf_vision'].forEach((toId) => {
                  const toNode = LANGGRAPH_NODES.find(n => n.id === toId);
                  if (toNode) {
                    const toCoords = getCoords(toNode);
                    const toStatus = getNodeStatus(toNode);
                    const strokeColor = toStatus === 'completed' ? '#10b981' : toStatus === 'running' ? '#fbbf24' : '#475569';
                    const markerId = toStatus === 'completed' ? 'arrow-completed' : toStatus === 'running' ? 'arrow-running' : 'arrow-queued';
                    const isDash = toStatus === 'running';

                    paths.push(
                      <path
                        key={`${fromNode.id}-${toId}`}
                        d={`M ${fromCoords.cx} ${fromCoords.cy} C ${fromCoords.cx} ${fromCoords.cy + 30}, ${toCoords.cx} ${toCoords.cy - 30}, ${toCoords.cx} ${toCoords.cy}`}
                        stroke={strokeColor}
                        strokeWidth={toStatus === 'completed' ? 2 : 1.5}
                        strokeDasharray={isDash ? '4,4' : undefined}
                        className={isDash ? 'animate-[dash_1s_linear_infinite]' : ''}
                        fill="none"
                        markerEnd={`url(#${markerId})`}
                      />
                    );
                  }
                });
              } else if (['search', 'browser', 'pdf_vision'].includes(fromNode.id)) {
                // Merge to Evidence Merge node
                const toNode = LANGGRAPH_NODES.find(n => n.id === 'merge');
                if (toNode) {
                  const toCoords = getCoords(toNode);
                  const toStatus = getNodeStatus(toNode);
                  const strokeColor = toStatus === 'completed' ? '#10b981' : toStatus === 'running' ? '#fbbf24' : '#475569';
                  const markerId = toStatus === 'completed' ? 'arrow-completed' : toStatus === 'running' ? 'arrow-running' : 'arrow-queued';
                  const isDash = toStatus === 'running';

                  paths.push(
                    <path
                      key={`${fromNode.id}-merge`}
                      d={`M ${fromCoords.cx} ${fromCoords.cy} C ${fromCoords.cx} ${fromCoords.cy + 30}, ${toCoords.cx} ${toCoords.cy - 30}, ${toCoords.cx} ${toCoords.cy}`}
                      stroke={strokeColor}
                      strokeWidth={toStatus === 'completed' ? 2 : 1.5}
                      strokeDasharray={isDash ? '4,4' : undefined}
                      className={isDash ? 'animate-[dash_1s_linear_infinite]' : ''}
                      fill="none"
                      markerEnd={`url(#${markerId})`}
                    />
                  );
                }
              } else if (fromNode.id !== 'end') {
                // Sequential connection
                const toNode = LANGGRAPH_NODES[i + 1];
                // Skip if current node is a parallel child, we already handled search/browser/pdf_vision above
                if (['search', 'browser', 'pdf_vision'].includes(toNode.id)) {
                  // Do nothing, already linked
                } else {
                  const toCoords = getCoords(toNode);
                  const toStatus = getNodeStatus(toNode);
                  const strokeColor = toStatus === 'completed' ? '#10b981' : toStatus === 'running' ? '#fbbf24' : '#475569';
                  const markerId = toStatus === 'completed' ? 'arrow-completed' : toStatus === 'running' ? 'arrow-running' : 'arrow-queued';
                  const isDash = toStatus === 'running';

                  paths.push(
                    <line
                      key={`${fromNode.id}-${toNode.id}`}
                      x1={fromCoords.cx}
                      y1={fromCoords.cy}
                      x2={toCoords.cx}
                      y2={toCoords.cy}
                      stroke={strokeColor}
                      strokeWidth={toStatus === 'completed' ? 2 : 1.5}
                      strokeDasharray={isDash ? '4,4' : undefined}
                      className={isDash ? 'animate-[dash_1s_linear_infinite]' : ''}
                      markerEnd={`url(#${markerId})`}
                    />
                  );
                }
              }
            }
            return paths;
          })()}
        </svg>

        {/* Nodes Grid Layout */}
        <div className="absolute top-0 bottom-0 left-0 right-0 h-[950px] z-10 pointer-events-none">
          {LANGGRAPH_NODES.map((node) => {
            const coords = getCoords(node);
            const status = getNodeStatus(node);
            const isSelected = selectedNodeId === node.id;
            
            // Node Color styling
            let borderStyle = 'border-slate-800 bg-slate-900 text-slate-500';
            let glowStyle = '';
            
            if (status === 'completed') {
              borderStyle = 'border-emerald-500/40 bg-slate-900 text-emerald-300';
            } else if (status === 'running') {
              borderStyle = 'border-amber-500 bg-slate-900 text-amber-200 ring-2 ring-amber-500/20';
              glowStyle = 'animate-pulse';
            }

            if (isSelected) {
              borderStyle = 'border-sky-500 bg-slate-900 text-sky-100 ring-2 ring-sky-500/40 shadow-lg shadow-sky-500/10';
            }

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                style={{
                  position: 'absolute',
                  left: `${coords.cx}px`,
                  top: `${coords.cy}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`w-[110px] p-2 rounded-xl border text-center cursor-pointer transition-all duration-300 pointer-events-auto select-none ${borderStyle} ${glowStyle} hover:scale-105 hover:border-sky-400 group`}
                id={`langnode-${node.id}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    {status === 'completed' ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                    ) : status === 'running' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                    <span className="text-[10px] font-bold tracking-tight truncate max-w-[85px] text-white">
                      {node.label.replace(' Agent', '').replace(' Node', '')}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 block truncate max-w-[95px] mt-0.5 opacity-80 group-hover:text-sky-300">
                    {node.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Styled css rule for dash flow animation */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}
