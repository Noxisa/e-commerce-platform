// Simple in-memory cache with TTL
class SimpleCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 30) {
    const expireAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expireAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expireAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  del(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new SimpleCache();
