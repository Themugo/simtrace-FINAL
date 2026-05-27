import { Request, Response, NextFunction } from 'express';

// Supported API versions
const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';
const DEPRECATED_VERSIONS: Record<string, Date> = {};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

// Middleware to extract and validate API version
export function apiVersion(req: Request, res: Response, next: NextFunction): void {
  // Extract version from URL path (e.g., /api/v1/devices)
  const pathVersion = req.path.match(/^\/api\/(v\d+)\//)?.[1];
  
  // Extract version from header
  const headerVersion = req.headers['x-api-version'] as string;
  
  // Determine which version to use
  const version = pathVersion || headerVersion || DEFAULT_VERSION;
  
  // Validate version
  if (!SUPPORTED_VERSIONS.includes(version)) {
    res.status(400).json({
      error: 'Unsupported API version',
      supportedVersions: SUPPORTED_VERSIONS,
      requestedVersion: version,
    });
    return;
  }
  
  // Check if version is deprecated
  if (DEPRECATED_VERSIONS[version]) {
    const deprecationDate = DEPRECATED_VERSIONS[version];
    const sunsetDate = new Date(deprecationDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days after deprecation
    
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecation-Date', deprecationDate.toISOString());
    res.setHeader('X-API-Sunset-Date', sunsetDate.toISOString());
    
    // Log deprecation warning
    console.warn(`[API Version] Deprecated version ${version} used by ${req.ip}`);
  }
  
  // Set API version on request
  req.apiVersion = version;
  
  // Add version response header
  res.setHeader('X-API-Version', version);
  
  next();
}

// Middleware to require minimum API version
export function requireMinVersion(minVersion: string) {
  const versionOrder = SUPPORTED_VERSIONS; // Assumes versions are in order
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const currentVersion = req.apiVersion || DEFAULT_VERSION;
    const currentIndex = versionOrder.indexOf(currentVersion);
    const minIndex = versionOrder.indexOf(minVersion);
    
    if (currentIndex < minIndex) {
      res.status(400).json({
        error: 'API version too old',
        message: `This endpoint requires API version ${minVersion} or higher`,
        currentVersion,
        requiredVersion: minVersion,
      });
      return;
    }
    
    next();
  };
}

// Mark a version as deprecated
export function deprecateVersion(version: string): void {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    throw new Error(`Version ${version} is not supported`);
  }
  
  DEPRECATED_VERSIONS[version] = new Date();
  console.warn(`[API Version] Version ${version} deprecated as of ${new Date().toISOString()}`);
}

// Get version information
export function getVersionInfo() {
  return {
    supportedVersions: SUPPORTED_VERSIONS,
    defaultVersion: DEFAULT_VERSION,
    deprecatedVersions: DEPRECATED_VERSIONS,
  };
}
