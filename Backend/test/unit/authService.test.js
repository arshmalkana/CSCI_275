import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock the database and JWT utils
const mockQuery = mock.fn();
const mockJwtUtils = {
  generateAccessToken: mock.fn(),
  generateRefreshToken: mock.fn(),
  verifyAccessToken: mock.fn(),
  verifyRefreshToken: mock.fn()
};

// Mock module imports
mock.module('../../src/database/db.js', {
  namedExports: { query: mockQuery }
});

mock.module('../../src/utils/jwt.js', {
  default: mockJwtUtils
});

// Import after mocking
const authServiceModule = await import('../../src/services/authService.js');
const authService = authServiceModule.default;

describe('Auth Service - Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockQuery.mock.resetCalls();
    mockJwtUtils.generateAccessToken.mock.resetCalls();
    mockJwtUtils.generateRefreshToken.mock.resetCalls();
    mockJwtUtils.verifyAccessToken.mock.resetCalls();
    mockJwtUtils.verifyRefreshToken.mock.resetCalls();
  });

  describe('findStaffByUserId', () => {
    it('should find staff member by user_id successfully', async () => {
      const mockStaff = {
        staff_id: 1,
        user_id: 'testuser',
        full_name: 'Test User',
        designation: 'Veterinarian',
        mobile: '9876543210',
        email: 'test@example.com',
        password_hash: 'password123',
        user_role: 'staff',
        current_institute_id: 1,
        is_first_time: false,
        is_active: true,
        institute_name: 'Test Institute',
        institute_type: 'CVH',
        district_name: 'Test District',
        tehsil_name: 'Test Tehsil'
      };

      mockQuery.mock.mockImplementation(() =>
        Promise.resolve({ rows: [mockStaff] })
      );

      const result = await authService.findStaffByUserId('testuser');

      assert.strictEqual(result.staff_id, 1);
      assert.strictEqual(result.user_id, 'testuser');
      assert.strictEqual(result.full_name, 'Test User');
      assert.strictEqual(mockQuery.mock.calls.length, 1);
    });

    it('should return null if user not found', async () => {
      mockQuery.mock.mockImplementation(() =>
        Promise.resolve({ rows: [] })
      );

      const result = await authService.findStaffByUserId('nonexistent');

      assert.strictEqual(result, null);
    });

    it('should be case-insensitive for user_id', async () => {
      const mockStaff = { staff_id: 1, user_id: 'TestUser' };

      mockQuery.mock.mockImplementation((sql, params) => {
        // Verify LOWER() is used in query
        assert.ok(sql.includes('LOWER'));
        return Promise.resolve({ rows: [mockStaff] });
      });

      await authService.findStaffByUserId('testuser');
      assert.ok(mockQuery.mock.calls.length > 0);
    });

    it('should only return active users', async () => {
      mockQuery.mock.mockImplementation((sql) => {
        // Verify is_active = true check
        assert.ok(sql.includes('is_active = true'));
        return Promise.resolve({ rows: [] });
      });

      await authService.findStaffByUserId('testuser');
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mock.mockImplementation(() =>
        Promise.reject(new Error('Database connection error'))
      );

      await assert.rejects(
        async () => await authService.findStaffByUserId('testuser'),
        { message: 'Database connection error' }
      );
    });
  });

  describe('findStaffById', () => {
    it('should find staff member by staff_id successfully', async () => {
      const mockStaff = {
        staff_id: 1,
        user_id: 'testuser',
        full_name: 'Test User',
        user_role: 'staff',
        is_active: true,
        passkey_enabled: true
      };

      mockQuery.mock.mockImplementation(() =>
        Promise.resolve({ rows: [mockStaff] })
      );

      const result = await authService.findStaffById(1);

      assert.strictEqual(result.staff_id, 1);
      assert.strictEqual(result.passkey_enabled, true);
    });

    it('should return null if staff_id not found', async () => {
      mockQuery.mock.mockImplementation(() =>
        Promise.resolve({ rows: [] })
      );

      const result = await authService.findStaffById(999);

      assert.strictEqual(result, null);
    });

    it('should only return active staff', async () => {
      mockQuery.mock.mockImplementation((sql) => {
        assert.ok(sql.includes('is_active = true'));
        return Promise.resolve({ rows: [] });
      });

      await authService.findStaffById(1);
    });

    it('should include passkey_enabled field', async () => {
      mockQuery.mock.mockImplementation((sql) => {
        assert.ok(sql.includes('passkey_enabled'));
        return Promise.resolve({ rows: [] });
      });

      await authService.findStaffById(1);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password (plain text)', () => {
      const plainPassword = 'password123';
      const storedHash = 'password123';

      const result = authService.verifyPassword(plainPassword, storedHash);

      assert.strictEqual(result, true);
    });

    it('should reject incorrect password (plain text)', () => {
      const plainPassword = 'wrongpassword';
      const storedHash = 'password123';

      const result = authService.verifyPassword(plainPassword, storedHash);

      assert.strictEqual(result, false);
    });

    it('should be case-sensitive', () => {
      const plainPassword = 'Password123';
      const storedHash = 'password123';

      const result = authService.verifyPassword(plainPassword, storedHash);

      assert.strictEqual(result, false);
    });

    it('should handle empty passwords', () => {
      const result = authService.verifyPassword('', '');

      assert.strictEqual(result, true);
    });

    it('should handle special characters', () => {
      const password = 'P@ssw0rd!#$';
      const result = authService.verifyPassword(password, password);

      assert.strictEqual(result, true);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const mockStaff = {
        staff_id: 1,
        user_id: 'testuser',
        user_role: 'staff',
        designation: 'Veterinarian',
        current_institute_id: 1
      };

      mockJwtUtils.generateAccessToken.mock.mockImplementation(() => 'mock-access-token');
      mockJwtUtils.generateRefreshToken.mock.mockImplementation(() => 'mock-refresh-token');

      const result = authService.generateTokens(mockStaff);

      assert.strictEqual(result.accessToken, 'mock-access-token');
      assert.strictEqual(result.refreshToken, 'mock-refresh-token');
      assert.strictEqual(mockJwtUtils.generateAccessToken.mock.calls.length, 1);
      assert.strictEqual(mockJwtUtils.generateRefreshToken.mock.calls.length, 1);
    });

    it('should include correct payload in tokens', () => {
      const mockStaff = {
        staff_id: 1,
        user_id: 'testuser',
        user_role: 'admin',
        designation: 'DVO'
      };

      mockJwtUtils.generateAccessToken.mock.mockImplementation((payload) => {
        assert.strictEqual(payload.staffId, 1);
        assert.strictEqual(payload.userId, 'testuser');
        assert.strictEqual(payload.role, 'admin');
        assert.strictEqual(payload.designation, 'DVO');
        return 'mock-access-token';
      });

      mockJwtUtils.generateRefreshToken.mock.mockImplementation(() => 'mock-refresh-token');

      authService.generateTokens(mockStaff);
    });

    it('should handle staff with different roles', () => {
      const roles = ['staff', 'admin', 'hq_staff'];

      roles.forEach(role => {
        const mockStaff = {
          staff_id: 1,
          user_id: 'testuser',
          user_role: role,
          designation: 'Test'
        };

        mockJwtUtils.generateAccessToken.mock.mockImplementation(() => 'token');
        mockJwtUtils.generateRefreshToken.mock.mockImplementation(() => 'token');

        const result = authService.generateTokens(mockStaff);
        assert.ok(result.accessToken);
        assert.ok(result.refreshToken);
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const mockPayload = {
        staffId: 1,
        userId: 'testuser',
        role: 'staff'
      };

      mockJwtUtils.verifyAccessToken.mock.mockImplementation(() => mockPayload);

      const result = authService.verifyAccessToken('valid-token');

      assert.strictEqual(result.staffId, 1);
      assert.strictEqual(result.userId, 'testuser');
      assert.strictEqual(mockJwtUtils.verifyAccessToken.mock.calls.length, 1);
    });

    it('should throw error for invalid token', () => {
      mockJwtUtils.verifyAccessToken.mock.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      assert.throws(
        () => authService.verifyAccessToken('invalid-token'),
        { message: 'Invalid token' }
      );
    });

    it('should throw error for expired token', () => {
      mockJwtUtils.verifyAccessToken.mock.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      assert.throws(
        () => authService.verifyAccessToken('expired-token'),
        { name: 'TokenExpiredError' }
      );
    });

    it('should throw error for malformed token', () => {
      mockJwtUtils.verifyAccessToken.mock.mockImplementation(() => {
        const error = new Error('Malformed token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      assert.throws(
        () => authService.verifyAccessToken('malformed-token'),
        { name: 'JsonWebTokenError' }
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const mockPayload = {
        staffId: 1,
        userId: 'testuser',
        role: 'staff'
      };

      mockJwtUtils.verifyRefreshToken.mock.mockImplementation(() => mockPayload);

      const result = authService.verifyRefreshToken('valid-refresh-token');

      assert.strictEqual(result.staffId, 1);
      assert.strictEqual(mockJwtUtils.verifyRefreshToken.mock.calls.length, 1);
    });

    it('should throw error for invalid refresh token', () => {
      mockJwtUtils.verifyRefreshToken.mock.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      assert.throws(
        () => authService.verifyRefreshToken('invalid-token'),
        { message: 'Invalid refresh token' }
      );
    });

    it('should throw error for expired refresh token', () => {
      mockJwtUtils.verifyRefreshToken.mock.mockImplementation(() => {
        const error = new Error('Refresh token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      assert.throws(
        () => authService.verifyRefreshToken('expired-token'),
        { name: 'TokenExpiredError' }
      );
    });
  });

  describe('Security - Edge Cases', () => {
    it('should not return password_hash when finding by staff_id', async () => {
      const mockStaff = {
        staff_id: 1,
        user_id: 'testuser',
        full_name: 'Test User'
        // password_hash should NOT be in this query result
      };

      mockQuery.mock.mockImplementation((sql) => {
        // Verify password_hash is NOT selected
        assert.ok(!sql.includes('password_hash'), 'password_hash should not be selected in findStaffById');
        return Promise.resolve({ rows: [mockStaff] });
      });

      await authService.findStaffById(1);
    });

    it('should handle SQL injection attempts safely', async () => {
      const maliciousUserId = "'; DROP TABLE staff; --";

      mockQuery.mock.mockImplementation((sql, params) => {
        // Verify parameterized query
        assert.ok(params && params.length > 0, 'Should use parameterized queries');
        return Promise.resolve({ rows: [] });
      });

      await authService.findStaffByUserId(maliciousUserId);
    });

    it('should handle null/undefined user_id gracefully', async () => {
      mockQuery.mock.mockImplementation(() =>
        Promise.resolve({ rows: [] })
      );

      const result1 = await authService.findStaffByUserId(null);
      const result2 = await authService.findStaffByUserId(undefined);

      assert.strictEqual(result1, null);
      assert.strictEqual(result2, null);
    });

    it('should handle very long user_id strings', async () => {
      const longUserId = 'a'.repeat(1000);

      mockQuery.mock.mockImplementation(() =>
        Promise.resolve({ rows: [] })
      );

      const result = await authService.findStaffByUserId(longUserId);
      assert.strictEqual(result, null);
    });
  });
});

console.log('Running Auth Service Unit Tests...');
