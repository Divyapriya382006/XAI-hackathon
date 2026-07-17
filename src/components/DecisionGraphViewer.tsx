import React, { useState } from 'react';
import { DecisionGraph } from '../types';
import { GitFork, Layers, FileCode, CheckCircle2 } from 'lucide-react';

interface DecisionGraphViewerProps {
  graph: DecisionGraph;
}

export default function DecisionGraphViewer({ graph }: DecisionGraphViewerProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Group nodes by their structural tier (columns) to draw an organized flow-chart
  const inputs = graph.nodes.filter(n => n.type === 'input');
  const evidences = graph.nodes.filter(n => n.type === 'evidence');
  const claims = graph.nodes.filter(n => n.type === 'claim');
  const decisions = graph.nodes.filter(n => n.type === 'decision');

  const columns = [
    { title: "User Inputs", items: inputs, icon: FileCode },
    { title: "Verified Evidence", items: evidences, icon: Layers },
    { title: "Claims Checked", items: claims, icon: GitFork },
    { title: "Verdict Node", items: decisions, icon: CheckCircle2 }
  ];

  // Helper to check if an edge is highlighted
  const isEdgeHighlighted = (from: string, to: string) => {
    if (!hoveredNode) return false;
    return from === hoveredNode || to === hoveredNode;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4" id="graph-panel">
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 font-display">
            <GitFork className="w-4 h-4 text-emerald-400 rotate-90" />
            Auditable Multi-Agent Decision Graph
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic node map tracing how initial user inputs split into sub-claims, aligned with verified sources, and converged to the judge verdict.
          </p>
        </div>
      </div>

      {/* SVG Canvas and Node Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-950 border border-slate-850 rounded-xl p-5 min-h-[300px] overflow-hidden select-none">
        
        {columns.map((col, colIdx) => {
          const Icon = col.icon;
          return (
            <div key={colIdx} className="space-y-4 flex flex-col justify-center items-center relative z-10" id={`graph-col-${colIdx}`}>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 border-b border-slate-850 pb-2 w-full text-center justify-center uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                {col.title}
              </div>

              <div className="space-y-3.5 w-full flex flex-col items-center">
                {col.items.map((node) => {
                  const isHovered = hoveredNode === node.id;
                  const isRelated = graph.edges.some(
                    e => (e.from === node.id && e.to === hoveredNode) || (e.to === node.id && e.from === hoveredNode)
                  );

                  let nodeStyle = "border-slate-850 bg-slate-900/50 text-slate-400 hover:border-emerald-500/30";
                  if (node.type === 'input') {
                    nodeStyle = "border-sky-950/80 bg-sky-950/20 text-sky-300 hover:border-sky-800";
                  } else if (node.type === 'evidence') {
                    nodeStyle = "border-emerald-950/80 bg-emerald-950/20 text-emerald-300 hover:border-emerald-800";
                  } else if (node.type === 'claim') {
                    nodeStyle = "border-amber-950/80 bg-amber-950/20 text-amber-300 hover:border-amber-800";
                  } else if (node.type === 'decision') {
                    nodeStyle = "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400 font-bold";
                  }

                  // Active hover state
                  if (isHovered) {
                    nodeStyle = "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/15";
                  } else if (hoveredNode && isRelated) {
                    nodeStyle = "border-emerald-500/50 bg-emerald-950/30 text-emerald-200 shadow-sm";
                  }

                  return (
                    <div
                      key={node.id}
                      id={`node-${node.id}`}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`w-full max-w-[170px] p-2.5 rounded-xl border text-xs text-center transition-all duration-300 cursor-pointer ${nodeStyle}`}
                    >
                      <p className="font-semibold line-clamp-2 leading-relaxed tracking-tight">
                        {node.label}
                      </p>
                      <span className="text-[9px] font-mono opacity-60 block mt-1 tracking-wider uppercase">
                        {node.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs text-slate-400 leading-normal flex gap-2 items-start">
        <GitFork className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong>Decision Traceability:</strong> Hover over any functional node above to automatically highlight its physical logic links. Tracing edges allows any regulator or peer auditor to inspect the exact path from source ingestion straight to final judge verdict, ensuring 100% explainability.
        </div>
      </div>
    </div>
  );
}
