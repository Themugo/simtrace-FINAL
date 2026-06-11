// services/networkEffects/droneIntegration.ts - Drone integration for physical tracking
import crypto from 'crypto';

export interface Drone {
  droneId: string;
  name: string;
  model: string;
  operatorId: string;
  capabilities: string[];
  maxRange: number; // in km
  maxFlightTime: number; // in minutes
  batteryLevel: number;
  status: 'available' | 'in_flight' | 'maintenance' | 'charging';
  currentLocation?: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  lastUpdate: number;
}

export interface DroneMission {
  missionId: string;
  droneId: string;
  deviceId: string;
  targetLocation: {
    latitude: number;
    longitude: number;
  };
  missionType: 'search' | 'surveillance' | 'tracking' | 'recovery';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  waypoints: { latitude: number; longitude: number }[];
  footage: string[];
  findings: string[];
}

export interface DroneFleet {
  fleetId: string;
  name: string;
  operatorId: string;
  droneIds: string[];
  coverageArea: {
    center: { latitude: number; longitude: number };
    radius: number;
  };
  isActive: boolean;
}

export class DroneIntegrationService {
  private drones: Map<string, Drone> = new Map();
  private missions: Map<string, DroneMission> = new Map();
  private fleets: Map<string, DroneFleet> = new Map();

  /**
   * Register drone
   */
  registerDrone(
    name: string,
    model: string,
    operatorId: string,
    capabilities: string[],
    maxRange: number,
    maxFlightTime: number
  ): Drone {
    const droneId = crypto.randomBytes(16).toString('hex');

    const drone: Drone = {
      droneId,
      name,
      model,
      operatorId,
      capabilities,
      maxRange,
      maxFlightTime,
      batteryLevel: 100,
      status: 'available',
      lastUpdate: Date.now()
    };

    this.drones.set(droneId, drone);
    return drone;
  }

  /**
   * Create mission
   */
  createMission(
    deviceId: string,
    targetLocation: { latitude: number; longitude: number },
    missionType: 'search' | 'surveillance' | 'tracking' | 'recovery',
    priority: 'low' | 'normal' | 'high' | 'emergency' = 'normal'
  ): DroneMission {
    const missionId = crypto.randomBytes(16).toString('hex');

    // Find available drone
    const drone = this.findAvailableDrone(targetLocation, missionType);
    
    if (!drone) {
      throw new Error('No available drone for mission');
    }

    const mission: DroneMission = {
      missionId,
      droneId: drone.droneId,
      deviceId,
      targetLocation,
      missionType,
      status: 'assigned',
      priority,
      createdAt: Date.now(),
      waypoints: this.generateWaypoints(drone.currentLocation || { latitude: 0, longitude: 0 }, targetLocation),
      footage: [],
      findings: []
    };

    this.missions.set(missionId, mission);

    // Update drone status
    drone.status = 'in_flight';
    this.drones.set(drone.droneId, drone);

    return mission;
  }

  /**
   * Find available drone
   */
  private findAvailableDrone(
    targetLocation: { latitude: number; longitude: number },
    missionType: string
  ): Drone | null {
    const availableDrones = Array.from(this.drones.values())
      .filter(d => 
        d.status === 'available' &&
        d.batteryLevel > 20 &&
        d.capabilities.includes(missionType)
      );

    if (availableDrones.length === 0) {
      return null;
    }

    // Find closest drone
    let closestDrone: Drone | null = null;
    let minDistance = Infinity;

    for (const drone of availableDrones) {
      if (drone.currentLocation) {
        const distance = this.calculateDistance(drone.currentLocation, targetLocation);
        
        if (distance < drone.maxRange && distance < minDistance) {
          minDistance = distance;
          closestDrone = drone;
        }
      }
    }

    return closestDrone;
  }

  /**
   * Generate waypoints for mission
   */
  private generateWaypoints(
    start: { latitude: number; longitude: number },
    target: { latitude: number; longitude: number }
  ): { latitude: number; longitude: number }[] {
    // Simple straight line with intermediate waypoints
    const waypoints: { latitude: number; longitude: number }[] = [];
    const numWaypoints = 5;

    for (let i = 0; i <= numWaypoints; i++) {
      const ratio = i / numWaypoints;
      const lat = start.latitude + (target.latitude - start.latitude) * ratio;
      const lng = start.longitude + (target.longitude - start.longitude) * ratio;
      waypoints.push({ latitude: lat, longitude: lng });
    }

    return waypoints;
  }

  /**
   * Start mission
   */
  startMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    
    if (!mission || mission.status !== 'assigned') {
      return false;
    }

    mission.status = 'in_progress';
    mission.startedAt = Date.now();
    this.missions.set(missionId, mission);

