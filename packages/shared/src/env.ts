/**
 * Get a required environment variable or throw an error.
 */
export function requireEnv(name: string): string {
  const value = Bun.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value.
 */
export function optionalEnv(name: string, defaultValue: string): string {
  return Bun.env[name] ?? defaultValue;
}

/**
 * Get an optional numeric environment variable with a default value.
 */
export function optionalEnvNumber(name: string, defaultValue: number): number {
  const value = Bun.env[name];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
  }
  return parsed;
}
