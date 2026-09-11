// src/services/retry.ts

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export const defaultShouldRetry = (error: any): boolean => {
  // Retry only on genuine network disconnections, 503 Service Unavailable, or 429 Rate Limits
  if (!error.response) return true;
  const status = error.response.status;
  return status === 503 || status === 429;
};

export const retryRequest = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: any;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      console.warn(
        `API request failed (attempt ${attempt}/${maxAttempts}). Retrying in ${currentDelay}ms...`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = currentDelay * backoffMultiplier;
    }
  }

  throw lastError;
};