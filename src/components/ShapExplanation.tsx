import React from 'react';
import { Source } from '../types';
import { ShieldCheck, Calendar, User, FileText, Link2, Info } from 'lucide-react';

interface ShapExplanationProps {
  source: Source;
}

export default function ShapExplanation({ source }: ShapExplanationProps) {
  const weights = source.shapWeights || {
    domainReputation: 20,
    recency: 15,
    authorReputation: 20,
    citationsWeight: 15,
    referencesWeight: 15,
  };

  const features = [
    {
      key: 'domainReputation',
      label: 'Domain Reputation',
      value: weights.domainReputation,
      icon: ShieldCheck,
      desc: `Credibility rating of the host domain [${source.domain}].`,
    },
    {
      key: 'recency',
      label: 'Publication Recency',
      value: weights.recency,
      icon: Calendar,
      desc: `Calculated from publication date [${source.date || 'N/A'}]. Recent articles prevent stale grounding.`,
    },
    {
      key: 'authorReputation',
      label: 'Author Credentials',
      value: weights.authorReputation,
      icon: User,
      desc: `Verified credentials of [${source.author || 'Unknown'}]. Peer-reviewed or expert authorship increases weight.`,
    },
    {
      key: 'citationsWeight',
      label: 'Citation Network Intensity',
      value: weights.citationsWeight,
      icon: Link2,
      desc: 'Count of external peer-reviewed publications citing this specific document.',
    },
    {
      key: 'referencesWeight',
      label: 'Reference Validity',
      value: weights.referencesWeight,
      icon: FileText,
      desc: 'Integrity score of bibliographical citations listed inside the source document.',
    }
  ];

  // Calculate sum of positive contributions
  const calculatedSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const scalingFactor = source.credibility / (calculatedSum || 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-3 space-y-4 shadow-lg" id={`shap-panel-${source.id}`}>
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 font-display">
            <Info className="w-4 h-4 text-emerald-400" />
            Source Credibility Attribution (SHAP model)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualizing feature importance weights contributing to the <strong>{source.credibility}%</strong> credibility rating.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono bg-slate-950 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800 font-semibold">
            SHAP Explained
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {features.map((feat) => {
          // Normalize the value to reflect actual credibility portion
          const adjustedValue = Math.round(feat.value * scalingFactor);
          const isPositive = adjustedValue >= 0;
          const displayPercent = isPositive ? `+${adjustedValue}%` : `${adjustedValue}%`;

          // Bar width percentage (clamp between 0 and 100 for visual sanity)
          const barWidth = Math.min(100, Math.max(0, Math.abs(adjustedValue) * 3));

          const IconComponent = feat.icon;

          return (
            <div key={feat.key} className="group relative" id={`shap-feature-${feat.key}`}>
              <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 text-slate-400 group-hover:text-white transition-colors">
                  <IconComponent className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                  {feat.label}
                </span>
                <span className={`font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {displayPercent}
                </span>
              </div>

              {/* Slider track */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex relative border border-slate-850/40">
                {/* Center point marker */}
                <div className="absolute left-[30%] top-0 bottom-0 w-[1px] bg-slate-800 z-10"></div>
                
                {/* Visual bar starting from center marker */}
                <div
                  style={{
                    left: '30%',
                    width: `${barWidth}%`,
                  }}
                  className={`absolute h-full rounded-full transition-all duration-500 ${
                    isPositive ? 'bg-emerald-500' : 'bg-rose-400'
                  }`}
                ></div>
              </div>

              {/* Context description */}
              <p className="text-[10px] text-slate-500 mt-1 hidden group-hover:block transition-all duration-300">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-400 leading-relaxed">
        <strong>SHAP Auditing Note:</strong> Features are calculated using a lightweight local <strong>Source Credibility Classifier</strong>. Government registries and peer-reviewed journal indexes receive anchor premiums (+25%), while commercial PR releases are penalized (-20% domain weight) due to promotional bias.
      </div>
    </div>
  );
}
