import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  ArrowUpDown, 
  TrendingUp, 
  Edit3, 
  Check, 
  X, 
  Download,
  Filter,
  DollarSign
} from 'lucide-react';
import { BusinessProfile, Product } from '../types/pos';
import { sound } from '../services/soundService';

interface InventoryManagerProps {
  products: Product[];
  businessProfile: BusinessProfile;
  onUpdateProducts: (products: Product[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  businessProfile,
  onUpdateProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Adjust stock state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState('Supplier Restock');

  // New product modal state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Beverages');
  const [newPrice, setNewPrice] = useState(250);
  const [newCost, setNewCost] = useState(120);
  const [newStock, setNewStock] = useState(50);
  const [newMinStock, setNewMinStock] = useState(10);
  const [newBarcode, setNewBarcode] = useState('');
  const [newIsRestaurant, setNewIsRestaurant] = useState(true);
  const [newIsRetail, setNewIsRetail] = useState(true);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.stock <= p.minStockLevel && p.stock > 0;
    if (stockFilter === 'out') matchesStock = p.stock <= 0;

    return matchesSearch && matchesCat && matchesStock;
  });

  // Calculate inventory metrics
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  const inventoryValueCost = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const inventoryValueRetail = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStockLevel && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleSaveStockAdjustment = () => {
    if (!adjustingProduct) return;
    sound.playKeypadClick();

    let newStockLevel = adjustingProduct.stock;
    if (adjustType === 'add') newStockLevel += adjustQty;
    if (adjustType === 'remove') newStockLevel = Math.max(0, newStockLevel - adjustQty);
    if (adjustType === 'set') newStockLevel = Math.max(0, adjustQty);

    const updated = products.map((p) =>
      p.id === adjustingProduct.id ? { ...p, stock: newStockLevel } : p
    );

    onUpdateProducts(updated);
    setAdjustingProduct(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    sound.playSuccessChime();

    const randomSku = `${newCategory.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const barcode = newBarcode || Math.floor(1000000000000 + Math.random() * 9000000000000).toString();

    const newProd: Product = {
      id: `prod-custom-${Date.now()}`,
      sku: randomSku,
      barcode,
      name: newName,
      category: newCategory,
      price: Number(newPrice),
      costPrice: Number(newCost),
      stock: Number(newStock),
      minStockLevel: Number(newMinStock),
      taxRate: 0.16,
      isRestaurant: newIsRestaurant,
      isRetail: newIsRetail,
      color: 'from-emerald-700 to-slate-900',
    };

    onUpdateProducts([newProd, ...products]);
    setIsAddingProduct(false);
    setNewName('');
    setNewBarcode('');
  };

  const exportStockCSV = () => {
    sound.playKeypadClick();
    const headers = ['SKU,Barcode,Product Name,Category,Cost Price,Selling Price,Stock,Min Level,Valuation (Cost)\n'];
    const rows = products.map(
      (p) =>
        `"${p.sku}","${p.barcode}","${p.name.replace(/"/g, '""')}","${p.category}",${p.costPrice},${p.price},${p.stock},${p.minStockLevel},${p.stock * p.costPrice}`
    );
    const blob = new Blob([...headers, rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Units In Stock</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">{totalItems.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500">{products.length} SKUs Cataloged</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Inventory Cost Basis</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {businessProfile.currency} {inventoryValueCost.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500">Retail Worth: {businessProfile.currency} {inventoryValueRetail.toLocaleString()}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-2">{lowStockCount}</p>
          <span className="text-[10px] text-slate-500">Requires Reorder</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-2">{outOfStockCount}</p>
          <span className="text-[10px] text-slate-500">Immediate Action</span>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportStockCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              setIsAddingProduct(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStockLevel && p.stock > 0;
                const isOut = p.stock <= 0;
                const margin = p.price > 0 ? (((p.price - p.costPrice) / p.price) * 100).toFixed(0) : '0';

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white tracking-tight">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        SKU: {p.sku} · Barcode: {p.barcode}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{p.category}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {businessProfile.currency} {p.costPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {businessProfile.currency} {p.price.toLocaleString()}
                      <span className="text-[9px] text-emerald-400 block font-normal">{margin}% margin</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-base">
                      <span className={isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isOut ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-full">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full">
                          Low: {p.stock} / {p.minStockLevel}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playKeypadClick();
                          setAdjustingProduct(p);
                          setAdjustQty(10);
                          setAdjustType('add');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-400" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Stock Adjustment</h4>
                <p className="text-xs text-slate-400">{adjustingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl">
                <span className="text-slate-400">Current Stock Level:</span>
                <span className="text-base font-mono font-bold text-white">{adjustingProduct.stock} units</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Adjustment Type:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'add', label: '+ Restock' },
                    { id: 'remove', label: '- Damaged' },
                    { id: 'set', label: '= Audit Count' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAdjustType(t.id as any)}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        adjustType === t.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Audit Note / Reason:</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                >
                  <option value="Supplier Restock">Supplier Restock Delivery</option>
                  <option value="Physical Cycle Audit">Physical Cycle Audit Count</option>
                  <option value="Damaged or Expired">Damaged / Expired Write-off</option>
                  <option value="Internal Store Use">Internal Kitchen/Store Use</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStockAdjustment}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950"
                >
                  Save Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateProduct}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white">Add New Catalog Item</h4>
              <button
                type="button"
                onClick={() => setIsAddingProduct(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Avocado Toast Deluxe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Cost Price ({businessProfile.currency})</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Selling Price ({businessProfile.currency})</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsRetail}
                    onChange={(e) => setNewIsRetail(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Show in Retail Mode</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsRestaurant}
                    onChange={(e) => setNewIsRestaurant(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Show in Restaurant Mode</span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950 cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
