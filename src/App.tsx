/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  POSMode, 
  ViewMode, 
  Product, 
  CartItem, 
  Order, 
  PaymentDetails, 
  RestaurantTable, 
  StaffMember, 
  CashShift, 
  ProductModifier 
} from './types/pos';
import { storage } from './services/storageService';
import { sound } from './services/soundService';
import { TerminalFrame } from './components/TerminalFrame';
import { Header } from './components/Header';
import { PosRegister } from './components/PosRegister';
import { TableManagement } from './components/TableManagement';
import { InventoryManager } from './components/InventoryManager';
import { SalesReports } from './components/SalesReports';
import { StaffShiftManager } from './components/StaffShiftManager';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { KitchenDisplayModal } from './components/KitchenDisplayModal';

export default function App() {
  // Navigation & Display modes
  const [currentTab, setCurrentTab] = useState<'register' | 'tables' | 'inventory' | 'reports' | 'staff'>('register');
  const [mode, setMode] = useState<POSMode>('retail');
  const [viewMode, setViewMode] = useState<ViewMode>('handheld');
  const [audioMuted, setAudioMuted] = useState(false);

  // Core Data Entities
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [tables, setTables] = useState<RestaurantTable[]>(() => storage.getTables());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storage.getStaff());
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(() => storage.getCurrentStaff());
  const [currentShift, setCurrentShift] = useState<CashShift>(() => storage.getShift());
  const businessProfile = storage.getBusinessProfile();

  // Active Transaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTable, setCurrentTable] = useState<RestaurantTable | null>(null);
  const [currentCustomerPhone, setCurrentCustomerPhone] = useState('');
  const [currentOrderNumber, setCurrentOrderNumber] = useState(
    () => `ORD-${Math.floor(80000 + Math.random() * 20000)}`
  );

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Auto-sync state changes to persistent storage
  useEffect(() => {
    storage.saveProducts(products);
  }, [products]);

  useEffect(() => {
    storage.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    storage.saveTables(tables);
  }, [tables]);

  useEffect(() => {
    storage.saveStaff(staffList);
  }, [staffList]);

  useEffect(() => {
    storage.saveCurrentStaff(currentStaff);
  }, [currentStaff]);

  useEffect(() => {
    storage.saveShift(currentShift);
  }, [currentShift]);

  // Cart operations
  const handleAddToCart = (product: Product, modifiers: ProductModifier[] = [], notes?: string) => {
    // Check if duplicate item with exact same modifiers exists in cart
    const existingIndex = cart.findIndex((item) => {
      if (item.product.id !== product.id) return false;
      if (item.notes !== notes) return false;
      if (item.selectedModifiers.length !== modifiers.length) return false;
      const modIds = modifiers.map((m) => m.id).sort().join(',');
      const itemModIds = item.selectedModifiers.map((m) => m.id).sort().join(',');
      return modIds === itemModIds;
    });

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random()}`,
        product,
        quantity: 1,
        selectedModifiers: modifiers,
        notes,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    sound.playKeypadClick();
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCurrentTable(null);
  };

  // Park Order / Recall Order
  const handleParkOrder = () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => {
      const mods = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
      return sum + (item.product.price + mods) * item.quantity;
    }, 0);

    const taxTotal = Math.round((subtotal * businessProfile.defaultTaxRate) / (1 + businessProfile.defaultTaxRate));

    const parked: Order = {
      id: `ord-parked-${Date.now()}`,
      orderNumber: currentOrderNumber,
      mode,
      tableId: currentTable?.id,
      tableName: currentTable?.name,
      items: cart,
      subtotal,
      taxTotal,
      discountTotal: 0,
      grandTotal: subtotal,
      status: 'parked',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashierId: currentStaff.id,
      cashierName: currentStaff.name,
    };

    setOrders([parked, ...orders]);
    setCart([]);
    setCurrentTable(null);
    setCurrentOrderNumber(`ORD-${Math.floor(80000 + Math.random() * 20000)}`);
  };

  const handleRecallOrder = (order: Order) => {
    setCart(order.items);
    if (order.tableId) {
      const tbl = tables.find((t) => t.id === order.tableId);
      if (tbl) setCurrentTable(tbl);
    }
    setCurrentOrderNumber(order.orderNumber);
    // Remove from parked orders
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  };

  // Fire to kitchen (Restaurant KOT)
  const handleFireToKitchen = () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => {
      const mods = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
      return sum + (item.product.price + mods) * item.quantity;
    }, 0);

    const taxTotal = Math.round((subtotal * businessProfile.defaultTaxRate) / (1 + businessProfile.defaultTaxRate));

    const kitchenOrder: Order = {
      id: `ord-kot-${Date.now()}`,
      orderNumber: currentOrderNumber,
      mode: 'restaurant',
      tableId: currentTable?.id,
      tableName: currentTable?.name || 'Walk-in Bar',
      items: cart,
      subtotal,
      taxTotal,
      discountTotal: 0,
      grandTotal: subtotal,
      status: 'kitchen_preparing',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashierId: currentStaff.id,
      cashierName: currentStaff.name,
    };

    setOrders([kitchenOrder, ...orders]);
    // Mark table as occupied
    if (currentTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === currentTable.id
            ? { ...t, status: 'occupied', occupiedSince: 'Just now', activeOrderId: kitchenOrder.id }
            : t
        )
      );
    }

    setCart([]);
    setCurrentOrderNumber(`ORD-${Math.floor(80000 + Math.random() * 20000)}`);
  };

  // Payment Completion
  const handlePaymentSuccess = (paymentDetails: PaymentDetails) => {
    setIsPaymentOpen(false);

    const subtotal = cart.reduce((sum, item) => {
      const mods = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
      return sum + (item.product.price + mods) * item.quantity;
    }, 0);

    const taxTotal = Math.round((paymentDetails.amount * businessProfile.defaultTaxRate) / (1 + businessProfile.defaultTaxRate));
    const discount = Math.max(0, subtotal - paymentDetails.amount);

    const completedOrder: Order = {
      id: `ord-done-${Date.now()}`,
      orderNumber: currentOrderNumber,
      mode,
      tableId: currentTable?.id,
      tableName: currentTable?.name,
      customerPhone: paymentDetails.stkPush?.phoneNumber || currentCustomerPhone,
      customerName: paymentDetails.paybillTill?.senderName || paymentDetails.cardEmv?.cardHolder,
      items: cart,
      subtotal,
      taxTotal,
      discountTotal: discount,
      grandTotal: paymentDetails.amount,
      status: 'completed',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paidAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentDetails,
      cashierId: currentStaff.id,
      cashierName: currentStaff.name,
    };

    // 1. Decrement inventory stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((ci) => ci.product.id === p.id);
        if (cartMatch) {
          return { ...p, stock: Math.max(0, p.stock - cartMatch.quantity) };
        }
        return p;
      })
    );

    // 2. Free up table if occupied
    if (currentTable) {
      setTables((prev) =>
        prev.map((t) => (t.id === currentTable.id ? { ...t, status: 'available', activeOrderId: undefined } : t))
      );
    }

    // 3. Update current shift revenue & transaction count
    setCurrentShift((prev) => ({
      ...prev,
      totalSales: prev.totalSales + paymentDetails.amount,
      totalTransactions: prev.totalTransactions + 1,
      expectedCash: paymentDetails.method === 'cash' ? prev.expectedCash + paymentDetails.amount : prev.expectedCash,
    }));

    // 4. Save completed order
    setOrders([completedOrder, ...orders]);
    setLastCompletedOrder(completedOrder);
    setIsReceiptOpen(true);
  };

  const handleNextTransaction = () => {
    setIsReceiptOpen(false);
    setCart([]);
    setCurrentTable(null);
    setCurrentOrderNumber(`ORD-${Math.floor(80000 + Math.random() * 20000)}`);
  };

  const activeKitchenTickets = orders.filter(
    (o) => o.status === 'kitchen_preparing' || o.status === 'kitchen_ready'
  ).length;

  const cartGrandTotal = cart.reduce((sum, item) => {
    const mods = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
    return sum + (item.product.price + mods) * item.quantity;
  }, 0);

  return (
    <TerminalFrame
      viewMode={viewMode}
      onToggleViewMode={() => setViewMode(viewMode === 'handheld' ? 'countertop' : 'handheld')}
      onHardwareScanTrigger={() => setIsScannerOpen(true)}
      audioMuted={audioMuted}
      onToggleAudio={() => setAudioMuted(!audioMuted)}
    >
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mode={mode}
        onToggleMode={() => {
          setMode(mode === 'retail' ? 'restaurant' : 'retail');
          setCurrentTab('register');
        }}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'handheld' ? 'countertop' : 'handheld')}
        currentStaff={currentStaff}
        onStaffClick={() => setCurrentTab('staff')}
        onOpenKitchenDisplay={() => setIsKitchenOpen(true)}
        kitchenTicketsCount={activeKitchenTickets}
      />

      {/* Main Tab Viewport */}
      <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
        {currentTab === 'register' && (
          <PosRegister
            mode={mode}
            products={products}
            cart={cart}
            currentTable={currentTable}
            businessProfile={businessProfile}
            parkedOrders={orders.filter((o) => o.status === 'parked')}
            onAddToCart={handleAddToCart}
            onUpdateCartItemQty={handleUpdateCartQty}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenPayment={() => setIsPaymentOpen(true)}
            onParkOrder={handleParkOrder}
            onRecallOrder={handleRecallOrder}
            onFireToKitchen={handleFireToKitchen}
            onSelectTableTrigger={() => setCurrentTab('tables')}
          />
        )}

        {currentTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Restaurant Floor Management</h3>
                <p className="text-xs text-slate-400">Select table to view or assign order</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('register')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back to Register
              </button>
            </div>

            <TableManagement
              tables={tables}
              selectedTableId={currentTable?.id}
              onSelectTable={(table) => {
                setCurrentTable(table);
                setCurrentTab('register');
              }}
            />
          </div>
        )}

        {currentTab === 'inventory' && (
          <InventoryManager
            products={products}
            businessProfile={businessProfile}
            onUpdateProducts={setProducts}
          />
        )}

        {currentTab === 'reports' && (
          <SalesReports
            orders={orders}
            businessProfile={businessProfile}
            currentShift={currentShift}
            onViewReceipt={(order) => {
              setLastCompletedOrder(order);
              setIsReceiptOpen(true);
            }}
          />
        )}

        {currentTab === 'staff' && (
          <StaffShiftManager
            staffList={staffList}
            currentStaff={currentStaff}
            currentShift={currentShift}
            businessProfile={businessProfile}
            onSwitchStaff={setCurrentStaff}
            onUpdateShift={setCurrentShift}
            onUpdateStaffList={setStaffList}
          />
        )}
      </main>

      {/* --- MODALS --- */}

      {/* 1. Barcode Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanProduct={(prod) => {
          handleAddToCart(prod);
          setCurrentTab('register');
        }}
      />

      {/* 2. Integrated Payment Hub (Tap to Pay, STK Push, Till/Paybill, Cards, Cash) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        grandTotal={cartGrandTotal}
        orderNumber={currentOrderNumber}
        businessProfile={businessProfile}
        customerPhone={currentCustomerPhone}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 3. Thermal Receipt Preview */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={lastCompletedOrder}
        businessProfile={businessProfile}
        onNewOrder={handleNextTransaction}
      />

      {/* 4. Kitchen Display / KOT Expediter */}
      <KitchenDisplayModal
        isOpen={isKitchenOpen}
        onClose={() => setIsKitchenOpen(false)}
        orders={orders}
        onUpdateOrderStatus={(orderId, status) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status } : o))
          );
        }}
      />
    </TerminalFrame>
  );
}
