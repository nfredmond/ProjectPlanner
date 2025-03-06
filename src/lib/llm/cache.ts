/**
 * LLM Response Cache
 * 
 * This module provides caching functionality for LLM responses to reduce costs
 * and improve response times for repeated queries.
 */

import { LlmResponse } from './service';

interface CacheEntry {
  response: LlmResponse;
  timestamp: number;
}

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time-to-live in milliseconds
}

interface Cache {
  get(key: string): LlmResponse | null;
  set(key: string, response: LlmResponse): void;
  clear(): void;
  getStats(): CacheStats;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Create a new in-memory cache for LLM responses
 */
export function createCache(options: CacheOptions = {}): Cache {
  const maxSize = options.maxSize || 500; // Default to 500 entries
  const ttl = options.ttl || 24 * 60 * 60 * 1000; // Default to 24 hours
  
  const cache = new Map<string, CacheEntry>();
  let hits = 0;
  let misses = 0;
  
  /**
   * Get a response from the cache
   */
  function get(key: string): LlmResponse | null {
    const entry = cache.get(key);
    
    if (!entry) {
      misses++;
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > ttl) {
      cache.delete(key);
      misses++;
      return null;
    }
    
    hits++;
    return entry.response;
  }
  
  /**
   * Set a response in the cache
   */
  function set(key: string, response: LlmResponse): void {
    // If cache is at max size, remove oldest entry
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear the cache
   */
  function clear(): void {
    cache.clear();
    hits = 0;
    misses = 0;
  }
  
  /**
   * Get cache statistics
   */
  function getStats(): CacheStats {
    const totalRequests = hits + misses;
    const hitRate = totalRequests > 0 ? hits / totalRequests : 0;
    
    return {
      size: cache.size,
      hits,
      misses,
      hitRate
    };
  }
  
  return {
    get,
    set,
    clear,
    getStats
  };
} 