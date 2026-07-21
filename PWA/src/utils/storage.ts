/**
 * Cross-platform localStorage utility for PWA
 * Handles localStorage with fallback for iOS private browsing and Android WebView
 */

class Storage {
  private isAvailable: boolean = false
  private memoryStorage: Map<string, string> = new Map()

  constructor() {
    this.checkAvailability()
  }

  private checkAvailability(): void {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.isAvailable = true
    } catch (e) {
      console.warn('localStorage not available, using memory storage fallback', e)
      this.isAvailable = false
    }
  }

  /**
   * Get item from storage
   */
  getItem(key: string): string | null {
    try {
      if (this.isAvailable) {
        return localStorage.getItem(key)
      } else {
        return this.memoryStorage.get(key) || null
      }
    } catch (e) {
      console.error('Error getting item from storage:', e)
      return this.memoryStorage.get(key) || null
    }
  }

  /**
   * Set item in storage
   */
  setItem(key: string, value: string): void {
    try {
      if (this.isAvailable) {
        localStorage.setItem(key, value)
        // Also save to memory storage as backup
        this.memoryStorage.set(key, value)
      } else {
        this.memoryStorage.set(key, value)
      }
    } catch (e) {
      console.error('Error setting item in storage:', e)
      // Fallback to memory storage
      this.memoryStorage.set(key, value)
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    try {
      if (this.isAvailable) {
        localStorage.removeItem(key)
      }
      this.memoryStorage.delete(key)
    } catch (e) {
      console.error('Error removing item from storage:', e)
      this.memoryStorage.delete(key)
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      if (this.isAvailable) {
        localStorage.clear()
      }
      this.memoryStorage.clear()
    } catch (e) {
      console.error('Error clearing storage:', e)
      this.memoryStorage.clear()
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    try {
      if (this.isAvailable) {
        return Object.keys(localStorage)
      } else {
        return Array.from(this.memoryStorage.keys())
      }
    } catch (e) {
      console.error('Error getting keys from storage:', e)
      return Array.from(this.memoryStorage.keys())
    }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    return this.isAvailable
  }
}

// Export singleton instance
export const storage = new Storage()

// Export helper functions for easier usage
export const getStorageItem = (key: string): string | null => storage.getItem(key)
export const setStorageItem = (key: string, value: string): void => storage.setItem(key, value)
export const removeStorageItem = (key: string): void => storage.removeItem(key)
export const clearStorage = (): void => storage.clear()
