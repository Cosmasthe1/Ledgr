import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  KeyRound, 
  Clock, 
  DollarSign, 
  Lock, 
  Check, 
  AlertCircle, 
  Plus, 
  ArrowDownCircle, 
  ArrowUpCircle,
  LogOut
} from 'lucide-react';
import { BusinessProfile, CashShift, StaffMember } from '../types/pos';
import { sound } from '../services/soundService';

interface StaffShiftManagerProps {
  staffList: StaffMember[];
  currentStaff: StaffMember;
  currentShift: CashShift;
  businessProfile: BusinessProfile;
  onSwitchStaff: (staff: StaffMember) => void;
  onUpdateShift: (shift: CashShift) => void;
  onUpdateStaffList: (staff: StaffMember[]) => void;
}

export const StaffShiftManager: React.FC<StaffShiftManagerProps> = ({
  staffList,
  currentStaff,
  currentShift,
  businessProfile,
  onSwitchStaff,
  onUpdateShift,
  onUpdateStaffList,
}) => {
  const [selectedStaffToLogin, setSelectedStaffToLogin] = useState<StaffMember | null>(null);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Cash In / Cash Out drawer modal
  const [cashActionType, setCashActionType] = useState<'in' | 'out' | null>(null);
  const [cashActionAmount, setCashActionAmount] = useState(1000);
  const [cashActionNote, setCashActionNote] = useState('');

  // Close shift modal
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(currentShift.openingFloat + currentShift.cashIn - currentShift.cashOut);

  // Add staff modal
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffMember['role']>('Server');
  const [newStaffPin, setNewStaffPin] = useState('1111');

  const handleKeypadPress = (digit: string) => {
    sound.playKeypadClick();
    if (pinAttempt.length < 4) {
      const nextPin = pinAttempt + digit;
      setPinAttempt(nextPin);

      if (nextPin.length === 4 && selectedStaffToLogin) {
        if (nextPin === selectedStaffToLogin.pin) {
          sound.playSuccessChime();
          onSwitchStaff(selectedStaffToLogin);
          setSelectedStaffToLogin(null);
          setPinAttempt('');
          setPinError(null);
        } else {
          sound.playDeclinedBuzzer();
          setPinError('Invalid 4-digit PIN');
          setTimeout(() => {
            setPinAttempt('');
            setPinError(null);
          }, 1000);
        }
      }
    }
  };

  const handleApplyCashAction = () => {
    if (!cashActionType || cashActionAmount <= 0) return;
    sound.playPrinterFeed();

    const updated: CashShift = {
      ...currentShift,
      cashIn: cashActionType === 'in' ? currentShift.cashIn + cashActionAmount : currentShift.cashIn,
      cashOut: cashActionType === 'out' ? currentShift.cashOut + cashActionAmount : currentShift.cashOut,
    };

    onUpdateShift(updated);
    setCashActionType(null);
    setCashActionAmount(1000);
    setCashActionNote('');
  };

  const handleCloseShift = () => {
    sound.playPrinterFeed();
    sound.playSuccessChime();

    const expected = currentShift.openingFloat + currentShift.cashIn - currentShift.cashOut;

    const updated: CashShift = {
      ...currentShift,
      closedAt: new Date().toLocaleTimeString(),
      closingCashCount: countedCash,
      expectedCash: expected,
      isOpen: false,
    };

    onUpdateShift(updated);
    setIsClosingShift(false);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || newStaffPin.length !== 4) return;
    sound.playSuccessChime();

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      pin: newStaffPin,
      avatarColor: 'bg-emerald-600',
      canVoid: newStaffRole === 'Store Manager',
      canDiscount: newStaffRole !== 'Server',
      canViewReports: newStaffRole === 'Store Manager' || newStaffRole === 'Senior Cashier',
      canEditInventory: newStaffRole === 'Store Manager',
    };

    onUpdateStaffList([...staffList, newMember]);
    setIsAddingStaff(false);
    setNewStaffName('');
    setNewStaffPin('1111');
  };

  const expectedCashDrawer = currentShift.openingFloat + currentShift.cashIn - currentShift.cashOut;
  const cashDifference = countedCash - expectedCashDrawer;

  return (
    <div className="space-y-5">
      {/* Current Active User Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${currentStaff.avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
            {currentStaff.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">{currentStaff.name}</h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-700">
                {currentStaff.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Permissions: {currentStaff.canVoid ? 'Void/Refunds ✓ · ' : ''}
              {currentStaff.canDiscount ? 'Discounts ✓ · ' : ''}
              {currentStaff.canViewReports ? 'Sales Audits ✓ · ' : ''}
              {currentStaff.canEditInventory ? 'Stock Control ✓' : 'Standard Tender'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              setIsAddingStaff(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Cashier Shift Drawer & Float Controls */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Active Shift Float & Drawer Reconciliation</h4>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {currentShift.isOpen ? `Shift Open Since ${currentShift.openedAt}` : 'Shift Closed'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Opening Float</span>
            <span className="text-lg font-mono font-bold text-white">
              {businessProfile.currency} {currentShift.openingFloat.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Cash In (Pay-in)</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              +{businessProfile.currency} {currentShift.cashIn.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Cash Out (Safe Drop)</span>
            <span className="text-lg font-mono font-bold text-rose-400">
              -{businessProfile.currency} {currentShift.cashOut.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Expected in Drawer</span>
            <span className="text-lg font-mono font-bold text-amber-400">
              {businessProfile.currency} {expectedCashDrawer.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              setCashActionType('in');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>Record Cash In Float</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              setCashActionType('out');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4 text-rose-400" />
            <span>Drop Cash to Safe</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playKeypadClick();
              setIsClosingShift(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Reconcile & Close Shift</span>
          </button>
        </div>
      </div>

      {/* Staff Switch Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white tracking-tight">Quick Staff Switch (PIN Required)</h4>
          <span className="text-xs text-slate-400">Tap user profile to unlock</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {staffList.map((member) => {
            const isActive = currentStaff.id === member.id;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  sound.playKeypadClick();
                  setSelectedStaffToLogin(member);
                  setPinAttempt('');
                  setPinError(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${member.avatarColor} flex items-center justify-center text-white font-bold`}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{member.name}</h5>
                    <span className="text-[10px] text-slate-400">{member.role}</span>
                  </div>
                </div>

                {isActive ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    Active
                  </span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PIN Unlock Modal */}
      {selectedStaffToLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Staff Authentication
              </span>
              <button
                type="button"
                onClick={() => setSelectedStaffToLogin(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-14 h-14 rounded-2xl ${selectedStaffToLogin.avatarColor} flex items-center justify-center text-white text-xl font-bold mb-2 shadow-lg`}>
                {selectedStaffToLogin.name.charAt(0)}
              </div>
              <h4 className="text-sm font-bold text-white">{selectedStaffToLogin.name}</h4>
              <p className="text-xs text-slate-400">{selectedStaffToLogin.role}</p>
            </div>

            {/* PIN Dots */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    pinAttempt.length > idx
                      ? 'bg-emerald-400 border-emerald-400 shadow-sm shadow-emerald-400/50 scale-110'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-semibold">{pinError}</p>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playKeypadClick();
                setPinAttempt(selectedStaffToLogin.pin);
                onSwitchStaff(selectedStaffToLogin);
                setSelectedStaffToLogin(null);
                sound.playSuccessChime();
              }}
              className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
            >
              Auto-fill PIN ({selectedStaffToLogin.pin})
            </button>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => {
                if (k === '') return <div key={i} />;
                if (k === '⌫') {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        sound.playKeypadClick();
                        setPinAttempt((prev) => prev.slice(0, -1));
                      }}
                      className="h-11 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
                    >
                      DEL
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleKeypadPress(k)}
                    className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-base font-bold transition-all active:scale-95"
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cash In / Out Modal */}
      {cashActionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white">
                {cashActionType === 'in' ? 'Record Cash In (Float Add)' : 'Drop Cash to Store Safe'}
              </h4>
              <button
                type="button"
                onClick={() => setCashActionType(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Amount ({businessProfile.currency}):</label>
              <input
                type="number"
                value={cashActionAmount}
                onChange={(e) => setCashActionAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Reason / Note:</label>
              <input
                type="text"
                value={cashActionNote}
                onChange={(e) => setCashActionNote(e.target.value)}
                placeholder="e.g. Change replenishment, Safe drop"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCashActionType(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCashAction}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Confirm Drawer Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile & Close Shift Modal */}
      {isClosingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white">Reconcile & Close Shift</h4>
              <button
                type="button"
                onClick={() => setIsClosingShift(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-400">Opening Float:</span>
                <span className="font-mono text-white">{businessProfile.currency} {currentShift.openingFloat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cash In - Out:</span>
                <span className="font-mono text-white">+{businessProfile.currency} {(currentShift.cashIn - currentShift.cashOut).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-800 pt-1 text-slate-200">
                <span>Expected Cash Total:</span>
                <span className="font-mono text-emerald-400">{businessProfile.currency} {expectedCashDrawer.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 block font-semibold mb-1">
                Physically Counted Cash in Drawer:
              </label>
              <input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold"
              />
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              cashDifference === 0
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : cashDifference > 0
                ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              <span className="font-semibold">
                {cashDifference === 0 ? 'Drawer Balanced ✓' : cashDifference > 0 ? 'Cash Overage (+)' : 'Cash Shortage (-)'}
              </span>
              <span className="font-mono font-bold">
                {businessProfile.currency} {Math.abs(cashDifference).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClosingShift(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                Finalize Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateStaff}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white">Add Staff Member</h4>
              <button
                type="button"
                onClick={() => setIsAddingStaff(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Role</label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
              >
                <option value="Store Manager">Store Manager (All Permissions)</option>
                <option value="Senior Cashier">Senior Cashier (Sales & Reports)</option>
                <option value="Server">Server (Order Taking)</option>
                <option value="Barista">Barista (Order Taking)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">4-Digit Security PIN *</label>
              <input
                type="password"
                maxLength={4}
                required
                value={newStaffPin}
                onChange={(e) => setNewStaffPin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-lg font-bold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingStaff(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
