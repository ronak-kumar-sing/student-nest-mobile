type Listener = (...args: unknown[]) => void;

class MockEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`Error in listener for event ${event}:`, err);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export const mockEvents = new MockEventEmitter();

