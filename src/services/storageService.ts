import { BusinessProfile, CashShift, Order, Product, RestaurantTable, StaffMember } from '../types/pos';
import { initialBusinessProfile, initialProducts, initialShift, initialStaff, initialTables, sampleCompletedOrders } from '../data/mockData';

const KEYS = {
  PRODUCTS: 'apex_pos_products_v1',
  ORDERS: 'apex_pos_orders_v1',
  TABLES: 'apex_pos_tables_v1',
  STAFF: 'apex_pos_staff_v1',
  CURRENT_STAFF: 'apex_pos_current_staff_v1',
  CURRENT_SHIFT: 'apex_pos_shift_v1',
  BUSINESS: 'apex_pos_business_v1',
  MODE: 'apex_pos_mode_v1',
  VIEW: 'apex_pos_view_v1',
};

export const storage = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(KEYS.PRODUCTS);
      return data ? JSON.parse(data) : initialProducts;
    } catch {
      return initialProducts;
    }
  },
  saveProducts(products: Product[]) {
    try {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(KEYS.ORDERS);
      return data ? JSON.parse(data) : sampleCompletedOrders;
    } catch {
      return sampleCompletedOrders;
    }
  },
  saveOrders(orders: Order[]) {
    try {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  },

  getTables(): RestaurantTable[] {
    try {
      const data = localStorage.getItem(KEYS.TABLES);
      return data ? JSON.parse(data) : initialTables;
    } catch {
      return initialTables;
    }
  },
  saveTables(tables: RestaurantTable[]) {
    try {
      localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
    } catch {}
  },

  getStaff(): StaffMember[] {
    try {
      const data = localStorage.getItem(KEYS.STAFF);
      return data ? JSON.parse(data) : initialStaff;
    } catch {
      return initialStaff;
    }
  },
  saveStaff(staff: StaffMember[]) {
    try {
      localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
    } catch {}
  },

  getCurrentStaff(): StaffMember {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_STAFF);
      return data ? JSON.parse(data) : initialStaff[0];
    } catch {
      return initialStaff[0];
    }
  },
  saveCurrentStaff(staff: StaffMember) {
    try {
      localStorage.setItem(KEYS.CURRENT_STAFF, JSON.stringify(staff));
    } catch {}
  },

  getShift(): CashShift {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_SHIFT);
      return data ? JSON.parse(data) : initialShift;
    } catch {
      return initialShift;
    }
  },
  saveShift(shift: CashShift) {
    try {
      localStorage.setItem(KEYS.CURRENT_SHIFT, JSON.stringify(shift));
    } catch {}
  },

  getBusinessProfile(): BusinessProfile {
    try {
      const data = localStorage.getItem(KEYS.BUSINESS);
      return data ? JSON.parse(data) : initialBusinessProfile;
    } catch {
      return initialBusinessProfile;
    }
  },
  saveBusinessProfile(profile: BusinessProfile) {
    try {
      localStorage.setItem(KEYS.BUSINESS, JSON.stringify(profile));
    } catch {}
  },

  resetDefaults() {
    try {
      localStorage.removeItem(KEYS.PRODUCTS);
      localStorage.removeItem(KEYS.ORDERS);
      localStorage.removeItem(KEYS.TABLES);
      localStorage.removeItem(KEYS.STAFF);
      localStorage.removeItem(KEYS.CURRENT_STAFF);
      localStorage.removeItem(KEYS.CURRENT_SHIFT);
      localStorage.removeItem(KEYS.BUSINESS);
    } catch {}
  }
};
