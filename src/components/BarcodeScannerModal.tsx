import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Scan, Zap, AlertCircle } from 'lucide-react';
import { Product } from '../types/pos';
import { sound } from '../services/soundService';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanProduct: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanProduct,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      setErrorMsg(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  if (!isOpen) return null;

  const handleSimulateScan = (product: Product) => {
    sound.playBarcodeBeep();
    onScanProduct(product);
    onClose();
  };

  const handleManualLookup = () => {
    const query = manualCode.trim().toLowerCase();
    const match = products.find(
      (p) =>
        p.barcode.toLowerCase() === query ||
        p.sku.toLowerCase() === query ||
        p.name.toLowerCase().includes(query)
    );

    if (match) {
      handleSimulateScan(match);
    } else {
      sound.playDeclinedBuzzer();
      setErrorMsg(`No product found with barcode/SKU: ${manualCode}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Smart Barcode Scanner</h3>
              <p className="text-[10px] text-slate-400">Aim camera or select item to trigger laser scan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder View */}
        <div className="relative bg-slate-950 h-56 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
              <Camera className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs">Optical Sensor Standby</p>
              <p className="text-[10px] text-slate-600 mt-1">Tap any product barcode below to simulate instantaneous hardware laser scan.</p>
            </div>
          )}

          {/* Viewfinder Reticle */}
          <div className="absolute inset-x-12 inset-y-8 border-2 border-emerald-500/60 rounded-2xl pointer-events-none flex items-center justify-center">
            {/* Animated Red Laser Scanline */}
            <div className="w-full h-0.5 bg-rose-500 shadow-md shadow-rose-500 animate-pulse relative">
              <div className="absolute inset-0 bg-red-400 blur-xs" />
            </div>
            {/* Corner notches */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
          </div>
        </div>

        {/* Quick Manual / Test Barcodes */}
        <div className="p-4 space-y-3 bg-slate-900 flex-1 overflow-y-auto max-h-64">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
              placeholder="Key in SKU or Barcode..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleManualLookup}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Scan
            </button>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Instant Hardware Laser Simulators:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSimulateScan(prod)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white truncate group-hover:text-emerald-400">
                      {prod.name}
                    </span>
                    <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>{prod.barcode.slice(-7)}</span>
                    <span className="text-emerald-400 font-bold">Ksh {prod.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
