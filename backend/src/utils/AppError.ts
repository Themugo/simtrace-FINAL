export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, errorCode: string = "INTERNAL_SERVER_ERROR", details?: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = "Bad Request", details?: any): AppError {
    return new AppError(message, 400, "VALIDATION_ERROR", details);
  }

  static unauthorized(message: string = "Unauthorized access", details?: any): AppError {
    return new AppError(message, 401, "AUTHENTICATION_ERROR", details);
  }

  static forbidden(message: string = "Access forbidden", details?: any): AppError {
    return new AppError(message, 403, "PERMISSION_ERROR", details);
  }

  static notFound(message: string = "Requested resource not found", details?: any): AppError {
    return new AppError(message, 404, "RESOURCE_NOT_FOUND", details);
  }

  static internal(message: string = "Internal server error", details?: any): AppError {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}
