// types/index.ts

export type UserRole = 'admin' | 'manager' | 'worker';

export type OrderLocation = 'Srbija' | 'Inostranstvo';

export type OrderStatus = 'na_cekanju' | 'u_proizvodnji' | 'isporuceno' | 'otkazano';

export type PaymentMethod = 'cash_on_delivery' | 'racun';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type ProductType =
  | 'window_single'
  | 'window_double'
  | 'trokrilni_prozor'
  | 'fiksni_prozor'
  | 'door'
  | 'balkonska_vrata'
  | 'klizna_vrata'
  | 'plisirani_komarnik';

export type Material = 'PVC' | 'ALU';

export type GlassType =
  | 'dvoslojno'
  | 'dvoslojno_niskoemisiono'
  | 'dvoslojno_peskirano'
  | 'niskoemisiono'
  | '4_godisnja_doba'
  | 'peskirano';

export type OkovType = 'agb' | 'schuco';

export type KomarnikType = 'none' | 'plisirani' | 'rolo' | 'fiksni';

export type ColorType = 'white' | 'anthracite' | 'wood';

export interface CartItem {
  id: string;
  type: ProductType;
  material: Material;
  width: number;
  height: number;
  quantity: number;
  glassType: GlassType;
  okovType: OkovType;
  color: ColorType;
  komarnikType: KomarnikType;
  hasRoletna: boolean;
  hasOkapnica: boolean;
  hasInstallation: boolean;
  hasSillInside: boolean;
  itemNotes: string;
  imageDataUrl?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
}

export interface DimensionsData {
  type: ProductType;
  material: Material;
  width: number;
  height: number;
  quantity: number;
  glassType?: GlassType;
  okovType?: OkovType;
  color?: ColorType;
  komarnikType?: KomarnikType;
  hasRoletna?: boolean;
  hasOkapnica?: boolean;
  hasInstallation?: boolean;
  hasSillInside?: boolean;
  notes?: string;
  imageDataUrl?: string;
  image_url?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  type: ProductType;
  material: Material;
  width: number;
  height: number;
  quantity: number;
  dimensions_data?: DimensionsData;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  email?: string;
  location: OrderLocation;
  town?: string;
  address?: string;
  status: OrderStatus;
  total_price: number;
  payment_method: PaymentMethod;
  dimensions_data: DimensionsData;
  items?: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  status: TaskStatus;
  due_date?: string;
  order_id?: string;
  created_at: string;
  updated_at: string;
  users?: User;
}

export interface OrderItemData {
  dimensions_data: DimensionsData;
}

export interface OrderFormData {
  customer_name: string;
  phone: string;
  email: string;
  location: OrderLocation;
  town?: string;
  address?: string;
  payment_method: PaymentMethod;
  notes: string;
  total_price: number;
  items: OrderItemData[];
}

export interface DashboardMetrics {
  total_revenue: number;
  active_orders: number;
  tasks_pending: number;
  orders_this_month: number;
}

export interface FinanceSummary {
  totalRevenue: number;
  pendingRevenue: number;
  materialCost: number;
  grossProfit: number;
  marginPercent: number;
  deliveredCount: number;
  cancelledValue: number;
  totalOrdersCount: number;
}

export interface FinanceMonthlyPoint {
  month: string;
  yearMonth: string;
  revenue: number;
  cost: number;
  orders: number;
}

export interface FinanceItemStat {
  units: number;
  calcRevenue: number;
  cost: number;
}

export interface FinanceCountStat {
  count: number;
  revenue: number;
}

export interface FinanceData {
  summary: FinanceSummary;
  byStatus: Record<string, FinanceCountStat>;
  byProductType: Record<string, FinanceItemStat>;
  byMaterial: Record<string, FinanceItemStat>;
  byPaymentMethod: Record<string, FinanceCountStat>;
  byLocation: Record<string, FinanceCountStat>;
  monthlyTrend: FinanceMonthlyPoint[];
}
