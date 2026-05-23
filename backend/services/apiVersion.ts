import { Request, Response, NextFunction } from 'express';

export const API_VERSION = 'v1';
export const API_VERSION_HEADER = 'x-api-version';

export function setApiVersion(req: Request, res: Response, next: NextFunction): void {
  const version = req.headers[API_VERSION_HEADER] as string || API_VERSION;
  req.headers[API_VERSION_HEADER] = version;
  res.setHeader(API_VERSION_HEADER, version);
  next();
}

export function requireApiVersion(version: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientVersion = req.headers[API_VERSION_HEADER] as string;
    if (clientVersion && clientVersion !== version) {
      res.status(400).json({
        error: `API version mismatch. Expected: ${version}, Received: ${clientVersion}`,
      });
      return;
    }
    next();
  };
}
