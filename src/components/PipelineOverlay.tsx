import React, { useState, useEffect, useRef } from 'react';
import { TraceEvent } from '../types';
import { ShieldAlert, Compass, Search, Terminal, Radio, Eye, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface PipelineOverlayProps {
  events: TraceEvent[];
  onComplete: () => void;
  question: string;
}

export default function PipelineOverlay({ events, onComplete, question }: PipelineOverlayProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [visibleLogs, setVisibleLogs] = useState<TraceEvent[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Agent cards to display in the grid
  const agents = [
    { name: 'Planner Agent', icon: Compass, desc: 'Query Decomposer' },
    { name: 'Retriever Agent', icon: Search, desc: 'Web grounding finder' },
    { name: 'Browser Agent', icon: Terminal, desc: 'DOM text scraper' },
    { name: 'Evidence Aggregator', icon: Radio, desc: 'Unified evidence compiler' },
    { name: 'Contradiction Detector', icon: ShieldAlert, desc: 'Alert & overlap flags' },
    { name: 'Hallucination Supervisor', icon: Eye, desc: '5-Layer validation audits' },
    { name: 'Judge Agent', icon: CheckCircle2, desc: 'Verdict synthesizer' },
  ];

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLogs]);

  // Fast-paced simulation of agent progression
  useEffect(() => {
    if (events.length === 0) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= events.length) {
          clearInterval(timer);
          // Wait a brief moment on the last step before completing for a solid transition
          setTimeout(() => {
            onComplete();
          }, 1200);
          return prev;
        }

        // Add to visible logs
        setVisibleLogs((logs) => [...logs, events[next]]);
        return next;
      });
    }, 700); // Progresses every 700ms for a snappy, highly dynamic feel

    // Add first event immediately
    setVisibleLogs([events[0]]);

    return () => clearInterval(timer);
  }, [events, onComplete]);

  // Determine which agent card is currently glowing/active
  const getActiveAgentName = () => {
    if (currentStep >= events.length) return '';
    return events[currentStep]?.agent || '';
  };

  const activeAgentName = getActiveAgentName();
  const percentComplete = Math.min(100, Math.round((currentStep / (events.length - 1)) * 100));

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto select-none" id="pipeline-overlay">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header bar */}
        <div className="border-b border-slate-800/80 bg-slate-950 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <h2 className="text-sm font-semibold tracking-wider font-mono text-emerald-400 uppercase">
                Active Multi-Agent Investigation
              </h2>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              Analyzing: <strong className="text-white">"{question}"</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              Celerity Engine: Parallel
            </span>
          </div>
        </div>

        {/* Progress display */}
        <div className="h-1 bg-slate-950 relative w-full">
          <div
            style={{ width: `${percentComplete}%` }}
            className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          ></div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          
          {/* Left panel: Active Agent Cards Flow */}
          <div className="lg:col-span-7 p-6 border-r border-slate-800/60 overflow-y-auto space-y-5">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Active Agent Constellation
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {agents.map((agent, index) => {
                const isActive = activeAgentName.toLowerCase().includes(agent.name.toLowerCase().split(' ')[0]);
                const isPast = events.slice(0, currentStep).some(e => e.agent.toLowerCase().includes(agent.name.toLowerCase().split(' ')[0]));
                const AgentIcon = agent.icon;

                let cardStyle = "border-slate-800/60 bg-slate-950/40 text-slate-500";
                if (isActive) {
                  cardStyle = "border-emerald-500 bg-emerald-500/10 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30";
                } else if (isPast) {
                  cardStyle = "border-emerald-500/30 bg-slate-950/80 text-emerald-400";
                }

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 relative overflow-hidden ${cardStyle}`}
                    id={`pipeline-agent-${index}`}
                  >
                    {isActive && (
                      <div className="absolute top-0 bottom-0 right-0 w-1 bg-emerald-500 animate-pulse"></div>
                    )}

                    <div className={`p-2 rounded-lg shrink-0 ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' :
                      isPast ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'
                    }`}>
                      <AgentIcon className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold leading-snug">
                        {agent.name}
                      </p>
                      <p className={`text-[10px] leading-normal ${
                        isActive ? 'text-emerald-200' : 'text-slate-500'
                      }`}>
                        {agent.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Terminal Terminal Output logs */}
          <div className="lg:col-span-5 bg-slate-950 p-5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Decision Trace Logs
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                STDOUT // AUTO
              </span>
            </div>

            {/* Scrollable log box */}
            <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[11px] text-slate-300 leading-relaxed pr-1">
              {visibleLogs.map((log, index) => {
                const isWarn = log.status === 'warning';
                return (
                  <div key={index} className="space-y-1 animate-fade-in" id={`log-item-${index}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                      <span className="text-emerald-400">[{log.timestamp}]</span>
                      <span>{log.agent}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className={isWarn ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {log.event.toUpperCase()}
                      </span>
                    </div>
                    <p className="pl-4 text-slate-400 font-normal leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                );
              })}
              <div ref={logEndRef}></div>
            </div>

            {/* Bottom active feedback */}
            <div className="border-t border-slate-900 pt-3 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Evaluating logical weights...
              </span>
              <span>Certainty: {percentComplete}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
