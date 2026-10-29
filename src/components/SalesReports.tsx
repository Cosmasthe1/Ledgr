import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Download, 
  Printer, 
  Calendar, 
  ArrowUpRight, 
  CreditCard, 
  Smartphone, 
  Radio, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { BusinessProfile, CashShift, Order } from '../types/pos';
import { sound } from '../services/soundService';

interface SalesReportsProps {
  orders: Order[];
  businessProfile: BusinessProfile;
  currentShift: CashShift;
  onViewReceipt: (order: Order) => void;
}

export const SalesReports: React.FC<SalesReportsProps> = ({
  orders,
  businessProfile,
  currentShift,
  onViewReceipt,
}) => {
  const [reportType, setReportType] = useState<'overview' | 'z_report' | 'transactions'>('overview');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'all'>('today');

  const completedOrders = orders.filter((o) => o.status === 'completed');

  // Aggregated calculations
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalTax = completedOrders.reduce((sum, o) => sum + o.taxTotal, 0);
  const totalDiscount = completedOrders.reduce((sum, o) => sum + o.discountTotal, 0);
  const transactionCount = completedOrders.length;
  const avgBasket = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

  // Breakdown by payment method
  const methodTotals: Record<string, { count: number; total: number }> = {
    tap_to_pay: { count: 0, total: 0 },
    stk_push: { count: 0, total: 0 },
    paybill_till: { count: 0, total: 0 },
    card_emv: { count: 0, total: 0 },
    cash: { count: 0, total: 0 },
  };

  completedOrders.forEach((o) => {
    const m = o.paymentDetails?.method || 'cash';
    if (methodTotals[m]) {
      methodTotals[m].count += 1;
      methodTotals[m].total += o.grandTotal;
    }
  });

  // Top selling products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesMap[item.product.id]) {
        productSalesMap[item.product.id] = {
          name: item.product.name,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product.id].qty += item.quantity;
      productSalesMap[item.product.id].revenue += item.quantity * item.product.price;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const exportSalesCSV = () => {
    sound.playKeypadClick();
    const headers = ['Order Number,Date,Mode,Cashier,Table/Customer,Payment Method,Reference,Subtotal,Tax,Discount,Grand Total\n'];
    const rows = completedOrders.map(
      (o) =>
        `"${o.orderNumber}","${o.paidAt || o.createdAt}","${o.mode}","${o.cashierName}","${o.tableName || o.customerName || 'Walk-in'}","${o.paymentDetails?.method || 'cash'}","${o.paymentDetails?.transactionReference || ''}",${o.subtotal},${o.taxTotal},${o.discountTotal},${o.grandTotal}`
    );
    const blob = new Blob([...headers, rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Report Navigation Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          {[
            { id: 'overview', label: 'Sales Dashboard' },
            { id: 'z_report', label: 'Z-Report / End of Day' },
            { id: 'transactions', label: 'Transaction Audit Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sound.playKeypadClick();
                setReportType(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                reportType === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportSalesCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
      {reportType === 'overview' && (
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Gross Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {businessProfile.currency} {totalRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-400">Net Sales: {businessProfile.currency} {(totalRevenue - totalTax).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Transactions</span>
                <ShoppingBag className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {transactionCount}
              </p>
              <span className="text-[10px] text-slate-500">100% Settled</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Average Basket (ATV)</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {businessProfile.currency} {avgBasket.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500">Per Transaction</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total VAT (16%)</span>
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {businessProfile.currency} {totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-500">Fiscal Tax Reserved</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Method Breakdown Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white tracking-tight">Payment Channel Volume</h4>
                <span className="text-[11px] font-mono text-slate-400">5 Integrated Channels</span>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'tap_to_pay', label: 'Tap to Pay (NFC Contactless)', color: 'bg-emerald-500' },
                  { id: 'stk_push', label: 'M-Pesa STK Push Prompt', color: 'bg-teal-500' },
                  { id: 'paybill_till', label: 'Paybill & Buy Goods Till', color: 'bg-blue-500' },
                  { id: 'card_emv', label: 'Visa / Mastercard EMV Chip', color: 'bg-indigo-500' },
                  { id: 'cash', label: 'Cash Tender Drawer', color: 'bg-amber-500' },
                ].map((channel) => {
                  const data = methodTotals[channel.id] || { count: 0, total: 0 };
                  const pct = totalRevenue > 0 ? ((data.total / totalRevenue) * 100).toFixed(1) : '0';

                  return (
                    <div key={channel.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{channel.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">{data.count} txns</span>
                          <span className="font-bold text-white">
                            {businessProfile.currency} {data.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${channel.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Selling Items Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white tracking-tight">Top Grossing Products</h4>
                <span className="text-[11px] text-slate-400">Ranked by Volume & Gross</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">{p.name}</p>
                        <span className="text-[10px] text-slate-400">{p.qty} units sold</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {businessProfile.currency} {p.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: Z-REPORT / FISCAL CLOSING --- */}
      {reportType === 'z_report' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                FISCAL Z-REPORT #8492-Z
              </span>
              <h3 className="text-base font-black text-white">{businessProfile.name}</h3>
              <p className="text-xs text-slate-400">Terminal ID: APEX-SMART-01 · PIN: {businessProfile.taxPin}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playPrinterFeed();
                window.print();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Z-Report</span>
            </button>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">REPORT PERIOD:</span>
                <span className="text-white font-bold">{new Date().toLocaleDateString()} (08:00 - {new Date().toLocaleTimeString()})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SUPERVISOR ON DUTY:</span>
                <span className="text-white font-bold">{currentShift.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TOTAL TRANSACTIONS:</span>
                <span className="text-white font-bold">{transactionCount}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl space-y-2">
              <h5 className="font-bold text-slate-300 font-sans text-xs">FINANCIAL TOTALS</h5>
              <div className="flex justify-between text-slate-300">
                <span>GROSS SALES (A):</span>
                <span>{businessProfile.currency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>DISCOUNTS APPLIED:</span>
                <span>-{businessProfile.currency} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>VAT PAYABLE (16%):</span>
                <span>{businessProfile.currency} {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-2 text-sm">
                <span>NET REVENUE:</span>
                <span>{businessProfile.currency} {(totalRevenue - totalTax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl space-y-2">
              <h5 className="font-bold text-slate-300 font-sans text-xs">TENDER RECONCILIATION</h5>
              <div className="flex justify-between text-slate-300">
                <span>TAP TO PAY (NFC):</span>
                <span>{businessProfile.currency} {methodTotals.tap_to_pay.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>M-PESA STK PUSH:</span>
                <span>{businessProfile.currency} {methodTotals.stk_push.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>PAYBILL & TILL:</span>
                <span>{businessProfile.currency} {methodTotals.paybill_till.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>VISA / MASTERCARD:</span>
                <span>{businessProfile.currency} {methodTotals.card_emv.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>CASH TENDERED:</span>
                <span>{businessProfile.currency} {methodTotals.cash.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-400 border-t border-slate-800 pt-1">
                <span>DRAWER OPENING FLOAT:</span>
                <span>{businessProfile.currency} {currentShift.openingFloat.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TRANSACTION AUDIT LOG --- */}
      {reportType === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Table/Customer</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 font-mono">Reference</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {completedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{ord.paidAt || ord.createdAt}</td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                        {ord.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[120px]">
                      {ord.tableName || ord.customerName || 'Walk-in'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-emerald-400 capitalize">
                        {ord.paymentDetails?.method.replace('_', ' ') || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {ord.paymentDetails?.transactionReference || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {businessProfile.currency} {ord.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playKeypadClick();
                          onViewReceipt(ord);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3 text-emerald-400" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
