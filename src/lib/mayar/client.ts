/**
 * Mayar.id API V2 Client
 * Base URL: https://api.mayar.id/hl/v2
 * Docs: https://docs.mayar.id
 */

// ─── Mayar API Types ──────────────────────────────────────────

export interface MayarInvoiceCreatePayload {
  name: string;          // Customer name
  email: string;         // Customer email
  mobile?: string;       // Customer phone
  description?: string;  // Invoice description
  items: Array<{
    quantity: number;
    rate: number;
    description: string;
  }>;
  redirectUrl?: string; // Menambahkan redirectUrl
}

export interface MayarPaymentRequestPayload {
  name: string;
  email: string;
  phone?: string;
  amount: number;
  description?: string;
  redirectUrl?: string;
}

export interface MayarCustomerPayload {
  name: string;
  email: string;
  mobile?: string;
}

export interface MayarProductPayload {
  name: string;
  amount: number;
  description?: string;
  category?: string;
  redirectUrl?: string;
  limit?: number;
}

export interface MayarApiResponse<T = unknown> {
  statusCode: number;
  messages: string;
  data: T;
}

export interface MayarInvoiceData {
  id: string;
  link: string;
  status: string;
  amount: number;
  description: string;
  expiredAt: string;
  createdAt: string;
  transaction: MayarTransactionData | null;
}

export interface MayarTransactionData {
  id: string;
  status: string;
  amount: number;
  paymentMethod: string;
  paymentChannel: string;
  paidAt: string;
}

export interface MayarCustomerData {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export interface MayarBalanceData {
  activeBalance: number;
  pendingBalance: number;
}

export interface MayarWebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    paymentMethod: string;
    paymentChannel: string;
    paidAt: string;
    productName: string;
    productId: string;
    [key: string]: unknown;
  };
}

export interface MayarDailyTransactionData {
  date: string;
  totalAmount: number;
  count: number;
}

export interface MayarStatisticsData {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  activeSubscriptions: number;
}

export interface MayarCouponValidationData {
  isValid: boolean;
  discountAmount: number;
  finalAmount: number;
}

// ─── Mayar Client Class ───────────────────────────────────────

class MayarClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const isSandbox = process.env.MAYAR_USE_SANDBOX === "true";
    this.baseUrl = isSandbox
      ? (process.env.MAYAR_SANDBOX_URL || "https://api.mayar.club/hl/v2")
      : (process.env.MAYAR_API_BASE_URL || "https://api.mayar.id/hl/v2");
    this.apiKey = process.env.MAYAR_API_KEY || "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<MayarApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeoutMs = 30_000; // 30 seconds

    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            ...options.headers,
          },
        });
        
        const duration = Date.now() - startTime;
        console.log(`[MayarClient] ${options.method || 'GET'} ${endpoint} - ${response.status} (${duration}ms)`);

        if (!response.ok) {
          const errorBody = await response.text();
          // Don't retry on client errors (4xx), only on server errors (5xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(
              `Mayar API Error [${response.status}]: ${errorBody}`
            );
          }
          // Server error — retry if attempts remaining
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10_000);
            console.warn(
              `[MayarClient] Server error ${response.status} on ${endpoint}, retry ${attempt}/${retries} in ${delay}ms`
            );
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new Error(
            `Mayar API Error [${response.status}] after ${retries} attempts: ${errorBody}`
          );
        }

        return response.json() as Promise<MayarApiResponse<T>>;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10_000);
            console.warn(
              `[MayarClient] Timeout on ${endpoint}, retry ${attempt}/${retries} in ${delay}ms`
            );
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new Error(
            `Mayar API Timeout on ${endpoint} after ${retries} attempts`
          );
        }
        // Non-retryable errors (e.g., 4xx already thrown above)
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    // Should never reach here, but TypeScript needs this
    throw new Error(`Mayar API: Unexpected exit from retry loop on ${endpoint}`);
  }

  // ─── Invoice ──────────────────────────────────────────────

  async createInvoice(payload: MayarInvoiceCreatePayload) {
    return this.request<MayarInvoiceData>("/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getInvoice(invoiceId: string) {
    return this.request<MayarInvoiceData>(`/invoices/${invoiceId}`);
  }

  async getInvoices(page: number = 1) {
    return this.request<MayarInvoiceData[]>(`/invoices?page=${page}`);
  }

  async editInvoice(invoiceId: string, payload: Partial<MayarInvoiceCreatePayload>) {
    return this.request<MayarInvoiceData>(`/invoices/${invoiceId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async cancelInvoice(invoiceId: string) {
    return this.request<{ success: boolean; message: string }>(`/invoices/${invoiceId}/cancel`, {
      method: "POST",
    });
  }

  // ─── Payment Request ─────────────────────────────────────

  async createPaymentRequest(payload: MayarPaymentRequestPayload) {
    return this.request<MayarInvoiceData>("/reqpayment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPaymentRequest(id: string) {
    return this.request<MayarInvoiceData>(`/reqpayment/${id}`);
  }

  // ─── Customer ─────────────────────────────────────────────

  async createCustomer(payload: MayarCustomerPayload) {
    return this.request<MayarCustomerData>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ─── Products ─────────────────────────────────────────────

  async createPaymentLinkProduct(payload: MayarProductPayload) {
    return this.request<{ id: string; link: string; name: string }>("/products/payment-link", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateProduct(productId: string, payload: Partial<MayarProductPayload>) {
    return this.request<{ id: string }>("/products/" + productId, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async searchCustomerByEmail(email: string) {
    return this.request<MayarCustomerData>(
      `/customers/search?email=${encodeURIComponent(email)}`
    );
  }

  async sendPortalLink(email: string) {
    return this.request<{ success: boolean; message: string }>("/customers/send-portal-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // ─── Transactions ─────────────────────────────────────────

  async getPaidTransactions(page: number = 1) {
    return this.request<MayarTransactionData[]>(
      `/transactions/paid?page=${page}`
    );
  }

  async getUnpaidTransactions(page: number = 1) {
    return this.request<MayarTransactionData[]>(
      `/transactions/unpaid?page=${page}`
    );
  }

  async getTransactionDetail(transactionId: string) {
    return this.request<MayarTransactionData>(
      `/transactions/${transactionId}`
    );
  }

  async getDailyTransactions() {
    return this.request<MayarDailyTransactionData[]>("/transactions/daily");
  }

  // ─── QR Code ──────────────────────────────────────────────

  async createDynamicQR(amount: number) {
    return this.request<{ qrCode: string }>("/qrcode/dynamic", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async getStaticQR() {
    return this.request<{ qrCode: string }>("/qrcode/static");
  }

  // ─── Statistics ───────────────────────────────────────────

  async getStatistics() {
    return this.request<MayarStatisticsData>("/statistics");
  }

  // ─── Account / Balance ──────────────────────────────────────

  async getBalance() {
    return this.request<MayarBalanceData>("/balance");
  }

  // ─── Coupons ──────────────────────────────────────────────

  async validateCoupon(payload: { couponCode: string; paymentLinkId: string; amount: number; membershipTierId?: string }) {
    return this.request<MayarCouponValidationData>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}

// Export singleton instance
export const mayarClient = new MayarClient();
