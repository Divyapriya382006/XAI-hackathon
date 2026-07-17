import React, { useState } from 'react';
import { Claim, LimePhrase } from '../types';
import { AlertCircle, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

interface LimeHighlighterProps {
  claim: Claim;
}

export default function LimeHighlighter({ claim }: LimeHighlighterProps) {
  const [activePhrase, setActivePhrase] = useState<LimePhrase | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <ThumbsUp className="w-4 h-4 text-emerald-500" />;
      case 'debunked':
        return <ThumbsDown className="w-4 h-4 text-rose-500" />;
      case 'exaggerated':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-950/60 border-emerald-800 text-emerald-400';
      case 'debunked':
        return 'bg-rose-950/60 border-rose-800 text-rose-400';
      case 'exaggerated':
        return 'bg-amber-950/60 border-amber-800 text-amber-400';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4" id={`lime-panel-${claim.id}`}>
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-display">
            Claim Truthiness Verification (LIME model)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyzing localized semantic token influence on claim status: 
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ml-1 text-[11px] font-medium border ${getStatusStyle(claim.status)}`}>
              {getStatusIcon(claim.status)}
              {claim.status.toUpperCase()} ({claim.confidence}%)
            </span>
          </p>
        </div>
      </div>

      {/* Renders the sentence broken down into highlighted chunks */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-sm font-medium text-slate-300 leading-relaxed">
        <div className="flex flex-wrap gap-1 items-center">
          {claim.limePhrases && claim.limePhrases.length > 0 ? (
            claim.limePhrases.map((phrase, idx) => {
              const isPositive = phrase.impact === 'positive';
              const isNegative = phrase.impact === 'negative';

              let highlightClass = 'hover:bg-slate-800 text-slate-300 border-transparent';
              if (isPositive) {
                highlightClass = 'bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-300';
              } else if (isNegative) {
                highlightClass = 'bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/30 text-rose-300';
              }

              return (
                <span
                  key={idx}
                  id={`lime-phrase-${idx}`}
                  onMouseEnter={() => setActivePhrase(phrase)}
                  onMouseLeave={() => setActivePhrase(null)}
                  className={`px-1.5 py-0.5 rounded-md border text-[13px] transition-all cursor-help duration-200 ${highlightClass} relative`}
                >
                  {phrase.text}
                </span>
              );
            })
          ) : (
            <span>{claim.text}</span>
          )}
        </div>
      </div>

      {/* Hover Info Panel */}
      <div className="h-16 flex items-center justify-center border border-dashed border-slate-800 rounded-lg p-2.5 bg-slate-950">
        {activePhrase ? (
          <div className="text-center w-full animate-fade-in">
            <span className="text-[11px] font-mono text-slate-500 block uppercase tracking-wider mb-0.5">
              Local Token Feature Attribution
            </span>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="font-semibold text-slate-200">"{activePhrase.text}"</span>
              <span className="text-slate-700">|</span>
              <span className={`font-mono font-bold ${activePhrase.score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Contribution: {activePhrase.score >= 0 ? '+' : ''}{activePhrase.score}%
              </span>
              <span className="text-slate-700">|</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                activePhrase.impact === 'positive' ? 'bg-emerald-950/50 border-emerald-500/20 text-emerald-400' :
                activePhrase.impact === 'negative' ? 'bg-rose-950/50 border-rose-500/20 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                {activePhrase.impact.toUpperCase()} EVIDENCE SIGNATURE
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Hover over any highlighted text segment to inspect its localized decision-weight contribution.
          </p>
        )}
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
        <strong>LIME Explanation Logic:</strong> LIME creates a localized surrogate linear model around the claim text by perturbing key terms. Green segments highlight terms that represent highly verified operational metrics. Red highlights flag terms associated with semantic exaggeration, circular citations, or unverified claims.
      </p>
    </div>
  );
}
