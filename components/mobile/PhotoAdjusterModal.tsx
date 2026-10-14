'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Check, 
  X, 
  Crop,
  Move,
  ScanLine,
  ArrowRight
} from 'lucide-react';
import { 
  cleanBanknoteImage, 
  CleanResult, 
  BanknoteCorners 
} from '@/lib/media/banknote-cleaner';

interface PhotoAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBlob: Blob | null;
  initialPreviewUrl: string | null;
  sideLabel: string; // 'Front' or 'Back'
  onApply: (cleanedBlob: Blob, cleanedPreview: string) => void;
}

const DEFAULT_CORNERS: BanknoteCorners = {
  topLeft: { x: 0.08, y: 0.12 },
  topRight: { x: 0.92, y: 0.12 },
  bottomRight: { x: 0.92, y: 0.88 },
  bottomLeft: { x: 0.08, y: 0.88 },
};

type CornerKey = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export default function PhotoAdjusterModal({
  isOpen,
  onClose,
  imageBlob,
  initialPreviewUrl,
  sideLabel,
  onApply,
}: PhotoAdjusterModalProps) {
  // Mode selection: 'corners' (Manual 4-point pin setter) vs 'preview' (Straightened output)
  const [activeTab, setActiveTab] = useState<'corners' | 'preview'>('corners');

  // Manual 4 corners state (normalized 0.0 to 1.0)
  const [corners, setCorners] = useState<BanknoteCorners>(DEFAULT_CORNERS);
  const [activeDraggingCorner, setActiveDraggingCorner] = useState<CornerKey | null>(null);

  // Fine-tuning states
  const [rotation90, setRotation90] = useState(0); // 0, 90, 180, 270
  const [manualAngle, setManualAngle] = useState(0); // -15 to +15
  const [cropPreset, setCropPreset] = useState<'safe' | 'close' | 'full'>('safe');
  const [cropMarginPercent, setCropMarginPercent] = useState(0);
  const [enhanceClarity, setEnhanceClarity] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Image URLs
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(initialPreviewUrl);
  const [activeCleanResult, setActiveCleanResult] = useState<CleanResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize raw image object URL on open
  useEffect(() => {
    if (isOpen && imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setRawImageUrl(url);
      setCorners(DEFAULT_CORNERS);
      setActiveTab('corners');

      // Also compute a default auto-cleaned preview in parallel
      runAdjustment(0, 0, 'safe', 0, false, true, undefined);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [isOpen, imageBlob]);

  const runAdjustment = async (
    rot90: number,
    angle: number,
    preset: 'safe' | 'close' | 'full',
    margin: number,
    enhance: boolean,
    autoDetectSkew: boolean = false,
    useCorners?: BanknoteCorners
  ) => {
    if (!imageBlob) return;
    setIsProcessing(true);
    try {
      const isFull = preset === 'full';
      const basePresetMargin = preset === 'close' ? 3 : 0;
      const totalMargin = isFull ? 0 : basePresetMargin + margin;

      const res = await cleanBanknoteImage(imageBlob, {
        autoStraighten: autoDetectSkew && !useCorners,
        autoCropEdges: !isFull && !useCorners,
        rotation90: rot90,
        manualAngle: angle,
        cropMarginPercent: totalMargin,
        enhanceClarity: enhance,
        quality: 0.94,
        corners: useCorners,
      });

      setActiveCleanResult(res);
      setPreviewDataUrl(res.dataUrl);
      if (autoDetectSkew && !useCorners && res.detectedSkew !== 0) {
        setManualAngle(Math.round(res.detectedSkew * 10) / 10);
      }
    } catch (err) {
      console.warn('Photo adjustment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Straighten note using currently set 4 corners
  const handleStraightenWithCorners = async () => {
    setActiveTab('preview');
    await runAdjustment(rotation90, manualAngle, cropPreset, cropMarginPercent, enhanceClarity, false, corners);
  };

  // Dragging tracking refs
  const isDraggingRef = useRef(false);
  const activeCornerRef = useRef<CornerKey | null>(null);
  activeCornerRef.current = activeDraggingCorner;

  // Window-level pointer listeners during corner drag
  useEffect(() => {
    if (!activeDraggingCorner) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!activeCornerRef.current || !containerRef.current) return;
      isDraggingRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;
      const clampedX = Math.max(0, Math.min(1, Math.round(rawX * 1000) / 1000));
      const clampedY = Math.max(0, Math.min(1, Math.round(rawY * 1000) / 1000));

      const cornerKey = activeCornerRef.current;
      setCorners((prev) => ({
        ...prev,
        [cornerKey]: { x: clampedX, y: clampedY },
      }));
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveDraggingCorner(null);
      // Retain dragging flag for 120ms to swallow any trailing synthetic click events
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 120);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerUp, { capture: true });
    window.addEventListener('pointercancel', handleWindowPointerUp, { capture: true });

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp, { capture: true });
      window.removeEventListener('pointercancel', handleWindowPointerUp, { capture: true });
    };
  }, [activeDraggingCorner]);

  // Pointer dragging handler for initiating handle drag
  const handlePointerDown = (cornerKey: CornerKey, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setActiveDraggingCorner(cornerKey);
  };

  // Click on container moves nearest corner pin (only when not dragging)
  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current || isDraggingRef.current || activeDraggingCorner) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const cornerKeys: CornerKey[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    let nearestKey = cornerKeys[0];
    let minDist = Infinity;

    for (const key of cornerKeys) {
      const pt = corners[key];
      const d = Math.hypot(pt.x - clickX, pt.y - clickY);
      if (d < minDist) {
        minDist = d;
        nearestKey = key;
      }
    }

    setCorners((prev) => ({
      ...prev,
      [nearestKey]: {
        x: Math.max(0, Math.min(1, Math.round(clickX * 1000) / 1000)),
        y: Math.max(0, Math.min(1, Math.round(clickY * 1000) / 1000)),
      },
    }));
  };

  // Corner Presets
  const handlePresetCorners = (preset: 'inset5' | 'inset10' | 'full') => {
    if (preset === 'full') {
      setCorners({
        topLeft: { x: 0.01, y: 0.01 },
        topRight: { x: 0.99, y: 0.01 },
        bottomRight: { x: 0.99, y: 0.99 },
        bottomLeft: { x: 0.01, y: 0.99 },
      });
    } else if (preset === 'inset5') {
      setCorners({
        topLeft: { x: 0.05, y: 0.06 },
        topRight: { x: 0.95, y: 0.06 },
        bottomRight: { x: 0.95, y: 0.94 },
        bottomLeft: { x: 0.05, y: 0.94 },
      });
    } else {
      setCorners(DEFAULT_CORNERS);
    }
  };

  // Fine-tuning adjustments
  const handleRotate90 = (delta: number) => {
    const nextRot = (rotation90 + delta + 360) % 360;
    setRotation90(nextRot);
    runAdjustment(nextRot, manualAngle, cropPreset, cropMarginPercent, enhanceClarity, false, activeTab === 'preview' ? corners : undefined);
  };

  const handleAngleChange = (angle: number) => {
    setManualAngle(angle);
    runAdjustment(rotation90, angle, cropPreset, cropMarginPercent, enhanceClarity, false, activeTab === 'preview' ? corners : undefined);
  };

  const handleCropSliderChange = (margin: number) => {
    setCropMarginPercent(margin);
    runAdjustment(rotation90, manualAngle, cropPreset, margin, enhanceClarity, false, activeTab === 'preview' ? corners : undefined);
  };

  const handleEnhanceToggle = () => {
    const nextEnhance = !enhanceClarity;
    setEnhanceClarity(nextEnhance);
    runAdjustment(rotation90, manualAngle, cropPreset, cropMarginPercent, nextEnhance, false, activeTab === 'preview' ? corners : undefined);
  };

  const handleSave = async () => {
    if (activeTab === 'corners') {
      // If user clicks Apply while on the Corners tab, warp immediately with current corners
      if (!imageBlob) return;
      setIsProcessing(true);
      try {
        const res = await cleanBanknoteImage(imageBlob, {
          rotation90,
          manualAngle,
          cropMarginPercent,
          enhanceClarity,
          quality: 0.95,
          corners,
        });
        onApply(res.cleanedBlob, res.dataUrl);
        onClose();
      } catch (err) {
        console.warn('Direct corner apply failed:', err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (activeCleanResult && previewDataUrl) {
      onApply(activeCleanResult.cleanedBlob, previewDataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Active corner details for Magnifier Loupe
  const activePt = activeDraggingCorner ? corners[activeDraggingCorner] : null;

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        
        {/* Header with Mode Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070d1e]">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit & Straighten {sideLabel} Note
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Segmented Pill */}
        <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('corners')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'corners'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Move className="h-3.5 w-3.5" />
              <span>1. Set 4 Corners</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'corners') {
                  handleStraightenWithCorners();
                } else {
                  setActiveTab('preview');
                }
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>2. Straightened Result</span>
            </button>
          </div>

          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            {activeTab === 'corners' ? 'Drag pins to note corners' : 'Adjust orientation & margins'}
          </span>
        </div>

        {/* Main Canvas Viewport */}
        <div className="relative flex-1 min-h-[240px] max-h-[380px] bg-slate-950 flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none">
          
          {/* Alignment Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-3 opacity-15 border border-white/40">
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div />
          </div>

          {activeTab === 'corners' ? (
            /* TAB 1: 4-Corner Manual Setter with interactive pins and magnifying loupe */
            <div 
              ref={containerRef}
              onClick={handleContainerClick}
              onPointerDown={(e) => e.stopPropagation()}
              className="relative max-h-full max-w-full aspect-video flex items-center justify-center touch-none cursor-crosshair overflow-visible"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            >
              {rawImageUrl ? (
                <img
                  src={rawImageUrl}
                  alt="Raw Note for Corner Selection"
                  className="max-h-[340px] w-auto max-w-full object-contain pointer-events-none rounded shadow-md"
                  draggable={false}
                />
              ) : (
                <div className="text-white text-xs">Loading note image...</div>
              )}

              {/* Shaded SVG Polygon Overlay */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                {/* Background Dimming Mask (Dims outside area) */}
                <path
                  d={`M 0 0 L 100 0 L 100 100 L 0 100 Z M ${corners.topLeft.x * 100} ${corners.topLeft.y * 100} L ${corners.bottomLeft.x * 100} ${corners.bottomLeft.y * 100} L ${corners.bottomRight.x * 100} ${corners.bottomRight.y * 100} L ${corners.topRight.x * 100} ${corners.topRight.y * 100} Z`}
                  fill="rgba(0, 0, 0, 0.45)"
                  fillRule="evenodd"
                />

                {/* Selected Banknote Polygon Boundary */}
                <polygon
                  points={`${corners.topLeft.x * 100},${corners.topLeft.y * 100} ${corners.topRight.x * 100},${corners.topRight.y * 100} ${corners.bottomRight.x * 100},${corners.bottomRight.y * 100} ${corners.bottomLeft.x * 100},${corners.bottomLeft.y * 100}`}
                  fill="rgba(59, 130, 246, 0.12)"
                  stroke="#3b82f6"
                  strokeWidth="1.2"
                  strokeDasharray="2.5,1.5"
                />
              </svg>

              {/* 4 Interactive Draggable Corner Handles */}
              {(
                [
                  { key: 'topLeft', label: 'TL', color: 'bg-cyan-500 border-cyan-200' },
                  { key: 'topRight', label: 'TR', color: 'bg-indigo-500 border-indigo-200' },
                  { key: 'bottomRight', label: 'BR', color: 'bg-amber-500 border-amber-200' },
                  { key: 'bottomLeft', label: 'BL', color: 'bg-emerald-500 border-emerald-200' },
                ] as const
              ).map(({ key, label, color }) => {
                const pt = corners[key];
                const isDragging = activeDraggingCorner === key;
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => handlePointerDown(key, e)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      left: `${pt.x * 100}%`,
                      top: `${pt.y * 100}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing p-2 group transition-transform ${
                      isDragging ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    {/* Glowing outer touch ring */}
                    <div className="relative flex items-center justify-center">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${color} shadow-lg flex items-center justify-center text-[10px] font-black text-white ring-4 ring-black/40`}>
                        {label}
                      </div>
                      {/* Crosshair guide */}
                      <div className="absolute w-2 h-2 rounded-full bg-white shadow-xs pointer-events-none" />
                    </div>
                  </div>
                );
              })}

              {/* Precision Magnifying Loupe (Zoom Glass floating above active finger/cursor) */}
              {activePt && rawImageUrl && (
                <div
                  style={{
                    left: `${Math.max(12, Math.min(88, activePt.x * 100))}%`,
                    top: `${Math.max(18, activePt.y * 100 - 22)}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-40 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-3 border-white shadow-2xl overflow-hidden pointer-events-none ring-4 ring-blue-500/80 bg-slate-900 animate-in zoom-in-75 duration-100"
                >
                  <img
                    src={rawImageUrl}
                    alt="Magnifier Loupe"
                    className="absolute max-w-none"
                    style={{
                      width: '350%',
                      height: '350%',
                      left: `${50 - activePt.x * 350}%`,
                      top: `${50 - activePt.y * 350}%`,
                    }}
                  />
                  {/* Center Crosshair in Loupe */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-5 h-[1.5px] bg-red-500 absolute shadow-xs" />
                    <div className="h-5 w-[1.5px] bg-red-500 absolute shadow-xs" />
                    <div className="w-2.5 h-2.5 rounded-full border border-red-500" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Straightened & Rectified Preview */
            previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Banknote Cleaned Preview"
                className="max-h-full max-w-full object-contain rounded shadow-lg transition-transform duration-150"
              />
            ) : (
              <div className="text-white text-xs">Generating straightened preview...</div>
            )
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center z-50">
              <div className="bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 border border-slate-700 shadow-xl">
                <span className="animate-spin text-sm">🪄</span>
                <span>Straightening & warping perspective...</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls & Action Panels */}
        <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto bg-white dark:bg-[#0b132b]">
          
          {activeTab === 'corners' ? (
            /* Controls for TAB 1: 4-Corner Manual Setter */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Move className="h-3.5 w-3.5 text-blue-500" />
                  Corner Inset Presets
                </span>
                <span className="text-[11px] text-slate-500">
                  Tip: Drag circles or tap edges to position
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetCorners('inset10')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  📐 10% Inset
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetCorners('inset5')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  📐 5% Margin
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetCorners('full')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  🔲 Full Frame
                </button>
              </div>

              {/* Big Straighten & Preview Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleStraightenWithCorners}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Straighten & Crop Using These 4 Corners</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Controls for TAB 2: Fine-Tuning & Straightening Result */
            <div className="space-y-3">
              {/* Quick Toolbar: 90 Deg Rotation & Back to Corners */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRotate90(-90)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title="Rotate 90 degrees Counter-Clockwise"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>-90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate90(90)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title="Rotate 90 degrees Clockwise"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>+90°</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleEnhanceToggle}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border cursor-pointer ${
                      enhanceClarity
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Clarity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('corners')}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Move className="h-3 w-3" />
                    <span>Adjust Corners</span>
                  </button>
                </div>
              </div>

              {/* Straighten Tilt Slider (-15 to +15) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-slate-400" />
                    Fine-tune Tilt Angle
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {manualAngle > 0 ? `+${manualAngle}°` : `${manualAngle}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={manualAngle}
                  onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-15°</span>
                  <button 
                    type="button"
                    onClick={() => handleAngleChange(0)}
                    className="hover:text-blue-500 underline cursor-pointer"
                  >
                    Level (0°)
                  </button>
                  <span>+15°</span>
                </div>
              </div>

              {/* Edge Trim Margin Slider (0% to 15%) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Crop className="h-3.5 w-3.5 text-slate-400" />
                    Fine-tune Edge Margin Inset
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {cropMarginPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={cropMarginPercent}
                  onChange={(e) => handleCropSliderChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070d1e]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            {activeTab === 'corners' && (
              <button
                type="button"
                onClick={handleStraightenWithCorners}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors cursor-pointer"
              >
                Preview
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply Cleaned Note</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
