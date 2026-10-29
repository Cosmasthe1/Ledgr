import React, { useState } from 'react';
import { Users, Clock, UtensilsCrossed, Check, Plus, AlertCircle } from 'lucide-react';
import { RestaurantTable } from '../types/pos';
import { sound } from '../services/soundService';

interface TableManagementProps {
  tables: RestaurantTable[];
  selectedTableId?: string;
  onSelectTable: (table: RestaurantTable) => void;
  onUpdateTableStatus?: (tableId: string, status: RestaurantTable['status']) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onUpdateTableStatus,
}) => {
  const [activeZone, setActiveZone] = useState<string>('All');

  const zones = ['All', 'Main Dining', 'Terrace', 'Bar', 'VIP Lounge'];

  const filteredTables = activeZone === 'All'
    ? tables
    : tables.filter((t) => t.zone === activeZone);

  const getStatusColor = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500';
      case 'occupied':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-500';
      case 'billed':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:border-blue-500';
      case 'reserved':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:border-purple-500';
    }
  };

  const getStatusBadge = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'available':
        return <span className="text-[10px] text-emerald-400 font-semibold">Available</span>;
      case 'occupied':
        return <span className="text-[10px] text-amber-400 font-semibold">Dining</span>;
      case 'billed':
        return <span className="text-[10px] text-blue-400 font-semibold">Bill Printed</span>;
      case 'reserved':
        return <span className="text-[10px] text-purple-400 font-semibold">Reserved</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {zones.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              setActiveZone(zone);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeZone === zone
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTables.map((tbl) => {
          const isSelected = selectedTableId === tbl.id;

          return (
            <div
              key={tbl.id}
              onClick={() => {
                sound.playKeypadClick();
                onSelectTable(tbl);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] ${getStatusColor(
                tbl.status
              )} ${isSelected ? 'ring-2 ring-emerald-400 shadow-lg scale-[1.02]' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white tracking-tight">{tbl.name}</h4>
                  {getStatusBadge(tbl.status)}
                </div>
                <span className="text-[10px] text-slate-400">{tbl.zone}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 mt-2">
                <div className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{tbl.guestCount ? `${tbl.guestCount}/${tbl.capacity}` : `${tbl.capacity} seats`}</span>
                </div>

                {tbl.occupiedSince && (
                  <div className="flex items-center gap-1 text-amber-400 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>{tbl.occupiedSince}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
