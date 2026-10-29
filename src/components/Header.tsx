import React from 'react';
import { ShoppingCart, UtensilsCrossed, Package, BarChart3, Users, ChefHat, Monitor, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { POSMode, StaffMember, ViewMode } from '../types/pos';
import { sound } from '../services/soundService';

interface HeaderProps {
  currentTab: 'register' | 'tables' | 'inventory' | 'reports' | 'staff';
  onSelectTab: (tab: 'register' | 'tables' | 'inventory' | 'reports' | 'staff') => void;
  mode: POSMode;
  onToggleMode: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  currentStaff: StaffMember;
  onStaffClick: () => void;
  onOpenKitchenDisplay: () => void;
  kitchenTicketsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  mode,
  onToggleMode,
  viewMode,
  onToggleViewMode,
  currentStaff,
  onStaffClick,
  onOpenKitchenDisplay,
  kitchenTicketsCount,
}) => {
  return (
    <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('register');
          }}
          className="text-base font-black tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
          <span>APEX SMART POS</span>
        </a>

        {/* Operating Mode Selector (Retail / Restaurant) */}
        <button
          type="button"
          onClick={() => {
            sound.playKeypadClick();
            onToggleMode();
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
            mode === 'restaurant'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
          }`}
          title="Toggle between Retail Store & Restaurant/Bar mode"
        >
          {mode === 'restaurant' ? (
            <>
              <UtensilsCrossed className="w-3 h-3 text-amber-400" />
              <span>Restaurant Mode</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3 h-3 text-emerald-400" />
              <span>Retail Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
        <button
          type="button"
          onClick={() => {
            sound.playKeypadClick();
            onSelectTab('register');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'register'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Register
        </button>

        {mode === 'restaurant' && (
          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              onSelectTab('tables');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'tables'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Floor Tables
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            sound.playKeypadClick();
            onSelectTab('inventory');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'inventory'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Inventory
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playKeypadClick();
            onSelectTab('reports');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'reports'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sales & Reports
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playKeypadClick();
            onSelectTab('staff');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'staff'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Staff & Shift
        </button>
      </nav>

      {/* Zone 3: Primary Action & Quick Tools */}
      <div className="flex items-center gap-2 shrink-0">
        {mode === 'restaurant' && (
          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              onOpenKitchenDisplay();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer relative"
            title="Kitchen Order Tickets"
          >
            <ChefHat className="w-4 h-4" />
            <span className="hidden md:inline">KOT</span>
            {kitchenTicketsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {kitchenTicketsCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            sound.playKeypadClick();
            onToggleViewMode();
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title={viewMode === 'handheld' ? 'Switch to Countertop Screen' : 'Switch to Handheld Smart POS'}
        >
          {viewMode === 'handheld' ? <Monitor className="w-4 h-4 text-emerald-400" /> : <Smartphone className="w-4 h-4 text-blue-400" />}
          <span className="hidden lg:inline">{viewMode === 'handheld' ? 'Countertop' : 'Handheld'}</span>
        </button>

        {/* Staff Switch Profile Trigger */}
        <button
          type="button"
          onClick={onStaffClick}
          className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-left transition-colors cursor-pointer border border-slate-700/60"
        >
          <div className={`w-6 h-6 rounded-lg ${currentStaff.avatarColor} text-white font-bold text-xs flex items-center justify-center`}>
            {currentStaff.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <span className="text-[11px] font-bold text-white block leading-tight truncate max-w-[100px]">
              {currentStaff.name.split(' ')[0]}
            </span>
            <span className="text-[9px] text-slate-400 block leading-none">
              {currentStaff.role}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
