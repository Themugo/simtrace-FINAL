// ── Advanced AI Investigation Graph ───────────────────────────────────────────────────
// Neo4j-based relationship intelligence for fraud detection and investigation

import neo4j from 'neo4j-driver';

export interface GraphConfig {
  uri: string;
  username: string;
  password: string;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, any>;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

class InvestigationGraph {
  private driver: any;
  private connected = false;

  constructor(config: GraphConfig) {
    this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
  }

  // Connect to Neo4j
  async connect(): Promise<void> {
    try {
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();
      this.connected = true;
    } catch (error) {
      console.error('[Graph] Connection error:', error);
      throw error;
    }
  }

  // Disconnect from Neo4j
  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
    }
  }

  // Create or update device node
  async upsertDevice(imei: string, properties: Record<string, any>): Promise<void> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (d:Device {imei: $imei})
        SET d += $properties
        SET d.lastUpdated = datetime()
        `,
        { imei, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Create or update SIM node
  async upsertSIM(iccid: string, properties: Record<string, any>): Promise<void> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (s:SIM {iccid: $iccid})
        SET s += $properties
        SET s.lastUpdated = datetime()
        `,
        { iccid, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Create or update user node
  async upsertUser(userId: string, properties: Record<string, any>): Promise<void> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (u:User {userId: $userId})
        SET u += $properties
        SET u.lastUpdated = datetime()
        `,
        { userId, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Create or update location node
  async upsertLocation(lat: number, lng: number, properties: Record<string, any>): Promise<void> {
    if (!this.connected) await this.connect();

    const locationId = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (l:Location {id: $locationId})
        SET l.lat = $lat
        SET l.lng = $lng
        SET l += $properties
        SET l.lastUpdated = datetime()
        `,
        { locationId, lat, lng, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Create device-SIM relationship
  async linkDeviceToSIM(imei: string, iccid: string, properties: Record<string, any> = {}): Promise<void> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (d:Device {imei: $imei})
        MATCH (s:SIM {iccid: $iccid})
        MERGE (d)-[r:USES_SIM]->(s)
        SET r += $properties
        SET r.lastUpdated = datetime()
        `,
        { imei, iccid, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Create device-user relationship
  async linkDeviceToUser(imei: string, userId: string, properties: Record<string, any> = {}): Promise<void> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (d:Device {imei: $imei})
        MATCH (u:User {userId: $userId})
        MERGE (u)-[r:OWNS]->(d)
        SET r += $properties
        SET r.lastUpdated = datetime()
        `,
        { imei, userId, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Create device-location relationship
  async linkDeviceToLocation(imei: string, lat: number, lng: number, properties: Record<string, any> = {}): Promise<void> {
    if (!this.connected) await this.connect();

    const locationId = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (d:Device {imei: $imei})
        MATCH (l:Location {id: $locationId})
        MERGE (d)-[r:VISITED]->(l)
        SET r += $properties
        SET r.lastUpdated = datetime()
        `,
        { imei, locationId, properties }
      );
    } finally {
      await session.close();
    }
  }

  // Find devices connected to SIM
  async findDevicesBySIM(iccid: string, months = 6): Promise<string[]> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (d:Device)-[r:USES_SIM]->(s:SIM {iccid: $iccid})
        WHERE r.lastUpdated >= datetime() - duration('P${months}M')
        RETURN d.imei AS imei
        `,
        { iccid }
      );

      return result.records.map((record: any) => record.get('imei'));
    } finally {
      await session.close();
    }
  }

  // Detect fraud rings (devices sharing SIMs or locations)
  async detectFraudRings(minDevices = 3): Promise<Array<{ devices: string[]; pattern: string }>> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      // Find devices sharing SIMs
      const simResult = await session.run(
        `
        MATCH (d1:Device)-[r1:USES_SIM]->(s:SIM)<-[r2:USES_SIM]-(d2:Device)
        WHERE d1.imei <> d2.imei
        WITH d1.imei AS imei1, d2.imei AS imei2, s.iccid AS iccid
        MATCH (d1)-[r3:USES_SIM]->(s2:SIM)<-[r4:USES_SIM]-(d3:Device)
        WHERE d3.imei <> imei1 AND d3.imei <> imei2
        RETURN DISTINCT [imei1, imei2, d3.imei] AS devices, 'SIM_SHARING' AS pattern
        LIMIT 100
        `
      );

      const rings: Array<{ devices: string[]; pattern: string }> = [];

      for (const record of simResult.records) {
        const devices = record.get('devices');
        if (devices.length >= minDevices) {
          rings.push({
            devices,
            pattern: record.get('pattern'),
          });
        }
      }

      return rings;
    } finally {
      await session.close();
    }
  }

  // Detect coordinated theft (devices moving together)
  async detectCoordinatedTheft(timeWindowHours = 24, distanceKm = 1): Promise<Array<{ devices: string[]; locations: any[] }>> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (d1:Device)-[r1:VISITED]->(l:Location)<-[r2:VISITED]-(d2:Device)
        WHERE d1.imei <> d2.imei
        AND r1.lastUpdated >= datetime() - duration('PT${timeWindowHours}H')
        AND r2.lastUpdated >= datetime() - duration('PT${timeWindowHours}H')
        WITH d1.imei AS imei1, d2.imei AS imei2, l
        MATCH (d1)-[r3:VISITED]->(l2:Location)<-[r4:VISITED]-(d2)
        WHERE r3.lastUpdated >= datetime() - duration('PT${timeWindowHours}H')
        AND r4.lastUpdated >= datetime() - duration('PT${timeWindowHours}H')
        AND point.distance(point({latitude: l.lat, longitude: l.lng}), point({latitude: l2.lat, longitude: l2.lng})) < $distanceKm
        RETURN DISTINCT [imei1, imei2] AS devices, collect(DISTINCT {lat: l.lat, lng: l.lng}) AS locations
        LIMIT 100
        `,
        { distanceKm }
      );

      return result.records.map((record: any) => ({
        devices: record.get('devices'),
        locations: record.get('locations'),
      }));
    } finally {
      await session.close();
    }
  }

  // Detect repeat offenders (users with multiple stolen devices)
  async detectRepeatOffenders(minDevices = 2): Promise<Array<{ userId: string; deviceCount: number; imeis: string[] }>> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User)-[r:OWNS]->(d:Device)
        WHERE d.status = 'stolen'
        WITH u.userId AS userId, count(d) AS deviceCount, collect(d.imei) AS imeis
        WHERE deviceCount >= $minDevices
        RETURN userId, deviceCount, imeis
        ORDER BY deviceCount DESC
        LIMIT 100
        `,
        { minDevices }
      );

      return result.records.map((record: any) => ({
        userId: record.get('userId'),
        deviceCount: record.get('deviceCount'),
        imeis: record.get('imeis'),
      }));
    } finally {
      await session.close();
    }
  }

  // Find suspicious relationships (short-lived device-SIM relationships)
  async findSuspiciousRelationships(maxDays = 7): Promise<Array<{ imei: string; iccid: string; duration: number }>> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (d:Device)-[r:USES_SIM]->(s:SIM)
        WHERE r.lastUpdated >= datetime() - duration('P${maxDays}D')
        WITH d.imei AS imei, s.iccid AS iccid, r.lastUpdated AS lastUpdated
        MATCH (d)-[r2:USES_SIM]->(s2:SIM)
        WHERE s2.iccid <> iccid
        AND r2.lastUpdated >= datetime() - duration('P${maxDays}D')
        RETURN imei, iccid, duration.between(lastUpdated, r2.lastUpdated).days AS duration
        ORDER BY duration ASC
        LIMIT 100
        `,
        { maxDays }
      );

      return result.records.map((record: any) => ({
        imei: record.get('imei'),
        iccid: record.get('iccid'),
        duration: record.get('duration'),
      }));
    } finally {
      await session.close();
    }
  }

  // Get device graph (all connected entities)
  async getDeviceGraph(imei: string, depth = 2): Promise<GraphQueryResult> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (d:Device {imei: $imei})-[r*1..${depth}]-(connected)
        RETURN d, r, connected
        `,
        { imei }
      );

      const nodes: Map<string, GraphNode> = new Map();
      const relationships: GraphRelationship[] = [];

      for (const record of result.records) {
        const device = record.get('d');
        const connected = record.get('connected');
        const rels = record.get('r');

        // Add device node
        if (!nodes.has(device.identity)) {
          nodes.set(device.identity, {
            id: device.identity,
            labels: device.labels,
            properties: device.properties,
          });
        }

        // Add connected node
        if (!nodes.has(connected.identity)) {
          nodes.set(connected.identity, {
            id: connected.identity,
            labels: connected.labels,
            properties: connected.properties,
          });
        }

        // Add relationships
        for (const rel of rels) {
          relationships.push({
            id: rel.identity,
            type: rel.type,
            startNode: rel.start,
            endNode: rel.end,
            properties: rel.properties,
          });
        }
      }

      return {
        nodes: Array.from(nodes.values()),
        relationships,
      };
    } finally {
      await session.close();
    }
  }

  // Execute custom Cypher query
  async executeQuery(cypher: string, params: Record<string, any> = {}): Promise<any[]> {
    if (!this.connected) await this.connect();

    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map((record: any) => record.toObject());
    } finally {
      await session.close();
    }
  }
}

