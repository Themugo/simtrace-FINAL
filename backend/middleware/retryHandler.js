// Retry Handler with Exponential Backoff
// Handles retry logic for failed operations

export class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
  }

  async execute(operation, context = {}) {
    let lastError;
    let delay = this.initialDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`[Retry] Operation succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          console.error(`[Retry] Operation failed after ${this.maxRetries + 1} attempts:`, error.message);
          throw error;
        }

        const waitTime = Math.min(delay, this.maxDelay);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${waitTime}ms:`, error.message);
        
        await this.sleep(waitTime);
        delay = delay * this.backoffMultiplier;
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithTimeout(operation, timeout = 5000) {
    return Promise.race([
      this.execute(operation),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }
}

// Retry handler for different operation types
export const retryHandlers = {
  database: new RetryHandler({
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  }),

  externalApi: new RetryHandler({
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  }),

  webhook: new RetryHandler({
    maxRetries: 7,
    initialDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 2,
  }),

  queue: new RetryHandler({
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5,
  }),
};

// Timeout configurations
export const timeoutConfig = {
  database: 5000,
  externalApi: 10000,
  webhook: 30000,
  queue: 3000,
};

// Decorator for automatic retry
export function withRetry(retryType = 'externalApi') {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const handler = retryHandlers[retryType];

    descriptor.value = async function (...args) {
      return handler.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

// Decorator for timeout
export function withTimeout(timeoutMs) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      return Promise.race([
        originalMethod.apply(this, args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
      ]);
    };

    return descriptor;
  };
}
