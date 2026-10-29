import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  DollarSign, 
  Radio, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  Wifi
} from 'lucide-react';
import { BusinessProfile, PaymentDetails, PaymentMethod } from '../types/pos';
import { sound } from '../services/soundService';
import { PhoneSimulatorModal } from './PhoneSimulatorModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  orderNumber: string;
  businessProfile: BusinessProfile;
  customerPhone?: string;
  onPaymentSuccess: (paymentDetails: PaymentDetails) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  orderNumber,
  businessProfile,
  customerPhone = '',
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('tap_to_pay');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STK Push state
  const [phoneInput, setPhoneInput] = useState(customerPhone || '0712345678');
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Paybill / Till state
  const [tillType, setTillType] = useState<'till' | 'paybill'>('till');
  const [customerRefCode, setCustomerRefCode] = useState('');
  const [autoCheckingTill, setAutoCheckingTill] = useState(false);

  // Card EMV state
  const [cardEntryType, setCardEntryType] = useState<'chip' | 'swipe' | 'manual'>('chip');
  const [cardHolder, setCardHolder] = useState('JANE DOE');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('883');

  // Tap to Pay state
  const [tapBrand, setTapBrand] = useState<'Visa' | 'Mastercard' | 'ApplePay' | 'GooglePay'>('Visa');
  const [nfcTapped, setNfcTapped] = useState(false);

  // Cash state
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('tap_to_pay');
      setProcessing(false);
      setErrorMsg(null);
      setNfcTapped(false);
      setCashTendered(grandTotal);
      setCustomerRefCode('');
      setAutoCheckingTill(false);
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  // 1. Process Tap to Pay
  const handleSimulateTap = (brand: 'Visa' | 'Mastercard' | 'ApplePay' | 'GooglePay' = tapBrand) => {
    if (processing) return;
    setTapBrand(brand);
    setNfcTapped(true);
    sound.playNfcTapTone();
    setProcessing(true);
    setErrorMsg(null);

    setTimeout(() => {
      sound.playSuccessChime();
      const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
      const authCode = 'V' + Math.floor(10000 + Math.random() * 90000);
      
      onPaymentSuccess({
        method: 'tap_to_pay',
        amount: grandTotal,
        status: 'completed',
        timestamp: new Date().toISOString(),
        transactionReference: `TAP-${authCode}`,
        tapToPay: {
          cardBrand: brand,
          lastFour,
          authCode,
          terminalId: 'APEX-SMART-NFC1',
          nfcVerified: true,
        },
      });
      setProcessing(false);
    }, 1200);
  };

  // 2. Trigger STK Push Prompt
  const handleTriggerStkPush = () => {
    if (!phoneInput || phoneInput.length < 9) {
      setErrorMsg('Please enter a valid mobile number');
      sound.playDeclinedBuzzer();
      return;
    }
    setErrorMsg(null);
    setIsPhoneModalOpen(true);
  };

  const handleStkSuccess = (receiptCode: string) => {
    setIsPhoneModalOpen(false);
    setProcessing(true);
    setTimeout(() => {
      onPaymentSuccess({
        method: 'stk_push',
        amount: grandTotal,
        status: 'completed',
        timestamp: new Date().toISOString(),
        transactionReference: receiptCode,
        stkPush: {
          phoneNumber: phoneInput,
          mpesaReceiptNumber: receiptCode,
          checkoutRequestId: `ws_CO_${Date.now()}`,
          resultDesc: 'The service request is processed successfully.',
        },
      });
      setProcessing(false);
    }, 400);
  };

  // 3. Process Paybill / Till Number Verification
  const handleVerifyTillPayment = (simulatedCode?: string) => {
    const code = simulatedCode || customerRefCode.trim().toUpperCase() || 'QK' + Math.floor(10000000 + Math.random() * 90000000);
    setAutoCheckingTill(true);
    sound.playKeypadClick();

    setTimeout(() => {
      setAutoCheckingTill(false);
      sound.playSuccessChime();
      onPaymentSuccess({
        method: 'paybill_till',
        amount: grandTotal,
        status: 'completed',
        timestamp: new Date().toISOString(),
        transactionReference: code,
        paybillTill: {
          type: tillType,
          shortcode: tillType === 'till' ? businessProfile.tillNumber : businessProfile.paybillNumber,
          accountReference: tillType === 'paybill' ? `ORD-${orderNumber.slice(-4)}` : undefined,
          customerTransactionCode: code,
          senderName: 'VERIFIED CUSTOMER',
        },
      });
    }, 1400);
  };

  // 4. Process Card EMV (Insert / Swipe / Manual)
  const handleProcessCardEmv = () => {
    setProcessing(true);
    sound.playBarcodeBeep();

    setTimeout(() => {
      sound.playSuccessChime();
      const lastFour = cardNumber.replace(/\D/g, '').slice(-4) || '4242';
      const authCode = 'AUTH-' + Math.floor(100000 + Math.random() * 900000);

      onPaymentSuccess({
        method: 'card_emv',
        amount: grandTotal,
        status: 'completed',
        timestamp: new Date().toISOString(),
        transactionReference: authCode,
        cardEmv: {
          cardBrand: cardNumber.startsWith('5') ? 'Mastercard' : 'Visa',
          entryMethod: cardEntryType,
          cardHolder: cardHolder || 'CUSTOMER',
          lastFour,
          authCode,
          aid: 'A0000000031010',
          batchNumber: '00084',
        },
      });
      setProcessing(false);
    }, 1500);
  };

  // 5. Process Cash
  const handleProcessCash = () => {
    if (cashTendered < grandTotal) {
      setErrorMsg(`Amount tendered is less than ${businessProfile.currency} ${grandTotal.toLocaleString()}`);
      sound.playDeclinedBuzzer();
      return;
    }
    sound.playPrinterFeed();
    sound.playSuccessChime();

    onPaymentSuccess({
      method: 'cash',
      amount: grandTotal,
      status: 'completed',
      timestamp: new Date().toISOString(),
      transactionReference: `CASH-${Date.now().toString().slice(-6)}`,
      cash: {
        tenderedAmount: cashTendered,
        changeGiven: cashTendered - grandTotal,
      },
    });
  };

  const cashChange = Math.max(0, cashTendered - grandTotal);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Integrated Smart Payment</h3>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                    256-Bit EMV Level 2
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Order {orderNumber} · Total Payable: <strong className="text-white font-mono">{businessProfile.currency} {grandTotal.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={processing}
              className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-5 gap-1.5 text-xs font-semibold">
            {[
              { id: 'tap_to_pay', label: 'Tap to Pay', icon: Wifi, highlight: 'NFC Contactless' },
              { id: 'stk_push', label: 'STK Push', icon: Smartphone, highlight: 'M-Pesa Prompt' },
              { id: 'paybill_till', label: 'Paybill / Till', icon: QrCode, highlight: 'Buy Goods / QR' },
              { id: 'card_emv', label: 'Card EMV', icon: CreditCard, highlight: 'Visa / MC Chip' },
              { id: 'cash', label: 'Cash Tender', icon: DollarSign, highlight: 'Change Calc' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedMethod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sound.playKeypadClick();
                    setSelectedMethod(tab.id as PaymentMethod);
                    setErrorMsg(null);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold leading-tight truncate">{tab.label}</span>
                  <span className={`text-[9px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {tab.highlight}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 text-slate-200 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* --- 1. TAP TO PAY (NFC CONTACTLESS) --- */}
            {selectedMethod === 'tap_to_pay' && (
              <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
                {/* NFC Wave Radar Animation */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping opacity-50" />
                  <div className="absolute inset-3 rounded-full border-2 border-emerald-500/40 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-950 z-10">
                    <Wifi className="w-10 h-10 rotate-90 transform" />
                    <span className="text-[10px] font-bold tracking-widest mt-1">NFC READ</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">Hold Card or Device Near Top of Terminal</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Supports contactless Visa payWave, Mastercard Contactless, Apple Pay, Google Wallet, and Samsung Pay.
                  </p>
                </div>

                {/* Instant Tap Simulation Quick Triggers */}
                <div className="w-full max-w-md bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold text-white">Tap to Pay Fast Simulators:</span>
                    <span className="text-emerald-400 text-[11px] font-mono">EMV Contactless Certified</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { brand: 'Visa', label: 'Visa Card', color: 'from-blue-700 to-blue-900' },
                      { brand: 'Mastercard', label: 'Mastercard', color: 'from-amber-600 to-red-800' },
                      { brand: 'ApplePay', label: 'Apple Pay', color: 'from-slate-700 to-slate-900' },
                      { brand: 'GooglePay', label: 'Google Pay', color: 'from-teal-700 to-emerald-900' },
                    ].map((item) => (
                      <button
                        key={item.brand}
                        type="button"
                        disabled={processing}
                        onClick={() => handleSimulateTap(item.brand as any)}
                        className={`py-3 px-2 rounded-xl text-white font-bold text-xs bg-gradient-to-b ${item.color} hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer border border-white/10`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Wifi className="w-3 h-3 rotate-90" />
                          <span>Tap</span>
                        </div>
                        <span className="text-[11px]">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3">
                    No signature or PIN needed for amounts under {businessProfile.currency} 5,000.
                  </p>
                </div>

                {processing && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing NFC chip payload with payment switch...</span>
                  </div>
                )}
              </div>
            )}

            {/* --- 2. MOBILE STK PUSH (M-PESA / MOBILE MONEY) --- */}
            {selectedMethod === 'stk_push' && (
              <div className="max-w-md mx-auto space-y-4 py-2">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        M
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">M-Pesa Express (STK Push)</h4>
                        <p className="text-[11px] text-slate-400">Sends instant prompt directly to customer's handset</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold border border-emerald-800/40">
                      Live Daraja v2
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Customer Mobile Number:
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="e.g. 0712345678 or 254712345678"
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setPhoneInput('0722123456')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-950/80 rounded-lg border border-emerald-800/50 cursor-pointer"
                        >
                          Fill Sample
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 py-1 border-t border-slate-800">
                      <span>Business Shortcode:</span>
                      <strong className="text-white font-mono">{businessProfile.tillNumber} (Buy Goods)</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 py-1 border-t border-slate-800">
                      <span>Amount:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{businessProfile.currency} {grandTotal.toLocaleString()}</strong>
                    </div>

                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleTriggerStkPush}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Send STK Push Prompt to Handset</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>A realistic phone pop-up will appear on screen simulating the customer entering their M-Pesa PIN.</span>
                </div>
              </div>
            )}

            {/* --- 3. PAYBILL / TILL NUMBER --- */}
            {selectedMethod === 'paybill_till' && (
              <div className="max-w-lg mx-auto space-y-4 py-1">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTillType('till')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tillType === 'till'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Buy Goods Till No.
                  </button>
                  <button
                    type="button"
                    onClick={() => setTillType('paybill')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tillType === 'paybill'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Paybill Business No.
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  {/* QR Code Card */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-md text-slate-900">
                    <div className="w-36 h-36 border-4 border-slate-900 p-2 rounded-lg flex items-center justify-center relative bg-white">
                      {/* Stylized high contrast QR pattern */}
                      <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-1 p-1">
                        <div className="bg-slate-900 rounded-xs col-span-2 row-span-2 border-2 border-white" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs col-span-2 row-span-2 border-2 border-white" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs col-span-2 row-span-2 border-2 border-white" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-slate-900 rounded-xs" />
                        <div className="bg-emerald-600 rounded-xs col-span-2 row-span-2 flex items-center justify-center text-white font-bold text-[8px]">
                          PAY
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold mt-2 text-slate-700">Scan via Any Banking App</span>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        {tillType === 'till' ? 'Till Number (Buy Goods):' : 'Paybill Number:'}
                      </span>
                      <span className="text-2xl font-mono font-black text-emerald-400 tracking-wider">
                        {tillType === 'till' ? businessProfile.tillNumber : businessProfile.paybillNumber}
                      </span>
                    </div>

                    {tillType === 'paybill' && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Account Number:</span>
                        <span className="text-sm font-mono font-bold text-white">
                          ORD-{orderNumber.slice(-4)}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payable Amount:</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {businessProfile.currency} {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instant Verification Controls */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-white">Payment Verification:</h5>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customerRefCode}
                      onChange={(e) => setCustomerRefCode(e.target.value.toUpperCase())}
                      placeholder="Enter M-Pesa Code (e.g. QK829104LA)"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 uppercase"
                    />
                    <button
                      type="button"
                      disabled={autoCheckingTill}
                      onClick={() => handleVerifyTillPayment()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {autoCheckingTill ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Verify Code</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Or simulate instant incoming notification:</span>
                    <button
                      type="button"
                      disabled={autoCheckingTill}
                      onClick={() => handleVerifyTillPayment('QK' + Math.floor(10000000 + Math.random() * 90000000))}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Simulate Incoming Payment</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- 4. VISA / MASTERCARD (EMV) --- */}
            {selectedMethod === 'card_emv' && (
              <div className="max-w-md mx-auto space-y-4 py-1">
                {/* Method selector: Chip vs Swipe vs Manual */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'chip', label: 'Insert Chip (Dip)' },
                    { id: 'swipe', label: 'Magnetic Swipe' },
                    { id: 'manual', label: 'Keyed Card' },
                  ].map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setCardEntryType(entry.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                        cardEntryType === entry.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>

                {/* Simulated EMV Card Visual */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700/40 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-8 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center">
                      <div className="w-7 h-5 border border-amber-800/40 rounded-xs grid grid-cols-2 grid-rows-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-widest text-slate-300">VISA / MASTERCARD</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Card Number</span>
                    <p className="text-lg font-mono font-bold text-white tracking-widest">
                      {cardNumber}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Cardholder</span>
                      <span className="text-slate-200 font-bold">{cardHolder}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Expires</span>
                      <span className="text-slate-200 font-bold">{cardExp}</span>
                    </div>
                  </div>
                </div>

                {cardEntryType === 'manual' ? (
                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <label className="text-[11px] text-slate-400">Exp</label>
                          <input
                            type="text"
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center text-slate-400">
                    {cardEntryType === 'chip'
                      ? 'Insert card into bottom EMV smart slot until card clicks.'
                      : 'Swipe card through right magnetic reader smoothly from top to bottom.'}
                  </p>
                )}

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleProcessCardEmv}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950 active:scale-[0.99] transition-all cursor-pointer"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing EMV Level 2 Transaction...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Process {cardEntryType.toUpperCase()} Transaction</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --- 5. CASH TENDER --- */}
            {selectedMethod === 'cash' && (
              <div className="max-w-md mx-auto space-y-4 py-1">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Cash Tendered:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                        {businessProfile.currency}
                      </span>
                      <input
                        type="number"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Preset Denominations */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">Quick Denominations:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Exact', value: grandTotal },
                        { label: '+500', value: Math.ceil(grandTotal / 500) * 500 || 500 },
                        { label: '1,000', value: 1000 },
                        { label: '2,000', value: 2000 },
                      ].map((den, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sound.playKeypadClick();
                            setCashTendered(den.value);
                          }}
                          className="py-2 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          {den.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change calculation */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Customer Change</span>
                      <span className={`text-xl font-mono font-bold ${cashChange > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {businessProfile.currency} {cashChange.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Sale</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {businessProfile.currency} {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessCash}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Cash Sale & Open Drawer</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Phone Simulator for STK Push verification */}
      <PhoneSimulatorModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        amount={grandTotal}
        currency={businessProfile.currency}
        businessName={businessProfile.name}
        tillOrPaybill={businessProfile.tillNumber}
        phoneNumber={phoneInput}
        onSuccess={handleStkSuccess}
        onFailed={(reason) => {
          setErrorMsg(reason);
          sound.playDeclinedBuzzer();
        }}
      />
    </>
  );
};
