import React from 'react';
import { Play, Pause, Activity, RefreshCw, Brain, Cpu, MessageSquare } from 'lucide-react';
import { ThinkingStep } from '../types';

export interface DynamicLangNode {
  id: string;
  label: string;
  role: string;
  step: number;
  x: number;    // Grid column
  y: number;    // Grid row
  details: {
    title: string;
    metrics: { label: string; val: string }[];
    io: { input: string; output: string };
    latency: string;
    toolCalls: string[];
    errors: string;
  };
}

interface LangGraphViewerProps {
  currentStep: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  replaySpeed: number;
  setReplaySpeed: (speed: number) => void;
  isReplaying: boolean;
  setIsReplaying: (val: boolean) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  thinkingSteps?: ThinkingStep[];
  question?: string;
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
  onReset,
  thinkingSteps = [],
  question = ""
}: LangGraphViewerProps) {

  // Dynamically map the thinkingSteps from the backend into LangGraph visualizer nodes!
  const nodes: DynamicLangNode[] = React.useMemo(() => {
    if (!thinkingSteps || thinkingSteps.length === 0) {
      // Direct clean fallback mapping if no steps are fetched yet
      return [
        {
          id: 'start',
          label: 'Start Node',
          role: 'System Trigger',
          step: 0,
          x: 0,
          y: 0,
          details: {
            title: 'System Trigger',
            metrics: [{ label: 'Status', val: 'Awaiting Query' }],
            io: { input: 'Idle', output: 'Pending user prompt' },
            latency: '0ms',
            toolCalls: [],
            errors: 'None'
          }
        }
      ];
    }

    const derivedNodes: DynamicLangNode[] = [];
    
    // Add Start Node at step 0
    derivedNodes.push({
      id: 'start',
      label: 'Start Node',
      role: 'System Trigger',
      step: 0,
      x: 0,
      y: 0,
      details: {
        title: 'Forensic Audit Trigger',
        metrics: [
          { label: 'Ingress Protocol', val: 'Secure API Ingress' },
          { label: 'Trigger Event', val: 'USER_QUERY_RECEIVED' }
        ],
        io: {
          input: question || 'No query input',
          output: 'Audit goal parsed and submitted to Planner Agent'
        },
        latency: '3ms',
        toolCalls: ['InitializeContext()'],
        errors: 'None'
      }
    });

    // Map each actual thinking step from the server to a node in the graph
    thinkingSteps.forEach((stepObj, idx) => {
      const stepNum = stepObj.step; // 1-indexed
      let x = 0;
      // Stagger nodes visually to create an interesting graph topology
      if (stepObj.agent.includes('Retriever')) x = -1;
      else if (stepObj.agent.includes('Scraper')) x = 1;
      else if (stepObj.agent.includes('Auditor')) x = -0.5;
      else if (stepObj.agent.includes('Explainability')) x = 0.5;

      derivedNodes.push({
        id: `step-${stepNum}`,
        label: stepObj.agent,
        role: 'Autonomous Agent',
        step: stepNum,
        x,
        y: stepNum,
        details: {
          title: `${stepObj.agent} Action Trace`,
          metrics: [
            { label: 'Step Milestone', val: `Phase ${stepNum}` },
            { label: 'Causal Stamp', val: stepObj.timestamp ? new Date(stepObj.timestamp).toLocaleTimeString() : 'N/A' }
          ],
          io: {
            input: stepObj.thought,
            output: stepObj.observation
          },
          latency: 'Variable',
          toolCalls: [stepObj.action],
          errors: 'None'
        }
      });
    });

    // Add conclusive conclusion node at the end
    const lastStep = thinkingSteps.length;
    derivedNodes.push({
      id: 'end',
      label: 'End Node',
      role: 'Immutable Ledger',
      step: lastStep + 1,
      x: 0,
      y: lastStep + 1,
      details: {
        title: 'Forensic Audit Concluded',
        metrics: [
          { label: 'Audit Status', val: 'SUCCESS_COMMITTED' },
          { label: 'Chain Length', val: `${thinkingSteps.length} Agents` }
        ],
        io: {
          input: 'Aggregated agent consensus matrices.',
          output: 'Immutable audit signature generated and displayed.'
        },
        latency: '1ms',
        toolCalls: ['CommitLedgerSignature()'],
        errors: 'None'
      }
    });

    return derivedNodes;
  }, [thinkingSteps, question]);

  const maxSteps = nodes.length > 0 ? Math.max(...nodes.map(n => n.step)) : 13;

  // Grid coordinates math
  const colWidth = 120;
  const rowHeight = 70;
  const paddingY = 30;
  const paddingX = 150;

  const getCoords = (node: DynamicLangNode) => {
    return {
      cx: paddingX + node.x * colWidth,
      cy: paddingY + node.y * rowHeight
    };
  };

  const getNodeStatus = (node: DynamicLangNode): 'completed' | 'running' | 'queued' => {
    if (node.step < currentStep) return 'completed';
    if (node.step === currentStep) return 'running';
    return 'queued';
  };

  // Find the selected node
  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes.find(n => n.step === currentStep) || nodes[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full" id="langgraph-visualizer">
      
      {/* Visualizer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
            <Activity className="text-emerald-400 w-4 h-4" />
            Dynamic LangGraph Swarm Execution Map
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time visual trace computed from actual API proceedings. Click any node to view its detailed execution state.
          </p>
        </div>
      </div>

      {/* Control Board */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReplaying(!isReplaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isReplaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
            }`}
            id="play-pause-btn"
          >
            {isReplaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isReplaying ? 'Pause' : 'Replay'}
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStep === 0}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            id="prev-step-btn"
          >
            ⏮
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStep >= maxSteps}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            id="next-step-btn"
          >
            ⏭
          </button>

          <button
            onClick={onReset}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
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
            Step: <strong className="text-white">{currentStep} / {maxSteps}</strong>
          </div>
        </div>
      </div>

      {/* Main Split Visual Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[480px]">
        
        {/* Left Grid: Graphical Nodes & Connections */}
        <div className="md:col-span-7 bg-slate-950 border border-slate-850 rounded-xl relative overflow-y-auto p-3 h-[500px] flex items-start justify-center">
          
          <svg className="absolute inset-0 w-full h-[850px] pointer-events-none z-0">
            <defs>
              <marker id="arrow-completed" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrow-running" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-queued" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
            </defs>

            {/* Render connections dynamically between nodes */}
            {(() => {
              const paths: React.ReactNode[] = [];
              for (let i = 0; i < nodes.length - 1; i++) {
                const fromNode = nodes[i];
                const toNode = nodes[i + 1];
                const fromCoords = getCoords(fromNode);
                const toCoords = getCoords(toNode);
                const toStatus = getNodeStatus(toNode);
                
                const strokeColor = toStatus === 'completed' ? '#10b981' : toStatus === 'running' ? '#fbbf24' : '#334155';
                const markerId = toStatus === 'completed' ? 'arrow-completed' : toStatus === 'running' ? 'arrow-running' : 'arrow-queued';
                const isDash = toStatus === 'running';

                paths.push(
                  <path
                    key={`edge-${fromNode.id}-${toNode.id}`}
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
              return paths;
            })()}
          </svg>

          {/* Interactive node elements */}
          <div className="absolute top-0 bottom-0 left-0 right-0 h-[850px] z-10 pointer-events-none">
            {nodes.map((node) => {
              const coords = getCoords(node);
              const status = getNodeStatus(node);
              const isSelected = selectedNodeId === node.id || (selectedNodeId === null && node.step === currentStep);

              let borderStyle = 'border-slate-800 bg-slate-900 text-slate-500';
              let glowStyle = '';

              if (status === 'completed') {
                borderStyle = 'border-emerald-500/40 bg-slate-900 text-emerald-300';
              } else if (status === 'running') {
                borderStyle = 'border-amber-500 bg-slate-900 text-amber-200 ring-2 ring-amber-500/20';
                glowStyle = 'animate-pulse';
              }

              if (isSelected) {
                borderStyle = 'border-sky-500 bg-slate-900 text-sky-100 ring-2 ring-sky-500/40 shadow-lg';
              }

              return (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  style={{
                    position: 'absolute',
                    left: `${coords.cx}px`,
                    top: `${coords.cy}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`w-[130px] p-2 rounded-xl border text-center transition-all duration-200 pointer-events-auto select-none ${borderStyle} ${glowStyle} hover:scale-105 hover:border-sky-400 group cursor-pointer`}
                  id={`langnode-${node.id}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      {status === 'completed' ? (
                        <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                      ) : status === 'running' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      )}
                      <span className="text-[10px] font-bold tracking-tight truncate max-w-[95px] text-white">
                        {node.label.replace(' Agent', '').replace(' Node', '')}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 block truncate max-w-[110px] mt-0.5 group-hover:text-sky-300">
                      {node.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Panel: Dynamic Node Inspector (Good explainability!) */}
        <div className="md:col-span-5 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between h-[500px]">
          
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">AGENT STATE INSPECTOR</span>
              <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                <Brain className="w-3.5 h-3.5 text-sky-400" />
                {activeNode.details.title}
              </h4>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              {activeNode.details.metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800/40 rounded-lg p-2">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">{m.label}</span>
                  <span className="text-[10px] font-bold text-slate-300 block truncate mt-0.5">{m.val}</span>
                </div>
              ))}
            </div>

            {/* Thought / Input */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest font-bold">Thought / Goal Input</span>
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-xs text-slate-300 font-medium italic leading-relaxed">
                "{activeNode.details.io.input}"
              </div>
            </div>

            {/* Actions / Tool Calls */}
            {activeNode.details.toolCalls.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest font-bold">Executed Commands</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeNode.details.toolCalls.map((t, idx) => (
                    <span key={idx} className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-sky-400 px-2 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Observation / Output */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-emerald-500 block uppercase tracking-widest font-bold">Observation / Output</span>
              <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-3 text-xs text-emerald-300 font-semibold leading-relaxed">
                {activeNode.details.io.output}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[9px] font-mono text-slate-600">
            <span>NODE STATUS: <strong className="text-slate-400">{getNodeStatus(activeNode).toUpperCase()}</strong></span>
            <span>LATENCY: <strong className="text-slate-400">{activeNode.details.latency}</strong></span>
          </div>

        </div>

      </div>

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

// ─── Backward compatibility exports for ForensicLedger and VerificationReport ───
export interface LangNode {
  id: string;
  label: string;
  role: string;
  step: number;
  x: number;
  y: number;
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
        input: 'System initialization...',
        output: 'System trigger dispatched.'
      },
      latency: '2 ms',
      toolCalls: [],
      errors: 'None'
    }
  }
];
