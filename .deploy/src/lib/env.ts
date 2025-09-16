/**
 * Environment variable validation and configuration
 * Ensures all required secrets are present at startup
 */

type EnvVar = {
  key: string;
  required: boolean;
  description?: string;
};

const ENV_VARS: EnvVar[] = [
  { 
    key: 'JWT_SECRET', 
    required: true, 
    description: 'JWT signing secret (must be 32+ characters)' 
  },
  { 
    key: 'DATABASE_URL', 
    required: true, 
    description: 'PostgreSQL connection string' 
  },
  { 
    key: 'XAI_API_KEY', 
    required: false, 
    description: 'xAI Grok API key (primary AI provider)' 
  },
  { 
    key: 'OPENAI_API_KEY', 
    required: false, 
    description: 'OpenAI API key (fallback AI provider)' 
  },
  { 
    key: 'ANTHROPIC_API_KEY', 
    required: false, 
    description: 'Anthropic Claude API key (secondary fallback)' 
  },
];

function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];
    
    if (envVar.required && !value) {
      missing.push(`${envVar.key}${envVar.description ? ` (${envVar.description})` : ''}`);
      continue;
    }

    // Additional validation for specific variables
    if (envVar.key === 'JWT_SECRET' && value) {
      if (value.length < 32) {
        missing.push(`JWT_SECRET must be at least 32 characters long (current: ${value.length})`);
      }
      if (value === 'crowe-logic-secret-key-change-in-production') {
        missing.push('JWT_SECRET is using the default development value - SECURITY RISK!');
      }
    }

    if (envVar.key === 'DATABASE_URL' && value && !value.startsWith('postgresql://')) {
      warnings.push(`DATABASE_URL should use postgresql:// scheme for security`);
    }
  }

  // Check if at least one AI provider is configured
  const hasAI = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!hasAI) {
    warnings.push('No AI providers configured - AI features will be unavailable');
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(msg => console.error(`  - ${msg}`));
    console.error('\n📝 Copy .env.example to .env.local and configure the required values.');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment configuration warnings:');
    warnings.forEach(msg => console.warn(`  - ${msg}`));
  }

  console.log('✅ Environment validation passed');
}

// Validate immediately when this module is imported
if (typeof window === 'undefined') { // Server-side only
  validateEnv();
}

// Export validated environment variables
export const env = {
  JWT_SECRET: process.env.JWT_SECRET!,
  DATABASE_URL: process.env.DATABASE_URL!,
  XAI_API_KEY: process.env.XAI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  REDIS_URL: process.env.REDIS_URL,
  
  // Feature flags
  ENABLE_TERMINAL_API: process.env.ENABLE_TERMINAL_API === 'true',
  ENABLE_FILE_SYSTEM_ACCESS: process.env.ENABLE_FILE_SYSTEM_ACCESS === 'true',
  ALLOW_USER_REGISTRATION: process.env.ALLOW_USER_REGISTRATION !== 'false',
} as const;

// Runtime type checking
export type Env = typeof env;