// Singleton instance
let investigationGraph: InvestigationGraph | null = null;

export function getInvestigationGraph(config?: GraphConfig): InvestigationGraph {
  if (!investigationGraph) {
    if (!config) {
      throw new Error('InvestigationGraph config required for first initialization');
    }
    investigationGraph = new InvestigationGraph(config);
  }
  return investigationGraph;
}

// ── Convenience Functions ───────────────────────────────────────────────────────
export async function addDeviceToGraph(imei: string, properties: Record<string, any>): Promise<void> {
  const graph = getInvestigationGraph();
  await graph.upsertDevice(imei, properties);
}

export async function addSIMToGraph(iccid: string, properties: Record<string, any>): Promise<void> {
  const graph = getInvestigationGraph();
  await graph.upsertSIM(iccid, properties);
}

export async function linkDeviceSIM(imei: string, iccid: string): Promise<void> {
  const graph = getInvestigationGraph();
  await graph.linkDeviceToSIM(imei, iccid);
}

export async function findConnectedDevices(imei: string, months = 6): Promise<string[]> {
  // First get the SIM for this device
  const graph = getInvestigationGraph();
  const session = graph['driver'].session();
  const result = await session.run(
    'MATCH (d:Device {imei: $imei})-[r:USES_SIM]->(s:SIM) RETURN s.iccid AS iccid',
    { imei }
  );
  await session.close();

  if (result.records.length === 0) return [];

  const iccid = result.records[0].get('iccid');
  return graph.findDevicesBySIM(iccid, months);
}
