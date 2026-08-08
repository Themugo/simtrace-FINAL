export interface NetworkTelemetry {
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  protectedDevices: string;
  activeProtection: string;
  openIncidents: number;
  recoveryCases: number;
  networkPartners: number;
  lastSync: string;
}

export interface ActivityEvent {
  id: string;
  type: 'VERIFIED' | 'SIM_SWAP' | 'RECOVERY' | 'RISK_SIGNAL' | 'LOCKDOWN';
  title: string;
  location: string;
  timestamp: string;
  details?: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SYNCING' | 'MAINTENANCE';
  coordinates: { x: number; y: number };
  activeConnections: number;
}

export const CENTRAL_NETWORK_DATA = {
  telemetry: {
    status: 'OPERATIONAL',
    protectedDevices: '12,482,910',
    activeProtection: '9,840,120',
    openIncidents: 14,
    recoveryCases: 42,
    networkPartners: 87,
    lastSync: '2 sec ago',
  } as NetworkTelemetry,

  activityFeed: [
    {
      id: 'evt-1',
      type: 'VERIFIED',
      title: 'Device #4821 verified clean',
      location: 'Nairobi Core Node',
      timestamp: '2 sec ago',
      details: 'GSMA & CEIR clean. Ownership signal valid.',
    },
    {
      id: 'evt-2',
      type: 'SIM_SWAP',
      title: 'SIM Swap Anomaly Detected',
      location: 'Mombasa Coastal Switch',
      timestamp: '12 sec ago',
      details: 'IMSI mismatch flagged. Automated lockdown offered.',
    },
    {
      id: 'evt-3',
      type: 'RECOVERY',
      title: 'Recovery Case #STM-982 Updated',
      location: 'Kampala Relay Station',
      timestamp: '1 min ago',
      details: 'Authorized field unit dispatched to coordinate handover.',
    },
    {
      id: 'evt-4',
      type: 'RISK_SIGNAL',
      title: 'Hardware Clone Signature Flagged',
      location: 'Dar es Salaam Gateway',
      timestamp: '3 min ago',
      details: 'Duplicate IMEI attempt rejected at trade-in terminal.',
    },
    {
      id: 'evt-5',
      type: 'LOCKDOWN',
      title: 'Remote Lockdown Engaged',
      location: 'Eldoret Cell Sector 4',
      timestamp: '5 min ago',
      details: 'Screen locked, memory encrypted, evidence vault active.',
    },
  ] as ActivityEvent[],

  networkNodes: [
    { id: 'nbo', name: 'Nairobi Central Core', status: 'ACTIVE', coordinates: { x: 50, y: 35 }, activeConnections: 1240 },
    { id: 'mba', name: 'Mombasa Coastal Relay', status: 'ACTIVE', coordinates: { x: 75, y: 55 }, activeConnections: 620 },
    { id: 'kmp', name: 'Kampala Hub', status: 'ACTIVE', coordinates: { x: 25, y: 30 }, activeConnections: 890 },
    { id: 'dar', name: 'Dar es Salaam Gateway', status: 'SYNCING', coordinates: { x: 68, y: 80 }, activeConnections: 450 },
    { id: 'kgl', name: 'Kigali Border Switch', status: 'ACTIVE', coordinates: { x: 20, y: 50 }, activeConnections: 310 },
  ] as NetworkNode[],

  quickCommands: [
    { id: 'verify', title: 'VERIFY DEVICE', subtitle: 'Identity, GSMA blacklist & risk score', keyHint: '⌘V', route: '/imei' },
    { id: 'report', title: 'REPORT STOLEN', subtitle: 'Trigger network alert & lockdown', keyHint: '⌘R', route: '/report' },
    { id: 'track', title: 'LIVE GPS TRACK', subtitle: 'Real-time telemetry & geofence', keyHint: '⌘T', route: '/devices' },
    { id: 'lock', title: 'REMOTE LOCK', subtitle: 'Encrypt data & seal device', keyHint: '⌘L', route: '/remote-lock' },
    { id: 'case', title: 'OPEN RECOVERY', subtitle: 'Authorized police coordination', keyHint: '⌘O', route: '/cases' },
    { id: 'alerts', title: 'SECURITY ALERTS', subtitle: 'SIM swap & IMSI threat log', keyHint: '⌘A', route: '/alerts' },
  ],

  incidentPipeline: [
    { step: '01', code: 'REPORT', label: 'Report Incident', desc: 'Device flagged lost/stolen across network', status: 'TRIGGERED' },
    { step: '02', code: 'CONTAIN', label: 'Contain & Lock', desc: 'Remote lockdown & memory vault engaged', status: 'ACTIVE' },
    { step: '03', code: 'LOCATE', label: 'Locate & Signal', desc: 'Triangulating via GPS & mesh nodes', status: 'SEARCHING' },
    { step: '04', code: 'VERIFY', label: 'Verify Owner', desc: 'Cryptographic proof of legal title', status: 'CONFIRMED' },
    { step: '05', code: 'RECOVER', label: 'Field Recovery', desc: 'Dispatch to authorized law enforcement', status: 'DISPATCHED' },
    { step: '06', code: 'CLOSE', label: 'Case Resolved', desc: 'Device safely restored to verified owner', status: 'COMPLETE' },
  ],

  telecomStatus: {
    carrierSignals: '● ACTIVE',
    simSecurity: '● MONITORING',
    deviceIdentity: '● SYNCHRONIZED',
    networkTelemetry: '● LIVE',
    partnersCount: '87+ Integrated Carriers',
  },

  marketplaceSample: {
    deviceModel: 'iPhone 15 Pro Max',
    imei: '••••••••••4821',
    identity: 'VERIFIED',
    blacklist: 'CLEAR',
    ownership: 'VALID',
    riskLevel: 'LOW',
    riskScore: 0.01,
    tradeRecommendation: 'SAFE TO REVIEW',
  },
};
