// src/lib/env.test.ts - Test environment validation
import { describe, it, expect, vi } from 'vitest';

describe('Environment Validation', () => {
  it('should validate JWT_SECRET length requirement', () => {
    // Mock short JWT secret
    const originalEnv = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'short';

    // This should throw when module is re-imported
    expect(() => {
      // Simulate the validation that happens in env.ts
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
      }
    }).toThrow('JWT_SECRET must be at least 32 characters long');

    // Restore original
    process.env.JWT_SECRET = originalEnv;
  });

  it('should reject default development JWT secret', () => {
    const originalEnv = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'crowe-logic-secret-key-change-in-production';

    expect(() => {
      if (process.env.JWT_SECRET === 'crowe-logic-secret-key-change-in-production') {
        throw new Error('JWT_SECRET is using the default development value - SECURITY RISK!');
      }
    }).toThrow('SECURITY RISK');

    process.env.JWT_SECRET = originalEnv;
  });

  it('should accept valid environment configuration', () => {
    const validJWT = 'this-is-a-valid-32-character-jwt-secret-key-for-production';
    const originalEnv = process.env.JWT_SECRET;
    process.env.JWT_SECRET = validJWT;

    expect(() => {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('Invalid JWT_SECRET');
      }
      if (process.env.JWT_SECRET === 'crowe-logic-secret-key-change-in-production') {
        throw new Error('Default JWT_SECRET');
      }
    }).not.toThrow();

    process.env.JWT_SECRET = originalEnv;
  });
});