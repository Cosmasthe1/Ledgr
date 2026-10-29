import React from 'react';
import { ChefHat, Clock, CheckCircle2, Utensils, X, Flame } from 'lucide-react';
import { Order } from '../types/pos';
import { sound } from '../services/soundService';

interface KitchenDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const KitchenDisplayModal: React.FC<KitchenDisplayModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
}) => {
  if (!isOpen) return null;

  // Filter kitchen active orders
  const kitchenOrders = orders.filter(
    (o) => o.status === 'kitchen_preparing' || o.status === 'kitchen_ready' || o.status === 'parked'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Kitchen Order Tickets (KOT)</h3>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
                  {kitchenOrders.length} Active Tickets
                </span>
              </div>
              <p className="text-xs text-slate-400">Live order staging & expediter dispatch</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tickets Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/40">
          {kitchenOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Kitchen queue is clear</p>
              <p className="text-xs text-slate-600 mt-1">Orders sent to kitchen from Restaurant mode will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {kitchenOrders.map((ord) => {
                const isReady = ord.status === 'kitchen_ready';

                return (
                  <div
                    key={ord.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between shadow-lg transition-all ${
                      isReady
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {ord.orderNumber}
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {ord.tableName || 'Takeaway'}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {ord.createdAt}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isReady ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {isReady ? 'Ready for Pickup' : 'Cooking'}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 text-xs">
                        {ord.items.map((item) => (
                          <div key={item.id} className="pb-1.5 border-b border-slate-800/50">
                            <div className="flex justify-between font-bold text-slate-200">
                              <span>{item.product.name}</span>
                              <span className="font-mono text-emerald-400">x{item.quantity}</span>
                            </div>
                            {item.selectedModifiers.length > 0 && (
                              <div className="text-[11px] text-amber-400 pl-2">
                                {item.selectedModifiers.map((m) => `• ${m.name}`).join(' ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[11px] text-rose-300 pl-2 italic">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-800 flex gap-2">
                      {!isReady ? (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playSuccessChime();
                            onUpdateOrderStatus(ord.id, 'kitchen_ready');
                          }}
                          className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Mark Food Ready</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playKeypadClick();
                            onUpdateOrderStatus(ord.id, 'completed');
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Order Served to Table</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
