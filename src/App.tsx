import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Link2,
  FileText,
  Globe,
  UploadCloud,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Radio,
  Terminal,
  Sliders,
  GitFork,
  Cpu,
  Layers,
  Activity,
  Trash2,
  Plus,
  Compass,
  AlertTriangle,
  Info,
  ChevronRight,
  Search,
  Eye,
  ShieldAlert,
  Check,
  ExternalLink,
  Sparkles,
  Binary,
  TrendingUp,
  GitMerge,
  Award,
  History
} from 'lucide-react';

import {
  Source,
  Claim,
  Alternative,
  TraceEvent,
  InvestigationCase,
  UserInputFile
} from './types';

// Import our highly polished sub-components
import LangGraphViewer from './components/LangGraphViewer';
import ForensicLedger from './components/ForensicLedger';
import CitationTrailViewer from './components/CitationTrailViewer';
import CounterfactualSandbox from './components/CounterfactualSandbox';
import VerificationReport from './components/VerificationReport';
import SimulationConsoleView from './components/SimulationConsoleView';
import ThinkingProcessViewer from './components/ThinkingProcessViewer';
import AllSourcesPanel from './components/AllSourcesPanel';

export default function App() {
  // Input states
  const [question, setQuestion] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<UserInputFile[]>([]);
  const [newUrl, setNewUrl] = useState<string>('');

  // Execution states
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [result, setResult] = useState<InvestigationCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<import('./types').ThinkingStep[]>([]);
  const [allSources, setAllSources] = useState<import('./types').Source[]>([]);

  // ── Causal timing state ─────────────────────────────────────────────────
  // These three timestamps prove the correct causal order:
  //   requestSentAt < responseReceivedAt < verdictVisibleAt
  const [requestSentAt, setRequestSentAt] = useState<string | null>(null);
  const [responseReceivedAt, setResponseReceivedAt] = useState<string | null>(null);
  const [verdictVisibleAt, setVerdictVisibleAt] = useState<string | null>(null);
  // animationComplete gates whether the verdict banner renders at all.
  // It starts false and is set true only when currentStep reaches 13.
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  // actualBackendMs: real measured latency in ms, used to pace animation
  const actualBackendMsRef = useRef<number>(0);

  // Redesign Feature State: Timeline Replay Controls & Active Node Focus
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 0.5x, 1x, 2x, 5x
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag-and-drop files handler
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Animation replay effect ────────────────────────────────────────────
  // The interval duration is derived from the REAL backend latency so that:
  //   - If the backend took 30 s, each of 14 steps shows for ~2 s (realistic)
  //   - If it took 5 s, each step is ~350 ms (snappy)
  // replaySpeed is a user multiplier on top.
  useEffect(() => {
    if (isReplaying) {
      // Target: spread 14 steps across ~80% of actual backend time (min 800ms/step)
      const backendMs = actualBackendMsRef.current || 14_000;
      const baseIntervalMs = Math.max(800, Math.round((backendMs * 0.8) / 14));
      const intervalMs = Math.round(baseIntervalMs / replaySpeed);

      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= 13) {
            // Animation has reached the END node — only NOW unlock the verdict banner
            setIsReplaying(false);
            setAnimationComplete(true);
            // Record exact timestamp when verdict becomes visible
            setVerdictVisibleAt(new Date().toISOString());
            return 13;
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isReplaying, replaySpeed]);

  const handleFilesAdded = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
      const isTxt = file.type.startsWith('text/') || /\.(txt|csv|json|md|log|xml|html)$/i.test(file.name);
      
      const fileType = isImg ? 'image' : (file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.docx') ? 'docx' : 'text'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultStr = e.target?.result as string;
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: fileType as any,
          size: sizeStr,
          content: resultStr
        }]);
      };
      
      if (isImg) {
        reader.readAsDataURL(file);
      } else if (isTxt) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isInvestigating) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isInvestigating) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const addUrlInput = () => {
    if (!newUrl) return;
    setAttachedFiles(prev => [...prev, {
      name: newUrl,
      type: 'text',
      size: 'Web URL',
      content: `Target URL link to scrape: ${newUrl}. Investigate any statements associated with this online link.`
    }]);
    setNewUrl('');
  };



  // ── Core investigation handler ────────────────────────────────────────
  const runInvestigation = async () => {
    if (!question.trim()) return;

    // ① Stamp request sent time BEFORE the fetch
    const tSent = new Date().toISOString();
    const tSentMs = Date.now();
    setRequestSentAt(tSent);
    setResponseReceivedAt(null);
    setVerdictVisibleAt(null);
    setAnimationComplete(false); // verdict banner hidden until animation finishes
    setResult(null);
    setCurrentStep(0);
    setIsInvestigating(true);
    setError(null);

    try {
      const apiHost = window.location.port && window.location.port !== '3000' 
        ? `${window.location.protocol}//${window.location.hostname}:3000` 
        : '';
      const response = await fetch(`${apiHost}/api/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          demoMode: false,
          inputs: attachedFiles.map(f => ({
            type: f.type,
            name: f.name,
            size: f.size,
            content: f.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Autonomous investigation endpoint failed.');
      }

      const data: InvestigationCase = await response.json();

      // ② Stamp response received — BEFORE any state updates that could render verdict
      const tReceived = new Date().toISOString();
      const backendMs = Date.now() - tSentMs;
      setResponseReceivedAt(tReceived);
      actualBackendMsRef.current = backendMs; // drives animation pacing

      // Extract supplementary data
      if (data.thinkingSteps && data.thinkingSteps.length > 0) {
        setThinkingSteps(data.thinkingSteps);
      }
      if (data.allSources && data.allSources.length > 0) {
        setAllSources(data.allSources);
      } else if (data.sources && data.sources.length > 0) {
        setAllSources(data.sources);
      }

      // Store result (but animationComplete=false so verdict banner is hidden)
      setResult(data);

      // ③ Start animation from step 0 — verdict only unlocks when it reaches step 13
      setCurrentStep(0);
      setSelectedNodeId(null);
      setIsReplaying(true); // timer kicks off; verdictVisibleAt set inside the effect

    } catch (err: any) {
      setError(err.message || 'An error occurred during evidence aggregation.');
    } finally {
      setIsInvestigating(false);
    }
  };

  const getVerdictBadgeColor = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('verified')) return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
    if (v.includes('debunked') || v.includes('false')) return 'bg-rose-950/40 text-rose-400 border-rose-500/30';
    if (v.includes('exaggerated')) return 'bg-amber-950/40 text-amber-400 border-amber-500/30';
    return 'bg-slate-900 text-slate-300 border-slate-800';
  };

  // Timeline replay custom controls
  const handleStepForward = () => {
    setCurrentStep(prev => {
      const next = Math.min(13, prev + 1);
      if (next === 13) {
        // User manually fast-forwarded to the end — unlock verdict
        setAnimationComplete(true);
        if (!verdictVisibleAt) setVerdictVisibleAt(new Date().toISOString());
      }
      return next;
    });
  };

  const handleStepBackward = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    // stepping backward hides the verdict again so it's not stale
    setAnimationComplete(false);
    setVerdictVisibleAt(null);
  };

  const handleResetTimeline = () => {
    setCurrentStep(0);
    setIsReplaying(false);
    setAnimationComplete(false);
    setVerdictVisibleAt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans antialiased" id="eaip-root">
      
      {/* Platform Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                EAIP Investigation OS
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase tracking-widest">
                Explainable Autonomous Agent framework
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              FORENSIC LEDGER ACTIVE
            </span>
            <span className="text-xs text-slate-500 font-semibold font-mono hidden sm:inline">
              V3.2-PRO-AUDIT
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="app-main">
        
        {/* Launch Pad & Input Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="input-section">
          
          {/* Main Inquiry Panel */}
          <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight font-display">
                  Initiate Forensic Audit Investigation
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide any claim, press release, or research target. Upload supportive files like PDFs, spreadsheets, or graphics. The platform performs real-time crawling and web scraping of the target query to retrieve sources and analyze evidence.
              </p>
            </div>

            {/* Input Bar */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Target Corporate Claim / Research Prompt
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isInvestigating}
                  placeholder="Enter a corporate announcement, product claims, or dockets..."
                  className="w-full pl-4 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-65 animate-fade-in"
                  id="target-question-input"
                />
                <button
                  onClick={runInvestigation}
                  disabled={isInvestigating || !question.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 font-bold text-xs font-mono"
                  id="trigger-btn"
                >
                  {isInvestigating ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>RUNNING</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>RUN AUDIT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ingress Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Drag Drop Area */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept="image/*,application/pdf,text/*,.csv,.json,.md,.docx,.log"
                />
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Evidence Attachments ({attachedFiles.length})
                  </label>
                  <button
                    onClick={triggerFileUpload}
                    disabled={isInvestigating}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" /> Upload PDF/Image
                  </button>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileUpload}
                  className={`border rounded-xl p-3 min-h-[110px] space-y-1.5 max-h-[150px] overflow-y-auto transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : 'bg-slate-950/50 border-slate-850 hover:border-slate-700'
                  }`}
                  title="Click or drop files here"
                >
                  {attachedFiles.length === 0 ? (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                      <UploadCloud className="w-6 h-6 mb-1 text-slate-600" />
                      <span>Drag files here or <strong className="text-emerald-400">browse</strong></span>
                    </div>
                  ) : (
                    attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                        id={`attached-file-${idx}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 text-slate-300 font-semibold truncate">
                          {file.type === 'image' && file.content ? (
                            <img
                              src={file.content}
                              className="w-5 h-5 object-cover rounded border border-slate-700 shrink-0"
                              alt="Preview"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">({file.size})</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scraper link channel */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Crawl & Scraping URL Ingress
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    disabled={isInvestigating}
                    placeholder="https://sec.gov/files/sustainability-compliance"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-65"
                    id="new-url-input"
                  />
                  <button
                    onClick={addUrlInput}
                    disabled={isInvestigating || !newUrl}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-3.5 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed flex gap-2 items-start h-[110px]">
                  <Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    Adding online URLs initiates a custom scraping agent that crawls the layout, strips JavaScript payloads, isolates text claims, and indexes the links into the verification stream.
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <div className="bg-rose-950/20 border border-rose-900/50 p-3.5 rounded-xl flex gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Investigation Failed:</strong> {error}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 2. MAIN RESULTS WORKSPACE: THE INTEGRATED SPLIT PANEL CONSOLE */}
        {result && !isInvestigating && (
          <div className="space-y-8 animate-fade-in" id="results-workspace">

            {true && (
              <>
                {/* ── CAUSAL TIMESTAMP RIBBON ───────────────────────────────────────
                    Proves: requestSentAt < responseReceivedAt < verdictVisibleAt
                    The verdict banner below ONLY renders when verdictVisibleAt is set,
                    which happens inside the animation timer, AFTER the animation
                    completes at step 13. This ribbon is always visible for inspection. */}
                {requestSentAt && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px]" id="causal-timestamp-ribbon">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Causal Order Proof</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                      <span className="text-slate-500">① Request Sent:</span>
                      <span className="text-sky-300 font-bold" id="ts-request-sent">{new Date(requestSentAt).toLocaleTimeString(undefined, {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3 as any})}</span>
                    </span>
                    {responseReceivedAt && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-slate-500">② Response Received:</span>
                        <span className="text-amber-300 font-bold" id="ts-response-received">{new Date(responseReceivedAt).toLocaleTimeString(undefined, {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3 as any})}</span>
                        <span className="text-slate-600">(+{Math.round((new Date(responseReceivedAt).getTime() - new Date(requestSentAt).getTime())/1000)}s backend)</span>
                      </span>
                    )}
                    {verdictVisibleAt ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-slate-500">③ Verdict Visible:</span>
                        <span className="text-emerald-300 font-bold" id="ts-verdict-visible">{new Date(verdictVisibleAt).toLocaleTimeString(undefined, {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3 as any})}</span>
                        <span className="text-slate-600">(+{Math.round((new Date(verdictVisibleAt).getTime() - new Date(responseReceivedAt!).getTime())/1000)}s animation)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse shrink-0" />
                        <span className="text-slate-600">③ Verdict: awaiting animation step 13...</span>
                      </span>
                    )}
                  </div>
                )}

                {/* AUDIT SUMMARY ACCENT HEADER CARD — only renders when animation is complete */}
                {animationComplete && (
                <div className={`border rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden shadow-md border-l-4 ${getVerdictBadgeColor(result.conclusion.verdict)} animate-fade-in`} id="verdict-banner">
                  <div className="space-y-2.5 max-w-4xl flex-1 text-left">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-60 block">
                        ACTIVE FORENSIC CONCLUSION
                      </span>
                      <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-display mt-0.5">
                        {result.conclusion.verdict}
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm font-medium leading-relaxed opacity-95 text-slate-300">
                      {result.conclusion.summary}
                    </p>
                  </div>

                  {/* Aggregate confidence rating */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="opacity-10 text-slate-600" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * result.conclusion.confidence) / 100} className="transition-all duration-1000 ease-out text-emerald-500" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black font-mono leading-none text-white">{result.conclusion.confidence}%</span>
                        <span className="text-[8px] font-mono opacity-70 uppercase tracking-widest mt-1 font-bold">Accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Waiting message while animation plays */}
                {!animationComplete && (
                  <div className="border border-amber-800/30 bg-amber-950/10 rounded-2xl p-5 flex items-center gap-3" id="verdict-pending">
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                    <div className="text-xs font-mono">
                      <span className="text-amber-300 font-bold">PIPELINE EXECUTING</span>
                      <span className="text-slate-400 ml-2">— verdict will appear when the agent swarm completes (step {currentStep}/13)</span>
                    </div>
                  </div>
                )}

                {/* DUAL INTERACTIVE WORKSPACE: GRAPH LOOP ON THE LEFT & FORENSIC LEDGER ON THE RIGHT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-split">
                  
                  {/* LEFT COLUMN: Animated Clicking LangGraph Flow Map */}
                  <div className="lg:col-span-6 flex flex-col">
                    <LangGraphViewer
                      currentStep={currentStep}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
                      replaySpeed={replaySpeed}
                      setReplaySpeed={(speed) => setReplaySpeed(speed)}
                      isReplaying={isReplaying}
                      setIsReplaying={(val) => setIsReplaying(val)}
                      onStepForward={handleStepForward}
                      onStepBackward={handleStepBackward}
                      onReset={handleResetTimeline}
                      thinkingSteps={thinkingSteps}
                      question={question}
                    />
                  </div>

                  {/* RIGHT COLUMN: Ledger Entry details with cryptographically signed parameters */}
                  <div className="lg:col-span-6 flex flex-col">
                    <ForensicLedger
                      selectedNodeId={selectedNodeId}
                      currentStep={currentStep}
                      question={question}
                    />
                  </div>

                </div>

                {/* AGENT THINKING / CHAIN-OF-THOUGHT TRACE */}
                {thinkingSteps.length > 0 && (
                  <ThinkingProcessViewer
                    thinkingSteps={thinkingSteps}
                    isLive={false}
                  />
                )}

                {/* CITATION TRAIL & INTERACTIVE EVIDENCE GRAPH VISUALIZER */}
                <CitationTrailViewer 
                  question={question} 
                  sources={result.sources}
                  claims={result.claims}
                  decisionTrace={result.decisionTrace}
                  decisionGraph={result.decisionGraph}
                  demoMode={result.demoMode}
                />

                {/* ALL SOURCES - FULL TRANSPARENCY (accepted + rejected) */}
                {allSources.length > 0 && (
                  <AllSourcesPanel
                    allSources={allSources}
                    question={question}
                  />
                )}

                {/* IMPACT ANALYSIS & COUNTERFACTUAL EVIDENCE SANDBOX */}
                <CounterfactualSandbox
                  initialSources={result.sources}
                  initialConfidence={result.confidenceBreakdown}
                  initialVerdict={result.conclusion.verdict}
                  initialSummary={result.conclusion.summary}
                />

                {/* THE SEC/EPA COMPLIANT PDF AUDIT REPORT */}
                <VerificationReport
                  question={question}
                  verdict={result.conclusion.verdict}
                  summary={result.conclusion.summary}
                  confidence={result.conclusion.confidence}
                  sources={result.sources}
                  allSources={result.allSources}
                  decisionTrace={result.decisionTrace}
                  alternatives={result.alternatives}
                  hallucinationChecks={result.hallucinationChecks}
                />
              </>
            )}

          </div>
        )}

      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-8 text-center text-xs text-slate-500 font-medium shrink-0" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 Explainable Autonomous Investigation Platform (EAIP). All rights reserved.</p>
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Immutable 12-Phase Multi-Agent Causal Traceability System.
          </p>
        </div>
      </footer>

    </div>
  );
}

// Minimalist fallback for missing HelpCircle svg
function HelpCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
