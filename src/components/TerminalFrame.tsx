import React from 'react';
import { Wifi, BatteryMedium, Signal, Radio, Scan, Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';
import { ViewMode } from '../types/pos';
import { sound } from '../services/soundService';

interface TerminalFrameProps {
  children: React.ReactNode;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onHardwareScanTrigger: () => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
}

export const TerminalFrame: React.FC<TerminalFrameProps> = ({
  children,
  viewMode,
  onToggleViewMode,
  onHardwareScanTrigger,
  audioMuted,
  onToggleAudio,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (viewMode === 'countertop') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {children}
      </div>
    );
  }

  // Handheld Smart POS Device Shell (Sunmi V2s / PAX A920 Handheld POS Aesthetic)
  return (
    <div className="min-h-screen bg-slate-950 py-3 sm:py-6 px-2 flex flex-col items-center justify-center">
      {/* Outer Industrial Handheld Terminal Body */}
      <div className="relative w-full max-w-[500px] bg-slate-900 border-4 border-slate-800 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
        
        {/* Top Thermal Printer Head & Paper Tear Slot */}
        <div className="bg-slate-950 border-b-2 border-slate-800 px-6 pt-4 pb-2.5 flex flex-col items-center relative">
          {/* Paper Tear Guillotine Slot */}
          <div className="w-48 h-1.5 bg-slate-900 border border-slate-800 rounded-full mb-2 shadow-inner" />
          
          <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Radio className="w-3.5 h-3.5" />
              <span>NFC TAP ZONE</span>
            </div>
            <span className="text-slate-500 font-semibold tracking-wider">SMART POS 58MM</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleViewMode}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded cursor-pointer"
                title="Switch to Countertop Mode"
              >
                <Monitor className="w-3 h-3" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Android Hardware Screen Frame */}
        <div className="bg-slate-950 flex flex-col min-h-[750px] relative">
          {/* Android System Status Bar */}
          <div className="h-7 bg-slate-950 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none border-b border-slate-900 z-30">
            <span className="font-semibold text-slate-200">{currentTime}</span>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-slate-400">
                <Signal className="w-3 h-3" />
                <span className="text-[9px] font-bold">4G+</span>
              </div>
              <Wifi className="w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="text-[10px]">98%</span>
                <BatteryMedium className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Main App Content Viewport */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {children}
          </div>

          {/* Android Virtual Navigation Softkeys Bar */}
          <div className="h-9 bg-slate-950/90 border-t border-slate-900 px-12 flex items-center justify-between text-slate-500 select-none z-30">
            <button
              type="button"
              onClick={() => sound.playKeypadClick()}
              className="p-1 hover:text-slate-300 transition-colors cursor-pointer"
              title="Soft Back"
            >
              <div className="w-3 h-3 border-l-2 border-b-2 border-current transform rotate-45" />
            </button>
            <button
              type="button"
              onClick={() => sound.playKeypadClick()}
              className="p-1 hover:text-slate-300 transition-colors cursor-pointer"
              title="Soft Home"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
            </button>
            <button
              type="button"
              onClick={() => sound.playKeypadClick()}
              className="p-1 hover:text-slate-300 transition-colors cursor-pointer"
              title="Soft Tasks"
            >
              <div className="w-3 h-3 border-2 border-current rounded-xs" />
            </button>
          </div>
        </div>

        {/* Physical Hardware Laser Scanner Buttons (Sides) */}
        <button
          type="button"
          onClick={() => {
            sound.playBarcodeBeep();
            onHardwareScanTrigger();
          }}
          className="absolute right-0 top-36 -mr-1.5 w-3 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-l-md shadow-md cursor-pointer transition-all active:translate-x-0.5"
          title="Hardware Yellow/Green Laser Scan Button"
        />
        <div className="absolute left-0 top-32 -ml-1 w-2.5 h-10 bg-slate-800 rounded-r-md shadow-md" title="Volume Up" />
        <div className="absolute left-0 top-44 -ml-1 w-2.5 h-10 bg-slate-800 rounded-r-md shadow-md" title="Volume Down" />
      </div>
    </div>
  );
};
