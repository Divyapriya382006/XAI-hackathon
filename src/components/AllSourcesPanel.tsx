import React, { useState } from 'react';
import { Source } from '../types';
import {
  Globe,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Newspaper,
  Building2,
  GraduationCap,
  BookMarked,
  Share2,
  FileText,
  Filter
} from 'lucide-react';

interface AllSourcesPanelProps {
  allSources: Source[];
  question: string;
}

const domainTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  gov: { label: 'Government', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' },
  edu: { label: 'Academic', icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'text-sky-400 bg-sky-950/40 border-sky-500/30' },
  news_wire: { label: 'News Wire', icon: <Newspaper className="w-3.5 h-3.5" />, color: 'text-violet-400 bg-violet-950/40 border-violet-500/30' },
  ngo: { label: 'NGO / Org', icon: <BookMarked className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' },
  corporate: { label: 'Corporate', icon: <Building2 className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-950/40 border-blue-500/30' },
  blog: { label: 'Blog', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-950/40 border-orange-500/30' },
  social: { label: 'Social Media', icon: <Share2 className="w-3.5 h-3.5" />, color: 'text-pink-400 bg-pink-950/40 border-pink-500/30' },
  other: { label: 'Other', icon: <FileText className="w-3.5 h-3.5" />, color: 'text-slate-400 bg-slate-800/40 border-slate-700/30' },
};

function CredibilityBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-bold text-slate-400 w-6 shrink-0">{Math.round(value)}</span>
    </div>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const accepted = source.decision === 'accepted' || !source.decision;
  const domainMeta = domainTypeLabels[source.domainType || 'other'] || domainTypeLabels['other'];

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        accepted
          ? 'border-emerald-800/40 bg-emerald-950/10 hover:border-emerald-700/60'
          : 'border-rose-900/30 bg-rose-950/10 opacity-80 hover:border-rose-800/50'
      }`}
      id={`source-card-${source.id}`}
    >
      {/* Card header */}
      <button
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Accept/Reject badge */}
        <div className={`shrink-0 mt-0.5 ${accepted ? 'text-emerald-400' : 'text-rose-400'}`}>
          {accepted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase ${domainMeta.color}`}>
              {domainMeta.icon}
              {domainMeta.label}
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
              accepted ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/40' : 'bg-rose-950/40 text-rose-400 border-rose-700/40'
            }`}>
              {accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2">{source.title}</p>
          <p className="text-[10px] text-slate-500 font-mono truncate">{source.domain || source.uri}</p>
        </div>

        {/* Credibility */}
        <div className="shrink-0 w-24 hidden sm:block">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wide mb-1">Credibility</div>
          <CredibilityBar value={source.credibility} />
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wide mt-1.5">Relevance</div>
          <CredibilityBar value={source.relevance} />
        </div>

        <div className="shrink-0 text-slate-600">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Reason */}
          {source.reasonText && (
            <div className={`rounded-lg p-3 border text-xs leading-relaxed ${
              accepted
                ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200'
                : 'bg-rose-950/20 border-rose-800/30 text-rose-200'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {accepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span className="font-mono font-bold uppercase text-[9px] tracking-widest">
                  {accepted ? 'Acceptance Rationale' : 'Rejection Rationale'}
                </span>
              </div>
              {source.reasonText}
            </div>
          )}

          {/* SHAP weights */}
          {source.shapWeights && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">SHAP Feature Attribution</div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(source.shapWeights).map(([key, val]) => (
                  <div key={key} className="space-y-0.5">
                    <div className="text-[9px] font-mono text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <CredibilityBar value={val} max={30} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snippet */}
          {source.snippet && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Extracted Excerpt</div>
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800/50 line-clamp-4">
                {source.snippet}
              </p>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 flex-wrap">
            {source.author && source.author !== 'Unknown' && (
              <span>Author: <span className="text-slate-400">{source.author}</span></span>
            )}
            {source.date && (
              <span>Date: <span className="text-slate-400">{source.date}</span></span>
            )}
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors ml-auto"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" /> Open Source
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllSourcesPanel({ allSources, question }: AllSourcesPanelProps) {
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [panelExpanded, setPanelExpanded] = useState(true);

  const accepted = allSources.filter(s => s.decision === 'accepted' || !s.decision);
  const rejected = allSources.filter(s => s.decision === 'rejected');
  const filtered = filter === 'all' ? allSources : filter === 'accepted' ? accepted : rejected;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg" id="all-sources-panel">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setPanelExpanded(!panelExpanded)}
        id="sources-panel-toggle"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white tracking-tight font-display">
              All Scraped Sources — Full Transparency
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {allSources.length} sources crawled · {accepted.length} accepted · {rejected.length} rejected with reason
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            {accepted.length} ✓
          </span>
          <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-950/30 border border-rose-800/40 px-2.5 py-1 rounded-lg">
            {rejected.length} ✗
          </span>
          {panelExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {panelExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {(['all', 'accepted', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-lg border transition-colors cursor-pointer uppercase tracking-wide ${
                  filter === f
                    ? f === 'all'
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : f === 'accepted'
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300'
                        : 'bg-rose-950/50 border-rose-700/50 text-rose-300'
                    : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
                id={`source-filter-${f}`}
              >
                {f} ({f === 'all' ? allSources.length : f === 'accepted' ? accepted.length : rejected.length})
              </button>
            ))}
          </div>

          {/* Source cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No sources in this category.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((source, idx) => (
                <SourceCard key={source.id || idx} source={source} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
