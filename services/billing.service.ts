export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "OVERDUE";
export type PaymentGateway = "STRIPE" | "MPESA" | "BANK_WIRE" | "ENTERPRISE_INVOICE";

export interface InvoiceRecord {
  id: string;
  organizationId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  issuedDate: string;
  dueDate: string;
  pdfUrl: string;
  lineItems: Array<{ description: string; amount: number }>;
}

const INVOICE_STORE: InvoiceRecord[] = [
  {
    id: "inv-2026-001",
    organizationId: "org-police-01",
    subscriptionId: "sub-101",
    amount: 99990,
    currency: "USD",
    status: "PAID",
    gateway: "ENTERPRISE_INVOICE",
    issuedDate: "2026-01-01T00:00:00Z",
    dueDate: "2026-01-31T23:59:59Z",
    pdfUrl: "/api/billing/invoices/inv-2026-001/download",
    lineItems: [
      { description: "SimTrace Enterprise SaaS Platform Annual Plan (2026)", amount: 99990 },
    ],
  },
  {
    id: "inv-2026-002",
    organizationId: "org-police-01",
    subscriptionId: "sub-101",
    amount: 1450,
    currency: "USD",
    status: "PAID",
    gateway: "MPESA",
    issuedDate: "2026-07-01T00:00:00Z",
    dueDate: "2026-07-15T23:59:59Z",
    pdfUrl: "/api/billing/invoices/inv-2026-002/download",
    lineItems: [
      { description: "Overage: Additional High-Frequency Telemetry Ingestion API Requests", amount: 1450 },
    ],
  },
];

export class BillingService {
  /**
   * Generates a new commercial invoice for an organization subscription.
   */
  public static createInvoice(params: {
    organizationId: string;
    subscriptionId: string;
    amount: number;
    currency?: string;
    gateway: PaymentGateway;
    lineItems: Array<{ description: string; amount: number }>;
  }): InvoiceRecord {
    const invId = `inv-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const invoice: InvoiceRecord = {
      id: invId,
      organizationId: params.organizationId,
      subscriptionId: params.subscriptionId,
      amount: params.amount,
      currency: params.currency || "USD",
      status: "PENDING",
      gateway: params.gateway,
      issuedDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      pdfUrl: `/api/billing/invoices/${invId}/download`,
      lineItems: params.lineItems,
    };

    INVOICE_STORE.push(invoice);
    return invoice;
  }

  /**
   * Processes simulated payment across gateways (Stripe, M-Pesa, Wire, Invoice).
   */
  public static async processPayment(
    invoiceId: string,
    gateway: PaymentGateway,
    paymentMetadata?: { mpesaPhone?: string; stripeToken?: string; bankRef?: string }
  ): Promise<{ success: boolean; invoice: InvoiceRecord; transactionId: string }> {
    const invoice = INVOICE_STORE.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    // Simulate network settlement delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    invoice.status = "PAID";
    invoice.gateway = gateway;

    const transactionId = `tx_${gateway.toLowerCase()}_${Date.now()}`;
    return { success: true, invoice, transactionId };
  }

  public static getInvoices(organizationId: string): InvoiceRecord[] {
    return INVOICE_STORE.filter((i) => i.organizationId === organizationId);
  }

  public static getInvoiceById(id: string): InvoiceRecord | undefined {
    return INVOICE_STORE.find((i) => i.id === id);
  }
}
