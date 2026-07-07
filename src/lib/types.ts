export type DashboardStats = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenue: number;
  readyOrders: number;
  todayRevenue: number;
};

export type ServiceType =
  | "wash"
  | "iron"
  | "dry-clean";

export type PaymentStatus =
  | "paid"
  | "unpaid"
  | "partial";

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "delivered";

export type OrderForm = {
  branchId: string;
  branchCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail: string;
  dressCode: string;
  dressDescription: string;
  quantity: number;
  price: number;
  paymentMethod: "cash" | "card" | "online";
  deliveryDate: string;
  notes: string;

  serviceType?: ServiceType;
  paymentStatus?: PaymentStatus;
};

export type Customer = {
  name: string;
  phone: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  customerId: Customer | string;
  serviceType: ServiceType;
  price: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
};

export type Branch = {
  _id: string;
  name: string;
  code: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};