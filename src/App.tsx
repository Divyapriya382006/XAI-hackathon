import React, { useState, useEffect, useRef } from 'react';
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
  Pause,
  RotateCcw,
  CheckCircle2,
  Radio,
  Terminal,
  Sliders,
  GitFork,
  Cpu,
  Layers,
  Activity,
  Trash2,
  Plus,
  Compass,
  AlertTriangle,
  Info,
  ChevronRight,
  Search,
  Eye,
  ShieldAlert,
  Check,
  ExternalLink,
  Sparkles,
  Binary,
  TrendingUp,
  GitMerge,
  Award,
  History
} from 'lucide-react';

import {
  Source,
  Claim,
  Alternative,
  TraceEvent,
  InvestigationCase,
  UserInputFile
} from './types';

// Import our highly polished sub-components
import LangGraphViewer from './components/LangGraphViewer';
import ForensicLedger from './components/ForensicLedger';
import CitationTrailViewer from './components/CitationTrailViewer';
import CounterfactualSandbox from './components/CounterfactualSandbox';
import VerificationReport from './components/VerificationReport';
import SimulationConsoleView from './components/SimulationConsoleView';
import { getDemoCaseResult } from './demo_cases';

export default function App() {
  // Input states
  const [question, setQuestion] = useState<string>('Did Coca-Cola exaggerate its sustainability claims?');
  const [attachedFiles, setAttachedFiles] = useState<UserInputFile[]>([
    { 
      name: 'coca_cola_esg_report_2023.pdf', 
      type: 'pdf', 
      size: '1.8 MB', 
      content: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL0xlbmd0aCAxNTAgPj4Kc3RyZWFtCkJUCi9GMSA0NiBUZgoxMCA3NTAgVGQKKEVtaXNzaW9ucyBSZXBvcnQgMjAyNSAtIFN1c3RhaW5hYmlsaXR5IEpvdXJuYWwpIFRqCjAgLTUwIFRkCihDbGFpbXM6IENhcmJvbiBuZXV0cmFsaXR5IGFjaGlldmVkIGJ5IG9mZnNldCByZWZvcmVzdGF0aW9uIGluIEFyZWEgMTItQi4pIFRqCjAgLTMwIFRkCihBY3R1YWwgc2F0ZWxsaXRlIGRhdGEgc2hvd3MgODglIGRlZm9yZXN0YXRpb24gaW4gQXJlYSAxMi1CLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NiAwMDAwMCBuIAowMDAwMDAwMTIzIDAwMDAwIGYgCjAwMDAwMDAyMzQgMDAwMDAgbiAKMDAwMDAwMDI5NCAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDk5CiUlRU9GCg==' 
    }
  ]);
  const [newUrl, setNewUrl] = useState<string>('');

  // Execution states
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [result, setResult] = useState<InvestigationCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useSimulationOnly, setUseSimulationOnly] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<'sustainability' | 'theranos' | 'tesla'>('sustainability');

  // Redesign Feature State: Timeline Replay Controls & Active Node Focus
  const [currentStep, setCurrentStep] = useState<number>(13); // Default to final step (completed)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 0.5x, 1x, 2x, 5x
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag-and-drop files handler
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto handle replay timing simulation
  useEffect(() => {
    if (isReplaying) {
      const intervalMs = Math.round(1500 / replaySpeed);
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 13) {
            setIsReplaying(false);
            return 13;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isReplaying, replaySpeed]);

  const handleFilesAdded = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
      const isTxt = file.type.startsWith('text/') || /\.(txt|csv|json|md|log|xml|html)$/i.test(file.name);
      
      const fileType = isImg ? 'image' : (file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.docx') ? 'docx' : 'text'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultStr = e.target?.result as string;
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: fileType as any,
          size: sizeStr,
          content: resultStr
        }]);
      };
      
      if (isImg) {
        reader.readAsDataURL(file);
      } else if (isTxt) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isInvestigating) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isInvestigating) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const addUrlInput = () => {
    if (!newUrl) return;
    setAttachedFiles(prev => [...prev, {
      name: newUrl,
      type: 'text',
      size: 'Web URL',
      content: `Target URL link to scrape: ${newUrl}. Investigate any statements associated with this online link.`
    }]);
    setNewUrl('');
  };

  // Prebuilt case templates selection
  const selectTemplateCase = (topic: 'sustainability' | 'theranos' | 'tesla') => {
    setSelectedTopic(topic);
    if (topic === 'sustainability') {
      setQuestion('Did Coca-Cola exaggerate its sustainability claims?');
      setAttachedFiles([
        { 
          name: 'emissions_report_2025.pdf', 
          type: 'pdf', 
          size: '1.8 MB', 
          content: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL0xlbmd0aCAxNTAgPj4Kc3RyZWFtCkJUCi9GMSA0NiBUZgoxMCA3NTAgVGQKKEVtaXNzaW9ucyBSZXBvcnQgMjAyNSAtIFN1c3RhaW5hYmlsaXR5IEpvdXJuYWwpIFRqCjAgLTUwIFRkCihDbGFpbXM6IENhcmJvbiBuZXV0cmFsaXR5IGFjaGlldmVkIGJ5IG9mZnNldCByZWZvcmVzdGF0aW9uIGluIEFyZWEgMTItQi4pIFRqCjAgLTMwIFRkCihBY3R1YWwgc2F0ZWxsaXRlIGRhdGEgc2hvd3MgODglIGRlZm9yZXN0YXRpb24gaW4gQXJlYSAxMi1CLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NiAwMDAwMCBuIAowMDAwMDAwMTIzIDAwMDAwIGYgCjAwMDAwMDAyMzQgMDAwMDAgbiAKMDAwMDAwMDI5NCAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDk5CiUlRU9GCg==' 
        },
        { 
          name: 'amazonian_offset_canopy.png', 
          type: 'image', 
          size: '4.2 MB', 
          content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' 
        }
      ]);
    } else if (topic === 'theranos') {
      setQuestion('Did Elizabeth Holmes exaggerate the Edison blood test specifications?');
      setAttachedFiles([
        { 
          name: 'edison_device_schematic.png', 
          type: 'image', 
          size: '3.1 MB', 
          content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWP6fDwACfgF+K7t37gAAAABJRU5ErkJggg==' 
        },
        { 
          name: 'lab_deficiencies_newark.pdf', 
          type: 'pdf', 
          size: '1.2 MB', 
          content: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL0xlbmd0aCAxNDAgPj4Kc3RyZWFtCkJUCi9GMSA0NiBUZgoxMCA3NTAgVGQKKEZEQSBOZXdhcmsgTGFib3JhdG9yeSBJbnNwZWN0aW9uIFJlcG9ydCkgVGoKMCAtNTAgVGQKKERlZmljaWVuY2llcyBmb3VuZDogRWRpc29uIG1hY2hpbmVzIHJldHVybmVkIGRpdmVyZ2VudCB2YWx1ZXMgb24gcG90YXNzaXVtIGFzc2F5cy4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjYgMDAwMDAgbiAKMDAwMDAwMDEyMyAwMDAwMCBmIAowMDAwMDAwMjM0IDAwMDAwIG4gCjAwMDAwMDAyOTQgMDAwMDAgbiAKdHJhaWxlcgogIDw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ5OQolJUVPRgo=' 
        }
      ]);
    } else if (topic === 'tesla') {
      setQuestion('Did Tesla exaggerate its early Solar Roof installation targets?');
      setAttachedFiles([
        { 
          name: 'tesla_solarcity_lawsuit.pdf', 
          type: 'pdf', 
          size: '2.4 MB', 
          content: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL0xlbmd0aCAxNDAgPj4Kc3RyZWFtCkJUCi9GMSA0NiBUZgoxMCA3NTAgVGQKKFRlc2xhLVNvbGFyQ2l0eSBTZWN1cml0aWVzIGxpdGlnYXRpb24sIERlbGF3YXJlIENvdXJ0IG9mIENoYW5jZXJ5LikgVGoKMCAtNTAgVGQKKERvY3VtZW50IGV4dHJhY3Q6IGFjdHVhbCBTb2xhciBSb29mIHdlZWtseSBpbnN0YWxscyB3ZXJlIDIxLiBUYXJnZXRzIHdlcmUgMTAwMC4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjYgMDAwMDAgbiAKMDAwMDAwMDEyMyAwMDAwMCBmIAowMDAwMDAwMjM0IDAwMDAwIG4gCjAwMDAwMDAyOTQgMDAwMDAgbiAKdHJhaWxlcgogIDw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ5OQolJUVPRgo=' 
        },
        { 
          name: 'tempered_glass_shingle.png', 
          type: 'image', 
          size: '1.9 MB', 
          content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPc/uT/DwAFBwH/993DFAAAAABJRU5ErkJggg==' 
        }
      ]);
    }
    setResult(null); // Clear previous results to let the user run fresh
  };

  // Run the autonomous agent inquiry fetch
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
          demoMode: useSimulationOnly,
          inputs: attachedFiles.map(f => ({
            type: f.type,
            name: f.name,
            size: f.size,
            content: f.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Autonomous investigation endpoint failed.');
      }

      const data: InvestigationCase = await response.json();
      
      // Load and commit completed case
      setResult(data);
      setCurrentStep(0); // Trigger timeline from 0
      setIsReplaying(true); // Automatically trigger replay simulation!
      setSelectedNodeId(null); // Focus executes live

    } catch (err: any) {
      setError(err.message || 'An error occurred during evidence aggregation.');
      setIsInvestigating(false);
    } finally {
      setIsInvestigating(false);
    }
  };

  const getVerdictBadgeColor = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('verified')) return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
    if (v.includes('debunked') || v.includes('false')) return 'bg-rose-950/40 text-rose-400 border-rose-500/30';
    if (v.includes('exaggerated')) return 'bg-amber-950/40 text-amber-400 border-amber-500/30';
    return 'bg-slate-900 text-slate-300 border-slate-800';
  };

  // Timeline replay custom controls
  const handleStepForward = () => {
    setCurrentStep(prev => Math.min(13, prev + 1));
  };

  const handleStepBackward = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleResetTimeline = () => {
    setCurrentStep(0);
    setIsReplaying(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans antialiased" id="eaip-root">
      
      {/* Platform Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                EAIP Investigation OS
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase tracking-widest">
                Explainable Autonomous Agent framework
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              FORENSIC LEDGER ACTIVE
            </span>
            <span className="text-xs text-slate-500 font-semibold font-mono hidden sm:inline">
              V3.2-PRO-AUDIT
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="app-main">
        
        {/* Launch Pad & Input Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="input-section">
          
          {/* Main Inquiry Panel */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight font-display">
                  Initiate Forensic Audit Investigation
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide any claim, press release, or research target. Upload supportive files like PDFs, spreadsheets, or graphics. The multi-agent LangGraph constellation generates an immutable forensic path with full causal verification.
              </p>
            </div>

            {/* Input Bar */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Target Corporate Claim / Research Prompt
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isInvestigating}
                  placeholder="Enter a corporate announcement, product claims, or dockets..."
                  className="w-full pl-4 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-65 animate-fade-in"
                  id="target-question-input"
                />
                <button
                  onClick={runInvestigation}
                  disabled={isInvestigating || !question.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 font-bold text-xs font-mono"
                  id="trigger-btn"
                >
                  {isInvestigating ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>RUNNING</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>RUN AUDIT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Sandbox Simulation Trigger */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 bg-slate-950/40 rounded-xl border border-slate-850 text-left" id="sandbox-quick-trigger">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  Interactive Offline Sandbox
                </span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Want to instantly inspect the interactive causal graphs, forensic timelines, and counterfactual sandbox? Load a static mockup result immediately without API keys.
                </p>
              </div>
              <button
                onClick={() => {
                  const sample = getDemoCaseResult(selectedTopic);
                  setResult(sample as any);
                  setCurrentStep(13);
                  setIsReplaying(true);
                  setSelectedNodeId(null);
                }}
                disabled={isInvestigating}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/35 text-amber-400 text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                id="view-sample-btn"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>VIEW SAMPLE WORKSPACE</span>
              </button>
            </div>

            {/* Ingress Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Drag Drop Area */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept="image/*,application/pdf,text/*,.csv,.json,.md,.docx,.log"
                />
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Evidence Attachments ({attachedFiles.length})
                  </label>
                  <button
                    onClick={triggerFileUpload}
                    disabled={isInvestigating}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" /> Upload PDF/Image
                  </button>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileUpload}
                  className={`border rounded-xl p-3 min-h-[110px] space-y-1.5 max-h-[150px] overflow-y-auto transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : 'bg-slate-950/50 border-slate-850 hover:border-slate-700'
                  }`}
                  title="Click or drop files here"
                >
                  {attachedFiles.length === 0 ? (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                      <UploadCloud className="w-6 h-6 mb-1 text-slate-600" />
                      <span>Drag files here or <strong className="text-emerald-400">browse</strong></span>
                    </div>
                  ) : (
                    attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                        id={`attached-file-${idx}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 text-slate-300 font-semibold truncate">
                          {file.type === 'image' && file.content ? (
                            <img
                              src={file.content}
                              className="w-5 h-5 object-cover rounded border border-slate-700 shrink-0"
                              alt="Preview"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">({file.size})</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scraper link channel */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Crawl & Scraping URL Ingress
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    disabled={isInvestigating}
                    placeholder="https://sec.gov/files/sustainability-compliance"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-65"
                    id="new-url-input"
                  />
                  <button
                    onClick={addUrlInput}
                    disabled={isInvestigating || !newUrl}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-3.5 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed flex gap-2 items-start h-[110px]">
                  <Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    Adding online URLs initiates a custom scraping agent that crawls the layout, strips JavaScript payloads, isolates text claims, and indexes the links into the verification stream.
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <div className="bg-rose-950/20 border border-rose-900/50 p-3.5 rounded-xl flex gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Investigation Failed:</strong> {error}
                </div>
              </div>
            )}
          </div>

          {/* Preset templates panel */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-tight">
                <Compass className="w-4 h-4 text-emerald-400" />
                Inquiry Presets
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly load and inspect comprehensive pre-compiled cases showing full multi-agent traceability.
              </p>
            </div>

             <div className="space-y-2.5 flex-1 mt-4">
              {[
                {
                  id: 'sustainability',
                  title: 'Coca-Cola ESG Statements',
                  desc: 'Virgin plastic claims vs landfills data.',
                  verdict: 'Exaggerated'
                },
                {
                  id: 'theranos',
                  title: 'Elizabeth Holmes Trial',
                  desc: 'FDA audits vs device specs.',
                  verdict: 'Debunked'
                },
                {
                  id: 'tesla',
                  title: 'Tesla Solar Roof Target',
                  desc: 'Install rates vs court dockets.',
                  verdict: 'Exaggerated'
                }
              ].map((template) => (
                <div
                  key={template.id}
                  onClick={() => selectTemplateCase(template.id as any)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-2 group cursor-pointer ${
                    selectedTopic === template.id ? 'border-emerald-500 bg-slate-950/50' : 'border-slate-850 hover:border-slate-750 hover:bg-slate-950/20'
                  }`}
                  id={`preset-card-${template.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className={`text-xs font-bold transition-colors ${
                        selectedTopic === template.id ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-400'
                      }`}>
                        {template.title}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        {template.desc}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${
                      template.verdict === 'Debunked' ? 'bg-rose-950/50 border-rose-900/40 text-rose-400' : 'bg-amber-950/50 border-amber-900/40 text-amber-400'
                    }`}>
                      {template.verdict}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTemplateCase(template.id as any);
                      }}
                      className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-750 text-[10px] font-mono font-bold text-slate-300 transition-all cursor-pointer text-center"
                    >
                      Load Case
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTemplateCase(template.id as any);
                        const sample = getDemoCaseResult(template.id as any);
                        setResult(sample as any);
                        setCurrentStep(13);
                        setIsReplaying(true);
                      }}
                      className="flex-1 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400 transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Sample
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-850 pt-3 text-[11px] text-slate-500 leading-normal">
              <strong>Consensus Tip:</strong> Choose any interactive scenario above, and press the glowing green <strong>RUN AUDIT</strong> button to watch the graph execute live.
            </div>
          </div>

        </div>

        {/* 2. MAIN RESULTS WORKSPACE: THE INTEGRATED SPLIT PANEL CONSOLE */}
        {result && !isInvestigating && (
          <div className="space-y-8 animate-fade-in" id="results-workspace">
            
            {result.demoMode && (
              <div className="bg-amber-950/15 border border-amber-500/40 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between text-left shadow-lg animate-fade-in" id="demo-mode-banner">
                <div className="flex gap-4 items-center">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                      Interactive Sandbox Mockup Active
                    </h4>
                    <p className="text-[11px] text-amber-300/80 leading-normal mt-0.5 max-w-2xl">
                      You are inspecting a static pre-compiled template case designed to demonstrate the complete clickable traceability, causal graph transitions, and counterfactual simulation. To execute a dynamic, live inquiry against real web sources, use the prompt bar above and click <strong>RUN AUDIT</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer shrink-0 text-center"
                >
                  Configure Live Run
                </button>
              </div>
            )}

            {true && (
              <>
                {/* AUDIT SUMMARY ACCENT HEADER CARD */}
                <div className={`border rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden shadow-md border-l-4 ${getVerdictBadgeColor(result.conclusion.verdict)}`}>
                  <div className="space-y-2.5 max-w-4xl flex-1 text-left">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-60 block">
                        ACTIVE FORENSIC CONCLUSION
                      </span>
                      <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-display mt-0.5">
                        {result.conclusion.verdict}
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm font-medium leading-relaxed opacity-95 text-slate-300">
                      {result.conclusion.summary}
                    </p>
                  </div>

                  {/* Aggregate confidence rating */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="opacity-10 text-slate-600" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * result.conclusion.confidence) / 100} className="transition-all duration-1000 ease-out text-emerald-500" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black font-mono leading-none text-white">{result.conclusion.confidence}%</span>
                        <span className="text-[8px] font-mono opacity-70 uppercase tracking-widest mt-1 font-bold">Accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DUAL INTERACTIVE WORKSPACE: GRAPH LOOP ON THE LEFT & FORENSIC LEDGER ON THE RIGHT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-split">
                  
                  {/* LEFT COLUMN: Animated Clicking LangGraph Flow Map */}
                  <div className="lg:col-span-6 flex flex-col">
                    <LangGraphViewer
                      currentStep={currentStep}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
                      replaySpeed={replaySpeed}
                      setReplaySpeed={(speed) => setReplaySpeed(speed)}
                      isReplaying={isReplaying}
                      setIsReplaying={(val) => setIsReplaying(val)}
                      onStepForward={handleStepForward}
                      onStepBackward={handleStepBackward}
                      onReset={handleResetTimeline}
                    />
                  </div>

                  {/* RIGHT COLUMN: Ledger Entry details with cryptographically signed parameters */}
                  <div className="lg:col-span-6 flex flex-col">
                    <ForensicLedger
                      selectedNodeId={selectedNodeId}
                      currentStep={currentStep}
                      question={question}
                    />
                  </div>

                </div>

                {/* CITATION TRAIL & INTERACTIVE EVIDENCE GRAPH VISUALIZER */}
                <CitationTrailViewer 
                  question={question} 
                  sources={result.sources}
                  claims={result.claims}
                  decisionTrace={result.decisionTrace}
                  decisionGraph={result.decisionGraph}
                  demoMode={result.demoMode}
                />

                {/* IMPACT ANALYSIS & COUNTERFACTUAL EVIDENCE SANDBOX */}
                <CounterfactualSandbox
                  initialSources={result.sources}
                  initialConfidence={result.confidenceBreakdown}
                  initialVerdict={result.conclusion.verdict}
                  initialSummary={result.conclusion.summary}
                />

                {/* THE SEC/EPA COMPLIANT PDF AUDIT REPORT */}
                <VerificationReport
                  question={question}
                  verdict={result.conclusion.verdict}
                  summary={result.conclusion.summary}
                  confidence={result.conclusion.confidence}
                  sources={result.sources}
                  decisionTrace={result.decisionTrace}
                  alternatives={result.alternatives}
                  hallucinationChecks={result.hallucinationChecks}
                />
              </>
            )}

          </div>
        )}

      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-8 text-center text-xs text-slate-500 font-medium shrink-0" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 Explainable Autonomous Investigation Platform (EAIP). All rights reserved.</p>
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Immutable 12-Phase Multi-Agent Causal Traceability System.
          </p>
        </div>
      </footer>

    </div>
  );
}

// Minimalist fallback for missing HelpCircle svg
function HelpCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
