/**
 * Android SMART POS - Data Types and Interfaces
 */

export type POSMode = 'retail' | 'restaurant';
export type ViewMode = 'handheld' | 'countertop';

export type PaymentMethod = 
  | 'tap_to_pay' 
  | 'stk_push' 
  | 'paybill_till' 
  | 'card_emv' 
  | 'cash';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ProductModifier {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockLevel: number;
  taxRate: number; // e.g. 0.16 for 16%
  imageUrl?: string;
  icon?: string;
  color?: string;
  isRetail?: boolean;
  isRestaurant?: boolean;
  modifiers?: ProductModifier[];
}

export interface CartItem {
  id: string; // unique item instance id in cart
  product: Product;
  quantity: number;
  selectedModifiers: ProductModifier[];
  itemDiscountPercent?: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  mode: POSMode;
  tableId?: string;
  tableName?: string;
  serverName?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: 'open' | 'parked' | 'kitchen_preparing' | 'kitchen_ready' | 'completed' | 'voided';
  createdAt: string;
  paidAt?: string;
  paymentDetails?: PaymentDetails;
  cashierId: string;
  cashierName: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  timestamp: string;
  transactionReference: string;
  
  // Specific method metadata
  stkPush?: {
    phoneNumber: string;
    mpesaReceiptNumber: string;
    checkoutRequestId: string;
    resultDesc: string;
  };
  paybillTill?: {
    type: 'till' | 'paybill';
    shortcode: string;
    accountReference?: string;
    customerTransactionCode: string;
    senderName: string;
  };
  tapToPay?: {
    cardBrand: 'Visa' | 'Mastercard' | 'ApplePay' | 'GooglePay';
    lastFour: string;
    authCode: string;
    terminalId: string;
    nfcVerified: boolean;
  };
  cardEmv?: {
    cardBrand: 'Visa' | 'Mastercard';
    entryMethod: 'chip' | 'swipe' | 'manual';
    cardHolder: string;
    lastFour: string;
    authCode: string;
    aid: string; // Application Identifier
    batchNumber: string;
  };
  cash?: {
    tenderedAmount: number;
    changeGiven: number;
  };
}

export interface RestaurantTable {
  id: string;
  name: string;
  zone: 'Main Dining' | 'Terrace' | 'Bar' | 'VIP Lounge';
  capacity: number;
  status: 'available' | 'occupied' | 'billed' | 'reserved';
  activeOrderId?: string;
  occupiedSince?: string;
  guestCount?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Store Manager' | 'Senior Cashier' | 'Server' | 'Barista';
  pin: string;
  avatarColor: string;
  canVoid: boolean;
  canDiscount: boolean;
  canViewReports: boolean;
  canEditInventory: boolean;
}

export interface CashShift {
  id: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  closingCashCount?: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  totalSales: number;
  totalTransactions: number;
  isOpen: boolean;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxPin: string;
  tillNumber: string;
  paybillNumber: string;
  currency: string;
  defaultTaxRate: number;
}
