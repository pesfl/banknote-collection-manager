'use client';

import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Check, 
  X, 
  Crop
} from 'lucide-react';
import { cleanBanknoteImage, CleanResult } from '@/lib/media/banknote-cleaner';

interface PhotoAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBlob: Blob | null;
  initialPreviewUrl: string | null;
  sideLabel: string; // 'Front' or 'Back'
  onApply: (cleanedBlob: Blob, cleanedPreview: string) => void;
}

export default function PhotoAdjusterModal({
  isOpen,
  onClose,
  imageBlob,
  initialPreviewUrl,
  sideLabel,
  onApply,
}: PhotoAdjusterModalProps) {
  const [rotation90, setRotation90] = useState(0); // 0, 90, 180, 270
  const [manualAngle, setManualAngle] = useState(0); // -15 to +15
  const [cropPreset, setCropPreset] = useState<'safe' | 'close' | 'full'>('safe');
  const [cropMarginPercent, setCropMarginPercent] = useState(0);
  const [enhanceClarity, setEnhanceClarity] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(initialPreviewUrl);
  const [activeCleanResult, setActiveCleanResult] = useState<CleanResult | null>(null);

  useEffect(() => {
    if (isOpen && imageBlob) {
      // Run automatic deskew and crop off background on open
      runAdjustment(0, 0, 'safe', 0, false, true);
    }
  }, [isOpen, imageBlob]);

  const runAdjustment = async (
    rot90: number,
    angle: number,
    preset: 'safe' | 'close' | 'full',
    margin: number,
    enhance: boolean,
    autoDetectSkew: boolean = false
  ) => {
    if (!imageBlob) return;
    setIsProcessing(true);
    try {
      const isFull = preset === 'full';
      const basePresetMargin = preset === 'close' ? 3 : 0;
      const totalMargin = isFull ? 0 : basePresetMargin + margin;

      const res = await cleanBanknoteImage(imageBlob, {
        autoStraighten: autoDetectSkew,
        autoCropEdges: !isFull, // Automatically crops background unless user selected 'Full (No Crop)'
        rotation90: rot90,
        manualAngle: angle,
        cropMarginPercent: totalMargin,
        enhanceClarity: enhance,
        quality: 0.94,
      });

      setActiveCleanResult(res);
      setPreviewDataUrl(res.dataUrl);
      if (autoDetectSkew && res.detectedSkew !== 0) {
        setManualAngle(Math.round(res.detectedSkew * 10) / 10);
      }
    } catch (err) {
      console.warn('Photo adjustment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate90 = (delta: number) => {
    const nextRot = (rotation90 + delta + 360) % 360;
    setRotation90(nextRot);
    runAdjustment(nextRot, manualAngle, cropPreset, cropMarginPercent, enhanceClarity, false);
  };

  const handleAngleChange = (angle: number) => {
    setManualAngle(angle);
    runAdjustment(rotation90, angle, cropPreset, cropMarginPercent, enhanceClarity, false);
  };

  const handleSelectPreset = (preset: 'safe' | 'close' | 'full') => {
    setCropPreset(preset);
    runAdjustment(rotation90, manualAngle, preset, cropMarginPercent, enhanceClarity, false);
  };

  const handleCropSliderChange = (margin: number) => {
    setCropMarginPercent(margin);
    runAdjustment(rotation90, manualAngle, cropPreset, margin, enhanceClarity, false);
  };

  const handleEnhanceToggle = () => {
    const nextEnhance = !enhanceClarity;
    setEnhanceClarity(nextEnhance);
    runAdjustment(rotation90, manualAngle, cropPreset, cropMarginPercent, nextEnhance, false);
  };

  const handleAutoClean = () => {
    setManualAngle(0);
    setCropPreset('safe');
    setCropMarginPercent(0);
    runAdjustment(rotation90, 0, 'safe', 0, enhanceClarity, true);
  };

  const handleSave = () => {
    if (activeCleanResult && previewDataUrl) {
      onApply(activeCleanResult.cleanedBlob, previewDataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070d1e]">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Clean & Straighten {sideLabel} Photo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Canvas / Preview */}
        <div className="relative flex-1 min-h-[220px] max-h-[340px] bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
          {/* Alignment Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-3 opacity-20 border border-white/40">
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-white/30" />
            <div className="border-r border-white/30" />
            <div className="border-r border-white/30" />
            <div />
          </div>

          {previewDataUrl ? (
            <img
              src={previewDataUrl}
              alt="Banknote Cleaned Preview"
              className="max-h-full max-w-full object-contain rounded shadow-lg transition-transform duration-150"
            />
          ) : (
            <div className="text-white text-xs">Loading preview...</div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center">
              <div className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-700 shadow-lg">
                <span className="animate-spin text-sm">🪄</span>
                <span>Optimizing edges...</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-white dark:bg-[#0b132b]">
          
          {/* Quick Toolbar: 90 Deg Rotation & Auto Clean */}
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
                onClick={handleAutoClean}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>🪄 Auto Clean</span>
              </button>
            </div>
          </div>

          {/* Quick Crop Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Crop Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('full')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  cropPreset === 'full'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                🖼️ Full (No Crop)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('safe')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  cropPreset === 'safe'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                📐 Safe Margin
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('close')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  cropPreset === 'close'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                ✂️ Close Crop
              </button>
            </div>
          </div>

          {/* Straighten Tilt Slider (-15 to +15) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-slate-400" />
                Straighten Skew Angle
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Crop className="h-3.5 w-3.5 text-slate-400" />
                Fine-tune Edge Margins
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
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Auto detected edges)</span>
              <span>15% (Extra inset)</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070d1e]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Apply Cleaned Photo</span>
          </button>
        </div>

      </div>
    </div>
  );
}
