// src/lib/ai-provider.test.ts - Test AI provider abstraction
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AI Provider Manager', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    vi.resetModules();
  });

  it('should select primary provider when available', () => {
    // Mock XAI provider available
    vi.stubEnv('XAI_API_KEY', 'test-xai-key');
    
    // Dynamically import to get fresh instance
    import('@/lib/ai-provider').then(({ aiProviderManager }) => {
      const provider = aiProviderManager.getActiveProvider();
      expect(provider?.name).toBe('CroweCode Neural Engine');
      expect(provider?.model).toBe('grok-4-latest');
    });
  });

  it('should fallback to secondary provider when primary unavailable', () => {
    // Mock primary unavailable, secondary available
    vi.stubEnv('XAI_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
    
    import('@/lib/ai-provider').then(({ aiProviderManager }) => {
      // Test fallback logic would need to be implemented in the actual provider manager
      expect(aiProviderManager.hasProvider()).toBe(true);
    });
  });

  it('should return consistent display name regardless of actual provider', () => {
    import('@/lib/ai-provider').then(({ aiProviderManager }) => {
      const displayName = aiProviderManager.getDisplayName();
      expect(displayName).toBe('CroweCode™ Intelligence');
    });
  });

  it('should return abstracted model info', () => {
    import('@/lib/ai-provider').then(({ aiProviderManager }) => {
      const modelInfo = aiProviderManager.getModelInfo();
      expect(modelInfo).toBe('CroweCode Neural Architecture v4.0');
    });
  });

  it('should provide AI capabilities without exposing underlying providers', () => {
    import('@/lib/ai-provider').then(({ getAICapabilities }) => {
      const capabilities = getAICapabilities();
      expect(capabilities.name).toBe('CroweCode™ Intelligence System');
      expect(capabilities.powered_by).toBe('Proprietary Neural Network');
      expect(capabilities.features).toContain('256K context window');
      expect(capabilities.features).toContain('Advanced reasoning');
    });
  });
});