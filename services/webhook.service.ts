export type WebhookEventType =
  | "CASE_CREATED"
  | "CASE_UPDATED"
  | "DEVICE_ALERT"
  | "RISK_ALERT"
  | "REPORT_READY"
  | "USER_ACTIVITY";

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  status: "ACTIVE" | "PAUSED" | "DISABLED";
  createdAt: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  webhookId: string;
  organizationId: string;
  event: WebhookEventType;
  payload: Record<string, any>;
  statusCode: number;
  attempts: number;
  signature: string;
  status: "SUCCESS" | "FAILED" | "RETRYING";
  createdAt: string;
}

const WEBHOOKS_STORE: WebhookSubscription[] = [
  {
    id: "wh-1",
    organizationId: "org-police-01",
    url: "https://siem.nps.go.ke/api/v1/simtrace-ingest",
    secret: "whsec_live_98a7b6c5d4e3f2a1",
    events: ["DEVICE_ALERT", "RISK_ALERT", "CASE_CREATED"],
    status: "ACTIVE",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

const DELIVERIES_STORE: WebhookDeliveryRecord[] = [
  {
    id: "del-101",
    webhookId: "wh-1",
    organizationId: "org-police-01",
    event: "DEVICE_ALERT",
    payload: { imei: "864209123456789", alertType: "SIM_SWAP_SUSPECTED", riskScore: 92 },
    statusCode: 200,
    attempts: 1,
    signature: "sha256=4f89d3a2...",
    status: "SUCCESS",
    createdAt: "2026-08-01T01:30:00Z",
  },
];

export class WebhookService {
  public static getWebhooks(organizationId: string): WebhookSubscription[] {
    return WEBHOOKS_STORE.filter((w) => w.organizationId === organizationId);
  }

  public static createWebhook(
    organizationId: string,
    url: string,
    events: WebhookEventType[]
  ): WebhookSubscription {
    const secret = `whsec_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const sub: WebhookSubscription = {
      id: `wh-${Date.now()}`,
      organizationId,
      url,
      secret,
      events,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    WEBHOOKS_STORE.push(sub);
    return sub;
  }

  public static deleteWebhook(id: string): boolean {
    const idx = WEBHOOKS_STORE.findIndex((w) => w.id === id);
    if (idx !== -1) {
      WEBHOOKS_STORE.splice(idx, 1);
      return true;
    }
    return false;
  }

  public static triggerEvent(
    organizationId: string,
    event: WebhookEventType,
    payload: Record<string, any>
  ): WebhookDeliveryRecord[] {
    const matchingWebhooks = WEBHOOKS_STORE.filter(
      (w) => w.organizationId === organizationId && w.status === "ACTIVE" && w.events.includes(event)
    );

    const createdDeliveries: WebhookDeliveryRecord[] = [];

    for (const wh of matchingWebhooks) {
      const delivery: WebhookDeliveryRecord = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        webhookId: wh.id,
        organizationId,
        event,
        payload,
        statusCode: 200, // Simulated successful endpoint delivery
        attempts: 1,
        signature: `sha256_sig_${Date.now()}`,
        status: "SUCCESS",
        createdAt: new Date().toISOString(),
      };
      DELIVERIES_STORE.unshift(delivery);
      createdDeliveries.push(delivery);
    }

    return createdDeliveries;
  }

  public static getDeliveries(organizationId: string): WebhookDeliveryRecord[] {
    return DELIVERIES_STORE.filter((d) => d.organizationId === organizationId);
  }
}
