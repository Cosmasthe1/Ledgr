import React, { useState, useEffect } from 'react';
import { sound } from '../services/soundService';
import { Smartphone, Lock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface PhoneSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  businessName: string;
  tillOrPaybill: string;
  phoneNumber: string;
  onSuccess: (mpesaReceipt: string) => void;
  onFailed: (reason: string) => void;
}

export const PhoneSimulatorModal: React.FC<PhoneSimulatorModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  businessName,
  tillOrPaybill,
  phoneNumber,
  onSuccess,
  onFailed,
}) => {
  const [pin, setPin] = useState('');
  const [stage, setStage] = useState<'prompt' | 'processing' | 'approved' | 'rejected'>('prompt');
  const [timer, setTimer] = useState(45);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setStage('prompt');
      setTimer(45);
      sound.playBarcodeBeep(); // Phone notification chime
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || stage !== 'prompt') return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStage('rejected');
          sound.playDeclinedBuzzer();
          setTimeout(() => onFailed('Customer timed out entering PIN'), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, stage, onFailed]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      sound.playKeypadClick();
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    sound.playKeypadClick();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleConfirmPin = () => {
    if (pin.length < 4) return;
    setStage('processing');
    sound.playKeypadClick();

    setTimeout(() => {
      // Generate authentic-looking M-Pesa receipt code: e.g. QK + 8 random digits/letters
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let ref = 'QK';
      for (let i = 0; i < 8; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      setStage('approved');
      sound.playSuccessChime();

      setTimeout(() => {
        onSuccess(ref);
        onClose();
      }, 1400);
    }, 1800);
  };

  const handleCancel = () => {
    sound.playDeclinedBuzzer();
    setStage('rejected');
    setTimeout(() => {
      onFailed('Request cancelled on handset by user');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Smartphone Outer Shell */}
      <div className="relative w-full max-w-[340px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700 ring-1 ring-slate-800">
        {/* Phone Speaker & Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full flex items-center justify-center gap-2 z-20">
          <div className="w-10 h-1 bg-slate-800 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-800" />
        </div>

        {/* Screen Bezel */}
        <div className="bg-slate-950 rounded-[36px] overflow-hidden min-h-[560px] flex flex-col justify-between p-4 pt-10 text-slate-100 relative">
          {/* Handset Top Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 mb-2">
            <span>Safaricom M-PESA</span>
            <span className="text-emerald-400 font-semibold">{phoneNumber || '+254 7XX XXX XXX'}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">4G</span>
              <span className="text-[10px]">98%</span>
            </div>
          </div>

          {/* SIM Toolkit Modal Content */}
          <div className="flex-1 flex flex-col justify-center">
            {stage === 'prompt' && (
              <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                      M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">M-PESA SIM TOOLKIT</h4>
                      <p className="text-[10px] text-slate-400">STK Push Request</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold">
                    {timer}s
                  </span>
                </div>

                <div className="text-center py-2 mb-3">
                  <p className="text-xs text-slate-300 mb-1">
                    Do you want to pay <strong className="text-emerald-400 text-sm">{currency} {amount.toLocaleString()}</strong> to:
                  </p>
                  <p className="font-bold text-white text-sm">{businessName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Till / Acc: {tillOrPaybill}</p>
                </div>

                {/* PIN Input Indicator */}
                <div className="mb-4 text-center">
                  <label className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-2">
                    <Lock className="w-3 h-3 text-emerald-400" /> Enter 4-digit M-Pesa PIN:
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-11 rounded-lg border flex items-center justify-center text-lg font-bold transition-all ${
                          pin.length > idx
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-800/80 border-slate-700 text-slate-500'
                        }`}
                      >
                        {pin.length > idx ? '•' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Auto-Fill for Convenience */}
                <div className="flex justify-center mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeypadClick();
                      setPin('1234');
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Auto-fill demo PIN (1234)
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={pin.length < 4}
                    onClick={handleConfirmPin}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                      pin.length === 4
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    Confirm & Send
                  </button>
                </div>
              </div>
            )}

            {stage === 'processing' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto mb-4" />
                <h4 className="text-sm font-bold text-white mb-1">Encrypting & Verifying PIN</h4>
                <p className="text-xs text-slate-400">Communicating with Safaricom M-Pesa Core...</p>
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit TLS End-to-End Encrypted</span>
                </div>
              </div>
            )}

            {stage === 'approved' && (
              <div className="text-center py-8 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Payment Successful!</h4>
                <p className="text-xs text-emerald-400 font-mono">
                  {currency} {amount.toLocaleString()} paid to {businessName}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">SMS receipt dispatched to customer</p>
              </div>
            )}

            {stage === 'rejected' && (
              <div className="text-center py-8 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto mb-3">
                  <XCircle className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Request Declined</h4>
                <p className="text-xs text-slate-400">Transaction was cancelled or timed out.</p>
              </div>
            )}
          </div>

          {/* Virtual Handset Keypad (shown only when prompt is active) */}
          {stage === 'prompt' && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => {
                if (k === '') return <div key={i} />;
                if (k === '⌫') {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={handleDelete}
                      className="h-11 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
                    >
                      DEL
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleKeyPress(k)}
                    className="h-11 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center text-base font-semibold transition-colors cursor-pointer active:scale-95"
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          )}

          {/* Home indicator bar */}
          <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
};
