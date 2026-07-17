import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Radio,
  Terminal,
  Sliders,
  GitFork,
  Cpu,
  Layers,
  Activity,
  FileCode,
  Trash2,
  Plus,
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';

import {
  Source,
  Claim,
  Alternative,
  HallucinationChecks,
  TraceEvent,
  DecisionGraph,
  ImageAnalysis,
  ConfidenceBreakdown,
  InvestigationCase,
  UserInputFile
} from './types';

// Import sub-components
import ShapExplanation from './components/ShapExplanation';
import LimeHighlighter from './components/LimeHighlighter';
import CounterfactualSandbox from './components/CounterfactualSandbox';
import GradCamViewer from './components/GradCamViewer';
import DecisionGraphViewer from './components/DecisionGraphViewer';
import PipelineOverlay from './components/PipelineOverlay';

export default function App() {
  // Input states
  const [question, setQuestion] = useState<string>('Did this company exaggerate its sustainability claims?');
  const [attachedFiles, setAttachedFiles] = useState<UserInputFile[]>([
    { name: 'emissions_report_2025.pdf', type: 'pdf', size: '1.8 MB' },
    { name: 'amazonian_offset_canopy.png', type: 'image', size: '4.2 MB' }
  ]);
  const [newUrl, setNewUrl] = useState<string>('');

  // Execution states
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [result, setResult] = useState<InvestigationCase | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI Active tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'counterfactual' | 'claims' | 'sources' | 'graph'>('overview');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // File Upload Handlers (Simulated for high fidelity client side UX)
  const triggerFileUpload = () => {
    const fileNames = ['global_regulatory_log.docx', 'whistleblower_comms.docx', 'satellite_canopy_delta.png', 'sec_filing_extract.pdf'];
    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const randomType = randomName.endsWith('.pdf') ? 'pdf' : randomName.endsWith('.png') ? 'image' : 'docx';
    const randomSize = `${(Math.random() * 3 + 1).toFixed(1)} MB`;

    setAttachedFiles(prev => [...prev, {
      name: randomName,
      type: randomType,
      size: randomSize
    }]);
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const addUrlInput = () => {
    if (!newUrl) return;
    setAttachedFiles(prev => [...prev, {
      name: newUrl,
      type: 'text',
      size: 'Web URL'
    }]);
    setNewUrl('');
  };

  // Prebuilt template shortcuts
  const selectTemplateCase = (topic: 'sustainability' | 'theranos' | 'tesla') => {
    if (topic === 'sustainability') {
      setQuestion('Did this company exaggerate its sustainability claims?');
      setAttachedFiles([
        { name: 'emissions_report_2025.pdf', type: 'pdf', size: '1.8 MB' },
        { name: 'amazonian_offset_canopy.png', type: 'image', size: '4.2 MB' }
      ]);
    } else if (topic === 'theranos') {
      setQuestion('Did Elizabeth Holmes exaggerate the Edison blood test specifications?');
      setAttachedFiles([
        { name: 'edison_device_schematic.png', type: 'image', size: '3.1 MB' },
        { name: 'lab_deficiencies_newark.pdf', type: 'pdf', size: '1.2 MB' }
      ]);
    } else if (topic === 'tesla') {
      setQuestion('Did Tesla exaggerate its early Solar Roof installation targets?');
      setAttachedFiles([
        { name: 'tesla_solarcity_lawsuit.pdf', type: 'pdf', size: '2.4 MB' },
        { name: 'tempered_glass_shingle.png', type: 'image', size: '1.9 MB' }
      ]);
    }
  };

  // Handle core investigation execution
  const runInvestigation = async () => {
    if (!question.trim()) return;
    
    setIsInvestigating(true);
    setError(null);

    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          inputs: attachedFiles.map(f => ({
            type: f.type,
            name: f.name
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Autonomous investigation endpoint failed.');
      }

      const data: InvestigationCase = await response.json();
      
      // Load completed investigation data
      setResult(data);
      
      // Auto-focus first source & claim for convenient layout defaults
      if (data.sources && data.sources.length > 0) {
        setSelectedSourceId(data.sources[0].id);
      }
      if (data.claims && data.claims.length > 0) {
        setSelectedClaimId(data.claims[0].id);
      }

      // Trigger the spectacular animated multi-agent overlay!
      setShowOverlay(true);

    } catch (err: any) {
      setError(err.message || 'An error occurred during evidence aggregation.');
      setIsInvestigating(false);
    }
  };

  const getVerdictBadgeColor = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('verified')) return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
    if (v.includes('debunked') || v.includes('false')) return 'bg-rose-950/40 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]';
    if (v.includes('exaggerated')) return 'bg-amber-950/40 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]';
    return 'bg-slate-900 text-slate-300 border-slate-800 shadow-[0_0_15px_rgba(148,163,184,0.05)]';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans antialiased" id="eaip-root">
      
      {/* Dynamic Parallel Agent Progress Overlay */}
      {showOverlay && result && (
        <PipelineOverlay
          events={result.decisionTrace}
          question={question}
          onComplete={() => {
            setShowOverlay(false);
            setIsInvestigating(false);
            setActiveTab('overview');
          }}
        />
      )}

      {/* Primary Header Area */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                EAIP Portal
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase tracking-widest">
                Explainable Autonomous Investigation Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {result?.demoMode && (
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Demonstration Mode Active
              </span>
            )}
            <span className="text-xs text-slate-500 font-semibold font-mono hidden sm:inline">
              V2.5.0-Celerity
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="app-main">
        
        {/* Intro Block & Input Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="input-section">
          
          {/* Main Investigation Launcher */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white tracking-tight font-display">
                Launch Grounded Multi-Agent Audit
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Formulate any research question, claim, or target statement. Link supportive regulatory filings or evidence images to index them across agents.
              </p>
            </div>

            {/* Claim/Question Input Bar */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Research Question or Statement
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isInvestigating}
                  placeholder="Enter a target corporate statement, public claim, or news report..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-65"
                  id="target-question-input"
                />
                <button
                  onClick={runInvestigation}
                  disabled={isInvestigating || !question.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3.5 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  id="trigger-btn"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold font-mono">RUN</span>
                </button>
              </div>
            </div>

            {/* Multimodal Input drawers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* File Attachment List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Attached Evidence ({attachedFiles.length})
                  </label>
                  <button
                    onClick={triggerFileUpload}
                    disabled={isInvestigating}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" /> Add Sample File
                  </button>
                </div>

                <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 min-h-[110px] space-y-1.5 max-h-[150px] overflow-y-auto">
                  {attachedFiles.length === 0 ? (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <UploadCloud className="w-6 h-6 mb-1 text-slate-600" />
                      No evidence files loaded.
                    </div>
                  ) : (
                    attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs" id={`attached-file-${idx}`}>
                        <div className="flex items-center gap-2 text-slate-300 font-semibold truncate">
                          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-[9px] font-mono text-slate-500 font-normal">({file.size})</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* URL Adding Block */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Scrape Website URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    disabled={isInvestigating}
                    placeholder="https://example.com/source-link"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-65"
                    id="new-url-input"
                  />
                  <button
                    onClick={addUrlInput}
                    disabled={isInvestigating || !newUrl}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-3 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3.5 text-[11px] text-slate-400 leading-relaxed flex gap-2 items-start h-[110px]">
                  <Globe className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    Adding URLs routes a simulated <strong>Browser Agent</strong> to crawl the target host DOM, strip layout noise, extract publisher metadata, and align claims in parallel.
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <div className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-xl flex gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Investigation Failed:</strong> {error}
                </div>
              </div>
            )}
          </div>

          {/* Quick-Launch Presets */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                <Compass className="w-4 h-4 text-emerald-400" />
                Select Prebuilt Investigation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly load highly detailed, multi-agent cases with pre-configured regulatory logs and images.
              </p>
            </div>

            <div className="space-y-2.5 flex-1 mt-3">
              {[
                {
                  id: 'sustainability',
                  title: 'ESG Greenwashing Claim',
                  desc: 'Corporate offsets and Scope 1-3 audit discrepancies.',
                  verdict: 'Exaggerated'
                },
                {
                  id: 'theranos',
                  title: 'Theranos Blood Tech Fraud',
                  desc: 'Edison cartridge volumes vs Siemens modifications.',
                  verdict: 'Debunked'
                },
                {
                  id: 'tesla',
                  title: 'Tesla Solar Roof Rollout',
                  desc: 'Target deployment numbers versus state utility metrics.',
                  verdict: 'Exaggerated'
                }
              ].map((template) => (
                <button
                  key={template.id}
                  onClick={() => selectTemplateCase(template.id as any)}
                  disabled={isInvestigating}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-emerald-500 hover:bg-slate-950/50 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  id={`preset-btn-${template.id}`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {template.title}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-normal">
                      {template.desc}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-2 ${
                    template.verdict === 'Debunked' ? 'bg-rose-950/50 border-rose-900/40 text-rose-400' : 'bg-amber-950/50 border-amber-900/40 text-amber-400'
                  }`}>
                    {template.verdict}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500 leading-normal">
              <strong>Tip:</strong> Click any prebuilt card above, then press the glowing green <strong>RUN</strong> button to trigger the autonomous validation constellation.
            </div>
          </div>

        </div>

        {/* Results Workspace */}
        {result && !isInvestigating && (
          <div className="space-y-6" id="results-workspace">
            
            {/* Verdict Summary Panel */}
            <div className={`border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 justify-between relative overflow-hidden shadow-md border-l-4 ${getVerdictBadgeColor(result.conclusion.verdict)}`}>
              
              <div className="space-y-4 max-w-3xl flex-1">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-60 block">
                    Synthesized Audit Verdict
                  </span>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight mt-1">
                    {result.conclusion.verdict}
                  </h3>
                </div>

                <p className="text-xs md:text-sm font-medium leading-relaxed opacity-95">
                  {result.conclusion.summary}
                </p>

                {result.message && (
                  <div className="text-[11px] font-mono opacity-80 border border-slate-200/50 p-2.5 rounded-lg flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {result.message}
                  </div>
                )}
              </div>

              {/* Overall Radial Meter */}
              <div className="flex flex-col items-center justify-center shrink-0" id="radial-verdict-meter">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="opacity-10"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * result.conclusion.confidence) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black font-mono leading-none text-white">
                      {result.conclusion.confidence}%
                    </span>
                    <span className="text-[9px] font-mono opacity-70 uppercase tracking-widest mt-1 font-bold">
                      Confidence
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Dashboard Tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto gap-2" id="report-tabs">
              {[
                { id: 'overview', label: 'Verdict & Highlights', icon: Radio },
                { id: 'counterfactual', label: 'Counterfactual Sandbox', icon: Sliders },
                { id: 'claims', label: 'Extracted Claims (LIME)', icon: GitFork },
                { id: 'sources', label: 'Sources & Credibility (SHAP)', icon: Layers },
                { id: 'graph', label: 'Decision Trace Graph', icon: Activity }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3.5 text-xs font-mono font-bold uppercase border-b-2 whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-850'
                    }`}
                    id={`tab-btn-${tab.id}`}
                  >
                    <TabIcon className="w-4 h-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content screens */}
            <div className="space-y-6">

              {/* 1. OVERVIEW SCREEN */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="overview-screen">
                  
                  {/* Left Column: Confidence break downs and alternative hypothesis */}
                  <div className="lg:col-span-6 space-y-6">
                    
                    {/* Confidence breakdowns */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
                      <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Dimensional Certainty Scores
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'source', label: 'Source Credibility', val: result.confidenceBreakdown.source, desc: 'Domains & publisher trust' },
                          { key: 'evidence', label: 'Evidence Sufficiency', val: result.confidenceBreakdown.evidence, desc: 'Coverage ratio' },
                          { key: 'reasoning', label: 'Reasoning Logic', val: result.confidenceBreakdown.reasoning, desc: 'Contradiction-free matches' },
                          { key: 'citation', label: 'Citation Integrity', val: result.confidenceBreakdown.citation, desc: 'Link and paper index validations' }
                        ].map((dim) => (
                          <div key={dim.key} className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl space-y-1.5" id={`dim-${dim.key}`}>
                            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                              {dim.label}
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-white font-mono font-display">
                                {dim.val}%
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium font-mono">
                                PASS
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              {dim.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hallucination control layer */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                      <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Hallucination Control audits (5-Agent Fusion)
                      </h4>

                      <div className="space-y-3">
                        {[
                          { label: 'Faithfulness Audit', val: result.hallucinationChecks.faithfulness, key: 'faithfulness' },
                          { label: 'Grounding Audit', val: result.hallucinationChecks.grounding, key: 'grounding' },
                          { label: 'Citation Validity', val: result.hallucinationChecks.citationCheck, key: 'citation' },
                          { label: 'Multi-Model Consistency', val: result.hallucinationChecks.consistency, key: 'consistency' },
                          { label: 'Evidence Sufficiency Limit', val: result.hallucinationChecks.evidenceCoverage, key: 'coverage' }
                        ].map((chk) => (
                          <div key={chk.label} className="group relative border-b border-slate-850 pb-3 last:border-0 last:pb-0" id={`hallucination-chk-${chk.key}`}>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                              <span>{chk.label}</span>
                              <span className="text-emerald-400 font-mono flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                                {chk.val.score}% ACCURACY
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {chk.val.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Alternatives and Image Analyses */}
                  <div className="lg:col-span-6 space-y-6">
                    
                    {/* Alternative hypothesis evaluated */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                      <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Alternative Hypotheses Audited & Rejected
                      </h4>

                      <div className="space-y-4">
                        {result.alternatives.map((alt, idx) => (
                          <div key={idx} className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-2" id={`alt-hypo-${idx}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300 font-mono">
                                Hypothesis {idx + 1}:
                              </span>
                              <span className="bg-rose-950/50 text-rose-400 border border-rose-900/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                REJECTED (Certainty: {alt.confidence}%)
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                              "{alt.hypothesis}"
                            </p>
                            <p className="text-xs text-slate-400 leading-relaxed pt-1.5 border-t border-slate-850 border-dashed">
                              <strong>Why Rejected:</strong> {alt.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grad-CAM viewer (only if image analysis exists) */}
                    {result.imageAnalysis && (
                      <GradCamViewer imageAnalysis={result.imageAnalysis} />
                    )}

                  </div>

                </div>
              )}

              {/* 2. COUNTERFACTUAL SANDBOX SCREEN */}
              {activeTab === 'counterfactual' && (
                <div className="animate-fade-in" id="counterfactual-screen">
                  <CounterfactualSandbox
                    initialSources={result.sources}
                    initialConfidence={result.confidenceBreakdown}
                    initialVerdict={result.conclusion.verdict}
                    initialSummary={result.conclusion.summary}
                  />
                </div>
              )}

              {/* 3. CLAIMS (LIME) SCREEN */}
              {activeTab === 'claims' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="claims-screen">
                  
                  {/* Claim Selector List */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
                      Claims Audited ({result.claims.length})
                    </span>

                    <div className="space-y-2.5">
                      {result.claims.map((claim) => {
                        const isSelected = selectedClaimId === claim.id;
                        return (
                          <div
                            key={claim.id}
                            onClick={() => setSelectedClaimId(claim.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left space-y-1.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-950/50 border border-slate-850 hover:bg-slate-900/60 text-slate-300'
                            }`}
                            id={`claim-selector-${claim.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}>
                                {claim.status.toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                {claim.confidence}% Cert
                              </span>
                            </div>
                            <p className="text-xs font-bold leading-normal line-clamp-2">
                              "{claim.text}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LIME Highlight details */}
                  <div className="lg:col-span-7">
                    {selectedClaimId ? (
                      <div className="space-y-4">
                        <LimeHighlighter
                          claim={result.claims.find(c => c.id === selectedClaimId)!}
                        />
                        
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2.5">
                          <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                            Analyst Verification Rationale
                          </h4>
                          <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                            {result.claims.find(c => c.id === selectedClaimId)?.explanation}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs">
                        Select a claim from the left panel to inspect its LIME token attributions.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 4. SOURCES (SHAP) SCREEN */}
              {activeTab === 'sources' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="sources-screen">
                  
                  {/* Source List */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
                      Evidence Source Index ({result.sources.length})
                    </span>

                    <div className="space-y-2.5">
                      {result.sources.map((source) => {
                        const isSelected = selectedSourceId === source.id;
                        return (
                          <div
                            key={source.id}
                            onClick={() => setSelectedSourceId(source.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left space-y-2 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-950/50 border border-slate-850 hover:bg-slate-900/60 text-slate-300'
                            }`}
                            id={`source-selector-${source.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}>
                                {source.domain}
                              </span>
                              <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                Score: {source.credibility}%
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-bold leading-snug line-clamp-2">
                                {source.title}
                              </p>
                              <p className={`text-[10px] mt-1 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                                {source.author} • {source.date}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SHAP Explanation Weights */}
                  <div className="lg:col-span-7">
                    {selectedSourceId ? (
                      <div className="space-y-4">
                        <ShapExplanation
                          source={result.sources.find(s => s.id === selectedSourceId)!}
                        />

                        {/* Interactive Link Box */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider">
                              Verified Source URL
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-300 truncate max-w-[280px] sm:max-w-[400px] block">
                              {result.sources.find(s => s.id === selectedSourceId)?.uri}
                            </span>
                          </div>
                          <a
                            href={result.sources.find(s => s.id === selectedSourceId)?.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-2 flex items-center justify-center transition-colors shadow-sm"
                          >
                            <Link2 className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs">
                        Select a source from the left list to inspect its SHAP credibility features.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 5. SYSTEM TRACE (GRAPH) SCREEN */}
              {activeTab === 'graph' && (
                <div className="space-y-6 animate-fade-in" id="graph-screen">
                  
                  {/* SVG Node trace graph */}
                  <DecisionGraphViewer graph={result.decisionGraph} />

                  {/* Expandable Technical Trace Log */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        Complete Audit Registry Event-Log
                      </h4>
                      <span className="text-xs font-mono bg-slate-950 text-slate-400 px-2.5 py-1 rounded border border-slate-800">
                        9 TRACES CAPTURED
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {result.decisionTrace.map((event, idx) => {
                        const isWarn = event.status === 'warning';
                        return (
                          <div key={idx} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1.5" id={`audit-trace-${idx}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="font-mono text-slate-500">[{event.timestamp}]</span>
                                <span className="text-slate-200">{event.agent}</span>
                                <span className="text-slate-700">|</span>
                                <span className={isWarn ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                  {event.event}
                                </span>
                              </div>
                              <span className={`inline-flex self-start sm:self-auto items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${
                                isWarn ? 'bg-amber-950/50 border-amber-900/40 text-amber-400' : 'bg-emerald-950/50 border-emerald-900/40 text-emerald-400'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-normal pl-4 border-l-2 border-slate-800 font-medium">
                              {event.details}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-6 text-center text-xs text-slate-500 font-medium" id="app-footer">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Explainable Autonomous Investigation Platform (EAIP). All rights reserved.</p>
          <p className="text-[10px] text-slate-600 mt-1">
            Engineered for high-fidelity clinical and structural verification using dual Google Search Grounding and Multi-Agent Consensus Layers.
          </p>
        </div>
      </footer>

    </div>
  );
}
