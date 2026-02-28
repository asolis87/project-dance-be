import { logger } from './logger';

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (error: unknown, attempt: number) => void;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxRetries) {
        break;
      }

      if (opts.onRetry) {
        opts.onRetry(error, attempt);
      } else {
        logger.warn(
          { err: error, attempt, maxRetries: opts.maxRetries },
          'Retrying operation after error',
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * (opts.backoffMultiplier || 2), opts.maxDelayMs || 10000);
    }
  }

  throw lastError;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(timeoutError || `Operation timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}
