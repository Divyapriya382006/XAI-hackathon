import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { Eye, EyeOff, Sliders, MapPin, ZoomIn } from 'lucide-react';

interface GradCamViewerProps {
  imageAnalysis: ImageAnalysis;
  imageUrl?: string;
}

export default function GradCamViewer({ imageAnalysis, imageUrl }: GradCamViewerProps) {
  const [opacity, setOpacity] = useState<number>(0.6);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  // Fallback default image is a beautiful, highly detailed representation of a satellite grid
  const defaultImage = "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80";
  const displayImage = imageUrl || defaultImage;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4" id="gradcam-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 font-display">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Computer Vision Focus Attribution (Grad-CAM Map)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualizing spatial gradients in physical evidence images that influenced the sub-agent decisions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-slate-400">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Grad-CAM Overlay</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Interactive Image Display */}
        <div className="md:col-span-8 flex flex-col items-center">
          <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow bg-slate-950 w-full max-w-[450px] aspect-square flex items-center justify-center group select-none">
            {/* Base Image */}
            <img
              src={displayImage}
              alt="Evidence Capture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
            />

            {/* Heatmap Overlay Layer */}
            <div
              style={{ opacity }}
              className="absolute inset-0 bg-radial-gradient pointer-events-none transition-opacity duration-300"
            >
              {/* Radial heat gradient mock using concentric circles over key points */}
              {imageAnalysis.overlay && imageAnalysis.overlay.map((point, idx) => {
                return (
                  <div
                     key={idx}
                     style={{
                       left: `${point.x}%`,
                       top: `${point.y}%`,
                       width: `${point.width * 2}%`,
                       height: `${point.height * 2}%`,
                       transform: 'translate(-50%, -50%)',
                     }}
                     className="absolute rounded-full bg-red-500/45 blur-md border border-red-400 animate-pulse"
                  ></div>
                );
              })}
            </div>

            {/* Interactive Coordinate Hotspots */}
            {imageAnalysis.overlay && imageAnalysis.overlay.map((point, idx) => {
              return (
                <button
                  key={idx}
                  onMouseEnter={() => setActivePoint(idx)}
                  onMouseLeave={() => setActivePoint(null)}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-crosshair z-20 ${
                    activePoint === idx
                      ? 'bg-red-600 text-white scale-125 shadow-lg border border-white'
                      : 'bg-red-500/80 text-white hover:scale-110 border border-white/60'
                  }`}
                  id={`gradcam-hotspot-${idx}`}
                >
                  <MapPin className="w-3 h-3" />
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 mt-2 italic flex items-center gap-1 text-center justify-center">
            <ZoomIn className="w-3 h-3 text-slate-500" />
            Hover over localized pinpoints to inspect vision network descriptions.
          </p>
        </div>

        {/* Sliders and Info Controls */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
                Opacity Controller
              </span>
              <div className="flex items-center gap-3">
                <EyeOff className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 border border-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <Eye className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% (Raw Image)</span>
                <span>{Math.round(opacity * 100)}% Opacity</span>
                <span>100% (Overlay Only)</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-850 pt-3">
              <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
                Target OCR Scan
              </span>
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 font-mono text-[11px] text-slate-300 leading-normal max-h-[100px] overflow-y-auto">
                {imageAnalysis.ocrText || "No text patterns identified inside image matrix."}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-850 pt-3">
              <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
                Image Agent Caption
              </span>
              <p className="text-xs text-slate-400 leading-normal font-normal">
                {imageAnalysis.caption || "Image metadata parsed. No anomalies flagged."}
              </p>
            </div>
          </div>

          {/* Hotspot details focus */}
          <div className="h-16 flex items-center justify-center border border-dashed border-slate-800 rounded-lg p-2 bg-slate-950 text-center">
            {activePoint !== null ? (
              <div className="animate-fade-in text-[11px]">
                <strong className="text-red-400 uppercase font-mono block mb-0.5 text-[9px] tracking-wider">
                  Vision Node Attention Spot {activePoint + 1}
                </strong>
                <span className="text-slate-300 font-medium leading-relaxed">
                  "{imageAnalysis.overlay[activePoint].intensity}"
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Hover pins to focus vision logs.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
        <strong>Grad-CAM Explanation:</strong> Gradient-weighted Class Activation Mapping calculates the backpropagated gradients of target labels flowing into the final convolutional layer. This mathematically isolates the exact spatial coordinate grids within screenshots, documents, or satellite frames that prompted active verification triggers.
      </p>
    </div>
  );
}
