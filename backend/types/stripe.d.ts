declare module 'stripe' {
  class Stripe {
    constructor(secretKey: string, options?: Record<string, unknown>);
    paymentIntents: {
      create(params: Record<string, unknown>): Promise<{
        id: string;
        client_secret: string | null;
        status: string;
        [key: string]: unknown;
      }>;
    };
    customers: {
      create(params: Record<string, unknown>): Promise<{ id: string; [key: string]: unknown }>;
      update(id: string, params: Record<string, unknown>): Promise<{ id: string; [key: string]: unknown }>;
    };
    paymentMethods: {
      attach(id: string, params: Record<string, unknown>): Promise<{ id: string; card?: { last4?: string; brand?: string; exp_month?: number; exp_year?: number; [key: string]: unknown }; [key: string]: unknown }>;
      list(params: Record<string, unknown>): Promise<{ data: Record<string, unknown>[] }>;
      detach(id: string): Promise<Record<string, unknown>>;
      update(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
    refunds: {
      create(params: Record<string, unknown>): Promise<{ id: string; [key: string]: unknown }>;
    };
    webhooks: {
      constructEvent(payload: unknown, sig: unknown, secret: string): Record<string, unknown>;
    };
  }
  export default Stripe;
}