import React, { useState } from 'react';
import { ThinkingStep } from '../types';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Cpu,
  Search,
  FileSearch,
  Scale,
  Sparkles,
  Gavel,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ThinkingProcessViewerProps {
  thinkingSteps: ThinkingStep[];
  isLive?: boolean;
  visibleCount?: number; // how many steps are visible so far (for animation)
}

const agentIconMap: Record<string, React.ReactNode> = {
  'Planner Agent': <Brain className="w-4 h-4 text-violet-400" />,
  'Retriever Agent': <Search className="w-4 h-4 text-sky-400" />,
  'Scraper Agent': <FileSearch className="w-4 h-4 text-amber-400" />,
  'Auditor Agent': <Scale className="w-4 h-4 text-rose-400" />,
  'Explainability Agent': <Sparkles className="w-4 h-4 text-emerald-400" />,
  'Judge Agent': <Gavel className="w-4 h-4 text-orange-400" />,
};

const agentColorMap: Record<string, string> = {
  'Planner Agent': 'border-violet-500/30 bg-violet-950/20',
  'Retriever Agent': 'border-sky-500/30 bg-sky-950/20',
  'Scraper Agent': 'border-amber-500/30 bg-amber-950/20',
  'Auditor Agent': 'border-rose-500/30 bg-rose-950/20',
  'Explainability Agent': 'border-emerald-500/30 bg-emerald-950/20',
  'Judge Agent': 'border-orange-500/30 bg-orange-950/20',
};

const agentBadgeMap: Record<string, string> = {
  'Planner Agent': 'bg-violet-950/50 text-violet-300 border-violet-500/30',
  'Retriever Agent': 'bg-sky-950/50 text-sky-300 border-sky-500/30',
  'Scraper Agent': 'bg-amber-950/50 text-amber-300 border-amber-500/30',
  'Auditor Agent': 'bg-rose-950/50 text-rose-300 border-rose-500/30',
  'Explainability Agent': 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30',
  'Judge Agent': 'bg-orange-950/50 text-orange-300 border-orange-500/30',
};

function StepCard({ step, index, isVisible }: { step: ThinkingStep; index: number; isVisible: boolean }) {
  const [expanded, setExpanded] = useState(index < 2); // first 2 expanded by default
  const icon = agentIconMap[step.agent] || <Cpu className="w-4 h-4 text-slate-400" />;
  const borderColor = agentColorMap[step.agent] || 'border-slate-700 bg-slate-900/30';
  const badgeColor = agentBadgeMap[step.agent] || 'bg-slate-800 text-slate-300 border-slate-700';

  if (!isVisible) return null;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-500 ${borderColor} animate-fadeSlideIn`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Step Header */}
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        id={`thinking-step-${step.step}`}
      >
        {/* Step number */}
        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-300">{step.step}</span>
        </div>

        {/* Icon */}
        <div className="shrink-0">{icon}</div>

        {/* Agent badge */}
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${badgeColor}`}>
          {step.agent}
        </span>

        {/* Thought preview */}
        <span className="text-xs text-slate-400 flex-1 min-w-0 truncate font-medium">
          {step.thought}
        </span>

        {/* Timestamp */}
        <span className="text-[10px] font-mono text-slate-600 shrink-0 hidden sm:block">
          {new Date(step.timestamp).toLocaleTimeString()}
        </span>

        {/* Expand toggle */}
        <div className="shrink-0 text-slate-500">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Thought */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">💭 THOUGHT</span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 border border-slate-800/60 rounded-lg px-3 py-2 font-medium italic">
              "{step.thought}"
            </p>
          </div>

          {/* Action */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">⚡ ACTION</span>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 rounded-lg px-3 py-2 font-mono border border-slate-800/40">
              {step.action}
            </p>
          </div>

          {/* Observation */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest">✅ OBSERVATION</span>
            <p className="text-xs text-emerald-300 leading-relaxed bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-3 py-2 font-medium">
              {step.observation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ThinkingProcessViewer({ thinkingSteps, isLive = false, visibleCount }: ThinkingProcessViewerProps) {
  const [panelExpanded, setPanelExpanded] = useState(true);
  const count = visibleCount !== undefined ? visibleCount : thinkingSteps.length;

  if (!thinkingSteps || thinkingSteps.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg" id="thinking-process-panel">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setPanelExpanded(!panelExpanded)}
        id="thinking-panel-toggle"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-950/60 border border-violet-500/30 rounded-xl">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white tracking-tight font-display flex items-center gap-2">
              Agent Reasoning Trace
              {isLive && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Full chain-of-thought: {count} of {thinkingSteps.length} steps visible — Think → Act → Observe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
            {thinkingSteps.length} STEPS
          </span>
          {panelExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {panelExpanded && (
        <div className="px-5 pb-5 space-y-2.5">
          {/* Agent legend */}
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-slate-800">
            {Object.entries(agentBadgeMap).map(([agent, cls]) => (
              <span key={agent} className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${cls}`}>
                {agent}
              </span>
            ))}
          </div>

          {/* Step cards */}
          {thinkingSteps.map((step, idx) => (
            <StepCard key={step.step} step={step} index={idx} isVisible={idx < count} />
          ))}

          {count < thinkingSteps.length && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono py-1">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              Processing remaining {thinkingSteps.length - count} steps...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
