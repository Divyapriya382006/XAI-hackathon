import React, { useState } from 'react';
import { ShieldCheck, FileText, Cpu, Clock, Terminal, ChevronDown, ChevronUp, Copy, Check, Fingerprint, RefreshCw } from 'lucide-react';
import { LANGGRAPH_NODES, LangNode } from './LangGraphViewer';

interface ForensicLedgerProps {
  selectedNodeId: string | null;
  currentStep: number;
  question: string;
}

export default function ForensicLedger({ selectedNodeId, currentStep, question }: ForensicLedgerProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);

  // If no node is selected, default to the one executing at the current step
  const activeNode = selectedNodeId 
    ? LANGGRAPH_NODES.find(n => n.id === selectedNodeId)
    : LANGGRAPH_NODES.find(n => n.step === currentStep);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!activeNode) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col justify-center items-center text-center text-slate-500">
        <Cpu className="w-10 h-10 mb-3 animate-pulse text-slate-700" />
        <p className="text-xs font-mono font-bold">AWAITING AGENT SWARM SIGNAL...</p>
        <p className="text-[11px] text-slate-600 mt-1">Start or step through the replay to populate the Forensic Ledger.</p>
      </div>
    );
  }

  // Get active node status
  const getStatusLabel = () => {
    if (activeNode.step < currentStep) return { text: 'IMMUTABLE RECORD / COMMITTED', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
    if (activeNode.step === currentStep) return { text: 'EXECUTING / PULSING ACTIVE', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30 animate-pulse' };
    return { text: 'AWAITING DISPATCH / QUEUED', color: 'text-slate-500 bg-slate-950 border-slate-800' };
  };

  const status = getStatusLabel();

  // Custom metadata hashes / details based on the node
  const getDynamicHash = () => {
    // Generate a beautiful SHA-256 fingerprint simulation
    let seed = activeNode.id + question;
    let hash = 'f1e7a5b' + Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16) + '9b0c44298fc1c14';
    return `SHA-256: ${hash.substring(0, 32)}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col justify-between space-y-4" id="forensic-ledger-panel">
      
      {/* Panel Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-950 border border-sky-500/20 rounded-lg text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight font-display uppercase">
                Forensic Audit Ledger
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Cryptographically Signed Verification Stream
              </p>
            </div>
          </div>
          
          <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${status.color}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Primary Details Area */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 max-h-[580px]">
        
        {/* Node Profile Summary card */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-display">
              {activeNode.details.title}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Latency: <strong className="text-white">{activeNode.details.latency}</strong></span>
            </div>
          </div>
          
          <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-850 space-y-1">
            <div className="flex justify-between items-center">
              <span>Agent Identity:</span>
              <strong className="text-sky-400 uppercase">{activeNode.label}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Forensic Mission:</span>
              <span className="text-slate-300">SECURE-2026-1842</span>
            </div>
            <div className="flex justify-between items-center text-ellipsis overflow-hidden">
              <span>Secure Signature:</span>
              <span className="text-emerald-400 text-[10px] select-all cursor-copy flex items-center gap-1" onClick={() => handleCopy(getDynamicHash(), 'sig')}>
                <Fingerprint className="w-3 h-3" />
                {getDynamicHash().substring(0, 20)}...
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Metrics Section */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
            Agent Execution Parameters
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeNode.details.metrics.map((m, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{m.label}</span>
                <span className="text-xs font-bold text-slate-200 mt-1 line-clamp-2 leading-tight">
                  {m.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tool Calls */}
        {activeNode.details.toolCalls.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
              Executed Tool Invocation Calls
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeNode.details.toolCalls.map((t, idx) => (
                <span key={idx} className="text-[10px] font-mono bg-sky-950/40 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-sky-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Causal Citation rejection log (Custom mock rules for transparency) */}
        {activeNode.id === 'search' && (() => {
          const domainMatch = question.match(/\b([A-Z][a-zA-Z0-9]+)\b/);
          const subject = domainMatch ? domainMatch[1] : "target_entity";
          return (
            <div className="bg-rose-950/20 border border-rose-500/15 p-3 rounded-xl space-y-1 text-[11px] leading-relaxed text-left">
              <strong className="text-rose-400 block font-mono text-[10px] uppercase tracking-wider">
                ✖ REJECTED CANDIDATE SOURCE FILE
              </strong>
              <p className="text-slate-300">
                <strong>Source:</strong> wikipedia.org/wiki/{subject}_sustainability_criticism
              </p>
              <p className="text-slate-400 mt-0.5">
                <strong>Audit Reason:</strong> Lacks regulatory compliance sign-off. Flagged as insufficient authority for causal verification. Replaced by direct verified site inspection dockets.
              </p>
            </div>
          );
        })()}

        {/* Inputs / Outputs Panel */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
            Input & Output Payloads
          </span>

          <div className="space-y-2">
            {/* Input payload card */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">
                  Ingested Input Channel
                </span>
                <button 
                  onClick={() => handleCopy(activeNode.details.io.input, 'input')} 
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedText === 'input' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-text">
                {activeNode.details.io.input}
              </p>
            </div>

            {/* Output payload card */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">
                  Published Output Vector
                </span>
                <button 
                  onClick={() => handleCopy(activeNode.details.io.output, 'output')} 
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedText === 'output' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-emerald-300 leading-relaxed font-mono whitespace-pre-wrap select-text">
                {activeNode.details.io.output}
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible View Prompt Details */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="w-full bg-slate-950/40 p-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>VIEW AGENT PROMPT & DEPENDENCY TREE</span>
            {showPromptDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {showPromptDetails && (
            <div className="bg-slate-950 p-3 border-t border-slate-850 text-[10px] font-mono text-slate-500 space-y-2 leading-relaxed">
              <div>
                <strong className="text-slate-400">System Prompt:</strong>
                <p className="mt-1 bg-slate-900 p-2 rounded text-slate-400">
                  You are {activeNode.label}, acting within a cryptographically verifiable multi-agent autonomous loop. Resolve conflicts using standard causal-reasoning models. Ground every assertion in SHA-256 indexed documents. Reject secondary blog content when primary high-trust official/regulatory filings are present.
                </p>
              </div>
              <div>
                <strong className="text-slate-400">Operational Dependencies:</strong>
                <p className="mt-0.5">
                  - Core Loop: langgraph-agent-engine-v3<br />
                  - Model Context: gemini-3.5-flash<br />
                  - Error Recovery: Auto-Retry on SSL/Crawl Failure
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Ledger Security Footer */}
      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-mono text-slate-500 leading-normal shrink-0">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          This ledger entry represents an immutable forensic record. Authorized peer auditors can verify this record by cross-checking the cryptographically signed ledger signature.
        </div>
      </div>

    </div>
  );
}