    return true;
  }

  /**
   * Complete mission
   */
  completeMission(missionId: string, findings: string[], footage: string[]): boolean {
    const mission = this.missions.get(missionId);
    
    if (!mission || mission.status !== 'in_progress') {
      return false;
    }

    mission.status = 'completed';
    mission.completedAt = Date.now();
    mission.findings = findings;
    mission.footage = footage;
    this.missions.set(missionId, mission);

    // Update drone status
    const drone = this.drones.get(mission.droneId);
    if (drone) {
      drone.status = 'available';
      drone.batteryLevel = Math.max(0, drone.batteryLevel - 20); // Simulate battery usage
      drone.currentLocation = { ...mission.targetLocation, altitude: 0 };
      drone.lastUpdate = Date.now();
      this.drones.set(drone.droneId, drone);
    }

    return true;
  }

  /**
   * Cancel mission
   */
  cancelMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    
    if (!mission || ['completed', 'failed', 'cancelled'].includes(mission.status)) {
      return false;
    }

    mission.status = 'cancelled';
    this.missions.set(missionId, mission);

    // Update drone status
    const drone = this.drones.get(mission.droneId);
    if (drone) {
      drone.status = 'available';
      this.drones.set(drone.droneId, drone);
    }

    return true;
  }

  /**
   * Update drone location
   */
  updateDroneLocation(
    droneId: string,
    location: { latitude: number; longitude: number; altitude: number },
    batteryLevel?: number
  ): boolean {
    const drone = this.drones.get(droneId);
    
    if (!drone) {
      return false;
    }

    drone.currentLocation = location;
    drone.lastUpdate = Date.now();
    
    if (batteryLevel !== undefined) {
      drone.batteryLevel = batteryLevel;
    }

    this.drones.set(droneId, drone);
    return true;
  }

  /**
   * Get mission status
   */
  getMission(missionId: string): DroneMission | null {
    return this.missions.get(missionId) || null;
  }

  /**
   * Get missions for device
   */
  getMissionsForDevice(deviceId: string): DroneMission[] {
    return Array.from(this.missions.values())
      .filter(m => m.deviceId === deviceId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get missions for drone
   */
  getMissionsForDrone(droneId: string): DroneMission[] {
    return Array.from(this.missions.values())
      .filter(m => m.droneId === droneId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get available drones
   */
  getAvailableDrones(): Drone[] {
    return Array.from(this.drones.values())
      .filter(d => d.status === 'available' && d.batteryLevel > 20);
  }

  /**
   * Get drone by ID
   */
  getDrone(droneId: string): Drone | null {
    return this.drones.get(droneId) || null;
  }

  /**
   * Get drones by operator
   */
  getDronesByOperator(operatorId: string): Drone[] {
    return Array.from(this.drones.values())
      .filter(d => d.operatorId === operatorId);
  }

  /**
   * Create fleet
   */
  createFleet(
    name: string,
    operatorId: string,
    droneIds: string[],
    coverageArea: {
      center: { latitude: number; longitude: number };
      radius: number;
    }
  ): DroneFleet {
    const fleetId = crypto.randomBytes(16).toString('hex');

    const fleet: DroneFleet = {
      fleetId,
      name,
      operatorId,
      droneIds,
      coverageArea,
      isActive: true
    };

    this.fleets.set(fleetId, fleet);
    return fleet;
  }

  /**
   * Get fleet by ID
   */
  getFleet(fleetId: string): DroneFleet | null {
    return this.fleets.get(fleetId) || null;
  }

  /**
   * Get fleets by operator
   */
  getFleetsByOperator(operatorId: string): DroneFleet[] {
    return Array.from(this.fleets.values())
      .filter(f => f.operatorId === operatorId);
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.latitude - coord1.latitude);
    const dLng = this.toRad(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.latitude)) * Math.cos(this.toRad(coord2.latitude)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDrones: number;
    availableDrones: number;
    inFlightDrones: number;
    totalMissions: number;
    missionsByStatus: { [key: string]: number };
    missionsByType: { [key: string]: number };
    averageBatteryLevel: number;
  } {
    const drones = Array.from(this.drones.values());
    const missions = Array.from(this.missions.values());

    const missionsByStatus: { [key: string]: number } = {};
    const missionsByType: { [key: string]: number } = {};

    for (const mission of missions) {
      missionsByStatus[mission.status] = (missionsByStatus[mission.status] || 0) + 1;
      missionsByType[mission.missionType] = (missionsByType[mission.missionType] || 0) + 1;
    }

    const averageBatteryLevel = drones.length > 0
      ? drones.reduce((sum, d) => sum + d.batteryLevel, 0) / drones.length
      : 0;

    return {
      totalDrones: drones.length,
      availableDrones: drones.filter(d => d.status === 'available').length,
      inFlightDrones: drones.filter(d => d.status === 'in_flight').length,
      totalMissions: missions.length,
      missionsByStatus,
      missionsByType,
      averageBatteryLevel
    };
  }

  /**
   * Charge drone
   */
  chargeDrone(droneId: string): boolean {
    const drone = this.drones.get(droneId);
    
    if (!drone) {
      return false;
    }

    drone.status = 'charging';
    drone.batteryLevel = 100;
    drone.status = 'available';
    this.drones.set(droneId, drone);

    return true;
  }

  /**
   * Clear old missions
   */
  clearOldMissions(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [missionId, mission] of this.missions.entries()) {
      if (now - mission.createdAt > maxAge && ['completed', 'failed', 'cancelled'].includes(mission.status)) {
        this.missions.delete(missionId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export missions
   */
  exportMissions(deviceId?: string): string {
    const missions = deviceId
      ? Array.from(this.missions.values()).filter(m => m.deviceId === deviceId)
      : Array.from(this.missions.values());
    
    return JSON.stringify(missions, null, 2);
  }

  /**
   * Import missions
   */
  importMissions(missions: DroneMission[]): number {
    let imported = 0;

    for (const mission of missions) {
      if (!this.missions.has(mission.missionId)) {
        this.missions.set(mission.missionId, mission);
        imported++;
      }
    }

    return imported;
  }
}

export const droneIntegrationService = new DroneIntegrationService();
