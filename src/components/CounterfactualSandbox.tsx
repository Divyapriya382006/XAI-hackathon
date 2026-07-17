import React, { useState, useEffect } from 'react';
import { Source, ConfidenceBreakdown } from '../types';
import { RefreshCw, AlertTriangle, CheckSquare, Square, Info, ShieldCheck } from 'lucide-react';

interface CounterfactualSandboxProps {
  initialSources: Source[];
  initialConfidence: ConfidenceBreakdown;
  initialVerdict: string;
  initialSummary: string;
  onSandboxChange?: (activeSourcesCount: number) => void;
}

export default function CounterfactualSandbox({
  initialSources,
  initialConfidence,
  initialVerdict,
  initialSummary,
}: CounterfactualSandboxProps) {
  // Store which source IDs are active
  const [activeIds, setActiveIds] = useState<string[]>(initialSources.map((s) => s.id));
  const [currentConfidence, setCurrentConfidence] = useState<ConfidenceBreakdown>({ ...initialConfidence });
  const [currentVerdict, setCurrentVerdict] = useState<string>(initialVerdict);
  const [currentSummary, setCurrentSummary] = useState<string>(initialSummary);

  // Recalculate dynamically when activeIds change
  useEffect(() => {
    if (activeIds.length === 0) {
      setCurrentConfidence({
        source: 10,
        evidence: 5,
        reasoning: 5,
        citation: 10,
        overall: 8,
      });
      setCurrentVerdict("Conclusion Suspended: No Grounding Evidence");
      setCurrentSummary("All evidence has been counterfactually disabled. The multi-agent platform cannot assert any conclusion without a baseline anchor source. Please enable sources to ground the investigation.");
      return;
    }

    const selectedSources = initialSources.filter((s) => activeIds.includes(s.id));

    // Calculate a weighted score based on credibility and relevance
    let totalWeight = 0;
    let weightedCredibility = 0;
    let weightedRelevance = 0;

    selectedSources.forEach((s) => {
      // Gov sources have 1.5x weight in the counterfactual formula
      const weightMultiplier = s.domain.includes('gov') ? 1.5 : 1.0;
      totalWeight += weightMultiplier;
      weightedCredibility += s.credibility * weightMultiplier;
      weightedRelevance += s.relevance * weightMultiplier;
    });

    const averageCredibility = Math.round(weightedCredibility / totalWeight);
    const averageRelevance = Math.round(weightedRelevance / totalWeight);

    // Dynamic confidence scores
    const sourceConf = Math.min(100, Math.round(averageCredibility * 1.02));
    const evidenceConf = Math.min(100, Math.round(averageRelevance * 0.95));
    const reasoningConf = Math.min(100, Math.round((averageCredibility + averageRelevance) / 2 * 1.01));
    const citationConf = Math.min(100, Math.round(activeIds.length / initialSources.length * 35 + 65));

    // Combined overall confidence
    const overallConf = Math.round(
      sourceConf * 0.35 +
      evidenceConf * 0.30 +
      reasoningConf * 0.25 +
      citationConf * 0.10
    );

    // Set updated values
    setCurrentConfidence({
      source: sourceConf,
      evidence: evidenceConf,
      reasoning: reasoningConf,
      citation: citationConf,
      overall: overallConf,
    });

    // Check if crucial government source was disabled
    const hasGovSource = selectedSources.some((s) => s.domain.toLowerCase().includes('gov'));

    if (overallConf < 50) {
      setCurrentVerdict("⚠️ Insufficient Grounded Evidence");
      setCurrentSummary("Confidence has fallen below the 50% critical threshold. The platform cannot render an authoritative judgment. Deauthorizing key journalistic and empirical sources has collapsed the evidence-coverage ratio.");
    } else if (!hasGovSource && selectedSources.length > 0) {
      setCurrentVerdict(`⚠️ ${initialVerdict} (Anchors Removed)`);
      setCurrentSummary("WARNING: You have counterfactually disabled all official government or third-party regulatory audits. While a conclusion can be suggested from remaining reports, removing highly objective anchors increases our reasoning margin-of-error.");
    } else {
      setCurrentVerdict(initialVerdict);
      setCurrentSummary(initialSummary);
    }
  }, [activeIds, initialSources, initialVerdict, initialSummary]);

  const toggleSource = (id: string) => {
    setActiveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetSandbox = () => {
    setActiveIds(initialSources.map((s) => s.id));
  };

  const isGovDisabled = !initialSources
    .filter((s) => activeIds.includes(s.id))
    .some((s) => s.domain.toLowerCase().includes('gov'));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-6" id="counterfactual-panel">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
            Counterfactual Sandbox
          </span>
          <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
            Dynamic Evidence Toggle & Impact Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test the structural resilience of our judgment. Enable/disable specific source feeds to observe live verdict shifts.
          </p>
        </div>
        <button
          onClick={resetSandbox}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
          Reset Sandbox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Toggle List */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
            Evidence Sources in Scope
          </span>
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {initialSources.map((source) => {
              const isChecked = activeIds.includes(source.id);
              const isGov = source.domain.toLowerCase().includes('gov');

              return (
                <div
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex gap-3.5 ${
                    isChecked
                      ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-white'
                      : 'bg-slate-950/40 border-slate-900 hover:bg-slate-900/50 text-slate-500'
                  }`}
                  id={`counterfactual-toggle-${source.id}`}
                >
                  <button className="mt-0.5 focus:outline-none">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-700" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold leading-snug line-clamp-1">
                        {source.title}
                      </span>
                      {isGov && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.2 rounded-full font-semibold">
                          Regulatory Anchor
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] line-clamp-1 text-slate-400">
                      {source.author} • {source.domain} ({source.date})
                    </p>
                    <p className="text-[11px] line-clamp-2 text-slate-400 font-normal leading-relaxed">
                      "{source.snippet}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sandbox Result */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
              Dynamic Verdict Simulation
            </span>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  currentConfidence.overall >= 80 ? 'bg-emerald-500' :
                  currentConfidence.overall >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
                <span className="text-sm font-bold text-white tracking-tight font-display">
                  {currentVerdict}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentSummary}
              </p>
            </div>

            {/* Warnings block */}
            {isGovDisabled && activeIds.length > 0 && (() => {
              const disabledTypes = Array.from(new Set(
                initialSources.filter((s) => !activeIds.includes(s.id)).map((s) => s.domainType)
              ));
              const activeTypes = Array.from(new Set(
                initialSources.filter((s) => activeIds.includes(s.id)).map((s) => s.domainType)
              ));
              const dynamicWarning = disabledTypes.length > 0 && activeTypes.length > 0
                ? `Removing ${disabledTypes.map(t => `[${t}]`).join(', ')} sources reduces reliance on ${activeTypes.map(t => `[${t}]`).join(', ')} sources.`
                : "Removing authoritative sources reduces query coverage and increases reliance on uncorroborated third-party blogs.";
              return (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-2 items-start text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-normal text-left">
                    <strong>Authority Deficit:</strong> {dynamicWarning}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Dynamic Confidence Meters */}
          <div className="space-y-3.5 border-t border-slate-800 pt-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>RECALCULATED OVERALL CONFIDENCE</span>
                <span className={`font-bold ${
                  currentConfidence.overall >= 80 ? 'text-emerald-400' :
                  currentConfidence.overall >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}>{currentConfidence.overall}%</span>
              </div>
              <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${currentConfidence.overall}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentConfidence.overall >= 80 ? 'bg-emerald-500' :
                    currentConfidence.overall >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-400">
              <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
                <span className="block text-[10px] text-slate-500">SOURCE TRACE</span>
                <span className="text-white font-bold">{currentConfidence.source}%</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
                <span className="block text-[10px] text-slate-500">EVIDENCE MATRIX</span>
                <span className="text-white font-bold">{currentConfidence.evidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex gap-2 items-center text-xs text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <strong>Counterfactual Agent Note:</strong> This sandbox validates which elements of evidence are critical points-of-failure. Deauthorizing a primary regulatory node (indicated by the premium status tag) acts as a high-fidelity logical test for information resilience.
        </div>
      </div>
    </div>
  );
}
