/**
 * Mayar.id API V2 Client
 * Base URL: https://api.mayar.id/hl/v2
 * Docs: https://docs.mayar.id
 */

// ─── Mayar API Types ──────────────────────────────────────────

export interface MayarInvoiceCreatePayload {
  name: string;          // Customer name
  email: string;         // Customer email
  phone?: string;        // Customer phone
  amount: number;        // Amount in IDR (integer)
  description?: string;  // Invoice description
  expiredAt?: string;    // ISO date string
  redirectUrl?: string;  // Redirect after payment
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
    options: RequestInit = {}
  ): Promise<MayarApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Mayar API Error [${response.status}]: ${errorBody}`
      );
    }

    return response.json() as Promise<MayarApiResponse<T>>;
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

  async searchCustomerByEmail(email: string) {
    return this.request<MayarCustomerData>(
      `/customers/search?email=${encodeURIComponent(email)}`
    );
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
    return this.request<unknown>("/transactions/daily");
  }

  // ─── Balance ──────────────────────────────────────────────

  async getAccountBalance() {
    return this.request<MayarBalanceData>("/balance");
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
    return this.request<unknown>("/statistics");
  }
}

// Export singleton instance
export const mayarClient = new MayarClient();
