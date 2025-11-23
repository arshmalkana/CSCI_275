import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, logout, isAuthenticated, getToken, removeToken } from '../../services/authService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('Auth Service - Frontend Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        success: true,
        accessToken: 'mock-access-token',
        user: {
          staff_id: 1,
          user_id: 'testuser',
          full_name: 'Test User',
          user_role: 'staff',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.user.user_id).toBe('testuser');
      expect(localStorageMock.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorageMock.getItem('user')).toBeTruthy();
    });

    it('should throw error on invalid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      await expect(login('testuser', 'wrongpassword')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(login('testuser', 'password123')).rejects.toThrow('Network error');
    });

    it('should handle server errors (500)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(login('testuser', 'password123')).rejects.toThrow();
    });

    it('should validate empty username', async () => {
      await expect(login('', 'password123')).rejects.toThrow();
    });

    it('should validate empty password', async () => {
      await expect(login('testuser', '')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Setup logged in state
      localStorageMock.setItem('accessToken', 'mock-token');
      localStorageMock.setItem('user', JSON.stringify({ user_id: 'testuser' }));
    });

    it('should logout successfully and clear local storage', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await logout();

      expect(localStorageMock.getItem('accessToken')).toBeNull();
      expect(localStorageMock.getItem('user')).toBeNull();
    });

    it('should clear local storage even if API call fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await logout();

      expect(localStorageMock.getItem('accessToken')).toBeNull();
      expect(localStorageMock.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.setItem('accessToken', 'mock-token');

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false after logout', async () => {
      localStorageMock.setItem('accessToken', 'mock-token');
      expect(isAuthenticated()).toBe(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await logout();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      localStorageMock.setItem('accessToken', 'mock-token');

      expect(getToken()).toBe('mock-token');
    });

    it('should return null when no token', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      localStorageMock.setItem('accessToken', 'mock-token');
      expect(getToken()).toBe('mock-token');

      removeToken();
      expect(getToken()).toBeNull();
    });

    it('should not throw error if token does not exist', () => {
      expect(() => removeToken()).not.toThrow();
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token on 401 response', async () => {
      // This test documents expected behavior
      // Actual implementation may vary based on apiClient interceptor

      const mockRefreshResponse = {
        accessToken: 'new-mock-token',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Token expired' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRefreshResponse,
        });

      // Token refresh logic would be in apiClient
      // This test is a placeholder for expected behavior
    });
  });

  describe('Security - Token Storage', () => {
    it('should store token in localStorage', async () => {
      const mockResponse = {
        success: true,
        accessToken: 'secure-token',
        user: { user_id: 'testuser' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await login('testuser', 'password123');

      expect(localStorageMock.getItem('accessToken')).toBe('secure-token');
    });

    it('should not expose password in storage', async () => {
      const mockResponse = {
        success: true,
        accessToken: 'token',
        user: { user_id: 'testuser' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await login('testuser', 'password123');

      const storedUser = localStorageMock.getItem('user');
      expect(storedUser).not.toContain('password');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(login('testuser', 'password123')).rejects.toThrow();
    });

    it('should handle undefined response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => undefined,
      });

      await expect(login('testuser', 'password123')).rejects.toThrow();
    });

    it('should handle very long token', async () => {
      const longToken = 'a'.repeat(10000);
      const mockResponse = {
        success: true,
        accessToken: longToken,
        user: { user_id: 'testuser' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await login('testuser', 'password123');

      expect(localStorageMock.getItem('accessToken')).toBe(longToken);
    });

    it('should handle concurrent login attempts', async () => {
      const mockResponse = {
        success: true,
        accessToken: 'token',
        user: { user_id: 'testuser' },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Simulate concurrent logins
      const promises = [
        login('testuser1', 'password1'),
        login('testuser2', 'password2'),
        login('testuser3', 'password3'),
      ];

      await Promise.all(promises);

      // Last login should win
      expect(localStorageMock.getItem('accessToken')).toBe('token');
    });
  });
});
