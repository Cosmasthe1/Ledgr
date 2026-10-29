import React, { useState } from 'react';
import { Printer, Share2, Check, MessageSquare, Download, ArrowLeft, RefreshCw } from 'lucide-react';
import { BusinessProfile, Order } from '../types/pos';
import { sound } from '../services/soundService';

interface ReceiptModalProps {
  order: Order | null;
  businessProfile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  businessProfile,
  isOpen,
  onClose,
  onNewOrder,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharingWa, setSharingWa] = useState(false);

  if (!isOpen || !order) return null;

  const payment = order.paymentDetails;

  const handlePrint = () => {
    sound.playPrinterFeed();
    window.print();
  };

  const handleShareWhatsApp = () => {
    setSharingWa(true);
    sound.playKeypadClick();

    const itemsSummary = order.items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product.name} = ${businessProfile.currency} ${(
            (i.product.price +
              i.selectedModifiers.reduce((acc, m) => acc + m.price, 0)) *
            i.quantity
          ).toLocaleString()}`
      )
      .join('\n');

    const msg = `🧾 *${businessProfile.name}* E-RECEIPT\nOrder: ${order.orderNumber}\nDate: ${order.paidAt || order.createdAt}\nCashier: ${order.cashierName}\n\n${itemsSummary}\n\n*Total: ${businessProfile.currency} ${order.grandTotal.toLocaleString()}*\nPaid via: ${payment?.method.replace('_', ' ').toUpperCase()} (Ref: ${payment?.transactionReference || 'N/A'})\n\nThank you for your business!`;

    // Try web share if available or copy text
    if (navigator.share) {
      navigator.share({
        title: `${businessProfile.name} Receipt`,
        text: msg,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    setTimeout(() => setSharingWa(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Payment Confirmed</h4>
              <p className="text-[11px] text-slate-400">Order {order.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Print Thermal Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
          {/* Authentic 80mm Thermal Receipt Simulation Paper */}
          <div
            id="printable-receipt"
            className="bg-white text-slate-900 rounded-xl p-5 shadow-lg font-mono text-[11px] leading-relaxed select-text"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black tracking-tight uppercase text-slate-900 font-sans">
                {businessProfile.name}
              </h2>
              <p className="text-[10px] text-slate-600 font-sans">{businessProfile.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">{businessProfile.address}</p>
              <p className="text-[10px] text-slate-500">Tel: {businessProfile.phone}</p>
              <p className="text-[10px] text-slate-600 font-bold mt-0.5">PIN: {businessProfile.taxPin}</p>
              <p className="text-[10px] text-slate-600">
                Till: <strong>{businessProfile.tillNumber}</strong> · Paybill: <strong>{businessProfile.paybillNumber}</strong>
              </p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>ORDER #:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{order.paidAt || order.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.tableName && (
                <div className="flex justify-between font-bold text-slate-800">
                  <span>TABLE / ZONE:</span>
                  <span>{order.tableName}</span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 pb-1 border-b border-slate-200">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/4 text-center">QTY</span>
                <span className="w-1/4 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-slate-100 pt-1">
                {order.items.map((ci) => {
                  const modSum = ci.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
                  const lineTotal = (ci.product.price + modSum) * ci.quantity;

                  return (
                    <div key={ci.id} className="py-1">
                      <div className="flex justify-between">
                        <span className="w-1/2 font-bold truncate">{ci.product.name}</span>
                        <span className="w-1/4 text-center">x{ci.quantity}</span>
                        <span className="w-1/4 text-right font-bold">
                          {businessProfile.currency} {lineTotal.toLocaleString()}
                        </span>
                      </div>
                      {ci.selectedModifiers.length > 0 && (
                        <div className="pl-2 text-[9px] text-slate-500">
                          {ci.selectedModifiers.map((m) => `+ ${m.name}`).join(', ')}
                        </div>
                      )}
                      {ci.notes && (
                        <div className="pl-2 text-[9px] text-slate-400 italic">
                          Note: {ci.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL (EXCL. TAX):</span>
                <span>{businessProfile.currency} {(order.grandTotal - order.taxTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (16% INCLUDED):</span>
                <span>{businessProfile.currency} {order.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>DISCOUNT:</span>
                  <span>-{businessProfile.currency} {order.discountTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300 text-slate-900">
                <span>TOTAL PAID:</span>
                <span>{businessProfile.currency} {order.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Verification Block */}
            {payment && (
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                <div className="font-bold text-slate-800">
                  PAYMENT METHOD: {payment.method.replace('_', ' ').toUpperCase()}
                </div>

                {payment.method === 'stk_push' && payment.stkPush && (
                  <>
                    <div className="flex justify-between">
                      <span>M-PESA REF:</span>
                      <span className="font-bold font-mono">{payment.stkPush.mpesaReceiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PHONE:</span>
                      <span>{payment.stkPush.phoneNumber}</span>
                    </div>
                  </>
                )}

                {payment.method === 'tap_to_pay' && payment.tapToPay && (
                  <>
                    <div className="flex justify-between">
                      <span>NFC CARD:</span>
                      <span>{payment.tapToPay.cardBrand} •••• {payment.tapToPay.lastFour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AUTH CODE:</span>
                      <span className="font-bold">{payment.tapToPay.authCode}</span>
                    </div>
                  </>
                )}

                {payment.method === 'paybill_till' && payment.paybillTill && (
                  <>
                    <div className="flex justify-between">
                      <span>TRANSACTION CODE:</span>
                      <span className="font-bold font-mono">{payment.paybillTill.customerTransactionCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CHANNEL:</span>
                      <span>{payment.paybillTill.type === 'till' ? 'Buy Goods Till' : 'Paybill'}</span>
                    </div>
                  </>
                )}

                {payment.method === 'card_emv' && payment.cardEmv && (
                  <>
                    <div className="flex justify-between">
                      <span>CARD:</span>
                      <span>{payment.cardEmv.cardBrand} •••• {payment.cardEmv.lastFour} ({payment.cardEmv.entryMethod.toUpperCase()})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AID / AUTH:</span>
                      <span className="font-mono">{payment.cardEmv.aid.slice(0, 7)} / {payment.cardEmv.authCode}</span>
                    </div>
                  </>
                )}

                {payment.method === 'cash' && payment.cash && (
                  <>
                    <div className="flex justify-between">
                      <span>TENDERED:</span>
                      <span>{businessProfile.currency} {payment.cash.tenderedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>CHANGE:</span>
                      <span>{businessProfile.currency} {payment.cash.changeGiven.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Footer Barcode Simulation */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              <div className="w-3/4 mx-auto h-8 bg-slate-900 rounded-xs flex items-center justify-center p-1 mb-1">
                <div className="w-full h-full flex justify-between items-stretch">
                  {[4, 1, 3, 2, 5, 1, 2, 4, 3, 1, 2, 5, 2, 4, 1, 3, 2, 4, 1, 3, 5, 2].map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-white"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
              </div>
              <p className="font-mono text-[9px] tracking-wider text-slate-600">{order.orderNumber} - FISCAL VERIFIED</p>
              <p className="mt-1 font-bold text-slate-700">Thank you for dining / shopping with us!</p>
              <p className="text-[9px]">Goods once sold can be exchanged within 7 days with valid receipt.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{copied ? 'Copied Receipt!' : 'Share WhatsApp / SMS'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              onNewOrder();
            }}
            className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <span>Next Transaction</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
