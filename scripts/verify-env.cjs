#!/usr/bin/env node
/*
  Simple environment verification script for production deploys.
  Fails (exit code 1) if required vars are missing or invalid.
*/

const required = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET'
];

// Accept either PORT or Railway provided PORT at runtime; not validating PORT here.
// HOST will be set to 0.0.0.0 in Railway variables.

const errors = [];

for (const key of required) {
  if (!process.env[key]) {
    errors.push(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  errors.push('JWT_SECRET must be at least 32 characters.');
}

if (errors.length) {
  console.error('❌ Environment validation failed:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
} else {
  console.log('✅ Environment validation passed.');
}
