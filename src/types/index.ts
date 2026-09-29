// ============================================================
// Billing Types
// ============================================================

export type ClientType = "government" | "private" | "individual";
export type BillingStatus = "draft" | "issued" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled" | "refunded";
export type TaxType = "ppn" | "pph21" | "pph23" | "pph4_2" | "retribusi" | "custom";

export interface TaxDetail {
  type: TaxType;
  name: string;
  percentage: number;
  amount: number;
  isInclusive: boolean;
}

export interface Billing {
  id: string;
  billingNumber: string;
  clientId: string;
  catalogItemId: string;
  catalogItemName: string;
  accessCode: string;

  // Client info snapshot
  clientName: string;
  clientEmail: string;
  clientType: ClientType;
  clientOrganization: string;

  // Amounts
  subtotal: number;
  taxDetails: TaxDetail[];
  taxTotal: number;
  grandTotal: number;
  currency: string;

  // Mayar Integration
  mayarInvoiceId: string | null;
  mayarPaymentUrl: string | null;
  mayarStatus: string;

  // Payment info (diisi dari webhook)
  paymentMethod: string | null;
  paymentChannel: string | null;

  // Status
  status: BillingStatus;

  // Installment support
  installments?: {
    term: number;
    amount: number;
    dueDate: string;
    status: "pending" | "paid";
    mayarInvoiceId?: string;
    paidAt?: string;
  }[];

  // Dates
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;

  // Meta
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Catalog Types
// ============================================================

export type BillingType = "one_time" | "recurring" | "installment";

export interface TaxAllocationRule {
  taxType: TaxType;
  name: string;
  percentage: number;
  isInclusive: boolean;
  appliesTo: ClientType | "all";
  description: string;
}

export interface TaxConfig {
  isEnabled: boolean;
  allocations: TaxAllocationRule[];
}

export interface Catalog {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  isActive: boolean;
  itemCount: number;
  price?: number;
  basePrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  catalogId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mayarProductId: string | null;
  mayarPaymentLink: string | null;
  billingType: BillingType;
  taxConfig: TaxConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Client Types
// ============================================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ClientType;
  organization: string;
  npwp: string;
  address: string;
  mayarCustomerId: string | null;
  totalBillings: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Subscription Types
// ============================================================

export type SubscriptionCycle = "monthly" | "quarterly" | "yearly";

export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  catalogItemId: string;
  catalogItemName: string;
  amount: number;
  currency: string;
  cycle: SubscriptionCycle;
  status: "active" | "paused" | "cancelled";
  nextBillingDate: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Payment Types
// ============================================================

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";

export interface Payment {
  id: string;
  billingId: string;
  billingNumber: string;
  mayarTransactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentChannel: string;
  paidAt: string;
  rawWebhookData: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// Access Code Types
// ============================================================

export interface AccessCode {
  code: string;
  billingId: string;
  isUsed: boolean;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

// ============================================================
// Coupon Types
// ============================================================

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  appliesTo: "all" | string[];
  status: "active" | "inactive";
  createdAt: string;
}

// ============================================================
// Invoice/Receipt Types
// ============================================================

export type InvoiceType = "invoice" | "receipt" | "proforma";

export interface Invoice {
  id: string;
  billingId: string;
  invoiceNumber: string;
  type: InvoiceType;
  pdfUrl: string | null;
  generatedAt: string;
}

// ============================================================
// Tax Allocation
// ============================================================

export interface TaxAllocation {
  id: string;
  paymentId: string;
  billingId: string;
  taxType: TaxType;
  name: string;
  percentage: number;
  amount: number;
  description: string;
  period: string; // "2026-09" format
  createdAt: string;
}

export interface TaxHistoryItem {
  id: string;
  billingNumber: string;
  clientName: string;
  taxName: string;
  amount: number;
  date: string;
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeBillings: number;
  paidThisMonth: number;
  overdueCount: number;
  totalClients: number;
}

export interface DashboardRecentTransaction {
  id: string;
  client: string;
  amount: number;
  status: string;
  date: string;
  product: string;
  rawDate: number;
}

export interface DashboardCatalogBreakdown {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DashboardStat {
  label: string;
  value: number;
  change: string;
  trend: string;
}

export interface DashboardRevenueChart {
  name: string;
  total: number;
}

// ============================================================
// Admin Types
// ============================================================

export type AdminRole = "super_admin" | "admin" | "viewer";

export interface Admin {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  photoURL: string | null;
  createdAt: string;
}
