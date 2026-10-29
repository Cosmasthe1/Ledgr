import React, { useState } from 'react';
import { 
  Search, 
  Scan, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  UtensilsCrossed, 
  ShoppingBag, 
  Clock, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Flame,
  Bookmark,
  ChevronDown
} from 'lucide-react';
import { BusinessProfile, CartItem, Order, POSMode, Product, ProductModifier, RestaurantTable } from '../types/pos';
import { sound } from '../services/soundService';

interface PosRegisterProps {
  mode: POSMode;
  products: Product[];
  cart: CartItem[];
  currentTable?: RestaurantTable | null;
  businessProfile: BusinessProfile;
  parkedOrders: Order[];
  onAddToCart: (product: Product, modifiers?: ProductModifier[], notes?: string) => void;
  onUpdateCartItemQty: (itemId: string, delta: number) => void;
  onRemoveCartItem: (itemId: string) => void;
  onClearCart: () => void;
  onOpenScanner: () => void;
  onOpenPayment: () => void;
  onParkOrder: () => void;
  onRecallOrder: (order: Order) => void;
  onFireToKitchen: () => void;
  onSelectTableTrigger: () => void;
}

export const PosRegister: React.FC<PosRegisterProps> = ({
  mode,
  products,
  cart,
  currentTable,
  businessProfile,
  parkedOrders,
  onAddToCart,
  onUpdateCartItemQty,
  onRemoveCartItem,
  onClearCart,
  onOpenScanner,
  onOpenPayment,
  onParkOrder,
  onRecallOrder,
  onFireToKitchen,
  onSelectTableTrigger,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);

  // Modifiers selection modal state
  const [selectedProductForMod, setSelectedProductForMod] = useState<Product | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<ProductModifier[]>([]);
  const [itemNote, setItemNote] = useState('');

  // Filter products by mode and category
  const relevantProducts = products.filter((p) => {
    if (mode === 'restaurant') {
      return p.isRestaurant !== false;
    }
    return p.isRetail !== false;
  });

  const categories = ['All', ...Array.from(new Set(relevantProducts.map((p) => p.category)))];

  const filteredProducts = relevantProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  // Calculate cart financials
  const subtotal = cart.reduce((sum, item) => {
    const modsPrice = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
    return sum + (item.product.price + modsPrice) * item.quantity;
  }, 0);

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // VAT 16% inclusive: tax = taxableAmount * 0.16 / 1.16
  const taxTotal = Math.round((taxableAmount * businessProfile.defaultTaxRate) / (1 + businessProfile.defaultTaxRate));
  const grandTotal = taxableAmount;

  const handleProductClick = (product: Product) => {
    if (product.modifiers && product.modifiers.length > 0) {
      sound.playKeypadClick();
      setSelectedProductForMod(product);
      setActiveModifiers([]);
      setItemNote('');
    } else {
      sound.playBarcodeBeep();
      onAddToCart(product);
    }
  };

  const handleConfirmModifiers = () => {
    if (!selectedProductForMod) return;
    sound.playBarcodeBeep();
    onAddToCart(selectedProductForMod, activeModifiers, itemNote);
    setSelectedProductForMod(null);
  };

  const toggleModifier = (mod: ProductModifier) => {
    sound.playKeypadClick();
    if (activeModifiers.some((m) => m.id === mod.id)) {
      setActiveModifiers(activeModifiers.filter((m) => m.id !== mod.id));
    } else {
      setActiveModifiers([...activeModifiers, mod]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT COLUMN: Catalog & Products Grid */}
      <div className="flex-1 flex flex-col min-w-0 space-y-3">
        {/* Search & Barcode Strip */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mode === 'restaurant'
                  ? 'Search dishes, drinks, cocktails, SKU...'
                  : 'Scan barcode, enter SKU, or search item...'
              }
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              onOpenScanner();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-colors cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Laser Scan</span>
          </button>

          {parkedOrders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                sound.playKeypadClick();
                setIsParkedModalOpen(true);
              }}
              className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              <span>{parkedOrders.length} Held</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sound.playKeypadClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStockLevel && product.stock > 0;
              const isOutStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOutStock}
                  onClick={() => handleProductClick(product)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between group min-h-[115px] relative overflow-hidden ${
                    isOutStock
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        {product.category}
                      </span>
                      {product.modifiers && product.modifiers.length > 0 && (
                        <span className="text-[9px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                          Custom
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 leading-snug line-clamp-2">
                      {product.name}
                    </h4>
                  </div>

                  {/* Card Price & Stock Footer */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between mt-2">
                    <span className="font-mono font-extrabold text-white text-xs">
                      {businessProfile.currency} {product.price.toLocaleString()}
                    </span>

                    <span
                      className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isOutStock
                          ? 'text-rose-400 bg-rose-950/60'
                          : isLowStock
                          ? 'text-amber-400 bg-amber-950/60'
                          : 'text-slate-400 bg-slate-950'
                      }`}
                    >
                      {isOutStock ? 'Out' : `${product.stock} in stock`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Order Cart & Terminal Checkout */}
      <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl shrink-0">
        <div>
          {/* Order Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Active Order</h3>
                <span className="text-[10px] font-mono text-slate-400">
                  ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
                </span>
              </div>

              {mode === 'restaurant' && (
                <button
                  type="button"
                  onClick={onSelectTableTrigger}
                  className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  <UtensilsCrossed className="w-3 h-3" />
                  <span>{currentTable ? `Table: ${currentTable.name}` : 'Tap to Assign Table'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playKeypadClick();
                  onClearCart();
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Void</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-[38vh] space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Cart is empty</p>
                <p className="text-[10px] text-slate-600 mt-1">Tap items on the left or scan a barcode to add.</p>
              </div>
            ) : (
              cart.map((item) => {
                const modsSum = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
                const itemTotal = (item.product.price + modsSum) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{item.product.name}</h5>
                      <div className="text-[10px] font-mono text-emerald-400">
                        {businessProfile.currency} {item.product.price}
                      </div>

                      {item.selectedModifiers.length > 0 && (
                        <div className="text-[9px] text-slate-400 pl-1 mt-0.5">
                          {item.selectedModifiers.map((m) => `+${m.name} (${businessProfile.currency} ${m.price})`).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[9px] text-amber-400/90 italic pl-1">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playKeypadClick();
                          onUpdateCartItemQty(item.id, -1);
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center font-mono font-bold text-xs text-white">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playKeypadClick();
                          onUpdateCartItemQty(item.id, 1);
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[65px]">
                      <span className="font-mono font-bold text-xs text-white">
                        {businessProfile.currency} {itemTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cart Bottom Summary & Checkout */}
        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          {/* Quick Discount Trigger */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Discount</span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    sound.playKeypadClick();
                    setDiscountPercent(pct);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    discountPercent === pct
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pct === 0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">
                {businessProfile.currency} {subtotal.toLocaleString()}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">
                  -{businessProfile.currency} {discountAmount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Includes 16% VAT:</span>
              <span className="font-mono">
                {businessProfile.currency} {taxTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
              <span className="text-sm font-bold text-white">Grand Total:</span>
              <span className="text-xl font-mono font-black text-emerald-400">
                {businessProfile.currency} {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Secondary Actions: Park Bill / Fire to Kitchen */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                sound.playKeypadClick();
                onParkOrder();
              }}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Park / Hold Bill</span>
            </button>

            {mode === 'restaurant' ? (
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => {
                  sound.playSuccessChime();
                  onFireToKitchen();
                }}
                className="py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/50 text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Fire to Kitchen</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => {
                  sound.playBarcodeBeep();
                  // Quick shortcut
                  onOpenPayment();
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Tender</span>
              </button>
            )}
          </div>

          {/* Primary Charge CTA */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              sound.playKeypadClick();
              onOpenPayment();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Charge {businessProfile.currency} {grandTotal.toLocaleString()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modifiers Customization Modal */}
      {selectedProductForMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedProductForMod.name}</h4>
                <p className="text-xs text-emerald-400 font-mono">
                  Base: {businessProfile.currency} {selectedProductForMod.price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForMod(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">Select Add-ons / Modifiers:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedProductForMod.modifiers?.map((mod) => {
                  const isChecked = activeModifiers.some((m) => m.id === mod.id);

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{mod.name}</span>
                      <span className="font-mono text-emerald-400">
                        +{businessProfile.currency} {mod.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Kitchen Special Instructions:
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="e.g. Rare, No onions, Oat milk, Extra spicy"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductForMod(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModifiers}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held / Parked Orders Modal */}
      {isParkedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white">Held / Parked Bills</h4>
              <button
                type="button"
                onClick={() => setIsParkedModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parkedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{ord.orderNumber}</h5>
                    <span className="text-[10px] text-slate-400">
                      {ord.tableName || ord.customerName || 'Parked Cart'} · {ord.items.length} items
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
                      {businessProfile.currency} {ord.grandTotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeypadClick();
                      onRecallOrder(ord);
                      setIsParkedModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Recall
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
