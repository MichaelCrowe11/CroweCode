// Test setup file - runs before each test suite
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>, options: any = {}) => {
    const Component = fn();
    return Component;
  },
}));

// Mock Monaco Editor (heavy dependency)
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn().mockImplementation(({ value, onChange }) => {
    return `<div data-testid="monaco-editor">${value || 'mock-editor'}</div>`;
  }),
}));

// Mock AI providers to avoid network calls in tests
vi.mock('@/lib/ai-provider', () => ({
  aiProviderManager: {
    getActiveProvider: vi.fn().mockReturnValue({
      name: 'Mock Provider',
      endpoint: 'https://mock.api',
      model: 'mock-model',
      apiKey: 'mock-key'
    }),
    hasProvider: vi.fn().mockReturnValue(true),
    getDisplayName: vi.fn().mockReturnValue('CroweCode™ Intelligence'),
    getModelInfo: vi.fn().mockReturnValue('CroweCode Neural Architecture v4.0'),
  },
  getAICapabilities: vi.fn().mockReturnValue({
    name: 'CroweCode™ Intelligence System',
    version: '4.0',
    features: ['256K context window', 'Advanced reasoning'],
    powered_by: 'Proprietary Neural Network'
  })
}));

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
}));

// Mock environment variables for tests
vi.mock('@/lib/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-32-characters-long',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NODE_ENV: 'test',
    XAI_API_KEY: 'test-xai-key',
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    ENABLE_TERMINAL_API: false,
    ENABLE_FILE_SYSTEM_ACCESS: false,
    ALLOW_USER_REGISTRATION: true,
  }
}));

// Global test utilities
declare global {
  namespace Vi {
    interface AsserterContext {
      toBeValidUUID: () => any;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return {
      pass: uuidRegex.test(received),
      message: () => `expected ${received} to be a valid UUID`,
    };
  },
});

// Suppress console warnings in tests unless explicitly needed
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected in test environment
  const message = args.join(' ');
  if (
    message.includes('React does not recognize') ||
    message.includes('validateDOMNesting') ||
    message.includes('Warning: Each child in a list')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});