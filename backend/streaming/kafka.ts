// ── Kafka/Redpanda Event Streaming ─────────────────────────────────────────────────
// This provides a scalable event streaming architecture using Kafka or Redpanda

import { Kafka, Consumer, Producer, KafkaConfig } from 'kafkajs';

export interface StreamConfig {
  brokers: string[];
  clientId: string;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  ssl?: boolean;
}

export interface StreamMessage {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
  timestamp?: Date;
}

// Stream topics
export const STREAM_TOPICS = {
  TRACKING_EVENTS: 'tracking-events',
  RISK_EVENTS: 'risk-events',
  AUDIT_EVENTS: 'audit-events',
  NOTIFICATIONS: 'notifications',
  ANALYTICS_EVENTS: 'analytics-events',
  AI_EVENTS: 'ai-events',
  DEVICE_EVENTS: 'device-events',
  SIM_EVENTS: 'sim-events',
  LOCATION_EVENTS: 'location-events',
  ALERT_EVENTS: 'alert-events',
} as const;

class StreamManager {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private config: StreamConfig;

  constructor(config: StreamConfig) {
    this.config = config;
  }

  // Initialize Kafka/Redpanda connection
  async connect(): Promise<void> {
    const kafkaConfig: KafkaConfig = {
      clientId: this.config.clientId,
      brokers: this.config.brokers,
    };

    if (this.config.sasl) {
      kafkaConfig.sasl = this.config.sasl;
    }

    if (this.config.ssl) {
      kafkaConfig.ssl = true;
    }

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();

    await this.producer.connect();
  }

  // Disconnect from Kafka/Redpanda
  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }

    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }

    this.consumers.clear();
  }

  // Create topics
  async createTopics(topics: string[]): Promise<void> {
    if (!this.kafka) throw new Error('Kafka not connected');

    const admin = this.kafka.admin();
    await admin.connect();

    await admin.createTopics({
      topics: topics.map(topic => ({
        topic,
        numPartitions: 3,
        replicationFactor: 2,
      })),
    });

    await admin.disconnect();
  }

  // Publish message to stream
  async publish(message: StreamMessage): Promise<void> {
    if (!this.producer) throw new Error('Producer not connected');

    await this.producer.send({
      topic: message.topic,
      key: message.key,
      value: JSON.stringify(message.value),
      headers: message.headers,
      timestamp: message.timestamp ? message.timestamp.getTime() : Date.now(),
    });
  }

  // Publish batch of messages
  async publishBatch(messages: StreamMessage[]): Promise<void> {
    if (!this.producer) throw new Error('Producer not connected');

    const batch = messages.map(msg => ({
      topic: msg.topic,
      key: msg.key,
      value: JSON.stringify(msg.value),
      headers: msg.headers,
      timestamp: msg.timestamp ? msg.timestamp.getTime() : Date.now(),
    }));

    await this.producer.sendBatch({
      topicMessages: batch.reduce((acc, msg) => {
        if (!acc[msg.topic]) acc[msg.topic] = [];
        acc[msg.topic].push(msg);
        return acc;
      }, {} as Record<string, any[]>),
    });
  }

  // Subscribe to topic
  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: any) => void | Promise<void>
  ): Promise<void> {
    if (!this.kafka) throw new Error('Kafka not connected');

    const consumer = this.kafka.consumer({ groupId: groupId });
    await consumer.connect();
    await consumer.subscribe({ topic });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = JSON.parse(message.value?.toString() || '{}');
          await handler({
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value,
            headers: message.headers,
            timestamp: new Date(message.timestamp || Date.now()),
          });
        } catch (error) {
          console.error(`[Stream] Error processing message:`, error);
        }
      },
    });

    this.consumers.set(`${topic}:${groupId}`, consumer);
  }

  // Unsubscribe from topic
  async unsubscribe(topic: string, groupId: string): Promise<void> {
    const consumer = this.consumers.get(`${topic}:${groupId}`);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(`${topic}:${groupId}`);
    }
  }

  // Get consumer group lag
  async getConsumerLag(groupId: string): Promise<Record<string, number>> {
    if (!this.kafka) throw new Error('Kafka not connected');

    const admin = this.kafka.admin();
    await admin.connect();

    const topics = Object.values(STREAM_TOPICS);
    const lag: Record<string, number> = {};

    for (const topic of topics) {
      try {
        const offsets = await admin.fetchTopicOffsets(topic);
        const consumerOffsets = await admin.fetchOffsets({
          groupId,
          topics: [{ topic }],
        });

        for (const offset of offsets) {
          const consumerOffset = consumerOffsets.find(
            o => o.partition === offset.partition
          );
          if (consumerOffset) {
            lag[`${topic}:${offset.partition}`] =
              offset.offset - consumerOffset.offset;
          }
        }
      } catch (error) {
        console.error(`[Stream] Error fetching lag for ${topic}:`, error);
      }
    }

    await admin.disconnect();
    return lag;
  }

  // Get topic metadata
  async getTopicMetadata(topic: string): Promise<any> {
    if (!this.kafka) throw new Error('Kafka not connected');

    const admin = this.kafka.admin();
    await admin.connect();

    const metadata = await admin.fetchTopicMetadata({ topics: [topic] });

    await admin.disconnect();
    return metadata;
  }
}

// Singleton instance
let streamManager: StreamManager | null = null;

export function getStreamManager(config?: StreamConfig): StreamManager {
  if (!streamManager) {
    if (!config) {
      throw new Error('StreamManager config required for first initialization');
    }
    streamManager = new StreamManager(config);
  }
  return streamManager;
}

// ── Convenience Functions ───────────────────────────────────────────────────────
export async function publishTrackingEvent(data: any, key?: string): Promise<void> {
  const manager = getStreamManager();
  await manager.publish({
    topic: STREAM_TOPICS.TRACKING_EVENTS,
    key: key || data.imei,
    value: data,
  });
}

export async function publishRiskEvent(data: any, key?: string): Promise<void> {
  const manager = getStreamManager();
  await manager.publish({
    topic: STREAM_TOPICS.RISK_EVENTS,
    key: key || data.imei,
    value: data,
  });
}

export async function publishAuditEvent(data: any, key?: string): Promise<void> {
  const manager = getStreamManager();
  await manager.publish({
    topic: STREAM_TOPICS.AUDIT_EVENTS,
    key: key || data.userId,
    value: data,
  });
}

export async function publishNotification(data: any, key?: string): Promise<void> {
  const manager = getStreamManager();
  await manager.publish({
    topic: STREAM_TOPICS.NOTIFICATIONS,
    key: key || data.userId,
    value: data,
  });
}

export async function publishAnalyticsEvent(data: any, key?: string): Promise<void> {
  const manager = getStreamManager();
  await manager.publish({
    topic: STREAM_TOPICS.ANALYTICS_EVENTS,
    key: key || data.type,
    value: data,
  });
}

export async function publishAIEvent(data: any, key?: string): Promise<void> {
  const manager = getStreamManager();
  await manager.publish({
    topic: STREAM_TOPICS.AI_EVENTS,
    key: key || data.type,
    value: data,
  });
}
