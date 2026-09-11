// src/services/circuitBreaker.ts

export class CircuitBreaker {
  private failures: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime: number = 0;

  constructor(
    private readonly failureThreshold: number = 3, // 3 failures in 1 min -> OPEN
    private readonly timeout: number = 30000,      // 30 sec open ga undali
    private readonly halfOpenMaxCalls: number = 1   // Half-open lo okka test call
  ) {}

  // Check if we can call the API
  public canCall(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const now = Date.now();
      // Timeout ayyindha? (30 secs ayyayaa?)
      if (now - this.lastFailureTime > this.timeout) {
        console.log('⏳ Circuit timeout over. Going to HALF-OPEN.');
        this.state = 'HALF_OPEN';
        return true; // Allow a test request
      }
      console.warn('⛔ Circuit is OPEN. Skipping request.');
      return false; // ❌ Request ni block chesey
    }

    // HALF_OPEN
    return true;
  }

  // API call success ayite (Record Success)
  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN' || this.state === 'OPEN') {
      console.log('✅ Test call succeeded. Closing Circuit.');
      this.state = 'CLOSED';
      this.failures = 0; // Reset failures
    }
  }

  // API call fail ayite (Record Failure)
  public recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      console.warn(`🔥 Failure threshold (${this.failureThreshold}) reached. Opening Circuit.`);
      this.state = 'OPEN';
    }
  }

  public getState(): string {
    return this.state;
  }
}

// Singleton instance (app wide okate breaker)
export const globalCircuitBreaker = new CircuitBreaker(3, 30000, 1);